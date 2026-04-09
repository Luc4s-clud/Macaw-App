/**
 * Serviço de integração com Square (Catalog e Orders).
 * Nunca loga tokens ou dados sensíveis.
 */

import { loadEnv } from '../config/env.js';
import { ORDER_LIMITS } from '../config/constants.js';
import {
  loadMenuImageOverrides,
  resolveImageOverride,
} from '../config/menuImageOverrides.js';

function getConfig() {
  const env = loadEnv();
  const baseUrl =
    env.SQUARE_ENV === 'production'
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';
  return {
    baseUrl,
    token: env.SQUARE_ACCESS_TOKEN,
    locationId: env.SQUARE_LOCATION_ID,
  };
}

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Square-Version': '2024-11-20',
  };
}

async function squareFetch(path, options = {}) {
  const { baseUrl, token } = getConfig();
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...headers(token), ...options.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(text || res.statusText);
    err.statusCode = res.status;
    throw err;
  }
  return res.json();
}

async function listCatalogPage(cursor = null) {
  const types = 'ITEM,ITEM_VARIATION,CATEGORY,IMAGE';
  const path = cursor
    ? `/v2/catalog/list?types=${types}&cursor=${encodeURIComponent(cursor)}`
    : `/v2/catalog/list?types=${types}`;
  return squareFetch(path);
}

/** Busca objetos do catálogo; máx. 100 IDs por request (limite Square). */
async function batchRetrieveCatalog(objectIds) {
  if (objectIds.length === 0) return { objects: [], related_objects: [] };
  const body = JSON.stringify({
    object_ids: objectIds.slice(0, 100),
    include_related_objects: true,
  });
  const data = await squareFetch('/v2/catalog/batch-retrieve', {
    method: 'POST',
    body,
  });
  return {
    objects: data.objects || [],
    related_objects: data.related_objects || [],
  };
}

/** Vários batch-retrieve em paralelo (um round-trip por até 100 IDs). */
async function batchRetrieveCatalogChunks(objectIds) {
  if (objectIds.length === 0) return { objects: [], related_objects: [] };
  const chunks = [];
  for (let i = 0; i < objectIds.length; i += 100) {
    chunks.push(objectIds.slice(i, i + 100));
  }
  const results = await Promise.all(chunks.map((ids) => batchRetrieveCatalog(ids)));
  const objects = [];
  const related = [];
  const seenObj = new Set();
  const seenRel = new Set();
  for (const r of results) {
    for (const o of r.objects || []) {
      if (!seenObj.has(o.id)) {
        objects.push(o);
        seenObj.add(o.id);
      }
    }
    for (const o of r.related_objects || []) {
      if (!seenRel.has(o.id)) {
        related.push(o);
        seenRel.add(o.id);
      }
    }
  }
  return { objects, related_objects: related };
}

/** Square usa string ou objeto com `id` ou `catalog_object_id`. */
function catalogRefToId(ref) {
  if (ref == null) return null;
  if (typeof ref === 'string') return ref;
  return ref.id ?? ref.catalog_object_id ?? null;
}

function imageObjectPublicUrl(imageObj) {
  const d = imageObj?.image_data;
  if (!d || typeof d !== 'object') return '';
  const u = d.url ?? d.public_url ?? '';
  return typeof u === 'string' ? u.trim() : '';
}

/** IDs de imagem referenciados por itens/variações (para buscar objetos IMAGE que não vieram no list) */
function collectReferencedImageIds(objects) {
  const ids = new Set();
  const byId = Object.fromEntries(objects.map((o) => [o.id, o]));
  for (const o of objects) {
    if (o.type === 'ITEM' && o.item_data) {
      for (const id of o.item_data.image_ids || []) {
        const iid = catalogRefToId(id);
        if (iid) ids.add(iid);
      }
      for (const varRef of o.item_data.variations || []) {
        const varId = catalogRefToId(varRef);
        const rawImg = varId ? byId[varId]?.item_variation_data?.image_id : null;
        const vImg = catalogRefToId(rawImg);
        if (vImg) ids.add(vImg);
      }
    }
    if (o.type === 'ITEM_VARIATION' && o.item_variation_data?.image_id) {
      const vid = catalogRefToId(o.item_variation_data.image_id);
      if (vid) ids.add(vid);
    }
  }
  return [...ids];
}

