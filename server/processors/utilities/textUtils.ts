import { jsPDF } from 'jspdf';
import { Document, Paragraph, TextRun, Packer } from 'docx';

export function countTextMetrics(text: string) {
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s+/g, '').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text ? text.split('\n').length : 0;

  return {
    chars,
    charsNoSpaces,
    words,
    lines,
  };
}

export function convertTextCase(text: string, mode: 'upper' | 'lower' | 'title' | 'sentence') {
  if (mode === 'upper') return text.toUpperCase();
  if (mode === 'lower') return text.toLowerCase();
  if (mode === 'title') {
    return text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }
  if (mode === 'sentence') {
    return text.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  }
  return text;
}

export function removeTextExtraSpaces(text: string) {
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .trim();
}

export function createPdfFromText(text: string, title = 'Document'): Buffer {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 20, 20);

  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, 170);
  let y = 30;

  for (let i = 0; i < lines.length; i++) {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines[i], 20, y);
    y += 6;
  }

  const pdfArray = doc.output('arraybuffer');
  return Buffer.from(pdfArray);
}

export async function createWordFromText(text: string, title = 'Document'): Promise<Buffer> {
  const paragraphs = text.split('\n').map((line) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: line,
          size: 22,
        }),
      ],
      spacing: { after: 100 },
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 28,
              }),
            ],
            spacing: { after: 200 },
          }),
          ...paragraphs,
        ],
      },
    ],
  });

  const docxBuf = await Packer.toBuffer(doc);
  return Buffer.from(docxBuf);
}
