import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import jsPDF from 'jspdf';
import { renderPdfPages } from './pdfjsHelper';
import { bundleIntoZip } from './imageEngine';

export interface WatermarkOptions {
  text: string;
  size?: number;
  opacity?: number;
  color?: { r: number; g: number; b: number };
  angle?: number;
}

export interface PageNumberOptions {
  position?: 'bottom-center' | 'bottom-right' | 'top-right' | 'top-center' | 'bottom-left' | 'top-left';
  format?: 'page_of_total' | 'page_only';
  fontSize?: number;
  startIndex?: number;
}

/**
 * Merge multiple PDF file ArrayBuffers into a single unified PDF
 */
export async function mergePdfs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  
  for (const buffer of pdfBuffers) {
    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  
  return await mergedPdf.save();
}

/**
 * Split PDF by page ranges (e.g. "1-3, 5, 7-10") or extract all pages as individual PDFs
 */
export async function splitPdf(
  pdfBuffer: ArrayBuffer,
  pageRangeStr?: string
): Promise<{ pageIndex: number; pdfBytes: Uint8Array }[]> {
  const srcPdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = srcPdf.getPageCount();
  
  let targetIndices: number[] = [];
  
  if (pageRangeStr && pageRangeStr.trim()) {
    const parts = pageRangeStr.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(n => parseInt(n.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
            targetIndices.push(i - 1);
          }
        }
      } else {
        const pageNum = parseInt(trimmed, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          targetIndices.push(pageNum - 1);
        }
      }
    }
  } else {
    // Split all pages into individual files
    targetIndices = srcPdf.getPageIndices();
  }

  // Remove duplicates while keeping order
  targetIndices = Array.from(new Set(targetIndices));

  if (targetIndices.length === 0) {
    throw new Error('No valid pages found in specified page range.');
  }

  const results: { pageIndex: number; pdfBytes: Uint8Array }[] = [];
  
  for (const idx of targetIndices) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(srcPdf, [idx]);
    newPdf.addPage(copiedPage);
    const bytes = await newPdf.save();
    results.push({ pageIndex: idx + 1, pdfBytes: bytes });
  }

  return results;
}

/**
 * Extract specific pages into a new single PDF
 */
export async function extractPdfPages(
  pdfBuffer: ArrayBuffer,
  pageNumbers: number[] // 1-indexed
): Promise<Uint8Array> {
  const srcPdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = srcPdf.getPageCount();
  const validIndices = pageNumbers
    .filter(n => n >= 1 && n <= totalPages)
    .map(n => n - 1);

  if (validIndices.length === 0) {
    throw new Error('No valid pages selected for extraction.');
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(srcPdf, validIndices);
  copiedPages.forEach(p => newPdf.addPage(p));

  return await newPdf.save();
}

/**
 * Rotate pages of a PDF by 90, 180, or 270 degrees
 */
export async function rotatePdf(
  pdfBuffer: ArrayBuffer,
  rotationAngle: number = 90,
  pageNumbers?: number[]
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = pdf.getPageCount();
  
  for (let i = 0; i < totalPages; i++) {
    if (!pageNumbers || pageNumbers.length === 0 || pageNumbers.includes(i + 1)) {
      const page = pdf.getPage(i);
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + rotationAngle) % 360));
    }
  }
  
  return await pdf.save();
}

/**
 * Delete specified pages from PDF
 */
export async function deletePdfPages(
  pdfBuffer: ArrayBuffer,
  pagesToDelete: number[] // 1-indexed
): Promise<Uint8Array> {
  const srcPdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = srcPdf.getPageCount();
  const newPdf = await PDFDocument.create();
  
  const pagesToKeep = srcPdf
    .getPageIndices()
    .filter(idx => !pagesToDelete.includes(idx + 1));
    
  if (pagesToKeep.length === 0) {
    throw new Error('Cannot delete all pages from document.');
  }

  const copied = await newPdf.copyPages(srcPdf, pagesToKeep);
  copied.forEach(p => newPdf.addPage(p));
  
  return await newPdf.save();
}

/**
 * Reorder pages in PDF
 */
export async function reorderPdfPages(
  pdfBuffer: ArrayBuffer,
  newOrder: number[] // 1-indexed array of page order
): Promise<Uint8Array> {
  const srcPdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();
  
  const zeroIndexed = newOrder.map(n => n - 1);
  const copied = await newPdf.copyPages(srcPdf, zeroIndexed);
  copied.forEach(p => newPdf.addPage(p));
  
  return await newPdf.save();
}

/**
 * Apply text watermark across PDF pages
 */
