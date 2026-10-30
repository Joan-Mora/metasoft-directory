/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../config.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: err.flatten().fieldErrors,
    });
  }

  if (config.NODE_ENV !== 'production') {
    console.error(err);
  }

  const message =
    err instanceof Error && config.NODE_ENV !== 'production'
      ? err.message
      : 'Error interno del servidor';

  return res.status(500).json({ error: message });
}
