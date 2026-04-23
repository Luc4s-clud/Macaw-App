import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'order-codes.json');
const CODE_PREFIX = 'MW';
const CODE_DIGITS = 6;

let writeQueue = Promise.resolve();

function normalizePublicOrderCode(input) {
  return String(input ?? '').trim().toUpperCase();
}

async function readStore() {
  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      lastSeq: Number(parsed?.lastSeq) || 0,
      byOrderId: parsed?.byOrderId && typeof parsed.byOrderId === 'object' ? parsed.byOrderId : {},
      byCode: parsed?.byCode && typeof parsed.byCode === 'object' ? parsed.byCode : {},
    };
  } catch {
    return { lastSeq: 0, byOrderId: {}, byCode: {} };
  }
}

async function writeStore(store) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STORE_FILE, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

function nextCode(seq) {
  return `${CODE_PREFIX}${String(seq).padStart(CODE_DIGITS, '0')}`;
}

function enqueueWrite(task) {
  writeQueue = writeQueue.then(task, task);
  return writeQueue;
}

export async function getOrCreatePublicOrderCode(orderId) {
  const normalizedOrderId = String(orderId ?? '').trim();
  if (!normalizedOrderId) return null;
  return enqueueWrite(async () => {
    const store = await readStore();
    const existing = store.byOrderId[normalizedOrderId];
    if (existing) return existing;
    const seq = store.lastSeq + 1;
    const code = nextCode(seq);
    store.lastSeq = seq;
    store.byOrderId[normalizedOrderId] = code;
    store.byCode[code] = normalizedOrderId;
    await writeStore(store);
    return code;
  });
}

export async function getPublicOrderCode(orderId) {
  const normalizedOrderId = String(orderId ?? '').trim();
  if (!normalizedOrderId) return null;
  const store = await readStore();
  return store.byOrderId[normalizedOrderId] || null;
}

export async function getOrderIdByPublicCode(code) {
  const normalizedCode = normalizePublicOrderCode(code);
  if (!normalizedCode) return null;
  const store = await readStore();
  return store.byCode[normalizedCode] || null;
}

