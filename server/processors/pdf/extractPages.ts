import { PDFDocument } from 'pdf-lib';
import { validatePdf } from './validation';

/**
 * Parse a page range / selection string into 1-based page numbers
 * Examples: "1, 3, 5-7, 10" -> [1, 3, 5, 6, 7, 10]
 */
export function parsePageSelection(inputStr: string, totalPages: number): number[] {
  if (!inputStr || !inputStr.trim()) {
    throw new Error('Please specify at least one page number.');
  }

  const tokens = inputStr.split(',').map((t) => t.trim()).filter(Boolean);
  const result: number[] = [];

  for (const token of tokens) {
    if (token.includes('-')) {
      const [startStr, endStr] = token.split('-').map((t) => parseInt(t.trim(), 10));
      if (!isNaN(startStr) && !isNaN(endStr)) {
        const start = Math.max(1, Math.min(startStr, endStr));
        const end = Math.min(totalPages, Math.max(startStr, endStr));
        for (let p = start; p <= end; p++) {
          result.push(p);
        }
      }
    } else {
      const p = parseInt(token, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        result.push(p);
      }
    }
  }

  const unique = Array.from(new Set(result)).sort((a, b) => a - b);
  if (unique.length === 0) {
    throw new Error(`No valid pages selected within document range (1 to ${totalPages}).`);
  }
  return unique;
}

/**
 * Extract specific pages into a new PDF document
 */
export async function extractPdfPagesFile(
  pdfBuffer: Buffer | Uint8Array,
  pagesToExtract: number[] | string
): Promise<{ pdfBytes: Uint8Array; extractedCount: number; totalOriginalPages: number }> {
  const val = await validatePdf(pdfBuffer, 'document.pdf');
  if (!val.isValid) {
    throw new Error(val.error || 'Invalid PDF file.');
  }

  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  let targetPages: number[];
  if (typeof pagesToExtract === 'string') {
    targetPages = parsePageSelection(pagesToExtract, totalPages);
  } else {
    targetPages = pagesToExtract.filter((p) => p >= 1 && p <= totalPages);
  }

  if (targetPages.length === 0) {
    throw new Error(`Please select valid pages between 1 and ${totalPages}.`);
  }

  const newDoc = await PDFDocument.create();
  const zeroIndexed = targetPages.map((p) => p - 1);
  const copiedPages = await newDoc.copyPages(srcDoc, zeroIndexed);
  copiedPages.forEach((p) => newDoc.addPage(p));

  const pdfBytes = await newDoc.save({ useObjectStreams: true });
  return {
    pdfBytes,
    extractedCount: targetPages.length,
    totalOriginalPages: totalPages,
  };
}
