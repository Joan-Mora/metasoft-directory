/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { extractFromUrl } from '../services/extract.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Límite de extracciones alcanzado. Intenta más tarde.' },
});

const previewSchema = z.object({
  url: z.string().url().max(2000),
});

router.post('/preview', requireAuth, limiter, async (req, res, next) => {
  try {
    const { url } = previewSchema.parse(req.body);
    const data = await extractFromUrl(url);
    res.json(data);
  } catch (e) {
    if (e instanceof Error) {
      return res.status(400).json({ error: e.message });
    }
    next(e);
  }
});

export default router;