async function ensureImageObjectsInCatalog(merged) {
  const byId = Object.fromEntries(merged.map((o) => [o.id, o]));
  const needed = collectReferencedImageIds(merged).filter((id) => !byId[id]);
  if (needed.length === 0) return merged;
  const seen = new Set(merged.map((o) => o.id));
  let result = [...merged];
  const chunks = [];
  for (let i = 0; i < needed.length; i += 100) {
    chunks.push(needed.slice(i, i + 100));
  }
  const fetchResults = await Promise.all(chunks.map((chunk) => batchRetrieveCatalog(chunk)));
  for (const { objects } of fetchResults) {
    for (const obj of objects || []) {
      if (!seen.has(obj.id)) {
        result.push(obj);
        seen.add(obj.id);
      }
    }
  }
  return result;
}

function resolveItemImageUrl(itemData, variationData, byId) {
  // 1) Foto específica da variação
  const varImgId = catalogRefToId(variationData?.image_id);
  if (varImgId) {
    const u = imageObjectPublicUrl(byId[varImgId]);
    if (u) return u;
  }
  // 2) Todas as imagens do item (não só a primeira — às vezes a ordem falha ou o primeiro objeto veio sem URL)
  for (const ref of itemData.image_ids || []) {
    const imgId = catalogRefToId(ref);
    if (!imgId) continue;
    const u = imageObjectPublicUrl(byId[imgId]);
    if (u) return u;
  }
  // 3) URLs do canal online (site Square / e-commerce)
  const ecom = itemData.ecom_image_uris;
  if (Array.isArray(ecom)) {
    for (const uri of ecom) {
      if (typeof uri === 'string' && uri.trim()) return uri.trim();
    }
  }
  const single = itemData.ecom_uri;
  if (typeof single === 'string' && single.trim()) return single.trim();
  return '';
}

function mapCatalogToMenuItems(objects, imageOverrides = {}) {
  const byId = Object.fromEntries(objects.map((o) => [o.id, o]));
  const items = [];
  const seen = new Set();

  for (const o of objects) {
    if (o.type !== 'ITEM' || !o.item_data?.variations?.length) continue;
    const itemData = o.item_data;
    // Ordem: categories (novo) → reporting_category (dashboard "Açaí") → category_id (deprecated)
    const categoryId =
      itemData.categories?.length > 0
        ? (typeof itemData.categories[0] === 'object' && itemData.categories[0]?.id
            ? itemData.categories[0].id
            : itemData.categories[0])
        : (itemData.reporting_category?.id ?? itemData.category_id);
    const categoryName =
      (categoryId && byId[categoryId]?.category_data?.name) || 'other';
    const category = categoryName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') || 'other';

    for (const varRef of itemData.variations) {
      const varId = catalogRefToId(varRef);
      if (!varId || seen.has(varId)) continue;
      const v = byId[varId]?.item_variation_data;
      if (!v) continue;
      seen.add(varId);
      const fromCatalog = resolveItemImageUrl(itemData, v, byId);
      const fromOverride = resolveImageOverride(imageOverrides, {
        catalogItemId: o.id,
        variationId: varId,
        itemName: itemData.name,
      });
      const imageUrl = fromOverride || fromCatalog;
      const priceMoney = v.price_money;
      // Square envia amount na menor unidade (centavos para USD); divisor = 100
      const price =
        priceMoney && typeof priceMoney.amount === 'number'
          ? priceMoney.amount / 100
          : 0;
      const name = v.name ? `${itemData.name} - ${v.name}`.slice(0, ORDER_LIMITS.MAX_NAME_LENGTH) : (itemData.name || '').slice(0, ORDER_LIMITS.MAX_NAME_LENGTH);
      items.push({
        id: varId,
        squareVariationId: varId,
        squareItemId: o.id,
        name: name || 'Item',
        description: (itemData.description || '').slice(0, 500),
        price: Number(price.toFixed(2)),
        imageUrl,
        category,
      });
    }
  }
  return items;
}

