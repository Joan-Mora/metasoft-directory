/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { Router } from 'express';
import { z } from 'zod';
import { Company } from '../models/Company.js';
import { Extraction } from '../models/Extraction.js';
import { duplicateMessage, findDuplicateSite } from '../services/duplicateSite.js';
import { computeDataStatus } from '../utils/dataStatus.js';
import { requireAuth } from '../middleware/auth.js';
import { encryptField } from '../utils/crypto.js';

const router = Router();

const companySchema = z.object({
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
  manuallyModified: z.boolean().optional().default(false),
});

router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const status = String(req.query.status || '').trim();
    const nameFilter = q
      ? { name: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
      : {};
    const statusOk = ['complete', 'partial', 'none'].includes(status) ? status : '';

    const [companies, published] = await Promise.all([
      Company.find(nameFilter).limit(200),
      Extraction.find({
        visibility: { $in: ['published', 'both'] },
        manuallyModified: false,
        ...nameFilter,
      }).limit(100),
    ]);

    const merged = [
      ...companies.map((c) => {
        const o = c.toObject();
        return {
          ...o,
          _id: String(o._id),
          dataStatus: computeDataStatus(o),
          refType: 'company' as const,
        };
      }),
      ...published.map((e) => {
        const o = e.toObject();
        return {
          ...o,
          _id: String(o._id),
          dataStatus: computeDataStatus(o),
          refType: 'extraction' as const,
        };
      }),
    ]
      .filter((item) => !statusOk || item.dataStatus === statusOk)
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

    res.json(merged.slice(0, 200));
  } catch (e) {
    next(e);
  }
});

router.get('/by-status/:status', async (req, res, next) => {
  try {
    const status = req.params.status;
    if (!['complete', 'partial', 'none'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    const companies = await Company.find({ dataStatus: status }).sort({ name: 1 });
    res.json(companies);
  } catch (e) {
    next(e);
  }
});

/** Casas semilla / creadas por admin (colección Company). */
router.get('/source', requireAuth, async (_req, res, next) => {
  try {
    const companies = await Company.find().sort({ name: 1 }).limit(300);
    res.json(
      companies.map((c) => {
        const o = c.toObject();
        return {
          ...o,
          _id: String(o._id),
          dataStatus: computeDataStatus(o),
          refType: 'company' as const,
        };
      })
    );
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ error: 'No encontrada' });
    res.json(company);
  } catch (e) {
    next(e);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = companySchema.parse(req.body);
    const dup = await findDuplicateSite({
      urls: [body.website, body.sourceUrl],
    });
    if (dup) {
      return res.status(409).json({ error: duplicateMessage(dup), duplicate: true, hit: dup });
    }
    const dataStatus = computeDataStatus(body);
    const company = await Company.create({ ...body, dataStatus });
    res.status(201).json(company);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const body = companySchema.partial().parse(req.body);
    const existing = await Company.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'No encontrada' });

    Object.assign(existing, body);
    if (body.phone) existing.phone = encryptField(body.phone);
    existing.manuallyModified = body.manuallyModified ?? true;

    const dup = await findDuplicateSite({
      urls: [existing.website, existing.sourceUrl],
      excludeCompanyId: String(existing._id),
    });
    if (dup) {
      return res.status(409).json({ error: duplicateMessage(dup), duplicate: true, hit: dup });
    }

    existing.dataStatus = computeDataStatus(existing);
    await existing.save();
    // re-fetch to trigger decrypt hooks
    const updated = await Company.findById(existing.id);
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const deleted = await Company.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'No encontrada' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
