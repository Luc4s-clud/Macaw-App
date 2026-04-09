import { Router } from 'express';
import { createOrder } from '../services/squareService.js';
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
      const { items } = req.validated;
      const order = await createOrder(items);
      res.status(201).json({
        orderId: order.id,
        order,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
