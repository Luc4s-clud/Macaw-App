import { Router } from 'express';
import { loadEnv } from '../config/env.js';
import { verifySquareWebhookSignature } from '../services/squareWebhookVerify.js';

const router = Router();

/**
 * POST /api/webhooks/square
 * Corpo bruto JSON (use express.raw antes deste router).
 * Configure o mesmo URL no Developer Dashboard e em SQUARE_WEBHOOK_NOTIFICATION_URL.
 */
router.post('/', (req, res) => {
  const env = loadEnv();
  const rawBody =
    req.body instanceof Buffer
      ? req.body.toString('utf8')
      : String(req.body ?? '');
  const signature = req.get('x-square-hmacsha256-signature');
  const allowUnsigned =
    env.WEBHOOK_ALLOW_UNSIGNED === 'true' || env.NODE_ENV !== 'production';

  const sigKey = env.SQUARE_WEBHOOK_SIGNATURE_KEY?.trim();
  const notificationUrl = env.SQUARE_WEBHOOK_NOTIFICATION_URL?.trim();

  if (sigKey && notificationUrl) {
    const ok = verifySquareWebhookSignature(
      rawBody,
      signature || '',
      sigKey,
      notificationUrl
    );
    if (!ok) {
      return res.status(401).send('Invalid signature');
    }
  } else if (!allowUnsigned) {
    return res.status(503).json({
      error:
        'Webhook: configure SQUARE_WEBHOOK_SIGNATURE_KEY e SQUARE_WEBHOOK_NOTIFICATION_URL.',
    });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody || '{}');
  } catch {
    return res.status(400).json({ error: 'JSON inválido.' });
  }

  const type = payload?.type;
  const data = payload?.data?.object ?? payload?.data;

  if (type === 'payment.updated' && data) {
    const status = data.status;
    const orderId = data.order_id;
    if (status === 'COMPLETED' && orderId) {
      console.log(
        `[Square webhook] Pagamento concluído. order_id=${orderId} payment_id=${data.id ?? ''}`
      );
    }
  }

  res.status(200).send();
});

export default router;
