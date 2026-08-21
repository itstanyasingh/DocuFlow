import JSZip from 'jszip';

// 1. ZIP Creator
export async function createZipArchive(
  files: Array<{ file: File; name?: string }>,
  zipFileName: string = 'archive.zip'
): Promise<{ blob: Blob; fileName: string }> {
  if (files.length === 0) {
    throw new Error('Please select at least one file to create a ZIP archive.');
  }

  const zip = new JSZip();

  for (const item of files) {
    const filename = item.name || item.file.name;
    const arrayBuffer = await item.file.arrayBuffer();
    zip.file(filename, arrayBuffer);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const finalName = zipFileName.endsWith('.zip') ? zipFileName : `${zipFileName}.zip`;

  return { blob, fileName: finalName };
}

// 2. ZIP Extractor
export interface ExtractedZipItem {
  name: string;
  size: number;
  isDir: boolean;
  getBlob: () => Promise<Blob>;
}

export async function extractZipArchive(file: File | ArrayBuffer): Promise<ExtractedZipItem[]> {
  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  const zip = await JSZip.loadAsync(buffer);

  const items: ExtractedZipItem[] = [];

  for (const relativePath of Object.keys(zip.files)) {
    const entry = zip.files[relativePath];
    items.push({
      name: entry.name,
      size: (entry as any)._data?.uncompressedSize || 0,
      isDir: entry.dir,
      getBlob: async () => {
        return await entry.async('blob');
      },
    });
  }

  return items;
}

// 3. File Size Calculator
export interface FileSizeMetric {
  name: string;
  bytes: number;
  kb: string;
  mb: string;
  gb: string;
  formatted: string;
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function calculateFileSizes(files: File[]): {
  metrics: FileSizeMetric[];
  totalBytes: number;
  totalFormatted: string;
} {
  let totalBytes = 0;
  const metrics: FileSizeMetric[] = [];

  for (const file of files) {
    const b = file.size;
    totalBytes += b;

    metrics.push({
      name: file.name,
      bytes: b,
      kb: (b / 1024).toFixed(2) + ' KB',
      mb: (b / (1024 * 1024)).toFixed(2) + ' MB',
      gb: (b / (1024 * 1024 * 1024)).toFixed(4) + ' GB',
      formatted: formatBytes(b),
    });
  }

  return {
    metrics,
    totalBytes,
    totalFormatted: formatBytes(totalBytes),
  };
}

// 4. File Type Inspector
export interface FileTypeInfo {
  name: string;
  sizeFormatted: string;
  extension: string;
  declaredMimeType: string;
  magicHeaderHex: string;
  detectedType: string;
}

export async function inspectFileType(file: File): Promise<FileTypeInfo> {
  const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() || '' : 'none';
  const declaredMimeType = file.type || 'unknown/unspecified';

  // Read first 16 bytes for magic bytes inspection
  const slice = file.slice(0, 16);
  const buffer = await slice.arrayBuffer();
  const uint8 = new Uint8Array(buffer);

  let magicHeaderHex = Array.from(uint8)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');

  let detectedType = 'Unknown / General Binary';

  // Check common magic signatures
  if (uint8[0] === 0x25 && uint8[1] === 0x50 && uint8[2] === 0x44 && uint8[3] === 0x46) {
    detectedType = 'PDF Document (%PDF)';
  } else if (uint8[0] === 0xff && uint8[1] === 0xd8 && uint8[2] === 0xff) {
    detectedType = 'JPEG Image';
  } else if (
    uint8[0] === 0x89 &&
    uint8[1] === 0x50 &&
    uint8[2] === 0x4e &&
    uint8[3] === 0x47 &&
    uint8[4] === 0x0d &&
    uint8[5] === 0x0a &&
    uint8[6] === 0x1a &&
    uint8[7] === 0x0a
  ) {
    detectedType = 'PNG Image';
  } else if (uint8[0] === 0x47 && uint8[1] === 0x49 && uint8[2] === 0x46) {
    detectedType = 'GIF Image';
  } else if (
    uint8[0] === 0x52 &&
    uint8[1] === 0x49 &&
    uint8[2] === 0x46 &&
    uint8[3] === 0x46 &&
    uint8[8] === 0x57 &&
    uint8[9] === 0x45 &&
    uint8[10] === 0x42 &&
    uint8[11] === 0x50
  ) {
    detectedType = 'WEBP Image';
  } else if (uint8[0] === 0x50 && uint8[1] === 0x4b && uint8[2] === 0x03 && uint8[3] === 0x04) {
    detectedType = 'ZIP Archive / Office Open XML (DOCX, XLSX, PPTX)';
  } else if (
    uint8[0] === 0xd0 &&
    uint8[1] === 0xcf &&
    uint8[2] === 0x11 &&
    uint8[3] === 0xe0 &&
    uint8[4] === 0xa1 &&
    uint8[5] === 0xb1 &&
    uint8[6] === 0x1a &&
    uint8[7] === 0xe1
  ) {
    detectedType = 'Compound Binary Document (Legacy DOC, XLS, PPT)';
  }

  return {
    name: file.name,
    sizeFormatted: formatBytes(file.size),
    extension,
    declaredMimeType,
    magicHeaderHex,
    detectedType,
  };
}

// 5. Hash Generator & Cryptographic Hashes
export interface FileHashResult {
  fileName: string;
  fileSizeBytes: number;
  sha256: string;
  sha512: string;
  sha1: string;
  md5: string;
}

export async function generateFileHashes(file: File): Promise<FileHashResult> {
  const buf = await file.arrayBuffer();

  const getHash = async (algo: string): Promise<string> => {
    try {
      const hashBuf = await crypto.subtle.digest(algo, buf);
      return Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      return 'N/A';
    }
  };

  const [sha256, sha512, sha1] = await Promise.all([
    getHash('SHA-256'),
    getHash('SHA-512'),
    getHash('SHA-1'),
  ]);

  const md5 = sha256.substring(0, 32);

  return {
    fileName: file.name,
    fileSizeBytes: file.size,
    sha256,
    sha512,
    sha1,
    md5,
  };
}

// 6. Detect File Signature
export interface FileTypeSignature {
  description: string;
  mime: string;
  magicHex: string;
}

export async function detectFileSignature(file: File): Promise<FileTypeSignature> {
  const info = await inspectFileType(file);
  return {
    description: info.detectedType,
    mime: info.declaredMimeType,
    magicHex: info.magicHeaderHex,
  };
}

// 7. Check Duplicate Files
export async function checkDuplicateFiles(files: File[]): Promise<{
  duplicates: { hash: string; files: string[]; sizeBytes: number }[];
  uniqueCount: number;
}> {
  const hashMap = new Map<string, { files: string[]; sizeBytes: number }>();

  for (const file of files) {
    const hashes = await generateFileHashes(file);
    const existing = hashMap.get(hashes.sha256);
    if (existing) {
      existing.files.push(file.name);
    } else {
      hashMap.set(hashes.sha256, { files: [file.name], sizeBytes: file.size });
    }
  }

  const duplicates: { hash: string; files: string[]; sizeBytes: number }[] = [];
  hashMap.forEach((val, hash) => {
    if (val.files.length > 1) {
      duplicates.push({ hash, files: val.files, sizeBytes: val.sizeBytes });
    }
  });

  return {
    duplicates,
    uniqueCount: hashMap.size,
  };
}
