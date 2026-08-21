import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { renderPdfPages, extractTextFromPdf as extractPdfjsText } from './pdfjsHelper';

export interface PdfProcessOptions {
  // Merge
  files?: Array<{ buffer: ArrayBuffer; name: string }>;
  // Split / Extract / Delete / Reorder / Rotate
  pages?: number[]; // 1-indexed
  pageRanges?: string; // e.g. "1-3, 5, 7-9"
  splitMode?: 'all' | 'custom';
  pageOrder?: number[]; // 1-indexed
  rotationAngle?: 90 | 180 | 270;
  // Images to PDF
  images?: Array<{ buffer: ArrayBuffer; mimeType: string }>;
  pageSize?: 'a4' | 'letter' | 'original';
  pageOrientation?: 'portrait' | 'landscape' | 'auto';
  pageMargin?: 'none' | 'small' | 'medium' | 'large';
  // Watermark
  watermarkText?: string;
  watermarkFontSize?: number;
  watermarkOpacity?: number;
  watermarkRotation?: number;
  // Page numbers
  pageNumberPosition?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  startPageNumber?: number;
  // Add text
  textToAdd?: string;
  textPageNumber?: number;
  textX?: number;
  textY?: number;
  textFontSize?: number;
  textColor?: string;
  // Add image
  imageToAdd?: { buffer: ArrayBuffer; mimeType: string };
  imagePageNumber?: number;
  imageX?: number;
  imageY?: number;
  imageWidth?: number;
  imageHeight?: number;
  // Crop
  cropMargins?: { top: number; bottom: number; left: number; right: number };
  // Metadata
  metadata?: { title?: string; author?: string; subject?: string; keywords?: string; creator?: string };
}

// Helper to parse page range strings like "1-3, 5, 7-9"
export function parsePageRanges(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr || rangeStr.trim() === '' || rangeStr.trim().toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const result: Set<number> = new Set();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
          result.add(p);
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        result.add(p);
      }
    }
  }

  return Array.from(result).sort((a, b) => a - b);
}

