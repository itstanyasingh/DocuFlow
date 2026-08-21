import { PDFDocument } from 'pdf-lib';
import { validatePdf } from './validation';

export interface MergeResult {
  pdfBytes: Uint8Array;
  totalPages: number;
  fileCount: number;
  totalInputSize: number;
}

/**
 * Merge multiple PDF buffers into a single unified PDF document
 */
export async function mergePdfFiles(
  pdfBuffers: Array<{ buffer: Buffer | Uint8Array; originalName: string }>
): Promise<MergeResult> {
  if (!pdfBuffers || pdfBuffers.length < 2) {
    throw new Error('Please select at least 2 PDF files to merge.');
  }

  let totalInputSize = 0;
  for (const item of pdfBuffers) {
    const val = await validatePdf(item.buffer, item.originalName);
    if (!val.isValid) {
      throw new Error(`File "${item.originalName}" is invalid: ${val.error}`);
    }
    totalInputSize += val.fileSize;
  }

  const mergedPdf = await PDFDocument.create();
  let totalPages = 0;

  for (const item of pdfBuffers) {
    const srcDoc = await PDFDocument.load(item.buffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
    copiedPages.forEach((page) => {
      mergedPdf.addPage(page);
      totalPages++;
    });
  }

  const pdfBytes = await mergedPdf.save({ useObjectStreams: true });

  // Output Validation
  if (!pdfBytes || pdfBytes.length === 0) {
    throw new Error('Merge failed. The generated PDF could not be validated.');
  }

  try {
    const testDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const outputPageCount = testDoc.getPageCount();
    if (outputPageCount !== totalPages) {
      throw new Error('Merge failed. Page count verification mismatch.');
    }
  } catch (err: any) {
    throw new Error('Merge failed. The generated PDF could not be validated.');
  }

  return {
    pdfBytes,
    totalPages,
    fileCount: pdfBuffers.length,
    totalInputSize,
  };
}
