import { createWorker } from 'tesseract.js';
import { OcrResult } from '../types';
import { renderPdfPages } from './pdfjsHelper';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Perform Optical Character Recognition on an image using Tesseract OCR.
 * Extracts text, line bounding data, detected tables/key-values, and confidence.
 */
export async function performOcr(
  imageSource: string | File | Blob,
  progressCallback?: (progress: number, status: string) => void
): Promise<OcrResult> {
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (progressCallback && m.status === 'recognizing text') {
        progressCallback(Math.round((m.progress || 0) * 100), m.status);
      }
    },
  });

  try {
    const ret = await worker.recognize(imageSource);
    const text = ret.data.text || '';
    const confidence = (ret.data.confidence || 90) / 100;
    const words = text.trim().split(/\s+/).filter(Boolean);

    // Extract headers (lines in uppercase or short lines ending without punctuation)
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const headers: string[] = [];
    const keyValues: { key: string; value: string }[] = [];

    // Parse potential key-value pairs (e.g. "Invoice Number: 1042", "Date: 2026-01-15")
    for (const line of lines) {
      if (line.length < 50 && (line === line.toUpperCase() || line.startsWith('#') || line.endsWith(':'))) {
        headers.push(line.replace(/[:#]/g, '').trim());
      }

      const kvMatch = line.match(/^([^:\t]+)[:=]\s*(.+)$/);
      if (kvMatch) {
        keyValues.push({
          key: kvMatch[1].trim(),
          value: kvMatch[2].trim(),
        });
      }
    }

    // Parse tables if structured rows/tabs/pipes exist
    const tables: { title?: string; headers: string[]; rows: string[][] }[] = [];
    const tableLines = lines.filter(l => l.includes('|') || l.includes('\t') || /\s{3,}/.test(l));
    
    if (tableLines.length >= 2) {
      const parsedRows = tableLines.map(l => {
        if (l.includes('|')) {
          return l.split('|').map(c => c.trim()).filter(Boolean);
        }
        if (l.includes('\t')) {
          return l.split('\t').map(c => c.trim()).filter(Boolean);
        }
        return l.split(/\s{2,}/).map(c => c.trim()).filter(Boolean);
      }).filter(r => r.length >= 2);

      if (parsedRows.length >= 2) {
        const tableHeaders = parsedRows[0];
        const tableData = parsedRows.slice(1);
        tables.push({
          title: headers[0] || 'Extracted Data Table',
          headers: tableHeaders,
          rows: tableData,
        });
      }
    }

    // If no tables detected from delimiters, generate a clean structured tabular breakdown from key-values
    if (tables.length === 0 && keyValues.length >= 2) {
      tables.push({
        title: 'Extracted Field Properties',
        headers: ['Field / Property', 'Extracted Value'],
        rows: keyValues.map(kv => [kv.key, kv.value]),
      });
    }

    return {
      fullText: text,
      language: 'English (Tesseract OCR)',
      confidenceScore: Math.min(0.99, Math.max(0.70, confidence)),
      wordCount: words.length,
      headers: headers.slice(0, 8),
      tables,
      keyValues: keyValues.slice(0, 20),
      handwrittenNotesDetected: confidence < 0.75,
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * OCR on Scanned PDF: Renders PDF pages to raster images and performs Tesseract OCR
 */
export async function ocrScannedPdfToText(
  pdfBuffer: ArrayBuffer,
  progressCallback?: (current: number, total: number, status: string) => void
): Promise<string> {
  const renderedPages = await renderPdfPages(pdfBuffer, { scale: 1.8 });
  const worker = await createWorker('eng', 1);
  const textParts: string[] = [];

  try {
    for (let i = 0; i < renderedPages.length; i++) {
      if (progressCallback) {
        progressCallback(i + 1, renderedPages.length, `Recognizing page ${i + 1} of ${renderedPages.length}...`);
      }
      const page = renderedPages[i];
      const ret = await worker.recognize(page.canvas);
      textParts.push(`--- Page ${i + 1} ---\n` + (ret.data.text || '').trim());
    }
  } finally {
    await worker.terminate();
  }

  return textParts.join('\n\n');
}

/**
 * Create Searchable PDF from Scanned PDF: Renders pages and embeds OCR text overlay
 */
export async function ocrScannedPdfToSearchablePdf(
  pdfBuffer: ArrayBuffer,
  progressCallback?: (current: number, total: number, status: string) => void
): Promise<Uint8Array> {
  const renderedPages = await renderPdfPages(pdfBuffer, { scale: 1.8 });
  const worker = await createWorker('eng', 1);
  const searchablePdf = await PDFDocument.create();
  const font = await searchablePdf.embedFont(StandardFonts.Helvetica);

  try {
    for (let i = 0; i < renderedPages.length; i++) {
      if (progressCallback) {
        progressCallback(i + 1, renderedPages.length, `Extracting OCR layout for page ${i + 1}...`);
      }
      const pageRender = renderedPages[i];
      const ret = await worker.recognize(pageRender.canvas);
      
      const imgBytes = await pageRender.blob.arrayBuffer();
      const embeddedImg = await searchablePdf.embedJpg(imgBytes);

      const pageWidth = pageRender.width / 1.8;
      const pageHeight = pageRender.height / 1.8;
      const page = searchablePdf.addPage([pageWidth, pageHeight]);

      // Draw background scan image
      page.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      });

      // Embed invisible text overlay lines for text selection and searchability
      const lines = (ret.data as any).lines || [];
      for (const line of lines) {
        if (!line.text || !line.bbox) continue;
        const lineText = line.text.trim();
        if (!lineText) continue;

        const x = (line.bbox.x0 / 1.8);
        const y = pageHeight - (line.bbox.y1 / 1.8);
        const h = Math.max(8, (line.bbox.y1 - line.bbox.y0) / 1.8);

        page.drawText(lineText, {
          x,
          y,
          size: h * 0.8,
          font,
          color: rgb(0, 0, 0),
          opacity: 0.01, // Invisible overlay for native PDF search and copy/paste
        });
      }
    }
  } finally {
    await worker.terminate();
  }

  return await searchablePdf.save();
}
