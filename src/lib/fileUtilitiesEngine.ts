import JSZip from 'jszip';
import CryptoJS from 'crypto-js';

export interface ExtractedZipItem {
  name: string;
  size: number;
  blob: Blob;
  dataUrl?: string;
  isDirectory: boolean;
}

export interface FileHashResult {
  fileName: string;
  fileSizeBytes: number;
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
}

export interface FileTypeSignature {
  mime: string;
  extension: string;
  description: string;
  magicHex: string;
}

/**
 * 1. Create ZIP archive from list of files
 */
export async function createZipArchive(
  files: { name: string; fileOrBuffer: Blob | ArrayBuffer | Uint8Array | File }[],
  compressionLevel: number = 6
): Promise<Blob> {
  const zip = new JSZip();
  files.forEach(f => {
    zip.file(f.name, f.fileOrBuffer);
  });
  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: compressionLevel },
  });
}

/**
 * 2. Extract contents of a ZIP archive
 */
export async function extractZipArchive(
  zipBuffer: ArrayBuffer | Blob | File
): Promise<ExtractedZipItem[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipBuffer);
  const items: ExtractedZipItem[] = [];

  const filePromises: Promise<void>[] = [];

  loadedZip.forEach((relativePath, fileEntry) => {
    if (fileEntry.dir) return; // Skip directories

    const p = fileEntry.async('blob').then(blob => {
      items.push({
        name: relativePath,
        size: blob.size,
        blob,
        isDirectory: false,
      });
    });
    filePromises.push(p);
  });

  await Promise.all(filePromises);
  return items;
}

/**
 * 3. Generate MD5, SHA-1, SHA-256, SHA-512 hashes for a file
 */
export async function generateFileHashes(
  fileOrBuffer: File | Blob | ArrayBuffer
): Promise<FileHashResult> {
  let arrayBuffer: ArrayBuffer;
  let fileName = 'file';
  let sizeBytes = 0;

  if (fileOrBuffer instanceof File) {
    fileName = fileOrBuffer.name;
    sizeBytes = fileOrBuffer.size;
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else if (fileOrBuffer instanceof Blob) {
    sizeBytes = fileOrBuffer.size;
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    arrayBuffer = fileOrBuffer;
    sizeBytes = arrayBuffer.byteLength;
  }

  // Convert arrayBuffer to WordArray for crypto-js
  const uint8Array = new Uint8Array(arrayBuffer);
  const wordArray = CryptoJS.lib.WordArray.create(uint8Array as any);

  const md5 = CryptoJS.MD5(wordArray).toString(CryptoJS.enc.Hex);
  const sha1 = CryptoJS.SHA1(wordArray).toString(CryptoJS.enc.Hex);
  const sha256 = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
  const sha512 = CryptoJS.SHA512(wordArray).toString(CryptoJS.enc.Hex);

  return {
    fileName,
    fileSizeBytes: sizeBytes,
    md5,
    sha1,
    sha256,
    sha512,
  };
}

/**
 * 4. Detect file MIME and true signature based on Magic Bytes
 */
export async function detectFileSignature(
  fileOrBuffer: File | Blob | ArrayBuffer
): Promise<FileTypeSignature> {
  let arrayBuffer: ArrayBuffer;
  if (fileOrBuffer instanceof File || fileOrBuffer instanceof Blob) {
    arrayBuffer = await fileOrBuffer.slice(0, 16).arrayBuffer();
  } else {
    arrayBuffer = fileOrBuffer.slice(0, 16);
  }

  const bytes = new Uint8Array(arrayBuffer);
  const hex = Array.from(bytes.slice(0, 8))
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');

  // Magic byte checks
  // PDF: %PDF (25 50 44 46)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return { mime: 'application/pdf', extension: '.pdf', description: 'Portable Document Format (PDF)', magicHex: hex };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return { mime: 'image/png', extension: '.png', description: 'Portable Network Graphics (PNG)', magicHex: hex };
  }
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return { mime: 'image/jpeg', extension: '.jpg', description: 'JPEG Image', magicHex: hex };
  }
  // GIF: GIF87a / GIF89a (47 49 46 38)
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return { mime: 'image/gif', extension: '.gif', description: 'Graphics Interchange Format (GIF)', magicHex: hex };
  }
  // ZIP / DOCX / XLSX / PPTX: 50 4B 03 04 (PK..)
  if (bytes[0] === 0x50 && bytes[1] === 0x4B && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)) {
    return { mime: 'application/zip', extension: '.zip', description: 'ZIP Archive or Microsoft OpenXML Package', magicHex: hex };
  }
  // WebP: RIFF....WEBP (52 49 46 46)
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return { mime: 'image/webp', extension: '.webp', description: 'WebP Image', magicHex: hex };
  }
  // BMP: 42 4D
  if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
    return { mime: 'image/bmp', extension: '.bmp', description: 'Windows Bitmap Image (BMP)', magicHex: hex };
  }

  return {
    mime: 'application/octet-stream',
    extension: '.bin',
    description: 'Generic Binary / Plain Text Stream',
    magicHex: hex,
  };
}

/**
 * 5. Check duplicate files by comparing SHA-256 hashes
 */
export async function checkDuplicateFiles(
  files: File[]
): Promise<{ duplicates: { hash: string; files: string[]; sizeBytes: number }[]; uniqueCount: number }> {
  const hashMap = new Map<string, string[]>();
  const sizeMap = new Map<string, number>();

  for (const file of files) {
    const hashRes = await generateFileHashes(file);
    const hash = hashRes.sha256;
    if (!hashMap.has(hash)) {
      hashMap.set(hash, []);
      sizeMap.set(hash, file.size);
    }
    hashMap.get(hash)!.push(file.name);
  }

  const duplicates: { hash: string; files: string[]; sizeBytes: number }[] = [];
  hashMap.forEach((fileList, hash) => {
    if (fileList.length > 1) {
      duplicates.push({
        hash,
        files: fileList,
        sizeBytes: sizeMap.get(hash) || 0,
      });
    }
  });

  return {
    duplicates,
    uniqueCount: hashMap.size,
  };
}
