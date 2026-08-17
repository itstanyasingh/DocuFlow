import JSZip from 'jszip';

export interface ImageProcessOptions {
  targetFormat?: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/bmp';
  quality?: number; // 0.1 to 1.0
  resizeMode?: 'none' | 'percentage' | 'dimensions';
  scalePercentage?: number; // 1 to 200
  targetWidth?: number;
  targetHeight?: number;
  maintainAspectRatio?: boolean;
  cropRect?: { x: number; y: number; width: number; height: number }; // normalized 0..1 or absolute px
  rotation?: number; // 0, 90, 180, 270
  flipHorizontal?: boolean;
  flipVertical?: boolean;
}

/**
 * Load an image from File, Blob, or DataURL into an HTMLImageElement
 */
export function loadImage(src: string | File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));

    if (typeof src === 'string') {
      img.src = src;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(src);
    }
  });
}

/**
 * Process single image with format conversion, compression, resize, rotation, crop, flip
 */
export async function processImage(
  imageSource: string | File | Blob,
  options: ImageProcessOptions = {}
): Promise<{
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  originalSizeBytes: number;
  reductionPercentage: number;
}> {
  const originalSizeBytes = typeof imageSource === 'string' 
    ? Math.round(imageSource.length * 0.75) 
    : imageSource.size;

  const img = await loadImage(imageSource);
  
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = img.naturalWidth || img.width;
  let sourceHeight = img.naturalHeight || img.height;

  // Handle Crop if provided
  if (options.cropRect) {
    const c = options.cropRect;
    // Check if coordinates are normalized (0 to 1) or pixel values
    const isNormalized = c.width <= 1 && c.height <= 1 && c.x <= 1 && c.y <= 1;
    sourceX = isNormalized ? Math.round(c.x * sourceWidth) : c.x;
    sourceY = isNormalized ? Math.round(c.y * sourceHeight) : c.y;
    sourceWidth = isNormalized ? Math.round(c.width * sourceWidth) : c.width;
    sourceHeight = isNormalized ? Math.round(c.height * sourceHeight) : c.height;
  }
  
  let targetWidth = sourceWidth;
  let targetHeight = sourceHeight;

  if (options.resizeMode === 'percentage' && options.scalePercentage) {
    const scale = options.scalePercentage / 100;
    targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    targetHeight = Math.max(1, Math.round(sourceHeight * scale));
  } else if (options.resizeMode === 'dimensions') {
    if (options.targetWidth && options.targetHeight) {
      if (options.maintainAspectRatio) {
        const ratio = Math.min(options.targetWidth / sourceWidth, options.targetHeight / sourceHeight);
        targetWidth = Math.max(1, Math.round(sourceWidth * ratio));
        targetHeight = Math.max(1, Math.round(sourceHeight * ratio));
      } else {
        targetWidth = options.targetWidth;
        targetHeight = options.targetHeight;
      }
    } else if (options.targetWidth) {
      const ratio = options.targetWidth / sourceWidth;
      targetWidth = options.targetWidth;
      targetHeight = Math.max(1, Math.round(sourceHeight * ratio));
    } else if (options.targetHeight) {
      const ratio = options.targetHeight / sourceHeight;
      targetHeight = options.targetHeight;
      targetWidth = Math.max(1, Math.round(sourceWidth * ratio));
    }
  }

  // Handle rotation orientation
  const rotation = (options.rotation || 0) % 360;
  const isRotated90or270 = rotation === 90 || rotation === 270;
  const canvasWidth = isRotated90or270 ? targetHeight : targetWidth;
  const canvasHeight = isRotated90or270 ? targetWidth : targetHeight;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Fill background with solid white if converting from transparent format to JPEG
  const targetMime = options.targetFormat || 'image/jpeg';
  if (targetMime === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  ctx.save();
  ctx.translate(canvasWidth / 2, canvasHeight / 2);

  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }

  const scaleX = options.flipHorizontal ? -1 : 1;
  const scaleY = options.flipVertical ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  ctx.drawImage(
    img,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    -targetWidth / 2,
    -targetHeight / 2,
    targetWidth,
    targetHeight
  );
  ctx.restore();

  const quality = options.quality !== undefined ? Math.min(1, Math.max(0.05, options.quality)) : 0.85;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas blob generation failed'));
          return;
        }
        const dataUrl = canvas.toDataURL(targetMime, quality);
        const reductionPercentage = originalSizeBytes > 0
          ? Math.max(0, Math.round((1 - blob.size / originalSizeBytes) * 100))
          : 0;

        resolve({
          blob,
          dataUrl,
          width: canvasWidth,
          height: canvasHeight,
          sizeBytes: blob.size,
          originalSizeBytes,
          reductionPercentage,
        });
      },
      targetMime,
      quality
    );
  });
}

/**
 * Bundle multiple processed files into a single ZIP archive
 */
export async function bundleIntoZip(
  files: { name: string; blobOrBuffer: Blob | ArrayBuffer | Uint8Array }[]
): Promise<Blob> {
  const zip = new JSZip();
  
  files.forEach((f) => {
    zip.file(f.name, f.blobOrBuffer);
  });

  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}
