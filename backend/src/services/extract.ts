/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import * as cheerio from 'cheerio';
import sanitizeHtml from 'sanitize-html';
import { assertSafeUrl } from './ssrf.js';
import { computeDataStatus, type DataStatus } from '../utils/dataStatus.js';

export interface ExtractedCompany {
  name: string;
  address: string;
  specialty: string;
  phone: string;
  website: string;
  logoUrl: string;
  bannerUrl: string;
  links: string[];
  description: string;
  highlights: string[];
  dataStatus: DataStatus;
  manuallyModified: boolean;
  sourceUrl: string;
  scrapedAt: string;
}

function absUrl(base: string, href?: string | null): string {
  if (!href) return '';
  try {
    return new URL(href, base).toString();
  } catch {
    return '';
  }
}

function cleanText(s: string): string {
  return sanitizeHtml(s, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}

function findPhone(text: string): string {
  const patterns = [
    /(?:\+57[\s.-]?)?(?:\(?\d{1,3}\)?[\s.-]?)?\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/,
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{1,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{3,4}[\s.-]?\d{3,4}/,
    /(?:tel|teléfono|telefono|celular|whatsapp|móvil|movil)[:\s]*([+\d][\d\s().-]{7,})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (!m) continue;
    const raw = (m[1] || m[0]).trim();
    const digits = raw.replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) return raw.replace(/\s+/g, ' ').trim();
  }
  return '';
}

function findAddress(text: string, jsonLd = ''): string {
  const streetFromLd = jsonLd.match(/"streetAddress"\s*:\s*"([^"]+)"/i)?.[1];
  const locality = jsonLd.match(/"addressLocality"\s*:\s*"([^"]+)"/i)?.[1];
  const region = jsonLd.match(/"addressRegion"\s*:\s*"([^"]+)"/i)?.[1];
  const country = jsonLd.match(/"addressCountry"\s*:\s*"([^"]+)"/i)?.[1];
  if (streetFromLd) {
    return cleanText([streetFromLd, locality, region, country].filter(Boolean).join(', '));
  }
  if (locality || region) {
    return cleanText([locality, region, country].filter(Boolean).join(', '));
  }

  const labeled = text.match(
    /(?:dirección|direccion|ubicación|ubicacion|address|sede|location)[:\s]+([A-Za-zÁÉÍÓÚáéíóúñÑ0-9 .,#\-/]{4,100}?)(?=\s+(?:Email|Redes|Tel[eé]fono|WhatsApp|Contacto|Horario|@)|$)/i
  );
  if (labeled?.[1]) {
    const v = cleanText(labeled[1]).replace(/[.,;]\s*$/, '');
    if (v.length >= 4 && v.length <= 120) return v;
  }

  const colo = text.match(
    /(?:Calle|Cl\.|Cra\.?|Carrera|Av\.|Avenida|Cr\.?|Transversal|Tv\.|Diagonal|Dg\.|Autopista)\s+[^.\n|]{4,80}/i
  );
  if (colo?.[0]) return cleanText(colo[0]);

  const cityCountry = text.match(
    /\b([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚáéíóúñÑ]+(?:\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚáéíóúñÑ]+)?),\s*Colombia\b/
  );
  if (cityCountry?.[0]) return cleanText(cityCountry[0]);

  return '';
}

function interpret(params: {
  title: string;
  metaDesc: string;
  headings: string[];
  about: string;
  specialtyHint: string;
  phone: string;
  addressHint: string;
}): { description: string; highlights: string[]; specialty: string } {
  const bits: string[] = [];
  if (params.metaDesc) bits.push(params.metaDesc);
  else if (params.about) bits.push(params.about.slice(0, 400));
  else if (params.headings[0]) {
    bits.push(`${params.title || 'Esta organización'} se presenta como: ${params.headings.slice(0, 3).join('; ')}.`);
  } else {
    bits.push(
      params.title
        ? `${params.title} es una casa de desarrollo de software. La información pública disponible en su sitio es limitada.`
        : 'No se encontró suficiente información textual para generar una descripción completa.'
    );
  }

  const specialty =
    params.specialtyHint ||
    params.headings.find((h) => /software|web|app|erp|cloud|saas|desarrollo/i.test(h)) ||
    'Desarrollo de software';

  const highlights = [
    ...params.headings.slice(0, 4),
    params.phone ? `Contacto telefónico detectado: ${params.phone}` : '',
    params.addressHint ? `Ubicación referida: ${params.addressHint}` : '',
  ].filter(Boolean).slice(0, 6);

  return {
    description: bits.join(' ').slice(0, 800),
    highlights,
    specialty,
  };
}

