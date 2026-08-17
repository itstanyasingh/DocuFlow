import JSZip from 'jszip';
import { validatePdf } from './validation';

export interface ImageConvertOptions {
  pages?: number[] | string;
  quality?: 'standard' | 'high' | 'maximum' | number;
}

export interface ConvertImagesPayload {
  images: Array<{ pageNumber: number; dataUrl: string; mimeType: string }>;
  baseName: string;
}

/**
 * Packages rendered page images into single image or ZIP archive
 */
export async function bundleImagesZip(
  images: Array<{ pageNumber: number; buffer?: Buffer | Uint8Array; base64?: string }>,
  format: 'jpg' | 'png',
  baseName: string = 'document'
): Promise<{ outputBytes: Uint8Array | Buffer; mimeType: string; fileName: string; isZip: boolean }> {
  const cleanBase = baseName.replace(/\.[^/.]+$/, '');
  const ext = format === 'jpg' ? 'jpg' : 'png';
  const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';

  if (images.length === 0) {
    throw new Error('No images rendered to bundle.');
  }

  // Single page -> return direct image file
  if (images.length === 1) {
    const item = images[0];
    let buf: Buffer;
    if (item.buffer) {
      buf = Buffer.from(item.buffer);
    } else if (item.base64) {
      const cleanBase64 = item.base64.replace(/^data:image\/[a-z]+;base64,/, '');
      buf = Buffer.from(cleanBase64, 'base64');
    } else {
      throw new Error('Invalid image data provided.');
    }

    return {
      outputBytes: buf,
      mimeType: mime,
      fileName: `${cleanBase}-page-${item.pageNumber}.${ext}`,
      isZip: false,
    };
  }

  // Multi-page -> ZIP archive
  const zip = new JSZip();
  for (const item of images) {
    let buf: Buffer;
    if (item.buffer) {
      buf = Buffer.from(item.buffer);
    } else if (item.base64) {
      const cleanBase64 = item.base64.replace(/^data:image\/[a-z]+;base64,/, '');
      buf = Buffer.from(cleanBase64, 'base64');
    } else {
      continue;
    }
    zip.file(`page-${item.pageNumber}.${ext}`, buf);
  }

  const zipBytes = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return {
    outputBytes: zipBytes,
    mimeType: 'application/zip',
    fileName: `${cleanBase}-images.zip`,
    isZip: true,
  };
}
