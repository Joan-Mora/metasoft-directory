/**
 * © Joan Mora — Proprietary. See LICENSE.
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

const COLORS = {
  ink: '#0b1220',
  muted: '#4a5a72',
  accent: '#0891b2',
  accent2: '#6d5efc',
  line: '#d5dee8',
  badge: '#e6f7fb',
};

export async function buildCompaniesPdf(cards: PdfCard[], title = 'Directorio — Extracciones'): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fillColor(COLORS.accent).fontSize(9).text('METASOFT · SIGNAL LAYER', { align: 'left' });
    doc.moveDown(0.2);
    doc.fillColor(COLORS.ink).fontSize(18).text(title, { align: 'left' });
    doc.moveDown(0.3);
    doc
      .fillColor(COLORS.muted)
      .fontSize(9)
      .text(
        `Generado ${new Date().toLocaleString('es-CO')} · Origen: extracción / directorio MongoDB · © Joan Mora`
      );
    doc.moveDown(0.5);
    doc.strokeColor(COLORS.line).moveTo(48, doc.y).lineTo(547, doc.y).stroke();
    doc.moveDown(1);

    for (const card of cards) {
      if (doc.y > 700) doc.addPage();

      doc.fillColor(COLORS.ink).fontSize(14).text(card.name || 'Sin nombre');
      doc.moveDown(0.2);
      doc.fillColor(COLORS.accent).fontSize(9).text(
        [
          card.dataStatus ? `Estado: ${card.dataStatus}` : '',
          card.manuallyModified ? 'Modificado manualmente' : '',
        ]
          .filter(Boolean)
          .join(' · ') || ' '
      );
      doc.moveDown(0.3);
      doc.fillColor(COLORS.muted).fontSize(10);
      if (card.specialty) doc.text(`Especialidad: ${card.specialty}`);
      if (card.address) doc.text(`Dirección: ${card.address}`);
      if (card.phone) doc.text(`Teléfono: ${card.phone}`);
      if (card.website) doc.text(`Web: ${card.website}`);
      if (card.sourceUrl) doc.text(`Fuente: ${card.sourceUrl}`);
      doc.moveDown(0.3);
      if (card.description) {
        doc.fillColor(COLORS.ink).fontSize(10).text(card.description, { align: 'justify' });
      }
      if (card.highlights?.length) {
        doc.moveDown(0.3);
        doc.fillColor(COLORS.muted).fontSize(9).text('Destacados:');
        for (const h of card.highlights.slice(0, 6)) {
          doc.text(`• ${h}`);
        }
      }
      doc.moveDown(0.6);
      doc.strokeColor(COLORS.line).moveTo(48, doc.y).lineTo(547, doc.y).stroke();
      doc.moveDown(0.8);
    }

    doc.end();
  });
}