export async function extractFromUrl(rawUrl: string): Promise<ExtractedCompany> {
  const url = await assertSafeUrl(rawUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  let html = '';
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'DirectorioCasasBot/1.0 (+academic; Uniminuto Taller)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`No se pudo obtener la página (${res.status})`);
    const ctype = res.headers.get('content-type') || '';
    if (!ctype.includes('text/html') && !ctype.includes('application/xhtml')) {
      throw new Error('La URL no devolvió HTML');
    }
    html = await res.text();
  } finally {
    clearTimeout(timer);
  }

  const $ = cheerio.load(html);
  const jsonLd = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).html() || '')
    .get()
    .join('\n');
  $('script, style, noscript').remove();

  const title = cleanText($('meta[property="og:title"]').attr('content') || $('title').first().text() || '');
  const metaDesc = cleanText(
    $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      ''
  );
  const ogImage = absUrl(url.toString(), $('meta[property="og:image"]').attr('content'));
  const logoCandidate =
    absUrl(url.toString(), $('link[rel="icon"]').attr('href')) ||
    absUrl(url.toString(), $('img[alt*="logo" i]').first().attr('src')) ||
    absUrl(url.toString(), $('header img').first().attr('src')) ||
    ogImage;

  const banner =
    ogImage ||
    absUrl(url.toString(), $('img[class*="banner" i], img[class*="hero" i]').first().attr('src'));

  const headings = $('h1, h2')
    .map((_, el) => cleanText($(el).text()))
    .get()
    .filter((t) => t.length > 2 && t.length < 120)
    .slice(0, 8);

  const about = cleanText(
    $('[id*="about" i], [class*="about" i], section')
      .first()
      .text()
      .slice(0, 600)
  );

  const contactBlock = cleanText(
    $('[id*="contact" i], [class*="contact" i], footer, [itemtype*="PostalAddress" i]')
      .map((_, el) => $(el).text())
      .get()
      .join(' ')
      .slice(0, 4000)
  );
  const bodyText = cleanText($('body').text()).slice(0, 8000);
  const searchText = `${contactBlock} ${bodyText}`;

  const telHref = $('a[href^="tel:"]')
    .first()
    .attr('href')
    ?.replace(/^tel:/i, '')
    .trim();
  const phone =
    (telHref ? findPhone(telHref) || telHref : '') ||
    findPhone(`${jsonLd} ${searchText}`);
  const addressHint = findAddress(searchText, jsonLd);

  const socialLinks = $('a[href]')
    .map((_, el) => absUrl(url.toString(), $(el).attr('href')))
    .get()
    .filter((h) =>
      /linkedin|twitter|x\.com|facebook|instagram|github|whatsapp|mailto:/i.test(h)
    )
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 8);

  const contactLink = absUrl(
    url.toString(),
    $('a[href*="contact" i], a[href*="contacto" i]').first().attr('href')
  );
  const links = [...socialLinks, contactLink].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

  const interpreted = interpret({
    title,
    metaDesc,
    headings,
    about,
    specialtyHint: '',
    phone,
    addressHint,
  });

  const draft: ExtractedCompany = {
    name: title || url.hostname.replace(/^www\./, ''),
    address: addressHint,
    specialty: interpreted.specialty,
    phone,
    website: url.origin,
    logoUrl: logoCandidate,
    bannerUrl: banner,
    links,
    description: interpreted.description,
    highlights: interpreted.highlights,
    dataStatus: 'none',
    manuallyModified: false,
    sourceUrl: url.toString(),
    scrapedAt: new Date().toISOString(),
  };

  draft.dataStatus = computeDataStatus(draft);
  return draft;
}
