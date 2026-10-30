/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { Company } from '../models/Company.js';
import { Extraction } from '../models/Extraction.js';
import { siteKeyFromUrl } from '../utils/siteKey.js';

export interface DuplicateHit {
  kind: 'company' | 'extraction';
  id: string;
  name: string;
  matchedUrl: string;
  siteKey: string;
}

export interface DuplicateCheckOptions {
  /** URLs a evaluar (sourceUrl, website, etc.) */
  urls: Array<string | undefined | null>;
  excludeCompanyId?: string;
  excludeExtractionId?: string;
}

function collectKeys(urls: Array<string | undefined | null>): string[] {
  const keys = new Set<string>();
  for (const u of urls) {
    const k = siteKeyFromUrl(u);
    if (k) keys.add(k);
  }
  return [...keys];
}

function matchesAny(docUrls: Array<string | undefined | null>, keys: Set<string>): string | null {
  for (const u of docUrls) {
    const k = siteKeyFromUrl(u);
    if (k && keys.has(k)) return u || k;
  }
  return null;
}

/**
 * Busca si el dominio (sin path) ya existe en directorio o extracciones.
 */
export async function findDuplicateSite(
  options: DuplicateCheckOptions
): Promise<DuplicateHit | null> {
  const keys = collectKeys(options.urls);
  if (!keys.length) return null;
  const keySet = new Set(keys);

  const [companies, extractions] = await Promise.all([
    Company.find({}, { name: 1, website: 1, sourceUrl: 1 }).lean(),
    Extraction.find({}, { name: 1, website: 1, sourceUrl: 1 }).lean(),
  ]);

  for (const c of companies) {
    if (options.excludeCompanyId && String(c._id) === options.excludeCompanyId) continue;
    const matched = matchesAny([c.website, c.sourceUrl], keySet);
    if (matched) {
      return {
        kind: 'company',
        id: String(c._id),
        name: c.name,
        matchedUrl: matched,
        siteKey: siteKeyFromUrl(matched),
      };
    }
  }

  for (const e of extractions) {
    if (options.excludeExtractionId && String(e._id) === options.excludeExtractionId) continue;
    const matched = matchesAny([e.website, e.sourceUrl], keySet);
    if (matched) {
      return {
        kind: 'extraction',
        id: String(e._id),
        name: e.name,
        matchedUrl: matched,
        siteKey: siteKeyFromUrl(matched),
      };
    }
  }

  return null;
}

export function duplicateMessage(hit: DuplicateHit): string {
  const where = hit.kind === 'company' ? 'el directorio' : 'una importación previa';
  return (
    `Ya existe un registro para este sitio («${hit.name}» en ${where}). ` +
    `No se permiten enlaces duplicados ni variaciones de ruta del mismo dominio ` +
    `(p. ej. ejemplo.com y ejemplo.com/inicio). Dominio: ${hit.siteKey}.`
  );
}
