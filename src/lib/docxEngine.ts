import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import mammoth from 'mammoth';
import { extractTextFromPdf } from './pdfjsHelper';
import { textToPdf } from './pdfEngine';

/**
 * Generate a real, well-formatted Microsoft Word (.docx) document
 */
export async function createDocxFromText(
  title: string,
  content: string | { heading?: string; text: string }[]
): Promise<Blob> {
  const paragraphs: Paragraph[] = [];

  // Document Title
  paragraphs.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );

  if (typeof content === 'string') {
    const rawParagraphs = content.split(/\n\s*\n/);
    for (const pText of rawParagraphs) {
      const clean = pText.trim();
      if (!clean) continue;

      // Detect if this looks like a sub-heading (short line, uppercase or bold prefix)
      if (clean.length < 60 && (clean === clean.toUpperCase() || clean.startsWith('#') || clean.startsWith('--- Page'))) {
        paragraphs.push(
          new Paragraph({
            text: clean.replace(/^[#\- ]+/, ''),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
      } else {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: clean, size: 22 })], // 11pt
            spacing: { after: 150, line: 276 },
          })
        );
      }
    }
  } else {
    for (const section of content) {
      if (section.heading) {
        paragraphs.push(
          new Paragraph({
            text: section.heading,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
      }
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: section.text, size: 22 })],
          spacing: { after: 150, line: 276 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

/**
 * Convert PDF to editable Word document (.docx) by extracting text and structure
 */
export async function pdfToDocx(pdfBuffer: ArrayBuffer, docTitle: string): Promise<Blob> {
  const { fullText, pageTexts } = await extractTextFromPdf(pdfBuffer);
  
  if (!fullText.trim()) {
    // If no vector text found (scanned PDF), create docx with notice
    return await createDocxFromText(
      docTitle,
      'This document did not contain extractable vector text. For scanned PDFs or images, please use the OCR to Word tool.'
    );
  }

  const sections: { heading?: string; text: string }[] = pageTexts.map(pt => ({
    heading: `Page ${pt.page}`,
    text: pt.text,
  }));

  return await createDocxFromText(docTitle, sections);
}

/**
 * Extract raw text from a DOCX file using mammoth
 */
export async function docxToTxt(docxBuffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: docxBuffer });
  return result.value || '';
}

/**
 * Convert DOCX file to PDF
 */
export async function docxToPdf(docxBuffer: ArrayBuffer, fileName: string): Promise<Uint8Array> {
  const extractedText = await docxToTxt(docxBuffer);
  return await textToPdf(extractedText || 'Blank document');
}