/** Cache em memória do menu (evita refazer N chamadas ao Square a cada GET). */
let menuItemsCache = { items: null, expiresAt: 0 };

function getMenuCacheTtlMs() {
  const raw = process.env.MENU_CACHE_TTL_SECONDS;
  if (raw === '0') return 0;
  if (raw != null && raw !== '') {
    const sec = parseInt(raw, 10);
    if (!Number.isNaN(sec) && sec >= 0) return sec * 1000;
  }
  return 120_000;
}

export async function getMenuItems() {
  const ttlMs = getMenuCacheTtlMs();
  const now = Date.now();
  if (ttlMs > 0 && menuItemsCache.items && menuItemsCache.expiresAt > now) {
    return menuItemsCache.items;
  }

  const imageOverrides = loadMenuImageOverrides();
  let cursor = null;
  const allObjects = [];
  do {
    const data = await listCatalogPage(cursor);
    const list = data.objects || [];
    allObjects.push(...list);
    cursor = data.cursor || null;
  } while (cursor);

  // Batch retrieve itens completos (List pode não trazer reporting_category/categories)
  const itemIds = [...new Set(allObjects.filter((o) => o.type === 'ITEM').map((o) => o.id))];
  let mapped;
  if (itemIds.length > 0) {
    const { objects: fullItems, related_objects: related } =
      await batchRetrieveCatalogChunks(itemIds);
    const fullItemsById = Object.fromEntries((fullItems || []).map((o) => [o.id, o]));
    const merged = allObjects.map((o) =>
      o.type === 'ITEM' && fullItemsById[o.id] ? fullItemsById[o.id] : o
    );
    const mergedIds = new Set(merged.map((o) => o.id));
    for (const o of related || []) {
      if (!mergedIds.has(o.id)) {
        merged.push(o);
        mergedIds.add(o.id);
      }
    }
    const withImages = await ensureImageObjectsInCatalog(merged);
    mapped = mapCatalogToMenuItems(withImages, imageOverrides);
  } else {
    const withImages = await ensureImageObjectsInCatalog(allObjects);
    mapped = mapCatalogToMenuItems(withImages, imageOverrides);
  }

  if (ttlMs > 0) {
    menuItemsCache = { items: mapped, expiresAt: now + ttlMs };
  }
  return mapped;
}

/**
 * Sanitiza um item do pedido antes de enviar ao Square.
 */
function sanitizeOrderItem(item) {
  const name = String(item.name ?? 'Item').trim().slice(0, ORDER_LIMITS.MAX_NAME_LENGTH) || 'Item';
  const price = Math.min(
    ORDER_LIMITS.MAX_PRICE_CENTS / 100,
    Math.max(ORDER_LIMITS.MIN_PRICE_CENTS, Number(item.price) || 0)
  );
  const quantity = Math.min(
    ORDER_LIMITS.MAX_QUANTITY_PER_ITEM,
    Math.max(1, Math.floor(Number(item.quantity) || 1))
  );
  const observation = item.observation != null
    ? String(item.observation).trim().slice(0, ORDER_LIMITS.MAX_OBSERVATION_LENGTH)
    : undefined;
  return { name, price, quantity, observation };
}

export async function createOrder(validatedItems) {
  const { locationId } = getConfig();
  const lineItems = validatedItems.map((i) => {
    const { name, price, quantity, observation } = sanitizeOrderItem(i);
    return {
      name,
      quantity: String(quantity),
      base_price_money: {
        amount: Math.round(price * 100),
        currency: 'USD',
      },
      ...(observation && { note: observation }),
    };
  });

  const body = {
    idempotency_key: crypto.randomUUID(),
    order: {
      location_id: locationId,
      line_items: lineItems,
    },
  };

  const data = await squareFetch('/v2/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return data.order;
}
