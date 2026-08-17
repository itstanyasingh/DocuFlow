import JSZip from 'jszip';
import { bundleImagesZip } from './toJpg';

export interface PngConvertOptions {
  pages?: number[] | string;
  dpi?: 72 | 150 | 300;
}

/**
 * Bundle PNG images for PDF to PNG conversion
 */
export async function bundlePngZip(
  images: Array<{ pageNumber: number; buffer?: Buffer | Uint8Array; base64?: string }>,
  baseName: string = 'document'
) {
  return await bundleImagesZip(images, 'png', baseName);
}
