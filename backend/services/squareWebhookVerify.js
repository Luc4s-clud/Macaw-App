/**
 * Validação de assinatura dos webhooks Square (HMAC-SHA256).
 * @see https://developer.squareup.com/docs/webhooks-api/validate-notifications
 */

import crypto from 'crypto';

/**
 * @param {string} rawBodyString corpo exatamente como recebido (string UTF-8)
 * @param {string} signatureHeader valor do header x-square-hmacsha256-signature
 * @param {string} signatureKey chave do webhook no Developer Dashboard
 * @param {string} notificationUrl URL pública do endpoint, idêntica à cadastrada na Square
 */
export function verifySquareWebhookSignature(
  rawBodyString,
  signatureHeader,
  signatureKey,
  notificationUrl
) {
  if (!signatureHeader || !signatureKey || !notificationUrl) return false;
  const hmac = crypto.createHmac('sha256', signatureKey);
  hmac.update(notificationUrl + rawBodyString);
  const digest = hmac.digest('base64');
  const a = Buffer.from(digest, 'utf8');
  const b = Buffer.from(String(signatureHeader).trim(), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
