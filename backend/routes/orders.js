import { Router } from 'express';
import {
  cancelOrder,
  createCheckoutPaymentLink,
  createOrder,
  createPayment,
  getOrderPaymentStatus,
  getOrderTotalAmountCents,
  lookupOrdersByCustomer,
} from '../services/squareService.js';
import {
  getOrderIdByPublicCode,
  getOrCreatePublicOrderCode,
  getPublicOrderCode,
} from '../services/orderCodeStore.js';
import { loadEnv } from '../config/env.js';
import { validateBody } from '../middleware/validate.js';
import { createOrderBodySchema } from '../validators/orderSchema.js';

const router = Router();

/**
 * GET /api/orders/code/:publicCode/status
 * Consulta status usando o código público (ex.: MW000123).
 */
router.get('/code/:publicCode/status', async (req, res, next) => {
  try {
    const publicCode = String(req.params.publicCode ?? '').trim().toUpperCase();
    const orderId = await getOrderIdByPublicCode(publicCode);
    if (!orderId) {
      const err = new Error('Pedido não encontrado para este código.');
      err.statusCode = 404;
      throw err;
    }
    const status = await getOrderPaymentStatus(orderId);
    const publicOrderCode =
      (await getPublicOrderCode(status.orderId)) ||
      (await getOrCreatePublicOrderCode(status.orderId));
    res.json({ ...status, publicOrderCode });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders/:orderId/status
 * Retorna status atual do pedido/pagamento consultando a Square.
 */
router.get('/:orderId/status', async (req, res, next) => {
  try {
    const input = String(req.params.orderId ?? '').trim();
    const mappedOrderId = await getOrderIdByPublicCode(input);
    const resolvedOrderId = mappedOrderId || input;
    const status = await getOrderPaymentStatus(resolvedOrderId);
    const publicOrderCode =
      (await getPublicOrderCode(status.orderId)) ||
      (await getOrCreatePublicOrderCode(status.orderId));
    res.json({ ...status, publicOrderCode });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders/lookup?name=&email=
 * Busca pedidos recentes por nome/e-mail e retorna os candidatos com status.
 */
router.get('/lookup/search', async (req, res, next) => {
  try {
    const name = typeof req.query.name === 'string' ? req.query.name : '';
    const email = typeof req.query.email === 'string' ? req.query.email : '';
    const result = await lookupOrdersByCustomer({ name, email });
    const items = await Promise.all(
      result.map(async (item) => ({
        ...item,
        publicOrderCode:
          (await getPublicOrderCode(item.orderId)) ||
          (await getOrCreatePublicOrderCode(item.orderId)),
      }))
    );
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/orders
 * Body validado por createOrderBodySchema.
 * Cria o pedido no Square e retorna orderId.
 */
router.post(
  '/',
  validateBody(createOrderBodySchema),
  async (req, res, next) => {
    try {
      const {
        items,
        customerName,
        customerPhone,
        customerEmail,
        orderNote,
        fulfillmentType,
        deliveryAddressLine1,
        deliveryAddressLine2,
        deliveryCity,
        deliveryState,
        deliveryPostalCode,
        paymentSourceId,
        hostedCheckout,
      } = req.validated;

      if (hostedCheckout) {
        const env = loadEnv();
        if (!env.CHECKOUT_SUCCESS_URL?.trim()) {
          const err = new Error(
            'CHECKOUT_SUCCESS_URL não está configurada no servidor. Defina a URL da página de sucesso (ex.: https://seusite.com/checkout/complete).'
          );
          err.statusCode = 500;
          throw err;
        }
        const { checkoutUrl, orderId, paymentLinkId } = await createCheckoutPaymentLink(
          items,
          {
            customerName,
            customerPhone,
            customerEmail: customerEmail || undefined,
            orderNote,
            fulfillmentType,
            deliveryAddressLine1,
            deliveryAddressLine2,
            deliveryCity,
            deliveryState,
            deliveryPostalCode,
          },
          env.CHECKOUT_SUCCESS_URL.trim()
        );
        return res.status(201).json({
          orderId,
          publicOrderCode: await getOrCreatePublicOrderCode(orderId),
          checkoutUrl,
          paymentLinkId,
        });
      }

      const order = await createOrder(items, {
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        orderNote,
        fulfillmentType,
        deliveryAddressLine1,
        deliveryAddressLine2,
        deliveryCity,
        deliveryState,
        deliveryPostalCode,
      });
      let payment = null;
      if (paymentSourceId) {
        const amountCents = getOrderTotalAmountCents(order, items);
        try {
          payment = await createPayment({
            sourceId: paymentSourceId,
            orderId: order.id,
            amountCents,
          });
        } catch (payErr) {
          try {
            await cancelOrder(order.id);
          } catch (cancelErr) {
            console.error('Falha ao cancelar pedido após erro no pagamento:', cancelErr.message);
          }
          throw payErr;
        }
      }
      res.status(201).json({
        orderId: order.id,
        publicOrderCode: await getOrCreatePublicOrderCode(order.id),
        order,
        ...(payment?.id && { paymentId: payment.id }),
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
