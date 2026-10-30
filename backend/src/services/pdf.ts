/**
 * © Joan Mora — Proprietary. See LICENSE.
 * Export PDF — identidad Signal Layer (misma paleta que la SPA).
 */
import PDFDocument from 'pdfkit';

export interface PdfCard {
  name: string;
  address?: string;
  specialty?: string;
  phone?: string;
  website?: string;
  description?: string;
  highlights?: string[];
  dataStatus?: string;
  manuallyModified?: boolean;
  sourceUrl?: string;
}

const C = {
  bg: '#F2F5F9',
  panel: '#FFFFFF',
  ink: '#0B1220',
  muted: '#4A5A72',
  faint: '#7A8AA3',
  signal: '#0891B2',
  signal2: '#6D5EFC',
  stroke: '#D5DEE8',
  dark: '#0B0F14',
  darkElev: '#121925',
  snrFull: '#1DBF73',
  snrPartial: '#E6A117',
  snrNone: '#E5484D',
};

function snrColor(status?: string): string {
  if (status === 'complete') return C.snrFull;
  if (status === 'partial') return C.snrPartial;
  if (status === 'none') return C.snrNone;
  return C.signal;
}

function snrLabel(status?: string): string {
  if (status === 'complete') return 'COMPLETA';
  if (status === 'partial') return 'PARCIAL';
  if (status === 'none') return 'SIN DATOS';
  return 'SEÑAL';
}

type Doc = InstanceType<typeof PDFDocument>;

function drawPageChrome(
  doc: Doc,
  title: string,
  pageIndex: number,
  totalHint: string
) {
  const w = doc.page.width;
  const h = doc.page.height;

  // Soft page wash
  doc.save();
  doc.rect(0, 0, w, h).fill(C.bg);

  // Dark header band
  doc.rect(0, 0, w, 78).fill(C.dark);
  // Accent gradient strip (simulated with two rects)
  doc.rect(0, 78, w * 0.62, 3).fill(C.signal);
  doc.rect(w * 0.62, 78, w * 0.38, 3).fill(C.signal2);

  // Brand mark square
  doc.roundedRect(40, 22, 14, 14, 3).fill(C.signal);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8)
    .text('METASOFT  ·  SIGNAL LAYER', 62, 26, { characterSpacing: 1.1 });
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(16)
    .text(title, 40, 44, { width: w - 80, lineBreak: false });

  // Footer
  doc.fillColor(C.faint).font('Helvetica').fontSize(7.5)
    .text(
      `${totalHint}  ·  © Joan Mora  ·  Página ${pageIndex}`,
      40,
      h - 36,
      { width: w - 80, align: 'center' }
    );
  doc.moveTo(40, h - 48).lineTo(w - 40, h - 48).strokeColor(C.stroke).lineWidth(0.6).stroke();
  doc.restore();
}

function drawBadge(
  doc: Doc,
  x: number,
  y: number,
  label: string,
  color: string
): number {
  const padX = 7;
  const h = 14;
  doc.font('Helvetica-Bold').fontSize(7);
  const tw = doc.widthOfString(label) + padX * 2;
  doc.save();
  doc.roundedRect(x, y, tw, h, 3).fillOpacity(0.12).fill(color);
  doc.fillOpacity(1).fillColor(color).text(label, x + padX, y + 3.5, { lineBreak: false });
  doc.restore();
  return tw + 6;
}

function estimateCardHeight(card: PdfCard, contentWidth: number, doc: Doc): number {
  let h = 28 + 18 + 52; // header + meta block base
  if (card.description) {
    doc.font('Helvetica').fontSize(9);
    h += doc.heightOfString(card.description.slice(0, 520), { width: contentWidth - 28 }) + 10;
  }
  if (card.highlights?.length) {
    h += 14 + Math.min(card.highlights.length, 5) * 12;
  }
  return h + 18;
}

