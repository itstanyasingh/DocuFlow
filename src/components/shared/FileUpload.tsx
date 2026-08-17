import React, { useRef, useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, Plus, X, Sparkles } from 'lucide-react';
import { FileItem } from '../../types';
import { generateSamplePdf, generateSampleInvoicePdf } from '../../lib/sampleFiles';

interface FileUploadProps {
  onFilesSelected: (files: FileItem[]) => void;
  acceptedExtensions?: string[];
  multiple?: boolean;
  maxSizeMb?: number; // default 50
  title?: string;
  subtitle?: string;
  allowSampleFiles?: boolean;
  disabled?: boolean;
  className?: string;
}

const MAGIC_SIGNATURES: Record<string, (bytes: Uint8Array) => boolean> = {
  pdf: (b) => b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d, // %PDF-
  jpg: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  png: (b) =>
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a,
};

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  acceptedExtensions = ['.pdf'],
  multiple = false,
  maxSizeMb = 50,
  title,
  subtitle,
  allowSampleFiles = true,
  disabled = false,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  const validateAndProcessFiles = useCallback(
    async (rawFiles: FileList | File[]) => {
      setValidationError(null);
      if (!rawFiles || rawFiles.length === 0) {
        setValidationError('Please select a file first.');
        return;
      }

      const filesToInspect = multiple ? Array.from(rawFiles) : [rawFiles[0]];
      const validItems: FileItem[] = [];

      for (const file of filesToInspect) {
        // 1. Size validation
        if (file.size > maxSizeBytes) {
          setValidationError(`The maximum file size is ${maxSizeMb} MB.`);
          return;
        }

        // 2. Extension validation
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        const isExtensionAllowed = acceptedExtensions.some(
          (allowed) => allowed.toLowerCase() === ext || allowed === '*/*'
        );

        if (!isExtensionAllowed && acceptedExtensions.length > 0) {
          setValidationError(
            `File "${file.name}" is not supported. Please upload ${acceptedExtensions.join(', ')}.`
          );
          return;
        }

        // 3. Signature & Integrity Check
        try {
          const arrayBuffer = await file.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer.slice(0, 16));

          // Check if expected PDF
          if (ext === '.pdf' && !MAGIC_SIGNATURES.pdf(bytes)) {
            setValidationError('This file is not a valid PDF.');
            return;
          }

          // Check if expected JPG
          if ((ext === '.jpg' || ext === '.jpeg') && !MAGIC_SIGNATURES.jpg(bytes)) {
            setValidationError('This file is not a valid JPG image.');
            return;
          }

          // Check if expected PNG
          if (ext === '.png' && !MAGIC_SIGNATURES.png(bytes)) {
            setValidationError('This file is not a valid PNG image.');
            return;
          }

          validItems.push({
            id: 'file_' + Math.random().toString(36).substring(2, 9),
            file,
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            arrayBuffer,
          });
        } catch (err: any) {
          setValidationError(`Could not read "${file.name}". Please try another file.`);
          return;
        }
      }

      if (validItems.length > 0) {
        onFilesSelected(validItems);
      }
    },
    [acceptedExtensions, maxSizeBytes, maxSizeMb, multiple, onFilesSelected]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFiles(e.target.files);
      // Reset input value so selecting the same file triggers change
      e.target.value = '';
    }
  };

  const loadSampleDoc = async (type: 'standard' | 'invoice') => {
    try {
      setLoadingSample(true);
      setValidationError(null);
      const pdfBytes = type === 'standard' ? await generateSamplePdf() : await generateSampleInvoicePdf();
      const fileName = type === 'standard' ? 'sample-multipage.pdf' : 'sample-invoice.pdf';
      const file = new File([pdfBytes.buffer as ArrayBuffer], fileName, { type: 'application/pdf' });
      await validateAndProcessFiles([file]);
    } catch (e: any) {
      setValidationError('Failed to generate sample document.');
    } finally {
      setLoadingSample(false);
    }
  };

  const acceptString = acceptedExtensions.join(',');

  return (
    <div className={`w-full ${className}`}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
        id="file-dropzone-container"
        className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 sm:p-12 transition-all duration-200 flex flex-col items-center justify-center text-center ${
          isDragOver
            ? 'border-slate-900 bg-slate-50/80 scale-[0.99]'
            : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/50'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptString}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
          id="file-upload-input"
        />

        {/* Upload Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 mb-4 group-hover:scale-105 transition-transform duration-200">
          <Upload className="w-7 h-7" />
        </div>

        {/* Main Prompts */}
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
          {title || (multiple ? 'Drop files here or browse' : 'Drop file here or browse')}
        </h3>

        <p className="text-sm text-slate-500 max-w-sm mb-4">
          {subtitle ||
            `Supports ${acceptedExtensions.join(', ').toUpperCase()} files.`}
        </p>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          id="browse-files-btn"
          className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm transition-all active:scale-[0.98] mb-4"
        >
          {multiple ? 'Choose Files' : 'Choose File'}
        </button>

        {/* Size Badge */}
        <div className="text-xs font-medium text-slate-400">
          Maximum file size: {maxSizeMb} MB
        </div>
      </div>

      {/* Validation Error Message */}
      {validationError && (
        <div className="mt-3 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in" id="upload-validation-error">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">{validationError}</span>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="text-red-400 hover:text-red-700 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Test Sample Files Helper */}
      {allowSampleFiles && acceptedExtensions.some((e) => e.includes('.pdf')) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span>Need a test file?</span>
          <button
            type="button"
            disabled={loadingSample}
            onClick={() => loadSampleDoc('standard')}
            id="load-sample-multipage-btn"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors border border-slate-200/80"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            3-Page Document
          </button>
          <button
            type="button"
            disabled={loadingSample}
            onClick={() => loadSampleDoc('invoice')}
            id="load-sample-invoice-btn"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors border border-slate-200/80"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Sample Invoice
          </button>
        </div>
      )}
    </div>
  );
};
