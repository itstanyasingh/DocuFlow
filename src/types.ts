export type MajorCategory = 
  | 'pdf' 
  | 'documents' 
  | 'images' 
  | 'ocr' 
  | 'file-utilities' 
  | 'text-tools' 
  | 'data-tools' 
  | 'everyday-utilities';

export type ToolCategory = 
  | 'pdf-essentials'
  | 'pdf-organize'
  | 'pdf-edit'
  | 'pdf-security'
  | 'pdf-extract'
  | 'pdf-convert'
  | 'document-word'
  | 'document-excel'
  | 'document-powerpoint'
  | 'image-convert'
  | 'image-tools'
  | 'image-document'
  | 'ocr'
  | 'text-tools'
  | 'data-utilities'
  | 'data-tools'
  | 'file-utilities'
  | 'everyday-utilities';

export interface ToolDefinition {
  id: string;
  name: string;
  shortDescription: string;
  description?: string;
  fullDescription: string;
  majorCategory?: MajorCategory;
  subcategory?: string;
  category: ToolCategory;
  categoryLabel?: string;
  icon: string;
  fromFormat: string;
  toFormat: string;
  acceptedExtensions: string[];
  maxSizeMb: number;
  popular?: boolean;
  popularRank?: number;
  isPro?: boolean;
  status: 'available' | 'coming-soon';
  tags: string[];
  features?: string[];
  relatedToolIds?: string[];
  faq?: { q: string; a: string }[];
}

export type ProcessingStatus = 'IDLE' | 'UPLOADING' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  arrayBuffer?: ArrayBuffer;
  text?: string;
}

export interface ProcessedResult {
  id: string;
  toolId: string;
  toolName: string;
  originalFileName: string;
  originalFileSize: number;
  outputFileName: string;
  outputFileSize: number;
  outputMimeType: string;
  blobUrl?: string;
  textResult?: string;
  jsonResult?: any;
  dataUrl?: string;
  previewUrl?: string;
  createdAt: string;
  expiresAt: string;
}

export interface OcrResult {
  fullText: string;
  language: string;
  confidenceScore: number;
  wordCount: number;
  headers: string[];
  tables?: { title?: string; headers: string[]; rows: string[][] }[];
  keyValues?: { key: string; value: string }[];
  handwrittenNotesDetected?: boolean;
}

