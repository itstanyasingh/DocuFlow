import sharp from 'sharp';

export async function processImageConvert(
  buffer: Buffer,
  targetFormat: 'jpg' | 'png' | 'webp',
  quality = 85
): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
  let instance = sharp(buffer);

  if (targetFormat === 'jpg' || targetFormat === 'jpeg' as any) {
    const output = await instance.jpeg({ quality }).toBuffer();
    return { buffer: output, mimeType: 'image/jpeg', extension: 'jpg' };
  } else if (targetFormat === 'png') {
    const output = await instance.png({ compressionLevel: Math.round((100 - quality) / 10) }).toBuffer();
    return { buffer: output, mimeType: 'image/png', extension: 'png' };
  } else if (targetFormat === 'webp') {
    const output = await instance.webp({ quality }).toBuffer();
    return { buffer: output, mimeType: 'image/webp', extension: 'webp' };
  }

  const output = await instance.toBuffer();
  return { buffer: output, mimeType: 'image/jpeg', extension: 'jpg' };
}

export async function compressImageBuffer(
  buffer: Buffer,
  quality = 70
): Promise<{ buffer: Buffer; originalSize: number; compressedSize: number; mimeType: string }> {
  const meta = await sharp(buffer).metadata();
  const format = meta.format || 'jpeg';
  const originalSize = buffer.length;

  let instance = sharp(buffer);
  let output: Buffer;
  let mimeType = 'image/jpeg';

  if (format === 'png') {
    output = await instance.png({ quality: Math.min(quality, 90), palette: true }).toBuffer();
    mimeType = 'image/png';
  } else if (format === 'webp') {
    output = await instance.webp({ quality }).toBuffer();
    mimeType = 'image/webp';
  } else {
    output = await instance.jpeg({ quality }).toBuffer();
    mimeType = 'image/jpeg';
  }

  return {
    buffer: output,
    originalSize,
    compressedSize: output.length,
    mimeType,
  };
}

export async function resizeImageBuffer(
  buffer: Buffer,
  width?: number,
  height?: number,
  fit: 'cover' | 'contain' | 'fill' | 'inside' = 'inside'
): Promise<Buffer> {
  let instance = sharp(buffer);
  if (width || height) {
    instance = instance.resize({
      width: width || undefined,
      height: height || undefined,
      fit,
      withoutEnlargement: false,
    });
  }
  return await instance.toBuffer();
}

export async function cropImageBuffer(
  buffer: Buffer,
  left: number,
  top: number,
  width: number,
  height: number
): Promise<Buffer> {
  return await sharp(buffer)
    .extract({ left: Math.max(0, left), top: Math.max(0, top), width, height })
    .toBuffer();
}

export async function rotateImageBuffer(buffer: Buffer, angle: number): Promise<Buffer> {
  return await sharp(buffer).rotate(angle).toBuffer();
}

export async function flipImageBuffer(buffer: Buffer, direction: 'horizontal' | 'vertical'): Promise<Buffer> {
  const instance = sharp(buffer);
  if (direction === 'horizontal') {
    return await instance.flop().toBuffer();
  } else {
    return await instance.flip().toBuffer();
  }
}

export async function removeImageExif(buffer: Buffer): Promise<Buffer> {
  // Strip EXIF metadata by re-encoding without keeping metadata
  const meta = await sharp(buffer).metadata();
  if (meta.format === 'png') {
    return await sharp(buffer).png().toBuffer();
  } else if (meta.format === 'webp') {
    return await sharp(buffer).webp().toBuffer();
  }
  return await sharp(buffer).jpeg({ quality: 92 }).toBuffer();
}
