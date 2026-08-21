import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { validatePdf } from './validation';

export interface SplitResult {
  outputBytes: Uint8Array;
  isZip: boolean;
  mimeType: string;
  outputName: string;
  partsCount: number;
}

/**
 * Split PDF document by custom ranges or into individual pages
 */
export async function splitPdfFile(
  pdfBuffer: Buffer | Uint8Array,
  rangeStr?: string,
  baseFileName: string = 'document'
): Promise<SplitResult> {
  const val = await validatePdf(pdfBuffer, `${baseFileName}.pdf`);
  if (!val.isValid) {
    throw new Error(val.error || 'Invalid PDF file.');
  }

  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  const cleanBase = baseFileName.replace(/\.[^/.]+$/, '');

  // If no range provided or range is "all", split every single page
  if (!rangeStr || rangeStr.trim() === '' || rangeStr.trim().toLowerCase() === 'all') {
    const zip = new JSZip();
    for (let i = 0; i < totalPages; i++) {
      const partDoc = await PDFDocument.create();
      const [copied] = await partDoc.copyPages(srcDoc, [i]);
      partDoc.addPage(copied);
      const partBytes = await partDoc.save();
      zip.file(`page-${i + 1}.pdf`, partBytes);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    return {
      outputBytes: zipBuffer,
      isZip: true,
      mimeType: 'application/zip',
      outputName: `${cleanBase}-split-pages.zip`,
      partsCount: totalPages,
    };
  }

  // Parse ranges like "1-3, 4-7, 8-10" or "1, 3, 5"
  const rangeTokens = rangeStr.split(',').map((s) => s.trim()).filter(Boolean);
  const parsedGroups: number[][] = [];

  for (const token of rangeTokens) {
    if (token.includes('-')) {
      const parts = token.split('-').map((t) => t.trim());
      if (parts.length !== 2) {
        throw new Error(`Invalid page range format: "${token}".`);
      }
      const startStr = parts[0];
      const endStr = parts[1];
      if (startStr === '' || endStr === '') {
        throw new Error(`Invalid page range: "${token}".`);
      }
      const startVal = parseInt(startStr, 10);
      const endVal = parseInt(endStr, 10);

      if (isNaN(startVal) || isNaN(endVal)) {
        throw new Error(`Invalid page numbers in range: "${token}".`);
      }
      if (startVal > endVal) {
        throw new Error(`Invalid page range "${token}": start page cannot be greater than end page.`);
      }
      if (startVal < 1 || endVal > totalPages) {
        throw new Error(`Page number out of range in "${token}". This PDF contains ${totalPages} pages.`);
      }

      const group: number[] = [];
      for (let p = startVal; p <= endVal; p++) {
        group.push(p - 1);
      }
      if (group.length > 0) parsedGroups.push(group);
    } else {
      const p = parseInt(token, 10);
      if (isNaN(p)) {
        throw new Error(`Invalid page number: "${token}".`);
      }
      if (p < 1 || p > totalPages) {
        throw new Error(`Page ${p} does not exist. This PDF contains ${totalPages} pages.`);
      }
      parsedGroups.push([p - 1]);
    }
  }

  if (parsedGroups.length === 0) {
    throw new Error(`No valid page ranges found for ${totalPages}-page document.`);
  }

  // If only 1 group requested, return a single PDF
  if (parsedGroups.length === 1) {
    const partDoc = await PDFDocument.create();
    const copiedPages = await partDoc.copyPages(srcDoc, parsedGroups[0]);
    copiedPages.forEach((p) => partDoc.addPage(p));
    const partBytes = await partDoc.save({ useObjectStreams: true });
    return {
      outputBytes: partBytes,
      isZip: false,
      mimeType: 'application/pdf',
      outputName: `${cleanBase}-range.pdf`,
      partsCount: 1,
    };
  }

  // Multiple groups -> zip bundle
  const zip = new JSZip();
  for (let idx = 0; idx < parsedGroups.length; idx++) {
    const group = parsedGroups[idx];
    const partDoc = await PDFDocument.create();
    const copiedPages = await partDoc.copyPages(srcDoc, group);
    copiedPages.forEach((p) => partDoc.addPage(p));
    const partBytes = await partDoc.save({ useObjectStreams: true });
    zip.file(`part-${idx + 1}.pdf`, partBytes);
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return {
    outputBytes: zipBuffer,
    isZip: true,
    mimeType: 'application/zip',
    outputName: `${cleanBase}-split-ranges.zip`,
    partsCount: parsedGroups.length,
  };
}
