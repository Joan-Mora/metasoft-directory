/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Favorite } from '../models/Favorite.js';
import { Company } from '../models/Company.js';
import { Extraction } from '../models/Extraction.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

const router = Router();

const schema = z.object({
  refType: z.enum(['company', 'extraction']),
  refId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id)),
});

router.get('/', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const favs = await Favorite.find({ userId: req.user!.userId }).sort({ createdAt: -1 });
    const enriched = await Promise.all(
      favs.map(async (f) => {
        const item =
          f.refType === 'company'
            ? await Company.findById(f.refId)
            : await Extraction.findById(f.refId);
        return {
          id: f.id,
          refType: f.refType,
          refId: f.refId,
          createdAt: f.createdAt,
          item,
        };
      })
    );
    res.json(enriched);
  } catch (e) {
    next(e);
  }
});

router.post('/', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = schema.parse(req.body);
    const fav = await Favorite.findOneAndUpdate(
      { userId: req.user!.userId, refType: body.refType, refId: body.refId },
      { userId: req.user!.userId, refType: body.refType, refId: body.refId },
      { upsert: true, new: true }
    );
    res.status(201).json(fav);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const fav = await Favorite.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!.userId,
    });
    if (!fav) return res.status(404).json({ error: 'No encontrado' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete('/by-ref/:refType/:refId', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const refType = req.params.refType as 'company' | 'extraction';
    if (!['company', 'extraction'].includes(refType)) {
      return res.status(400).json({ error: 'Tipo inválido' });
    }
    await Favorite.findOneAndDelete({
      userId: req.user!.userId,
      refType,
      refId: req.params.refId,
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
