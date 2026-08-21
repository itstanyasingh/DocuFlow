import { createWorker } from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import { Document, Paragraph, TextRun, Packer } from 'docx';

export async function extractTextFromImage(imageBuffer: Buffer, language = 'eng'): Promise<string> {
  const worker = await createWorker(language);
  try {
    const ret = await worker.recognize(imageBuffer);
    await worker.terminate();
    return ret.data.text || 'No text recognized.';
  } catch (err: any) {
    await worker.terminate();
    throw new Error('OCR recognition failed: ' + (err.message || 'Unknown error'));
  }
}

export async function convertOcrTextToWord(text: string, title = 'OCR Document'): Promise<Buffer> {
  const paragraphs = text.split('\n').map((line) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: line,
          size: 22,
          color: '1E293B',
        }),
      ],
      spacing: { after: 120 },
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
                color: '0F172A',
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