// 1. Merge PDF
export async function mergePdfs(buffers: ArrayBuffer[]): Promise<Uint8Array> {
  if (buffers.length < 2) {
    throw new Error('Please select at least 2 PDF files to merge.');
  }

  const mergedPdf = await PDFDocument.create();

  for (const buf of buffers) {
    const pdf = await PDFDocument.load(buf, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

// 2. Split PDF
export async function splitPdf(
  buffer: ArrayBuffer,
  mode: 'all' | 'custom',
  rangeStr: string,
  baseName: string = 'document'
): Promise<{ pdfBytes?: Uint8Array; zipBlob?: Blob; isZip: boolean; outputFileName: string }> {
  const srcPdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = srcPdf.getPageCount();

  if (mode === 'all') {
    const zip = new JSZip();
    for (let i = 0; i < totalPages; i++) {
      const newPdf = await PDFDocument.create();
      const [page] = await newPdf.copyPages(srcPdf, [i]);
      newPdf.addPage(page);
      const bytes = await newPdf.save();
      zip.file(`${baseName}-page-${i + 1}.pdf`, bytes);
    }
    const zipContent = await zip.generateAsync({ type: 'blob' });
    return { zipBlob: zipContent, isZip: true, outputFileName: `${baseName}-split-pages.zip` };
  } else {
    // Custom ranges split
    const pagesToExtract = parsePageRanges(rangeStr, totalPages);
    if (pagesToExtract.length === 0) {
      throw new Error('Invalid page range specified.');
    }

    if (pagesToExtract.length === 1) {
      const newPdf = await PDFDocument.create();
      const [page] = await newPdf.copyPages(srcPdf, [pagesToExtract[0] - 1]);
      newPdf.addPage(page);
      const pdfBytes = await newPdf.save();
      return { pdfBytes, isZip: false, outputFileName: `${baseName}-page-${pagesToExtract[0]}.pdf` };
    }

    const newPdf = await PDFDocument.create();
    const indices = pagesToExtract.map((p) => p - 1);
    const copiedPages = await newPdf.copyPages(srcPdf, indices);
    copiedPages.forEach((page) => newPdf.addPage(page));
    const pdfBytes = await newPdf.save();
    return { pdfBytes, isZip: false, outputFileName: `${baseName}-split.pdf` };
  }
}

// 3. Extract Pages
export async function extractPdfPages(buffer: ArrayBuffer, pages: number[]): Promise<Uint8Array> {
  const srcPdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();
  const indices = pages.map((p) => p - 1).filter((idx) => idx >= 0 && idx < srcPdf.getPageCount());

  if (indices.length === 0) {
    throw new Error('No valid pages selected for extraction.');
  }

  const copiedPages = await newPdf.copyPages(srcPdf, indices);
  copiedPages.forEach((p) => newPdf.addPage(p));
  return await newPdf.save();
}

// 4. Delete Pages
export async function deletePdfPages(buffer: ArrayBuffer, pagesToDelete: number[]): Promise<Uint8Array> {
  const srcPdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const total = srcPdf.getPageCount();
  const deleteSet = new Set(pagesToDelete.map((p) => p - 1));

  const keepIndices: number[] = [];
  for (let i = 0; i < total; i++) {
    if (!deleteSet.has(i)) {
      keepIndices.push(i);
    }
  }

  if (keepIndices.length === 0) {
    throw new Error('Cannot delete all pages. A PDF must retain at least one page.');
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(srcPdf, keepIndices);
  copiedPages.forEach((p) => newPdf.addPage(p));
  return await newPdf.save();
}

// 5. Reorder Pages
export async function reorderPdfPages(buffer: ArrayBuffer, newOrder: number[]): Promise<Uint8Array> {
  const srcPdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();
  const indices = newOrder.map((p) => p - 1).filter((idx) => idx >= 0 && idx < srcPdf.getPageCount());

  const copiedPages = await newPdf.copyPages(srcPdf, indices);
  copiedPages.forEach((p) => newPdf.addPage(p));
  return await newPdf.save();
}

// 6. Rotate PDF
export async function rotatePdf(
  buffer: ArrayBuffer,
  angle: 90 | 180 | 270,
  targetPages: number[] | 'all'
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const total = pdf.getPageCount();

  const pagesToRotate = targetPages === 'all'
    ? Array.from({ length: total }, (_, i) => i)
    : targetPages.map((p) => p - 1).filter((idx) => idx >= 0 && idx < total);

  for (const idx of pagesToRotate) {
    const page = pdf.getPage(idx);
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + angle) % 360));
  }

  return await pdf.save();
}

// 7 & 8. PDF to JPG / PNG
export async function convertPdfToImages(
  buffer: ArrayBuffer,
  format: 'image/jpeg' | 'image/png',
  targetPages: number[] | 'all',
  baseName: string = 'document'
): Promise<{ zipBlob?: Blob; singleDataUrl?: string; isZip: boolean; outputFileName: string }> {
  const rendered = await renderPdfPages(buffer, {
    scale: 2.0,
    format,
    quality: format === 'image/jpeg' ? 0.88 : 1.0,
  });

  const ext = format === 'image/jpeg' ? 'jpg' : 'png';

  const pagesToExport = targetPages === 'all'
    ? rendered
    : rendered.filter((r) => targetPages.includes(r.pageNumber));

  if (pagesToExport.length === 0) {
    throw new Error('No pages selected for image conversion.');
  }

  if (pagesToExport.length === 1) {
    return {
      singleDataUrl: pagesToExport[0].dataUrl,
      isZip: false,
      outputFileName: `${baseName}-page-${pagesToExport[0].pageNumber}.${ext}`,
    };
  }

  const zip = new JSZip();
  for (const p of pagesToExport) {
    const base64Data = p.dataUrl.split(',')[1];
    zip.file(`${baseName}-page-${p.pageNumber}.${ext}`, base64Data, { base64: true });
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return { zipBlob, isZip: true, outputFileName: `${baseName}-images.zip` };
}

// 9, 10, 11. JPG / PNG / Image to PDF
export async function convertImagesToPdf(
  images: Array<{ buffer: ArrayBuffer; mimeType: string }>,
  pageSize: 'a4' | 'letter' | 'original' = 'a4',
  marginSize: 'none' | 'small' | 'medium' | 'large' = 'medium'
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  const marginMap = { none: 0, small: 18, medium: 36, large: 54 };
  const margin = marginMap[marginSize];

  for (const imgItem of images) {
    let embedImg;
    if (imgItem.mimeType.includes('png')) {
      embedImg = await pdf.embedPng(imgItem.buffer);
    } else {
      embedImg = await pdf.embedJpg(imgItem.buffer);
    }

    let pageWidth = 595.28; // A4
    let pageHeight = 841.89;

    if (pageSize === 'letter') {
      pageWidth = 612;
      pageHeight = 792;
    } else if (pageSize === 'original') {
      pageWidth = embedImg.width + margin * 2;
      pageHeight = embedImg.height + margin * 2;
    }

    const page = pdf.addPage([pageWidth, pageHeight]);

    const availW = pageWidth - margin * 2;
    const availH = pageHeight - margin * 2;

    const scale = Math.min(availW / embedImg.width, availH / embedImg.height);
    const drawW = embedImg.width * scale;
    const drawH = embedImg.height * scale;

    const x = margin + (availW - drawW) / 2;
    const y = margin + (availH - drawH) / 2;

    page.drawImage(embedImg, { x, y, width: drawW, height: drawH });
  }

  return await pdf.save();
}

// 12. PDF to Text
export async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  const result = await extractPdfjsText(buffer);
  if (!result || !result.fullText || result.fullText.trim().length === 0) {
    return 'This PDF does not contain selectable text. OCR is required.';
  }
  return result.fullText;
}

// 13. PDF Page Numbers
export async function addPageNumbersToPdf(
  buffer: ArrayBuffer,
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' = 'bottom-center',
  startNumber: number = 1
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const totalPages = pdf.getPageCount();

  for (let i = 0; i < totalPages; i++) {
    const page = pdf.getPage(i);
    const { width, height } = page.getSize();
    const pageNumStr = `${i + startNumber}`;
    const fontSize = 10;
    const textWidth = font.widthOfTextAtSize(pageNumStr, fontSize);

    let x = width / 2 - textWidth / 2;
    let y = 20;

    if (position.includes('top')) y = height - 30;
    if (position.includes('left')) x = 30;
    if (position.includes('right')) x = width - textWidth - 30;

    page.drawText(pageNumStr, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  return await pdf.save();
}

// 14. PDF Watermark
export async function addWatermarkToPdf(
  buffer: ArrayBuffer,
  text: string = 'CONFIDENTIAL',
  fontSize: number = 48,
  opacity: number = 0.3,
  rotationDegrees: number = 45
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);

  const totalPages = pdf.getPageCount();

  for (let i = 0; i < totalPages; i++) {
    const page = pdf.getPage(i);
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.6, 0.6, 0.6),
      opacity,
      rotate: degrees(rotationDegrees),
    });
  }

  return await pdf.save();
}