export async function watermarkPdf(
  pdfBuffer: ArrayBuffer,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const helveticaFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();
  
  const text = options.text || 'CONFIDENTIAL';
  const size = options.size || 42;
  const opacity = options.opacity !== undefined ? options.opacity : 0.25;
  const angle = options.angle !== undefined ? options.angle : 45;
  const col = options.color || { r: 0.85, g: 0.15, b: 0.15 };
  
  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = helveticaFont.widthOfTextAtSize(text, size);
    const textHeight = helveticaFont.heightAtSize(size);
    
    page.drawText(text, {
      x: width / 2 - (textWidth / 2) * Math.cos((angle * Math.PI) / 180),
      y: height / 2 - (textHeight / 2) * Math.sin((angle * Math.PI) / 180),
      size,
      font: helveticaFont,
      color: rgb(col.r, col.g, col.b),
      opacity,
      rotate: degrees(angle),
    });
  }
  
  return await pdf.save();
}

/**
 * Add page numbers to header or footer
 */
export async function addPageNumbers(
  pdfBuffer: ArrayBuffer,
  options: PageNumberOptions = {}
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const total = pages.length;
  
  const position = options.position || 'bottom-center';
  const format = options.format || 'page_of_total';
  const fontSize = options.fontSize || 10;
  const startIdx = options.startIndex || 1;
  
  pages.forEach((page, idx) => {
    const currentNum = startIdx + idx;
    const text = format === 'page_of_total' 
      ? `Page ${currentNum} of ${total}` 
      : `${currentNum}`;
      
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    
    let x = width / 2 - textWidth / 2;
    let y = 25;
    
    if (position === 'bottom-right') {
      x = width - textWidth - 30;
      y = 25;
    } else if (position === 'bottom-left') {
      x = 30;
      y = 25;
    } else if (position === 'top-right') {
      x = width - textWidth - 30;
      y = height - 25;
    } else if (position === 'top-center') {
      x = width / 2 - textWidth / 2;
      y = height - 25;
    } else if (position === 'top-left') {
      x = 30;
      y = height - 25;
    }
    
    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.25, 0.25, 0.25),
    });
  });
  
  return await pdf.save();
}

/**
 * Real PDF Compression: Rasterizes and optimizes high-DPI page streams to reduce actual file bytes
 */
export async function compressPdf(
  pdfBuffer: ArrayBuffer,
  level: 'low' | 'recommended' | 'extreme' = 'recommended'
): Promise<{ pdfBytes: Uint8Array; originalBytes: number; compressedBytes: number; reductionRatio: number }> {
  const originalBytes = pdfBuffer.byteLength;
  
  // Choose scale and quality based on compression level
  const scale = level === 'extreme' ? 1.2 : level === 'low' ? 1.8 : 1.5;
  const quality = level === 'extreme' ? 0.60 : level === 'low' ? 0.85 : 0.72;

  try {
    const renderedPages = await renderPdfPages(pdfBuffer, {
      scale,
      format: 'image/jpeg',
      quality,
    });

    const newPdf = await PDFDocument.create();
    
    for (const p of renderedPages) {
      const imgBytes = await p.blob.arrayBuffer();
      const embeddedImg = await newPdf.embedJpg(imgBytes);
      const page = newPdf.addPage([p.width / scale, p.height / scale]);
      page.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: p.width / scale,
        height: p.height / scale,
      });
    }

    const compressed = await newPdf.save();
    
    // If for any reason the rasterized is larger than original text-only PDF, perform stream repack
    if (compressed.byteLength >= originalBytes) {
      const src = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
      src.setTitle('');
      src.setAuthor('');
      src.setSubject('');
      src.setKeywords([]);
      src.setProducer('');
      src.setCreator('');
      const repacked = await src.save({ useObjectStreams: true });
      return {
        pdfBytes: repacked,
        originalBytes,
        compressedBytes: repacked.byteLength,
        reductionRatio: Math.max(0, (1 - repacked.byteLength / originalBytes)),
      };
    }

    return {
      pdfBytes: compressed,
      originalBytes,
      compressedBytes: compressed.byteLength,
      reductionRatio: Math.max(0, (1 - compressed.byteLength / originalBytes)),
    };
  } catch (err) {
    // Fallback to stream optimization if canvas rendering fails
    const src = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const repacked = await src.save({ useObjectStreams: true });
    return {
      pdfBytes: repacked,
      originalBytes,
      compressedBytes: repacked.byteLength,
      reductionRatio: Math.max(0, (1 - repacked.byteLength / originalBytes)),
    };
  }
}

/**
 * Remove all metadata (Author, Title, Creator, Producer, Keywords, Dates) from PDF
 */
