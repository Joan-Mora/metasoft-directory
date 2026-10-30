/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { Router } from 'express';
import { z } from 'zod';
import { Company } from '../models/Company.js';
import { Extraction } from '../models/Extraction.js';
import { buildCompaniesPdf } from '../services/pdf.js';
import { optionalAuth, requireAuth, type AuthedRequest } from '../middleware/auth.js';

const router = Router();

const schema = z.object({
  companyIds: z.array(z.string()).optional().default([]),
  extractionIds: z.array(z.string()).optional().default([]),
  title: z.string().max(120).optional(),
});

const previewSchema = z.object({
  title: z.string().max(120).optional(),
  cards: z
    .array(
      z.object({
        name: z.string(),
        address: z.string().optional(),
        specialty: z.string().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        description: z.string().optional(),
        highlights: z.array(z.string()).optional(),
        dataStatus: z.string().optional(),
        manuallyModified: z.boolean().optional(),
        sourceUrl: z.string().optional(),
      })
    )
    .min(1)
    .max(50),
});

router.post('/preview', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = previewSchema.parse(req.body);
    const pdf = await buildCompaniesPdf(
      body.cards,
      body.title || 'Vista previa de extracción'
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="extraccion-preview.pdf"');
    res.send(pdf);
  } catch (e) {
    next(e);
  }
});

router.post('/', optionalAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = schema.parse(req.body);
    if (!body.companyIds.length && !body.extractionIds.length) {
      return res.status(400).json({ error: 'Selecciona al menos un elemento' });
    }

    const companies = body.companyIds.length
      ? await Company.find({ _id: { $in: body.companyIds } })
      : [];

    let extractions: Awaited<ReturnType<typeof Extraction.find>> = [];
    if (body.extractionIds.length) {
      if (!req.user) {
        return res.status(401).json({
          error: 'Autenticación requerida para extracciones personales',
        });
      }
      extractions = await Extraction.find({
        _id: { $in: body.extractionIds },
        $or: [
          { ownerId: req.user.userId },
          { visibility: { $in: ['published', 'both'] }, manuallyModified: false },
        ],
      });
    }

    const cards = [
      ...companies.map((c) => ({
        name: c.name,
        address: c.address,
        specialty: c.specialty,
        phone: c.phone,
        website: c.website,
        description: c.description,
        highlights: c.highlights,
        dataStatus: c.dataStatus,
        manuallyModified: c.manuallyModified,
        sourceUrl: c.sourceUrl || c.website,
      })),
      ...extractions.map((c) => ({
        name: c.name,
        address: c.address,
        specialty: c.specialty,
        phone: c.phone,
        website: c.website,
        description: c.description,
        highlights: c.highlights,
        dataStatus: c.dataStatus,
        manuallyModified: c.manuallyModified,
        sourceUrl: c.sourceUrl || c.website,
      })),
    ];

    const pdf = await buildCompaniesPdf(
      cards,
      body.title || 'Directorio de casas de software'
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="directorio-export.pdf"');
    res.send(pdf);
  } catch (e) {
    next(e);
  }
});

export default router;
