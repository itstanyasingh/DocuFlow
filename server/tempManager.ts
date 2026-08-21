import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const TEMP_DIR = path.join(os.tmpdir(), 'docuflow_temp');
const UPLOADS_DIR = path.join(TEMP_DIR, 'uploads');
const PROCESSING_DIR = path.join(TEMP_DIR, 'processing');
const RESULTS_DIR = path.join(TEMP_DIR, 'results');

export interface StoredResultFile {
  fileId: string;
  originalName: string;
  outputName: string;
  mimeType: string;
  filePath: string;
  fileSize: number;
  createdAt: number;
  expiresAt: number;
  metadata?: Record<string, any>;
}

// In-memory lookup map for quick session retrieval
const resultsRegistry: Map<string, StoredResultFile> = new Map();

/**
 * Ensure all temporary folders exist
 */
export function initTempDirectories() {
  [TEMP_DIR, UPLOADS_DIR, PROCESSING_DIR, RESULTS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Save a generated result buffer to the temporary results store
 */
export function saveResultFile(
  buffer: Buffer | Uint8Array,
  outputName: string,
  mimeType: string,
  originalName: string = 'document.pdf',
  metadata?: Record<string, any>,
  ttlMinutes: number = 30
): StoredResultFile {
  initTempDirectories();
  const fileId = 'docuflow_' + crypto.randomBytes(16).toString('hex');
  const sanitizedName = path.basename(outputName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const targetFilePath = path.join(RESULTS_DIR, `${fileId}_${sanitizedName}`);

  fs.writeFileSync(targetFilePath, Buffer.from(buffer));

  const now = Date.now();
  const record: StoredResultFile = {
    fileId,
    originalName,
    outputName: sanitizedName,
    mimeType,
    filePath: targetFilePath,
    fileSize: buffer.byteLength || buffer.length,
    createdAt: now,
    expiresAt: now + ttlMinutes * 60 * 1000,
    metadata,
  };

  resultsRegistry.set(fileId, record);
  return record;
}

/**
 * Get stored file by ID
 */
export function getResultFile(fileId: string): StoredResultFile | null {
  const record = resultsRegistry.get(fileId);
  if (!record) return null;

  if (Date.now() > record.expiresAt) {
    // Expired - clean up
    try {
      if (fs.existsSync(record.filePath)) {
        fs.unlinkSync(record.filePath);
      }
    } catch (_) {}
    resultsRegistry.delete(fileId);
    return null;
  }

  if (!fs.existsSync(record.filePath)) {
    resultsRegistry.delete(fileId);
    return null;
  }

  return record;
}

/**
 * Purge expired temporary files
 */
export function cleanupExpiredTempFiles() {
  const now = Date.now();
  for (const [fileId, record] of resultsRegistry.entries()) {
    if (now > record.expiresAt) {
      try {
        if (fs.existsSync(record.filePath)) {
          fs.unlinkSync(record.filePath);
        }
      } catch (_) {}
      resultsRegistry.delete(fileId);
    }
  }

  // Also clean old physical files in temp folders older than 2 hours
  [UPLOADS_DIR, PROCESSING_DIR, RESULTS_DIR].forEach((dir) => {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fp = path.join(dir, file);
          const stat = fs.statSync(fp);
          if (now - stat.mtimeMs > 2 * 60 * 60 * 1000) {
            fs.unlinkSync(fp);
          }
        }
      } catch (_) {}
    }
  });
}

// Auto-run cleanup every 15 minutes
setInterval(cleanupExpiredTempFiles, 15 * 60 * 1000);
