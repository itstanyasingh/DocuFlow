import { PDFDocument } from 'pdf-lib';
import { validatePdf } from './validation';
import { parsePageSelection } from './extractPages';

/**
 * Delete specified pages from a PDF document
 */
export async function deletePdfPagesFile(
  pdfBuffer: Buffer | Uint8Array,
  pagesToDelete: number[] | string
): Promise<{ pdfBytes: Uint8Array; remainingPages: number; deletedCount: number; originalPages: number }> {
  const val = await validatePdf(pdfBuffer, 'document.pdf');
  if (!val.isValid) {
    throw new Error(val.error || 'Invalid PDF file.');
  }

  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  let targetDeletePages: number[];
  if (typeof pagesToDelete === 'string') {
    targetDeletePages = parsePageSelection(pagesToDelete, totalPages);
  } else {
    targetDeletePages = pagesToDelete.filter((p) => p >= 1 && p <= totalPages);
  }

  if (targetDeletePages.length === 0) {
    throw new Error(`Please specify at least one valid page to delete (between 1 and ${totalPages}).`);
  }

  const deleteSet = new Set(targetDeletePages);
  const pagesToKeep: number[] = [];

  for (let i = 1; i <= totalPages; i++) {
    if (!deleteSet.has(i)) {
      pagesToKeep.push(i - 1);
    }
  }

  if (pagesToKeep.length === 0) {
    throw new Error('Cannot delete all pages from the document. A PDF must retain at least one page.');
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, pagesToKeep);
  copiedPages.forEach((p) => newDoc.addPage(p));

  const pdfBytes = await newDoc.save({ useObjectStreams: true });
  return {
    pdfBytes,
    remainingPages: pagesToKeep.length,
    deletedCount: targetDeletePages.length,
    originalPages: totalPages,
  };
}
