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

export function computeDataStatus(doc: StatusInput): DataStatus {
  const relevant = [
    doc.address,
    doc.specialty,
    doc.phone,
    doc.website,
    doc.logoUrl,
    doc.bannerUrl,
    doc.description,
    (doc.links && doc.links.length > 0) || undefined,
    (doc.highlights && doc.highlights.length > 0) || undefined,
  ].filter((v) => typeof v === 'string' ? v.trim().length > 0 : Boolean(v));

  if (relevant.length === 0) return 'none';

  const hasCore =
    Boolean(doc.address?.trim()) &&
    Boolean(doc.specialty?.trim()) &&
    Boolean(doc.phone?.trim());
  const hasEnrichment =
    Boolean(doc.website?.trim()) &&
    Boolean(doc.logoUrl?.trim()) &&
    Boolean(doc.description?.trim());

  if (hasCore && hasEnrichment) return 'complete';
  return 'partial';
}
