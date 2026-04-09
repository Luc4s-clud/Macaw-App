/**
 * Serviço de integração com Square (Catalog e Orders).
 * Nunca loga tokens ou dados sensíveis.
 */

import { loadEnv } from '../config/env.js';
import { ORDER_LIMITS } from '../config/constants.js';

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
  const path = cursor
    ? `/v2/catalog/list?types=ITEM,ITEM_VARIATION&cursor=${encodeURIComponent(cursor)}`
    : '/v2/catalog/list?types=ITEM,ITEM_VARIATION';
  return squareFetch(path);
}

function mapCatalogToMenuItems(objects) {
  const byId = Object.fromEntries(objects.map((o) => [o.id, o]));
  const items = [];
  const seen = new Set();

  for (const o of objects) {
    if (o.type !== 'ITEM' || !o.item_data?.variations?.length) continue;
    const itemData = o.item_data;
    const categoryName =
      (itemData.category_id && byId[itemData.category_id]?.category_data?.name) || 'other';
    const category = categoryName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') || 'other';
    const imageUrl =
      itemData.image_ids?.length && byId[itemData.image_ids[0]]?.image_data?.url
        ? byId[itemData.image_ids[0]].image_data.url
        : '';

    for (const varRef of itemData.variations) {
      const varId = typeof varRef === 'string' ? varRef : varRef?.id;
      if (!varId || seen.has(varId)) continue;
      const v = byId[varId]?.item_variation_data;
      if (!v) continue;
      seen.add(varId);
      const priceMoney = v.price_money;
      const price =
        priceMoney && typeof priceMoney.amount === 'number'
          ? priceMoney.amount / Math.pow(10, priceMoney.currency?.length || 2)
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

export async function getMenuItems() {
  let cursor = null;
  const allObjects = [];
  do {
    const data = await listCatalogPage(cursor);
    const list = data.objects || [];
    allObjects.push(...list);
    cursor = data.cursor || null;
  } while (cursor);
  return mapCatalogToMenuItems(allObjects);
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
  const { locationId, token } = getConfig();
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
