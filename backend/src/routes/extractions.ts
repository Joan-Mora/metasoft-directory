/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { Router } from 'express';
import { z } from 'zod';
import { Extraction } from '../models/Extraction.js';
import { ImportActivity } from '../models/ImportActivity.js';
import { duplicateMessage, findDuplicateSite } from '../services/duplicateSite.js';
import { computeDataStatus } from '../utils/dataStatus.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

const router = Router();

const saveSchema = z.object({
  mode: z.enum(['private', 'publish', 'private_and_publish']),
  manuallyModified: z.boolean().optional().default(false),
  name: z.string().min(1).max(200),
  address: z.string().max(300).optional().default(''),
  specialty: z.string().max(200).optional().default(''),
  phone: z.string().max(80).optional().default(''),
  website: z.string().max(500).optional().default(''),
  logoUrl: z.string().max(1000).optional().default(''),
  bannerUrl: z.string().max(1000).optional().default(''),
  links: z.array(z.string().max(500)).optional().default([]),
  description: z.string().max(4000).optional().default(''),
  highlights: z.array(z.string().max(300)).optional().default([]),
  sourceUrl: z.string().max(1000).optional().default(''),
});

function visibilityFromMode(mode: 'private' | 'publish' | 'private_and_publish') {
  if (mode === 'private') return 'private' as const;
  if (mode === 'publish') return 'published' as const;
  return 'both' as const;
}

router.get('/mine', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    // «Solo publicar» (published) no aparece aquí; solo private y both.
    const items = await Extraction.find({
      ownerId: req.user!.userId,
      visibility: { $in: ['private', 'both'] },
    }).sort({ updatedAt: -1 });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

router.get('/published', async (_req, res, next) => {
  try {
    const items = await Extraction.find({
      visibility: { $in: ['published', 'both'] },
      manuallyModified: false,
    }).sort({ updatedAt: -1 }).limit(100);
    res.json(items);
  } catch (e) {
    next(e);
  }
});

/** Listado admin: todas las importaciones de usuarios. */
router.get('/admin/all', requireAuth, async (_req: AuthedRequest, res, next) => {
  try {
    const items = await Extraction.find().sort({ updatedAt: -1 }).limit(300);
    res.json(
      items.map((e) => {
        const o = e.toObject();
        return {
          ...o,
          _id: String(o._id),
          dataStatus: computeDataStatus(o),
          refType: 'extraction' as const,
        };
      })
    );
  } catch (e) {
    next(e);
  }
});

const adminFieldsSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(300).optional().default(''),
  specialty: z.string().max(200).optional().default(''),
  phone: z.string().max(80).optional().default(''),
  website: z.string().max(500).optional().default(''),
  logoUrl: z.string().max(1000).optional().default(''),
  bannerUrl: z.string().max(1000).optional().default(''),
  links: z.array(z.string().max(500)).optional().default([]),
  description: z.string().max(4000).optional().default(''),
  highlights: z.array(z.string().max(300)).optional().default([]),
  sourceUrl: z.string().max(1000).optional().default(''),
  visibility: z.enum(['private', 'published', 'both']).optional().default('published'),
});

router.post('/admin', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = adminFieldsSchema.parse(req.body);
    const dup = await findDuplicateSite({ urls: [body.sourceUrl, body.website] });
    if (dup) {
      return res.status(409).json({ error: duplicateMessage(dup), duplicate: true, hit: dup });
    }
    const doc = await Extraction.create({
      ...body,
      ownerId: req.user!.userId,
      visibility: body.visibility,
      manuallyModified: false,
      dataStatus: computeDataStatus(body),
      scrapedAt: new Date(),
    });
    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
});

router.put('/admin/:id', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = adminFieldsSchema.partial().parse(req.body);
    const doc = await Extraction.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrada' });

    Object.assign(doc, body);
    const dup = await findDuplicateSite({
      urls: [doc.sourceUrl, doc.website],
      excludeExtractionId: String(doc._id),
    });
    if (dup) {
      return res.status(409).json({ error: duplicateMessage(dup), duplicate: true, hit: dup });
    }
    doc.dataStatus = computeDataStatus(doc);
    await doc.save();
    const updated = await Extraction.findById(doc.id);
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete('/admin/:id', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const doc = await Extraction.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrada' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = saveSchema.parse(req.body);
    if (body.manuallyModified && body.mode !== 'private') {
      return res.status(400).json({
        error:
          'La información modificada manualmente no puede publicarse. Solo puede guardarse en Mis Extracciones.',
      });
    }

    const dup = await findDuplicateSite({
      urls: [body.sourceUrl, body.website],
    });
    if (dup) {
      return res.status(409).json({ error: duplicateMessage(dup), duplicate: true, hit: dup });
    }

    const visibility = visibilityFromMode(body.mode);
    const payload = { ...body };
    delete (payload as { mode?: string }).mode;

    const doc = await Extraction.create({
      ...payload,
      ownerId: req.user!.userId,
      visibility,
      dataStatus: computeDataStatus(payload),
      scrapedAt: new Date(),
    });

    const modeLabel =
      body.mode === 'private'
        ? 'Solo para mí'
        : body.mode === 'publish'
          ? 'Solo publicar'
          : 'Para mí y publicar';
    await ImportActivity.create({
      ownerId: req.user!.userId,
      action: 'saved',
      sourceUrl: body.sourceUrl || '',
      name: body.name,
      detail: `Guardado · ${modeLabel}`,
      mode: body.mode,
    });

    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = saveSchema.partial().extend({
      mode: z.enum(['private', 'publish', 'private_and_publish']).optional(),
    }).parse(req.body);

    const doc = await Extraction.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrada' });
    if (String(doc.ownerId) !== req.user!.userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const manuallyModified = body.manuallyModified ?? doc.manuallyModified;
    if (manuallyModified && body.mode && body.mode !== 'private') {
      return res.status(400).json({
        error: 'Contenido modificado manualmente: solo guardado privado permitido.',
      });
    }

    const { mode, ...rest } = body;
    Object.assign(doc, rest);
    doc.manuallyModified = manuallyModified;
    if (mode) doc.visibility = visibilityFromMode(mode);
    if (manuallyModified) doc.visibility = 'private';

    const dup = await findDuplicateSite({
      urls: [doc.sourceUrl, doc.website],
      excludeExtractionId: String(doc._id),
    });
    if (dup) {
      return res.status(409).json({ error: duplicateMessage(dup), duplicate: true, hit: dup });
    }

    doc.dataStatus = computeDataStatus(doc);
    await doc.save();
    const updated = await Extraction.findById(doc.id);
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const doc = await Extraction.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrada' });
    if (String(doc.ownerId) !== req.user!.userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    await doc.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
