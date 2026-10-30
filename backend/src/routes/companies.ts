/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { Router } from 'express';
import { z } from 'zod';
import { Company } from '../models/Company.js';
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
    const filter: Record<string, unknown> = {};
    if (q) filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (status && ['complete', 'partial', 'none'].includes(status)) {
      filter.dataStatus = status;
    }
    const companies = await Company.find(filter).sort({ name: 1 }).limit(200);
    res.json(companies);
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
