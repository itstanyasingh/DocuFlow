import { jsPDF } from 'jspdf';
import { Document, Paragraph, TextRun, Packer } from 'docx';

export interface TextStatistics {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  lines: number;
  paragraphs: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
  avgWordLength: number;
}

/**
 * 1. Calculate deterministic text statistics
 */
export function analyzeTextStatistics(text: string): TextStatistics {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  
  const wordsArray = text.trim().match(/\S+/g) || [];
  const words = wordsArray.length;
  
  const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
  
  const paragraphs = text
    ? text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
    : 0;

  const readingTimeMinutes = Math.ceil(words / 200); // avg 200 WPM
  const speakingTimeMinutes = Math.ceil(words / 130); // avg 130 WPM
  const avgWordLength = words > 0 ? Number((charactersNoSpaces / words).toFixed(1)) : 0;

  return {
    words,
    characters,
    charactersNoSpaces,
    lines,
    paragraphs: Math.max(1, paragraphs),
    readingTimeMinutes,
    speakingTimeMinutes,
    avgWordLength,
  };
}

/**
 * 2. Convert text case
 */
export type TextCaseType = 
  | 'uppercase'
  | 'lowercase'
  | 'title'
  | 'sentence'
  | 'camel'
  | 'snake'
  | 'kebab'
  | 'constant';

export function convertTextCase(text: string, targetCase: TextCaseType): string {
  switch (targetCase) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'title':
      return text.replace(
        /\w\S*/g,
        (w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase()
      );
    case 'sentence':
      return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
    case 'camel':
      return text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
    case 'snake':
      return text
        .trim()
        .toLowerCase()
        .replace(/[\s\W-]+/g, '_');
    case 'kebab':
      return text
        .trim()
        .toLowerCase()
        .replace(/[\s\W_]+/g, '-');
    case 'constant':
      return text
        .trim()
        .toUpperCase()
        .replace(/[\s\W-]+/g, '_');
    default:
      return text;
  }
}

/**
 * 3. Text to PDF Conversion
 */
export async function convertTextToPdf(
  text: string,
  options?: { title?: string; fontSize?: number; fontName?: string }
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxLineWidth = pageWidth - margin * 2;
  const fontSize = options?.fontSize || 11;
  const lineHeight = fontSize * 1.35;

  doc.setFontSize(fontSize);
  doc.setFont('Helvetica', 'normal');

  let currentY = margin;

  if (options?.title) {
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.text(options.title, margin, currentY);
    currentY += 28;
    doc.setFontSize(fontSize);
    doc.setFont('Helvetica', 'normal');
  }

  const lines = doc.splitTextToSize(text, maxLineWidth);

  for (let i = 0; i < lines.length; i++) {
    if (currentY + lineHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
    }
    doc.text(lines[i], margin, currentY);
    currentY += lineHeight;
  }

  return doc.output('blob');
}

/**
 * 4. Text to DOCX Conversion
 */
export async function convertTextToDocx(
  text: string,
  options?: { title?: string }
): Promise<Blob> {
  const paragraphs: Paragraph[] = [];

  if (options?.title) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: options.title,
            bold: true,
            size: 32, // 16pt
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  const rawParagraphs = text.split(/\r\n|\r|\n/);
  for (const p of rawParagraphs) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: p,
            size: 22, // 11pt
          }),
        ],
        spacing: { after: 120 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
