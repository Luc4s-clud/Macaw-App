import { Router } from 'express';
import { getMenuItems } from '../services/squareService.js';

const router = Router();

/**
 * GET /api/menu
 * Retorna itens do catálogo Square no formato do frontend.
 */
router.get('/', async (req, res, next) => {
  try {
    const items = await getMenuItems();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

export default router;