export async function removePdfMetadata(pdfBuffer: ArrayBuffer): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  
  pdf.setTitle('');
  pdf.setAuthor('');
  pdf.setSubject('');
  pdf.setKeywords([]);
  pdf.setProducer('DocuFlow Clean');
  pdf.setCreator('DocuFlow');
  pdf.setCreationDate(new Date(0));
  pdf.setModificationDate(new Date(0));

  return await pdf.save({ useObjectStreams: true });
}

/**
 * Repair damaged PDF structures by reconstructing xref tables and normal streams
 */
export async function repairPdf(pdfBuffer: ArrayBuffer): Promise<Uint8Array> {
  try {
    const pdf = await PDFDocument.load(pdfBuffer, { 
      ignoreEncryption: true,
      updateMetadata: true,
      parseSpeed: 1 as any 
    });
    
    return await pdf.save({ useObjectStreams: true });
  } catch (err: any) {
    throw new Error('This PDF could not be repaired. The document structure is completely malformed or unrecoverable.');
  }
}

/**
 * Crop PDF pages by margins (points: 72pt = 1 inch)
 */
export async function cropPdf(
  pdfBuffer: ArrayBuffer,
  margins: { top: number; right: number; bottom: number; left: number }
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = pdf.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const newX = Math.max(0, margins.left);
    const newY = Math.max(0, margins.bottom);
    const newWidth = Math.max(50, width - margins.left - margins.right);
    const newHeight = Math.max(50, height - margins.top - margins.bottom);

    page.setCropBox(newX, newY, newWidth, newHeight);
  }

  return await pdf.save();
}

/**
 * Add custom text overlay onto a PDF
 */
export async function addTextToPdf(
  pdfBuffer: ArrayBuffer,
  text: string,
  options: {
    x?: number;
    y?: number;
    fontSize?: number;
    color?: { r: number; g: number; b: number };
    pageIndex?: number; // 0-indexed
  } = {}
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  
  const targetPage = options.pageIndex !== undefined && options.pageIndex < pages.length
    ? pages[options.pageIndex]
    : pages[0];

  const fontSize = options.fontSize || 14;
  const col = options.color || { r: 0.1, g: 0.1, b: 0.1 };
  const x = options.x !== undefined ? options.x : 50;
  const y = options.y !== undefined ? options.y : targetPage.getHeight() - 50;

  targetPage.drawText(text, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(col.r, col.g, col.b),
  });

  return await pdf.save();
}

/**
 * Convert Images (JPG/PNG/WEBP) into a single unified PDF with margins and layout
 */
export async function imagesToPdf(
  images: { dataUrl?: string; buffer?: ArrayBuffer; mimeType: string }[],
  orientation: 'portrait' | 'landscape' = 'portrait',
  margin: number = 20
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  for (const img of images) {
    let embeddedImage;
    if (img.buffer) {
      if (img.mimeType.includes('png')) {
        embeddedImage = await pdfDoc.embedPng(img.buffer);
      } else {
        embeddedImage = await pdfDoc.embedJpg(img.buffer);
      }
    } else if (img.dataUrl) {
      if (img.mimeType.includes('png')) {
        embeddedImage = await pdfDoc.embedPng(img.dataUrl);
      } else {
        embeddedImage = await pdfDoc.embedJpg(img.dataUrl);
      }
    } else {
      continue;
    }
    
    const imgDims = embeddedImage.scale(1);
    const isLand = orientation === 'landscape';
    const pageWidth = isLand ? 842 : 595; // A4 pt
    const pageHeight = isLand ? 595 : 842;
    
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;
    
    const scaleFactor = Math.min(maxWidth / imgDims.width, maxHeight / imgDims.height, 1);
    const finalWidth = imgDims.width * scaleFactor;
    const finalHeight = imgDims.height * scaleFactor;
    
    const x = (pageWidth - finalWidth) / 2;
    const y = (pageHeight - finalHeight) / 2;
    
    page.drawImage(embeddedImage, {
      x,
      y,
      width: finalWidth,
      height: finalHeight,
    });
  }
  
  return await pdfDoc.save();
}

/**
 * Convert text or markdown content into a PDF using jsPDF
 */
export function textToPdf(text: string, title?: string): Uint8Array {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });
  
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxLineWidth = pageWidth - margin * 2;
  
  let cursorY = margin + 20;
  
  if (title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(20, 20, 20);
    doc.text(title, margin, cursorY);
    cursorY += 24;
    
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, cursorY - 6, pageWidth - margin, cursorY - 6);
    cursorY += 10;
  }
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  
  const lines = doc.splitTextToSize(text, maxLineWidth);
  const lineHeight = 15;
  
  for (let i = 0; i < lines.length; i++) {
    if (cursorY + lineHeight > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      cursorY = margin + 20;
    }
    doc.text(lines[i], margin, cursorY);
    cursorY += lineHeight;
  }
  
  return doc.output('arraybuffer') as unknown as Uint8Array;
}
