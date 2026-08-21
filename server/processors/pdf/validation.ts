import { PDFDocument } from 'pdf-lib';

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  fileSize: number;
  mimeType?: string;
  pageCount?: number;
}

/**
 * Check magic bytes of a PDF file (%PDF-)
 */
export function isPdfSignature(buffer: Buffer | Uint8Array): boolean {
  if (!buffer || buffer.length < 5) return false;
  return (
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46 && // F
    buffer[4] === 0x2d    // -
  );
}

/**
 * Check magic bytes of a JPEG file (\xFF\xD8\xFF)
 */
export function isJpgSignature(buffer: Buffer | Uint8Array): boolean {
  if (!buffer || buffer.length < 3) return false;
  return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

/**
 * Check magic bytes of a PNG file (\x89PNG\r\n\x1a\n)
 */
export function isPngSignature(buffer: Buffer | Uint8Array): boolean {
  if (!buffer || buffer.length < 8) return false;
  return (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}

/**
 * Comprehensive PDF Validation: Size, Signature, and Document Integrity
 */
export async function validatePdf(
  buffer: Buffer | Uint8Array,
  fileName: string = 'document.pdf'
): Promise<ValidationResult> {
  const fileSize = buffer.byteLength || buffer.length;

  if (!buffer || fileSize === 0) {
    return {
      isValid: false,
      error: 'Please select a file first.',
      fileSize: 0,
    };
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: 'The maximum file size is 50 MB.',
      fileSize,
    };
  }

  // Check signature
  if (!isPdfSignature(buffer)) {
    return {
      isValid: false,
      error: 'This file is not a valid PDF.',
      fileSize,
    };
  }

  // Check if parseable or encrypted by pdf-lib
  try {
    // First test loading without ignoring encryption to detect password protection
    try {
      await PDFDocument.load(buffer, { ignoreEncryption: false });
    } catch (encErr: any) {
      const msg = encErr?.message || '';
      if (msg.includes('encrypt') || msg.includes('password') || msg.includes('Encrypt') || msg.includes('decrypt')) {
        return {
          isValid: false,
          error: 'This PDF is password protected. Please unlock it before merging.',
          fileSize,
        };
      }
    }

    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    if (pageCount === 0) {
      return {
        isValid: false,
        error: 'This PDF document contains no pages.',
        fileSize,
      };
    }
    return {
      isValid: true,
      fileSize,
      mimeType: 'application/pdf',
      pageCount,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: 'This file is not a valid PDF or is corrupted.',
      fileSize,
    };
  }
}

/**
 * Validate JPG/JPEG Image File
 */
export function validateJpg(
  buffer: Buffer | Uint8Array,
  fileName: string = 'image.jpg'
): ValidationResult {
  const fileSize = buffer.byteLength || buffer.length;

  if (!buffer || fileSize === 0) {
    return { isValid: false, error: 'Please select a file first.', fileSize: 0 };
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return { isValid: false, error: 'The maximum file size is 50 MB.', fileSize };
  }

  if (!isJpgSignature(buffer)) {
    return {
      isValid: false,
      error: 'This file is not a valid JPG/JPEG image.',
      fileSize,
    };
  }

  return {
    isValid: true,
    fileSize,
    mimeType: 'image/jpeg',
  };
}

/**
 * Validate PNG Image File
 */
export function validatePng(
  buffer: Buffer | Uint8Array,
  fileName: string = 'image.png'
): ValidationResult {
  const fileSize = buffer.byteLength || buffer.length;

  if (!buffer || fileSize === 0) {
    return { isValid: false, error: 'Please select a file first.', fileSize: 0 };
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return { isValid: false, error: 'The maximum file size is 50 MB.', fileSize };
  }

  if (!isPngSignature(buffer)) {
    return {
      isValid: false,
      error: 'This file is not a valid PNG image.',
      fileSize,
    };
  }

  return {
    isValid: true,
    fileSize,
    mimeType: 'image/png',
  };
}
