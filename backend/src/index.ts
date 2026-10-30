/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/companies.js';
import extractRoutes from './routes/extract.js';
import extractionRoutes from './routes/extractions.js';
import favoriteRoutes from './routes/favorites.js';
import exportRoutes from './routes/exportPdf.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin: config.CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'directorio-casas', env: config.NODE_ENV });
});

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/extract', extractRoutes);
app.use('/api/extractions', extractionRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/export/pdf', exportRoutes);

app.use(errorHandler);

async function start() {
  await mongoose.connect(config.MONGODB_URI);
  console.log('MongoDB connected');
  app.listen(config.PORT, '0.0.0.0', () => {
    console.log(`API listening on http://0.0.0.0:${config.PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start', err);
  process.exit(1);
});