// 15. Add Text to PDF
export async function addTextToPdf(
  buffer: ArrayBuffer,
  text: string,
  pageNumber: number = 1,
  x: number = 50,
  y: number = 500,
  fontSize: number = 14,
  hexColor: string = '#000000'
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const targetIdx = Math.max(0, Math.min(pageNumber - 1, pdf.getPageCount() - 1));
  const page = pdf.getPage(targetIdx);

  const r = parseInt(hexColor.slice(1, 3), 16) / 255 || 0;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255 || 0;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255 || 0;

  page.drawText(text, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(r, g, b),
  });

  return await pdf.save();
}

// 16. Add Image to PDF
export async function addImageToPdf(
  pdfBuffer: ArrayBuffer,
  imgBuffer: ArrayBuffer,
  imgMimeType: string,
  pageNumber: number = 1,
  x: number = 50,
  y: number = 500,
  width: number = 150,
  height: number = 150
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

  let embeddedImg;
  if (imgMimeType.includes('png')) {
    embeddedImg = await pdf.embedPng(imgBuffer);
  } else {
    embeddedImg = await pdf.embedJpg(imgBuffer);
  }

  const targetIdx = Math.max(0, Math.min(pageNumber - 1, pdf.getPageCount() - 1));
  const page = pdf.getPage(targetIdx);

  page.drawImage(embeddedImg, {
    x,
    y,
    width,
    height,
  });

  return await pdf.save();
}

// 17. Crop PDF
export async function cropPdf(
  buffer: ArrayBuffer,
  cropMargins: { top: number; bottom: number; left: number; right: number }
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = pdf.getPageCount();

  for (let i = 0; i < totalPages; i++) {
    const page = pdf.getPage(i);
    const { width, height } = page.getSize();

    const left = cropMargins.left;
    const bottom = cropMargins.bottom;
    const right = width - cropMargins.right;
    const top = height - cropMargins.top;

    if (right > left && top > bottom) {
      page.setCropBox(left, bottom, right - left, top - bottom);
    }
  }

  return await pdf.save();
}

// 18 & 19. Edit or Remove Metadata
export async function editPdfMetadata(
  buffer: ArrayBuffer,
  metadata?: { title?: string; author?: string; subject?: string; keywords?: string; creator?: string },
  wipe: boolean = false
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });

  if (wipe) {
    pdf.setTitle('');
    pdf.setAuthor('');
    pdf.setSubject('');
    pdf.setKeywords([]);
    pdf.setProducer('');
    pdf.setCreator('');
  } else if (metadata) {
    if (metadata.title !== undefined) pdf.setTitle(metadata.title);
    if (metadata.author !== undefined) pdf.setAuthor(metadata.author);
    if (metadata.subject !== undefined) pdf.setSubject(metadata.subject);
    if (metadata.keywords !== undefined) {
      pdf.setKeywords(metadata.keywords.split(',').map((k) => k.trim()));
    }
    if (metadata.creator !== undefined) pdf.setCreator(metadata.creator);
  }

  return await pdf.save();
}

// 20. TXT to PDF
export async function convertTxtToPdf(
  text: string,
  fontSize: number = 12,
  margin: number = 40
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = fontSize * 1.35;

  const lines = text.split('\n');
  const wrappedLines: string[] = [];

  for (const rawLine of lines) {
    if (!rawLine) {
      wrappedLines.push('');
      continue;
    }
    const words = rawLine.split(' ');
    let current = '';

    for (const w of words) {
      const test = current ? `${current} ${w}` : w;
      const testW = font.widthOfTextAtSize(test, fontSize);
      if (testW <= contentWidth) {
        current = test;
      } else {
        wrappedLines.push(current);
        current = w;
      }
    }
    if (current) wrappedLines.push(current);
  }

  let page = pdf.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  for (const line of wrappedLines) {
    if (currentY - lineHeight < margin) {
      page = pdf.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - margin;
    }
    if (line) {
      page.drawText(line, {
        x: margin,
        y: currentY - fontSize,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }
    currentY -= lineHeight;
  }

  return await pdf.save();
}

export const textToPdf = convertTxtToPdf;
