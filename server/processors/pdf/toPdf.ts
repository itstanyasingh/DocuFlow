import mammoth from 'mammoth';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function convertWordToPdf(docxBuffer: Buffer): Promise<Buffer> {
  // Extract text from docx using mammoth
  const extracted = await mammoth.extractRawText({ buffer: docxBuffer });
  const text = extracted.value || 'Converted Word Document';

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const fontSize = 11;
  const lineHeight = 16;
  const margin = 50;
  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const usableHeight = pageHeight - margin * 2;
  const maxLinesPerPage = Math.floor(usableHeight / lineHeight);

  if (lines.length === 0) {
    lines.push('Converted Document (Empty)');
  }

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  for (let i = 0; i < lines.length; i++) {
    if (y < margin + lineHeight) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    const line = lines[i].substring(0, 95); // wrap length approx
    page.drawText(line, {
      x: margin,
      y,
      size: fontSize,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    y -= lineHeight;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
