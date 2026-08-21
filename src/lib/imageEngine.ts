export interface ImageProcessOptions {
  // Compress
  quality?: number; // 0 to 1
  maxWidth?: number;
  maxHeight?: number;
  targetFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
  // Resize
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
  // Rotate
  rotationAngle?: 90 | 180 | 270;
  // Crop
  cropBox?: { x: number; y: number; width: number; height: number };
  // Flip
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  // Filters
  grayscale?: boolean;
  sepia?: boolean;
  invert?: boolean;
  blurRadius?: number; // px
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  // Watermark
  watermarkText?: string;
  watermarkFontSize?: number;
  watermarkOpacity?: number;
  watermarkPosition?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  watermarkRotation?: number; // angle in degrees
  // Social Media Preset
  socialPresetWidth?: number;
  socialPresetHeight?: number;
}

// Load image into HTMLImageElement
function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file. Please check if the file is a valid image.'));
    };
    img.src = url;
  });
}

// Universal image processor
export async function processImage(
  file: File | Blob,
  options: ImageProcessOptions
): Promise<{ blob: Blob; width: number; height: number; mimeType: string }> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context unavailable in browser.');
  }

  let srcW = img.naturalWidth || img.width;
  let srcH = img.naturalHeight || img.height;

  let drawW = srcW;
  let drawH = srcH;

  // 1. Social Preset or Resize
  if (options.socialPresetWidth && options.socialPresetHeight) {
    drawW = options.socialPresetWidth;
    drawH = options.socialPresetHeight;
  } else if (options.width || options.height) {
    if (options.maintainAspectRatio) {
      if (options.width && options.height) {
        const scale = Math.min(options.width / srcW, options.height / srcH);
        drawW = Math.round(srcW * scale);
        drawH = Math.round(srcH * scale);
      } else if (options.width) {
        drawW = options.width;
        drawH = Math.round((srcH / srcW) * options.width);
      } else if (options.height) {
        drawH = options.height;
        drawW = Math.round((srcW / srcH) * options.height);
      }
    } else {
      drawW = options.width || srcW;
      drawH = options.height || srcH;
    }
  }

  // 2. Max Dimension Cap
  if (options.maxWidth && drawW > options.maxWidth) {
    drawH = Math.round((drawH / drawW) * options.maxWidth);
    drawW = options.maxWidth;
  }
  if (options.maxHeight && drawH > options.maxHeight) {
    drawW = Math.round((drawW / drawH) * options.maxHeight);
    drawH = options.maxHeight;
  }

  // Handle Rotation Dimensions
  const angle = options.rotationAngle || 0;
  if (angle === 90 || angle === 270) {
    canvas.width = drawH;
    canvas.height = drawW;
  } else {
    canvas.width = drawW;
    canvas.height = drawH;
  }

  // Apply Rotation & Flip
  ctx.save();
  if (angle === 90) {
    ctx.translate(canvas.width, 0);
    ctx.rotate((90 * Math.PI) / 180);
  } else if (angle === 180) {
    ctx.translate(canvas.width, canvas.height);
    ctx.rotate((180 * Math.PI) / 180);
  } else if (angle === 270) {
    ctx.translate(0, canvas.height);
    ctx.rotate((270 * Math.PI) / 180);
  }

  if (options.flipHorizontal || options.flipVertical) {
    ctx.translate(drawW / 2, drawH / 2);
    ctx.scale(options.flipHorizontal ? -1 : 1, options.flipVertical ? -1 : 1);
    ctx.translate(-drawW / 2, -drawH / 2);
  }

  // Handle Crop Box if provided
  if (options.cropBox) {
    const { x, y, width: cW, height: cH } = options.cropBox;
    canvas.width = cW;
    canvas.height = cH;
    ctx.drawImage(img, x, y, cW, cH, 0, 0, cW, cH);
  } else {
    ctx.drawImage(img, 0, 0, drawW, drawH);
  }
  ctx.restore();

  // Apply Filters (Grayscale, Sepia, Invert, Brightness, Contrast, Blur)
  if (options.grayscale || options.sepia || options.invert || options.brightness !== undefined || options.contrast !== undefined) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    const bVal = options.brightness || 0; // -100 to 100
    const cVal = options.contrast || 0; // -100 to 100
    const factor = (259 * (cVal + 255)) / (255 * (259 - cVal));

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Grayscale
      if (options.grayscale) {
        const avg = 0.299 * r + 0.587 * g + 0.114 * b;
        r = avg;
        g = avg;
        b = avg;
      }

      // Sepia
      if (options.sepia) {
        const sr = 0.393 * r + 0.769 * g + 0.189 * b;
        const sg = 0.349 * r + 0.686 * g + 0.168 * b;
        const sb = 0.272 * r + 0.534 * g + 0.131 * b;
        r = sr;
        g = sg;
        b = sb;
      }

      // Invert
      if (options.invert) {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }

      // Brightness
      if (bVal !== 0) {
        r += bVal;
        g += bVal;
        b += bVal;
      }

      // Contrast
      if (cVal !== 0) {
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        b = factor * (b - 128) + 128;
      }

      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }

    ctx.putImageData(imgData, 0, 0);
  }

  // Blur Filter
  if (options.blurRadius && options.blurRadius > 0) {
    ctx.filter = `blur(${options.blurRadius}px)`;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(canvas, 0, 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.filter = 'none';
  }

  // Watermark
  if (options.watermarkText) {
    ctx.save();
    const fontSize = options.watermarkFontSize || Math.max(16, Math.round(canvas.width / 20));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = `rgba(255, 255, 255, ${options.watermarkOpacity ?? 0.7})`;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 4;

    const textMetrics = ctx.measureText(options.watermarkText);
    const textWidth = textMetrics.width;

    let wx = (canvas.width - textWidth) / 2;
    let wy = canvas.height / 2 + fontSize / 3;

    const pos = options.watermarkPosition || 'center';
    const padding = 20;

    if (pos === 'top-left') {
      wx = padding;
      wy = padding + fontSize;
    } else if (pos === 'top-right') {
      wx = canvas.width - textWidth - padding;
      wy = padding + fontSize;
    } else if (pos === 'bottom-left') {
      wx = padding;
      wy = canvas.height - padding;
    } else if (pos === 'bottom-right') {
      wx = canvas.width - textWidth - padding;
      wy = canvas.height - padding;
    }

    if (options.watermarkRotation) {
      ctx.translate(wx + textWidth / 2, wy - fontSize / 3);
      ctx.rotate((options.watermarkRotation * Math.PI) / 180);
      ctx.fillText(options.watermarkText, -textWidth / 2, fontSize / 3);
    } else {
      ctx.fillText(options.watermarkText, wx, wy);
    }
    ctx.restore();
  }

  // Format selection
  let mimeType = options.targetFormat || (file.type as any) || 'image/jpeg';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    mimeType = 'image/jpeg';
  }

  const quality = options.quality !== undefined ? options.quality : 0.85;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate image binary output.'));
          return;
        }
        resolve({
          blob,
          width: canvas.width,
          height: canvas.height,
          mimeType,
        });
      },
      mimeType,
      quality
    );
  });
}
