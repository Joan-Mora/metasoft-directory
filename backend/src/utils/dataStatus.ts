/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
export type DataStatus = 'complete' | 'partial' | 'none';

export interface StatusInput {
  name?: string;
  address?: string;
  specialty?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  links?: string[];
  highlights?: string[];
}

function filled(v?: string | unknown[] | null): boolean {
  if (Array.isArray(v)) return v.length > 0;
  return typeof v === 'string' ? v.trim().length > 0 : Boolean(v);
}

/**
 * Completa: como máximo 2 campos clave ausentes y con logo.
 * Parcial: faltan 3 o más campos (o faltan ≤2 pero sin logo).
 * Sin datos: ningún campo de información útil.
 */
export function computeDataStatus(doc: StatusInput): DataStatus {
  const checks = [
    filled(doc.address),
    filled(doc.specialty),
    filled(doc.phone),
    filled(doc.website),
    filled(doc.logoUrl),
    filled(doc.bannerUrl),
    filled(doc.description),
    filled(doc.links),
    filled(doc.highlights),
  ];

  const present = checks.filter(Boolean).length;
  if (present === 0) return 'none';

  const missing = checks.length - present;
  const hasLogo = filled(doc.logoUrl);

  if (missing <= 2 && hasLogo) return 'complete';
  return 'partial';
}
