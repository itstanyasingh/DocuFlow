import * as pdfjsLib from 'pdfjs-dist';

// Ensure worker source is assigned properly
if (typeof window !== 'undefined') {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
  }
}

export { pdfjsLib };

export interface PdfPageRenderResult {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

export type RenderedPdfPage = PdfPageRenderResult;

/**
 * Render all or selected pages of a PDF to Canvas elements and Blobs
 */
export async function renderPdfPages(
  pdfBuffer: ArrayBuffer,
  options: {
    scale?: number;
    format?: 'image/jpeg' | 'image/png';
    quality?: number;
    pages?: number[]; // 1-indexed
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<PdfPageRenderResult[]> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const scale = options.scale || 2.0; // 2x scale for sharp output
  const format = options.format || 'image/jpeg';
  const quality = options.quality || 0.92;

  const targetPages = options.pages && options.pages.length > 0
    ? options.pages.filter(p => p >= 1 && p <= numPages)
    : Array.from({ length: numPages }, (_, i) => i + 1);

  const results: PdfPageRenderResult[] = [];

  for (let i = 0; i < targetPages.length; i++) {
    const pageNum = targetPages[i];
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to create canvas context');

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    // Fill white background for JPEGs
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext as any).promise;

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to render page ${pageNum}`));
        },
        format,
        quality
      );
    });

    results.push({
      pageNumber: pageNum,
      canvas,
      blob,
      dataUrl: canvas.toDataURL(format, quality),
      width: canvas.width,
      height: canvas.height,
    });

    if (options.onProgress) {
      options.onProgress(i + 1, targetPages.length);
    }
  }

  return results;
}

/**
 * Extract raw text page-by-page from PDF
 */
export async function extractTextFromPdf(
  pdfBuffer: ArrayBuffer
): Promise<{ fullText: string; pageTexts: { page: number; text: string }[] }> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const pageTexts: { page: number; text: string }[] = [];
  const fullTextParts: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    
    // Group text items by line position
    const items = textContent.items as any[];
    let lastY: number | null = null;
    let pageString = '';

    for (const item of items) {
      if (item.str === undefined) continue;
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
        pageString += '\n';
      } else if (pageString.length > 0 && !pageString.endsWith(' ') && !pageString.endsWith('\n')) {
        pageString += ' ';
      }
      pageString += item.str;
      lastY = item.transform[5];
    }

    const cleanedPageText = pageString.trim();
    pageTexts.push({ page: i, text: cleanedPageText });
    fullTextParts.push(`--- Page ${i} ---\n` + cleanedPageText);
  }

  return {
    fullText: fullTextParts.join('\n\n'),
    pageTexts,
  };
}
