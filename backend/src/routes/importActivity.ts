/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { Router } from 'express';
import { ImportActivity } from '../models/ImportActivity.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

const router = Router();

router.get('/mine', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const items = await ImportActivity.find({ ownerId: req.user!.userId })
      .sort({ createdAt: -1 })
      .limit(40);
    res.json(items);
  } catch (e) {
    next(e);
  }
});

router.delete('/mine', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    await ImportActivity.deleteMany({ ownerId: req.user!.userId });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
