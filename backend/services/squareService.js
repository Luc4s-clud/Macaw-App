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

const ORDER_TAX_PERCENTAGE = '6';
const SERVICE_FEE_AMOUNT_CENTS = 150;

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
    'Square-Version': '2025-06-18',
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

async function findOrderByIdInRecentSearch(orderId, locationId) {
  const now = new Date();
  const since = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);
  let cursor = null;
  for (let page = 0; page < 8; page += 1) {
    const body = {
      location_ids: [locationId],
      limit: 100,
      query: {
        filter: {
          date_time_filter: {
            created_at: {
              start_at: since.toISOString(),
              end_at: now.toISOString(),
            },
          },
        },
        sort: {
          sort_field: 'CREATED_AT',
          sort_order: 'DESC',
        },
      },
      ...(cursor && { cursor }),
    };
    const data = await squareFetch('/v2/orders/search', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const found = (data?.orders || []).find((o) => o?.id === orderId);
    if (found) return found;
    cursor = data?.cursor || null;
    if (!cursor) break;
  }
  return null;
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

function normalizeTextForKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeItemNameForDedupe(name) {
  return normalizeTextForKey(name)
    // remove palavras que variam por catálogo mas não mudam o produto-base
    .replace(/\bacai\b/g, ' ')
    .replace(/\bbowl\b/g, ' ')
    .replace(/\bregular\b/g, ' ')
    .replace(/\bsmall\b|\blarge\b/g, ' ')
    // remove tamanhos em oz (ex.: "16oz", "16 oz")
    .replace(/\b\d+\s*oz\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Duplicatas no Square: mesmos tamanhos que "Bowl - 16oz/24oz" mas com título
 * "Açaí Bowl - …" e sem foto — não listar em Build your own.
 */
function isHiddenBuildYourOwnDuplicate(name) {
  const n = normalizeTextForKey(name);
  return /^acai bowl (16|24) oz regular$/.test(n);
}

function canonicalizeCategorySlug(slug) {
  const key = normalizeTextForKey(slug).replace(/\s+/g, '-');
  const aliases = {
    'build-your-own': 'build-your-own',
    'build-you-own': 'build-your-own',
    'bowls-16-oz': 'bowls-16oz',
    'bowls-16oz': 'bowls-16oz',
    'bowls16oz': 'bowls-16oz',
    'bowls-24-oz': 'bowls-24oz',
    'bowls-24oz': 'bowls-24oz',
    'bowls24oz': 'bowls-24oz',
    'special-cup': 'special-cups',
    'special-cups': 'special-cups',
    'crepe-swiss': 'crepe-swiss',
    'crpe-swiss': 'crepe-swiss',
    smoothies: 'smoothies',
    drinks: 'drinks',
  };
  return aliases[key] || key || 'other';
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

function dedupeMenuItems(items) {
  const byKey = new Map();
  for (const item of items) {
    const normalizedName = normalizeItemNameForDedupe(item.name);
    const signature = [
      canonicalizeCategorySlug(item.category),
      normalizedName || normalizeTextForKey(item.name),
      Number(item.price).toFixed(2),
    ].join('|');
    const prev = byKey.get(signature);
    if (!prev) {
      byKey.set(signature, item);
      continue;
    }

    // Regra principal: sempre preferir a versão com imagem válida.
    const prevHasImage = Boolean(prev.imageUrl && String(prev.imageUrl).trim());
    const nextHasImage = Boolean(item.imageUrl && String(item.imageUrl).trim());
    if (nextHasImage && !prevHasImage) {
      byKey.set(signature, item);
      continue;
    }
    if (prevHasImage && !nextHasImage) {
      continue;
    }

    const prevScore =
      (prev.description ? 1 : 0) +
      normalizeTextForKey(prev.name).length;
    const nextScore =
      (item.description ? 1 : 0) +
      normalizeTextForKey(item.name).length;
    if (nextScore > prevScore || (nextScore === prevScore && item.id < prev.id)) {
      byKey.set(signature, item);
    }
  }
  return [...byKey.values()];
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
    const rawCategory = categoryName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') || 'other';
    const category = canonicalizeCategorySlug(rawCategory);

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
      if (category === 'build-your-own' && isHiddenBuildYourOwnDuplicate(name)) {
        continue;
      }
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
  return dedupeMenuItems(items);
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

function buildCheckoutOrderNote(meta = {}) {
  const parts = [];
  if (meta.customerName) parts.push(`Cliente: ${meta.customerName}`);
  if (meta.customerPhone) parts.push(`Tel: ${meta.customerPhone}`);
  if (meta.customerEmail) parts.push(`Email: ${meta.customerEmail}`);
  if (meta.fulfillmentType === 'delivery') parts.push('Entrega: delivery');
  if (meta.fulfillmentType === 'pickup') parts.push('Entrega: retirada no local');
  if (meta.orderNote) parts.push(`Obs: ${meta.orderNote}`);
  if (parts.length === 0) return '';
  return parts.join(' | ');
}

function buildSquareFulfillment(checkoutMeta = {}, forcedType) {
  const normalizedForcedType = forcedType === 'delivery'
    ? 'delivery'
    : forcedType === 'pickup'
      ? 'pickup'
      : forcedType === 'shipment'
        ? 'shipment'
        : null;
  const type = normalizedForcedType || (checkoutMeta.fulfillmentType === 'delivery' ? 'delivery' : 'pickup');
  if (type === 'delivery') {
    // Square: o padrão de schedule_type é SCHEDULED (exige deliver_at). Sem ASAP + prep_time_duration
    // o pedido pode ser criado de forma inválida e o checkout hospedado falha ao pagar.
    // @see https://developer.squareup.com/reference/square/objects/OrderFulfillmentDeliveryDetails
    const name = String(checkoutMeta.customerName || '').trim() || 'Customer';
    const phone = String(checkoutMeta.customerPhone || '').trim();
    const stateRegion = String(checkoutMeta.deliveryState || '').trim();
    return [
      {
        type: 'DELIVERY',
        state: 'PROPOSED',
        delivery_details: {
          schedule_type: 'ASAP',
          prep_time_duration: 'PT30M',
          recipient: {
            display_name: name,
            ...(phone && { phone_number: phone }),
            ...(checkoutMeta.customerEmail?.trim() && {
              email_address: checkoutMeta.customerEmail.trim(),
            }),
            address: {
              address_line_1: checkoutMeta.deliveryAddressLine1,
              address_line_2: checkoutMeta.deliveryAddressLine2 || undefined,
              locality: checkoutMeta.deliveryCity,
              ...(stateRegion && {
                administrative_district_level_1: stateRegion,
              }),
              postal_code: checkoutMeta.deliveryPostalCode,
              country: 'US',
            },
          },
        },
      },
    ];
  }
  if (type === 'shipment') {
    const name = String(checkoutMeta.customerName || '').trim() || 'Customer';
    const phone = String(checkoutMeta.customerPhone || '').trim();
    const stateRegion = String(checkoutMeta.deliveryState || '').trim();
    return [
      {
        type: 'SHIPMENT',
        state: 'PROPOSED',
        shipment_details: {
          recipient: {
            display_name: name,
            ...(phone && { phone_number: phone }),
            ...(checkoutMeta.customerEmail?.trim() && {
              email_address: checkoutMeta.customerEmail.trim(),
            }),
            address: {
              address_line_1: checkoutMeta.deliveryAddressLine1,
              address_line_2: checkoutMeta.deliveryAddressLine2 || undefined,
              locality: checkoutMeta.deliveryCity,
              ...(stateRegion && {
                administrative_district_level_1: stateRegion,
              }),
              postal_code: checkoutMeta.deliveryPostalCode,
              country: 'US',
            },
          },
        },
      },
    ];
  }

  return [
    {
      type: 'PICKUP',
      state: 'PROPOSED',
      pickup_details: {
        recipient: {
          display_name: checkoutMeta.customerName || undefined,
          phone_number: checkoutMeta.customerPhone || undefined,
          email_address: checkoutMeta.customerEmail || undefined,
        },
      },
    },
  ];
}

/**
 * Monta line_items + note para Orders API e Checkout API (Payment Link).
 */
function buildSquareOrderInner(validatedItems, checkoutMeta = {}, options = {}) {
  const includeFulfillment = options.includeFulfillment !== false;
  const forcedFulfillmentType = options.forcedFulfillmentType;
  const salesTaxUid = 'sales-tax-6pct';
  const lineItems = validatedItems.map((i) => {
    const { name, price, quantity, observation } = sanitizeOrderItem(i);
    return {
      name,
      quantity: String(quantity),
      base_price_money: {
        amount: Math.round(price * 100),
        currency: 'USD',
      },
      applied_taxes: [{ tax_uid: salesTaxUid }],
      ...(observation && { note: observation }),
    };
  });
  const orderNote = buildCheckoutOrderNote(checkoutMeta).slice(0, 500);
  return {
    line_items: lineItems,
    taxes: [
      {
        uid: salesTaxUid,
        name: 'Sales Tax',
        percentage: ORDER_TAX_PERCENTAGE,
        scope: 'ORDER',
      },
    ],
    service_charges: [
      {
        name: 'Service Fee',
        amount_money: {
          amount: SERVICE_FEE_AMOUNT_CENTS,
          currency: 'USD',
        },
        calculation_phase: 'SUBTOTAL_PHASE',
      },
    ],
    ...(includeFulfillment && {
      fulfillments: buildSquareFulfillment(checkoutMeta, forcedFulfillmentType),
    }),
    ...(orderNote && { note: orderNote }),
  };
}

export async function createOrder(validatedItems, checkoutMeta = {}) {
  const { locationId } = getConfig();
  const inner = buildSquareOrderInner(validatedItems, checkoutMeta, { includeFulfillment: true });
  const body = {
    idempotency_key: crypto.randomUUID(),
    order: {
      location_id: locationId,
      ...inner,
    },
  };

  const data = await squareFetch('/v2/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return data.order;
}

/**
 * Checkout hospedado pela Square: cria o pedido e retorna URL do Payment Link.
 * @see https://developer.squareup.com/reference/square/checkout-api/create-payment-link
 */
export async function createCheckoutPaymentLink(
  validatedItems,
  checkoutMeta = {},
  redirectUrl
) {
  const { locationId } = getConfig();
  const url = typeof redirectUrl === 'string' ? redirectUrl.trim() : '';
  if (!url) {
    const err = new Error('URL de retorno após pagamento não configurada (CHECKOUT_SUCCESS_URL).');
    err.statusCode = 500;
    throw err;
  }
  // Hosted checkout: delivery deve seguir fluxo de envio (SHIPMENT), que é o
  // formato esperado para roteamento de entrega (ex.: DoorDash) na Square.
  const includeHostedFulfillment = true;
  const hostedFulfillmentType =
    checkoutMeta.fulfillmentType === 'delivery' ? 'shipment' : 'pickup';
  const inner = buildSquareOrderInner(validatedItems, checkoutMeta, {
    includeFulfillment: includeHostedFulfillment,
    forcedFulfillmentType: hostedFulfillmentType,
  });
  const body = {
    idempotency_key: crypto.randomUUID(),
    order: {
      location_id: locationId,
      ...inner,
    },
    checkout_options: {
      redirect_url: url,
      // Exibe seleção de gorjeta no checkout hospedado da Square.
      allow_tipping: true,
    },
  };
  const email = checkoutMeta.customerEmail?.trim();
  const hasFulfillments = Array.isArray(body.order?.fulfillments) && body.order.fulfillments.length > 0;
  if (email && !hasFulfillments) {
    body.pre_populated_data = { buyer_email: email };
  }

  const data = await squareFetch('/v2/online-checkout/payment-links', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const pl = data.payment_link;
  // Prefere a URL curta oficial (square.link), que tende a ser mais robusta
  // para redirecionamento em navegadores/dispositivos diferentes.
  const checkoutUrl = pl?.url || pl?.long_url || '';
  const orderId =
    pl?.order_id ||
    data.related_resources?.orders?.[0]?.id ||
    null;
  if (!checkoutUrl || !orderId) {
    const err = new Error('Resposta inválida ao criar link de pagamento.');
    err.statusCode = 502;
    throw err;
  }
  return {
    checkoutUrl,
    orderId,
    paymentLinkId: pl?.id ?? null,
  };
}

/**
 * Total em centavos a partir da resposta do pedido no Square, ou soma dos itens.
 */
export function getOrderTotalAmountCents(order, validatedItems) {
  const fromOrder = order?.total_money?.amount;
  if (typeof fromOrder === 'number' && Number.isFinite(fromOrder) && fromOrder > 0) {
    return fromOrder;
  }
  let sum = 0;
  for (const i of validatedItems) {
    const { price, quantity } = sanitizeOrderItem(i);
    sum += Math.round(price * 100) * quantity;
  }
  return sum;
}

/**
 * Cobra o pedido com o token do Web Payments SDK (`source_id`).
 * O valor deve coincidir com o total do pedido no Square.
 */
export async function createPayment({ sourceId, orderId, amountCents }) {
  const { locationId } = getConfig();
  if (!sourceId || typeof sourceId !== 'string') {
    const err = new Error('Token de pagamento inválido.');
    err.statusCode = 400;
    throw err;
  }
  if (!orderId || !amountCents || amountCents < 1) {
    const err = new Error('Dados do pedido para pagamento inválidos.');
    err.statusCode = 400;
    throw err;
  }
  const body = {
    idempotency_key: crypto.randomUUID(),
    location_id: locationId,
    source_id: sourceId.trim(),
    amount_money: {
      amount: amountCents,
      currency: 'USD',
    },
    order_id: orderId,
    autocomplete: true,
  };
  const data = await squareFetch('/v2/payments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return data.payment;
}

/** Cancela um pedido aberto (ex.: após falha no pagamento). */
export async function cancelOrder(orderId) {
  if (!orderId) return;
  const body = {
    idempotency_key: crypto.randomUUID(),
  };
  await squareFetch(`/v2/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function mapSquarePaymentStatusToClient(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'COMPLETED' || normalized === 'CAPTURED') return 'paid';
  if (normalized === 'APPROVED') return 'authorized';
  if (normalized === 'PENDING') return 'pending';
  if (normalized === 'FAILED') return 'failed';
  if (normalized === 'CANCELED') return 'canceled';
  return 'unknown';
}

/** Pagamento efetivamente liquidado (API Payments ou tender no pedido). */
function isPaymentEffectivelyCaptured(squarePaymentStatus, order) {
  const raw =
    squarePaymentStatus ?? order?.tenders?.[0]?.card_details?.status ?? null;
  const normalized = String(raw || '').toUpperCase();
  return normalized === 'COMPLETED' || normalized === 'CAPTURED';
}

/**
 * Combina fulfillment + pagamento. Na UI da Square, "Ready" corresponde a PREPARED;
 * antes estávamos tratando PREPARED como in_progress e fazendo fulfillment "ganhar"
 * sobre o pagamento COMPLETED/CAPTURED.
 */
function resolveClientStatusFromOrder(order, squarePaymentStatus) {
  const ff = String(order?.fulfillments?.[0]?.state || '').toUpperCase();

  switch (ff) {
    case 'CANCELED':
    case 'FAILED':
      return 'canceled';
    case 'COMPLETED':
    case 'PREPARED':
      return 'paid';
    case 'RESERVED':
    case 'PROPOSED': {
      if (isPaymentEffectivelyCaptured(squarePaymentStatus, order)) return 'in_progress';
      const state = String(order?.state || '').toUpperCase();
      if (state === 'CANCELED') return 'canceled';
      if (state === 'DRAFT') return 'pending';
      return 'pending';
    }
    default:
      break;
  }

  const fromApi = mapSquarePaymentStatusToClient(squarePaymentStatus);
  if (fromApi !== 'unknown') return fromApi;

  const cardStatus = order?.tenders?.[0]?.card_details?.status ?? null;
  const upperCard = String(cardStatus || '').toUpperCase();
  if (upperCard === 'CAPTURED') return 'paid';
  if (upperCard === 'AUTHORIZED') return 'authorized';
  if (upperCard === 'FAILED') return 'failed';
  if (upperCard === 'VOIDED') return 'canceled';

  const state = String(order?.state || '').toUpperCase();
  if (state === 'OPEN') return 'paid';
  if (state === 'DRAFT') return 'pending';
  if (state === 'CANCELED') return 'canceled';
  if (state === 'COMPLETED') return 'paid';

  return 'unknown';
}

function normalizeLookupText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function extractOrderLookupText(order) {
  const recipient =
    order?.fulfillments?.[0]?.pickup_details?.recipient ||
    order?.fulfillments?.[0]?.delivery_details?.recipient ||
    {};
  return normalizeLookupText(
    [order?.note, recipient?.display_name, recipient?.email_address, recipient?.phone_number]
      .filter(Boolean)
      .join(' | ')
  );
}

function deriveStatusFromOrder(order) {
  const cardStatus = order?.tenders?.[0]?.card_details?.status ?? null;
  const status = resolveClientStatusFromOrder(order, null);
  return { status, paymentStatus: cardStatus };
}

/**
 * Busca o status do pedido/pagamento diretamente na Square.
 * Útil para o frontend acompanhar o pós-pagamento sem estado local no servidor.
 */
export async function getOrderPaymentStatus(orderId) {
  if (!orderId || typeof orderId !== 'string') {
    const err = new Error('orderId inválido.');
    err.statusCode = 400;
    throw err;
  }
  const { locationId } = getConfig();
  let resolvedOrderId = orderId;
  let order;
  try {
    const orderData = await squareFetch(`/v2/orders/${encodeURIComponent(orderId)}`);
    order = orderData?.order;
  } catch (err) {
    // Fallback: alguns fluxos devolvem checkoutId/paymentLinkId na URL.
    // Tentamos resolver para order_id via Checkout API.
    try {
      const paymentLinkData = await squareFetch(
        `/v2/online-checkout/payment-links/${encodeURIComponent(orderId)}`
      );
      const fromPaymentLink = paymentLinkData?.payment_link?.order_id;
      if (!fromPaymentLink) {
        throw err;
      }
      const orderData = await squareFetch(`/v2/orders/${encodeURIComponent(fromPaymentLink)}`);
      order = orderData?.order;
      resolvedOrderId = fromPaymentLink;
    } catch {
      // Fallback final: alguns pedidos aparecem no Search mas falham no Retrieve.
      const recovered = await findOrderByIdInRecentSearch(resolvedOrderId, locationId);
      if (!recovered) throw err;
      order = recovered;
    }
  }
  if (!order?.id) {
    const recovered = await findOrderByIdInRecentSearch(resolvedOrderId, locationId);
    if (!recovered?.id) {
      const err = new Error('Pedido não encontrado na Square.');
      err.statusCode = 404;
      throw err;
    }
    order = recovered;
  }

  let payment = null;
  let paymentStatus = null;
  try {
    const paymentsData = await squareFetch('/v2/payments/search', {
      method: 'POST',
      body: JSON.stringify({
        query: {
          filter: {
            order_ids: [resolvedOrderId],
          },
        },
        limit: 1,
        sort: {
          sort_field: 'CREATED_AT',
          sort_order: 'DESC',
        },
      }),
    });
    payment = paymentsData?.payments?.[0] ?? null;
    paymentStatus = payment?.status ?? null;
  } catch {
    // Alguns pedidos já trazem tender completo no retrieve do pedido.
    // Se SearchPayments falhar, seguimos com fallback sem quebrar o status.
    const tender = order?.tenders?.[0] ?? null;
    payment = tender
      ? {
          id: tender.payment_id ?? tender.id ?? null,
          status: tender.card_details?.status ?? null,
          updated_at: tender.created_at ?? null,
        }
      : null;
    paymentStatus = payment?.status ?? null;
  }
  const finalStatus = resolveClientStatusFromOrder(order, paymentStatus);
  return {
    orderId: order.id,
    orderState: order.state ?? null,
    createdAt: order?.created_at ?? null,
    paymentId: payment?.id ?? null,
    paymentStatus,
    status: finalStatus,
    updatedAt: payment?.updated_at ?? order?.updated_at ?? null,
  };
}

/**
 * Busca pedidos recentes por nome/e-mail no conteúdo do pedido.
 * Útil para recuperar order_id quando o cliente não o possui.
 */
export async function lookupOrdersByCustomer({ name, email, limit = 8 } = {}) {
  const normalizedName = normalizeLookupText(name);
  const normalizedEmail = normalizeLookupText(email);
  if (!normalizedName && !normalizedEmail) {
    const err = new Error('Informe nome ou e-mail para buscar pedidos.');
    err.statusCode = 400;
    throw err;
  }
  const { locationId } = getConfig();
  const now = new Date();
  const since = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30); // 30 dias
  const data = await squareFetch('/v2/orders/search', {
    method: 'POST',
    body: JSON.stringify({
      location_ids: [locationId],
      limit: Math.min(Math.max(Number(limit) || 8, 1), 20),
      query: {
        filter: {
          date_time_filter: {
            created_at: {
              start_at: since.toISOString(),
              end_at: now.toISOString(),
            },
          },
        },
        sort: {
          sort_field: 'CREATED_AT',
          sort_order: 'DESC',
        },
      },
    }),
  });
  const matches = (data?.orders || []).filter((o) => {
    const hay = extractOrderLookupText(o);
    if (!hay) return false;
    const nameOk = normalizedName ? hay.includes(normalizedName) : true;
    const emailOk = normalizedEmail ? hay.includes(normalizedEmail) : true;
    return nameOk && emailOk;
  });

  const enriched = matches.slice(0, 8).map((o) => {
    const derived = deriveStatusFromOrder(o);
    return {
      orderId: o.id,
      createdAt: o.created_at ?? null,
      orderState: o.state ?? null,
      fulfillmentType: o.fulfillments?.[0]?.type ?? null,
      status: derived.status,
      paymentStatus: derived.paymentStatus,
    };
  });
  return enriched;
}
