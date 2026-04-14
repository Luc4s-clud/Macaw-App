import { z } from 'zod';
import { ORDER_LIMITS } from '../config/constants.js';

const orderItemSchema = z.object({
  productId: z.string().min(1, 'productId é obrigatório').max(64),
  name: z
    .string()
    .min(1, 'name é obrigatório')
    .max(ORDER_LIMITS.MAX_NAME_LENGTH),
  price: z
    .number()
    .min(0)
    .max(ORDER_LIMITS.MAX_PRICE_CENTS / 100),
  quantity: z
    .number()
    .int('quantity deve ser inteiro')
    .min(1)
    .max(ORDER_LIMITS.MAX_QUANTITY_PER_ITEM),
  observation: z
    .string()
    .max(ORDER_LIMITS.MAX_OBSERVATION_LENGTH)
    .optional()
    .nullable(),
});

export const createOrderBodySchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, 'Envie pelo menos um item')
    .max(ORDER_LIMITS.MAX_ITEMS),
  /** Checkout: dados do cliente (vão para a nota do pedido no Square) */
  customerName: z.string().trim().min(1).max(120).optional(),
  customerPhone: z.string().trim().min(1).max(40).optional(),
  customerEmail: z.union([z.string().email().max(120), z.literal('')]).optional(),
  orderNote: z.string().trim().max(500).optional(),
  /** Token do Square Web Payments SDK (CreatePayment `source_id`). Opcional: sem token = só pedido. */
  paymentSourceId: z.string().trim().min(1).max(512).optional(),
});
