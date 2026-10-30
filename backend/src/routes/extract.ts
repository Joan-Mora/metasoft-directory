/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { extractFromUrl } from '../services/extract.js';
import { ImportActivity } from '../models/ImportActivity.js';
import { duplicateMessage, findDuplicateSite } from '../services/duplicateSite.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

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

const checkSchema = z.object({
  url: z.string().min(1).max(2000),
  excludeCompanyId: z.string().optional(),
  excludeExtractionId: z.string().optional(),
});

router.post('/check-duplicate', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = checkSchema.parse(req.body);
    const hit = await findDuplicateSite({
      urls: [body.url],
      excludeCompanyId: body.excludeCompanyId,
      excludeExtractionId: body.excludeExtractionId,
    });
    if (!hit) {
      return res.json({ duplicate: false });
    }
    return res.json({
      duplicate: true,
      error: duplicateMessage(hit),
      hit,
    });
  } catch (e) {
    next(e);
  }
});

router.post('/preview', requireAuth, limiter, async (req: AuthedRequest, res, next) => {
  try {
    const { url } = previewSchema.parse(req.body);

    const hit = await findDuplicateSite({ urls: [url] });
    if (hit) {
      const message = duplicateMessage(hit);
      await ImportActivity.create({
        ownerId: req.user!.userId,
        action: 'extract_fail',
        sourceUrl: url,
        name: hit.name,
        detail: message.slice(0, 300),
      });
      return res.status(409).json({ error: message, duplicate: true, hit });
    }

    const data = await extractFromUrl(url);
    await ImportActivity.create({
      ownerId: req.user!.userId,
      action: 'extract_ok',
      sourceUrl: url,
      name: data.name || '',
      detail: `Señales extraídas · SNR ${data.dataStatus}`,
    });
    res.json(data);
  } catch (e) {
    if (e instanceof Error) {
      try {
        const parsed = previewSchema.safeParse(req.body);
        await ImportActivity.create({
          ownerId: req.user!.userId,
          action: 'extract_fail',
          sourceUrl: parsed.success ? parsed.data.url : '',
          name: '',
          detail: e.message.slice(0, 300),
        });
      } catch {
        /* ignore activity write */
      }
      return res.status(400).json({ error: e.message });
    }
    next(e);
  }
});

export default router;
