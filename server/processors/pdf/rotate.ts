import { PDFDocument, degrees } from 'pdf-lib';
import { validatePdf } from './validation';
import { parsePageSelection } from './extractPages';

/**
 * Rotate PDF pages by 90, 180, or 270 degrees
 */
export async function rotatePdfFile(
  pdfBuffer: Buffer | Uint8Array,
  angle: 90 | 180 | 270 = 90,
  pageSelection?: number[] | string
): Promise<{ pdfBytes: Uint8Array; rotatedPagesCount: number; totalPages: number }> {
  const val = await validatePdf(pdfBuffer, 'document.pdf');
  if (!val.isValid) {
    throw new Error(val.error || 'Invalid PDF file.');
  }

  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  let targetPages: number[] = [];
  if (pageSelection && typeof pageSelection === 'string' && pageSelection.trim() !== '' && pageSelection.trim().toLowerCase() !== 'all') {
    targetPages = parsePageSelection(pageSelection, totalPages);
  } else if (Array.isArray(pageSelection) && pageSelection.length > 0) {
    targetPages = pageSelection.filter((p) => p >= 1 && p <= totalPages);
  } else {
    // All pages
    for (let i = 1; i <= totalPages; i++) {
      targetPages.push(i);
    }
  }

  const targetSet = new Set(targetPages);

  for (let i = 0; i < totalPages; i++) {
    const pageNumber = i + 1;
    if (targetSet.has(pageNumber)) {
      const page = srcDoc.getPage(i);
      const currentAngle = page.getRotation().angle;
      page.setRotation(degrees((currentAngle + angle) % 360));
    }
  }

  const pdfBytes = await srcDoc.save({ useObjectStreams: true });
  return {
    pdfBytes,
    rotatedPagesCount: targetPages.length,
    totalPages,
  };
}