function drawCard(
  doc: Doc,
  card: PdfCard,
  x: number,
  y: number,
  width: number
): number {
  const accent = snrColor(card.dataStatus);
  const pad = 14;
  const innerW = width - pad * 2 - 6;

  // Measure first
  const height = estimateCardHeight(card, width, doc);

  // Panel shadow (offset rect)
  doc.save();
  doc.roundedRect(x + 2, y + 3, width, height, 8).fill('#E2E8F0');
  // Panel
  doc.roundedRect(x, y, width, height, 8).fill(C.panel);
  // Left SNR accent bar
  doc.roundedRect(x, y, 5, height, 2).fill(accent);
  doc.restore();

  let cy = y + pad;

  // Name
  doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(13)
    .text(card.name || 'Sin nombre', x + pad + 6, cy, { width: innerW, lineBreak: false });
  cy += 18;

  // Badges
  let bx = x + pad + 6;
  bx += drawBadge(doc, bx, cy, snrLabel(card.dataStatus), accent);
  if (card.manuallyModified) {
    bx += drawBadge(doc, bx, cy, 'MODIFICADO', C.signal2);
  }
  if (card.website) {
    drawBadge(doc, bx, cy, 'OFICIAL', C.signal);
  }
  cy += 22;

  // Meta grid
  const meta: [string, string][] = [];
  if (card.specialty) meta.push(['Especialidad', card.specialty]);
  if (card.address) meta.push(['Dirección', card.address]);
  if (card.phone) meta.push(['Teléfono', card.phone]);
  if (card.website) meta.push(['Web', card.website]);
  if (card.sourceUrl && card.sourceUrl !== card.website) meta.push(['Fuente', card.sourceUrl]);

  for (const [label, value] of meta) {
    doc.fillColor(C.faint).font('Helvetica-Bold').fontSize(7)
      .text(label.toUpperCase(), x + pad + 6, cy, { width: 78, lineBreak: false });
    doc.fillColor(C.muted).font('Helvetica').fontSize(9)
      .text(value, x + pad + 86, cy - 1, { width: innerW - 86, lineBreak: false });
    cy += 13;
  }

  if (card.description) {
    cy += 6;
    doc.moveTo(x + pad + 6, cy).lineTo(x + width - pad, cy).strokeColor(C.stroke).lineWidth(0.5).stroke();
    cy += 8;
    doc.fillColor(C.ink).font('Helvetica').fontSize(9)
      .text(card.description.slice(0, 520), x + pad + 6, cy, {
        width: innerW,
        align: 'justify',
        lineGap: 1.5,
      });
    cy = doc.y + 4;
  }

  if (card.highlights?.length) {
    cy += 4;
    doc.fillColor(C.signal).font('Helvetica-Bold').fontSize(8)
      .text('DESTACADOS', x + pad + 6, cy);
    cy += 12;
    for (const h of card.highlights.slice(0, 5)) {
      doc.fillColor(C.signal).circle(x + pad + 10, cy + 3.5, 1.6).fill();
      doc.fillColor(C.muted).font('Helvetica').fontSize(8.5)
        .text(h, x + pad + 18, cy, { width: innerW - 14 });
      cy = Math.max(cy + 11, doc.y + 2);
    }
  }

  return height + 12;
}

export async function buildCompaniesPdf(
  cards: PdfCard[],
  title = 'Directorio — Extracciones'
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 100, bottom: 56, left: 40, right: 40 },
      info: {
        Title: title,
        Author: 'Joan Mora · MetaSoft Directory',
        Subject: 'Exportación Signal Layer',
      },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const stamp = new Date().toLocaleString('es-CO');
    let page = 1;

    const paintChrome = () => {
      drawPageChrome(doc, title, page, `Generado ${stamp}`);
      doc.y = 100;
    };

    paintChrome();

    // Intro strip
    doc
      .fillColor(C.muted)
      .font('Helvetica')
      .fontSize(9)
      .text(
        `${cards.length} ficha${cards.length === 1 ? '' : 's'}  ·  Origen: directorio / extracción MongoDB  ·  Identidad visual Signal Layer`,
        40,
        92,
        { width: doc.page.width - 80 }
      );
    doc.y = 112;

    for (const card of cards) {
      const needed = estimateCardHeight(card, doc.page.width - 80, doc) + 16;
      if (doc.y + needed > doc.page.height - 56) {
        doc.addPage();
        page += 1;
        paintChrome();
        doc.y = 100;
      }
      const used = drawCard(doc, card, 40, doc.y, doc.page.width - 80);
      doc.y += used;
    }

    doc.end();
  });
}
