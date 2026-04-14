import { Router } from 'express';
import {
  cancelOrder,
  createOrder,
  createPayment,
  getOrderTotalAmountCents,
} from '../services/squareService.js';
import { validateBody } from '../middleware/validate.js';
import { createOrderBodySchema } from '../validators/orderSchema.js';

const router = Router();

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
        paymentSourceId,
      } = req.validated;
      const order = await createOrder(items, {
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        orderNote,
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
        order,
        ...(payment?.id && { paymentId: payment.id }),
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
