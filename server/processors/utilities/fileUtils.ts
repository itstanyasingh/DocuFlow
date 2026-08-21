import JSZip from 'jszip';
import CryptoJS from 'crypto-js';

export async function createZipFromFiles(
  files: Array<{ buffer: Buffer; name: string }>
): Promise<Buffer> {
  const zip = new JSZip();
  for (const f of files) {
    zip.file(f.name, f.buffer);
  }
  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return content;
}

export async function extractZipEntries(
  zipBuffer: Buffer
): Promise<Array<{ name: string; buffer: Buffer; isDir: boolean }>> {
  const zip = await JSZip.loadAsync(zipBuffer);
  const results: Array<{ name: string; buffer: Buffer; isDir: boolean }> = [];

  for (const relativePath of Object.keys(zip.files)) {
    const entry = zip.files[relativePath];
    if (entry.dir) {
      results.push({ name: relativePath, buffer: Buffer.alloc(0), isDir: true });
    } else {
      const buf = await entry.async('nodebuffer');
      results.push({ name: relativePath, buffer: buf, isDir: false });
    }
  }

  return results;
}

export function generateFileHashes(buffer: Buffer): {
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
  fileSize: number;
} {
  const wordArray = CryptoJS.lib.WordArray.create(buffer as any);
  return {
    md5: CryptoJS.MD5(wordArray).toString(),
    sha1: CryptoJS.SHA1(wordArray).toString(),
    sha256: CryptoJS.SHA256(wordArray).toString(),
    sha512: CryptoJS.SHA512(wordArray).toString(),
    fileSize: buffer.byteLength,
  };
}

export function detectFileType(
  buffer: Buffer,
  originalName: string
): { mimeType: string; extension: string; details: string } {
  const ext = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();
  const hex = buffer.slice(0, 8).toString('hex').toUpperCase();

  let mimeType = 'application/octet-stream';
  let details = 'Binary file';

  if (hex.startsWith('25504446')) {
    mimeType = 'application/pdf';
    details = 'PDF Document (%PDF)';
  } else if (hex.startsWith('FFD8FF')) {
    mimeType = 'image/jpeg';
    details = 'JPEG Image (JFIF/Exif)';
  } else if (hex.startsWith('89504E47')) {
    mimeType = 'image/png';
    details = 'PNG Image (Portable Network Graphics)';
  } else if (hex.startsWith('504B0304')) {
    if (ext === '.docx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      details = 'Microsoft Word OpenXML Document (DOCX)';
    } else if (ext === '.xlsx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      details = 'Microsoft Excel OpenXML Spreadsheet (XLSX)';
    } else if (ext === '.pptx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      details = 'Microsoft PowerPoint OpenXML Presentation (PPTX)';
    } else {
      mimeType = 'application/zip';
      details = 'ZIP Compressed Archive';
    }
  } else if (hex.startsWith('52494646') && buffer.slice(8, 12).toString() === 'WEBP') {
    mimeType = 'image/webp';
    details = 'WebP Graphics Format';
  } else if (ext === '.json' || ext === '.txt' || ext === '.csv') {
    mimeType = ext === '.json' ? 'application/json' : ext === '.csv' ? 'text/csv' : 'text/plain';
    details = 'Plain Text / Structured Data File';
  }

  return { mimeType, extension: ext.replace('.', ''), details };
}
