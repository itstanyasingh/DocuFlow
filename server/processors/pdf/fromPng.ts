import { PDFDocument } from 'pdf-lib';
import { validatePng } from './validation';
import { ImageToPdfOptions } from './fromJpg';

const PAGE_SIZES: Record<string, [number, number]> = {
  a4: [595.28, 841.89],
  a5: [419.53, 595.28],
  letter: [612.0, 792.0],
  legal: [612.0, 1008.0],
};

const MARGIN_SIZES: Record<string, number> = {
  none: 0,
  small: 18,
  medium: 36,
  large: 72,
};

/**
 * Convert multiple PNG graphics into a single structured PDF document
 */
export async function convertPngToPdf(
  images: Array<{ buffer: Buffer | Uint8Array; fileName: string }>,
  options: ImageToPdfOptions = {}
): Promise<Uint8Array> {
  if (!images || images.length === 0) {
    throw new Error('Please select at least one PNG image.');
  }

  for (const img of images) {
    const val = validatePng(img.buffer, img.fileName);
    if (!val.isValid) {
      throw new Error(`File "${img.fileName}" is not a valid PNG: ${val.error}`);
    }
  }

  const pdfDoc = await PDFDocument.create();
  const marginPt = MARGIN_SIZES[options.margin || 'medium'] ?? 36;
  const targetPageSize = options.pageSize || 'a4';
  const targetOrientation = options.orientation || 'auto';

  for (const img of images) {
    const embedded = await pdfDoc.embedPng(img.buffer);
    const { width: imgW, height: imgH } = embedded.scale(1);

    let pageWidth = imgW;
    let pageHeight = imgH;

    if (targetPageSize === 'original') {
      pageWidth = imgW + marginPt * 2;
      pageHeight = imgH + marginPt * 2;
    } else {
      const standard = PAGE_SIZES[targetPageSize] || PAGE_SIZES.a4;
      let w = standard[0];
      let h = standard[1];

      if (targetOrientation === 'landscape') {
        w = Math.max(standard[0], standard[1]);
        h = Math.min(standard[0], standard[1]);
      } else if (targetOrientation === 'portrait') {
        w = Math.min(standard[0], standard[1]);
        h = Math.max(standard[0], standard[1]);
      } else {
        if (imgW > imgH) {
          w = Math.max(standard[0], standard[1]);
          h = Math.min(standard[0], standard[1]);
        } else {
          w = Math.min(standard[0], standard[1]);
          h = Math.max(standard[0], standard[1]);
        }
      }
      pageWidth = w;
      pageHeight = h;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const maxUsableW = Math.max(10, pageWidth - marginPt * 2);
    const maxUsableH = Math.max(10, pageHeight - marginPt * 2);

    const scaleFactor = Math.min(maxUsableW / imgW, maxUsableH / imgH, 1);
    const finalW = imgW * scaleFactor;
    const finalH = imgH * scaleFactor;

    const x = (pageWidth - finalW) / 2;
    const y = (pageHeight - finalH) / 2;

    page.drawImage(embedded, {
      x,
      y,
      width: finalW,
      height: finalH,
    });
  }

  return await pdfDoc.save({ useObjectStreams: true });
}
