import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Trash2, Sparkles, FolderOpen, ArrowRight, FileCheck, Image as ImageIcon, Sheet } from 'lucide-react';
import { FileItem } from '../types';
import { SAMPLE_DOCS, SampleDoc } from '../lib/sampleFiles';

interface UniversalDropzoneProps {
  acceptedExtensions?: string[];
  maxSizeMb?: number;
  multiple?: boolean;
  onFilesSelected: (files: FileItem[]) => void;
  title?: string;
  subtitle?: string;
  showSamplePicker?: boolean;
}

export const UniversalDropzone: React.FC<UniversalDropzoneProps> = ({
  acceptedExtensions = ['.pdf', '.docx', '.jpg', '.png', '.xlsx', '.csv', '.txt'],
  maxSizeMb = 50,
  multiple = false,
  onFilesSelected,
  title = 'Drop your files here or browse',
  subtitle = 'Supports PDF, Word, Excel, Images, and Text up to 50 MB',
  showSamplePicker = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFiles = async (fileList: FileList | File[]) => {
    setErrorMessage(null);
    const newItems: FileItem[] = [];
    const filesArray = Array.from(fileList);

    for (const file of filesArray) {
      // Size check
      const fileSizeMb = file.size / (1024 * 1024);
      if (fileSizeMb > maxSizeMb) {
        setErrorMessage(`File "${file.name}" is ${fileSizeMb.toFixed(1)} MB. Maximum allowed size is ${maxSizeMb} MB.`);
        return;
      }

      // Extension check
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isAccepted = acceptedExtensions.some(e => e.toLowerCase() === ext || e === '.*');
      if (!isAccepted && acceptedExtensions.length > 0 && !acceptedExtensions.includes('*')) {
        setErrorMessage(`Format "${ext}" is not supported for this tool. Supported formats: ${acceptedExtensions.join(', ')}`);
        return;
      }

      // Create preview / buffer
      let dataUrl: string | undefined;
      let text: string | undefined;

      if (file.type.startsWith('image/')) {
        dataUrl = await new Promise((res) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.readAsDataURL(file);
        });
      } else if (file.type.includes('text') || file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        text = await file.text();
      }

      newItems.push({
        id: 'file_' + Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl,
        text,
      });
    }

    const updated = multiple ? [...selectedFiles, ...newItems] : newItems;
    setSelectedFiles(updated);
    onFilesSelected(updated);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    const updated = selectedFiles.filter(f => f.id !== id);
    setSelectedFiles(updated);
    onFilesSelected(updated);
  };

  const handleSampleLoad = async (sample: SampleDoc) => {
    try {
      setLoadingSample(sample.id);
      const generated = await sample.generateFile();
      await validateAndProcessFiles([generated]);
    } catch (err) {
      console.error('Error generating sample doc:', err);
    } finally {
      setLoadingSample(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full space-y-4">
      {/* Drag & Drop Card */}
      <div
        id="universal-dropzone-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-blue-600 bg-blue-50/70 scale-[0.99] ring-4 ring-blue-100'
            : 'border-stone-300 bg-stone-50/50 hover:bg-stone-50 hover:border-stone-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedExtensions.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          id="universal-file-input"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-stone-200 flex items-center justify-center text-blue-600">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              className="px-5 py-2 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white rounded-lg shadow-sm transition-colors"
            >
              Choose Files
            </button>
            <span className="text-xs text-stone-400">or drag & drop</span>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-stone-400 font-mono">
            <span>Accepted:</span>
            {acceptedExtensions.map(ext => (
              <span key={ext} className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-stone-600">
                {ext.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message banner */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1-Click Sample Document Picker */}
      {showSamplePicker && selectedFiles.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Don't have a document ready? Test instantly with realistic samples:</span>
            </div>
            <span className="text-[10px] text-stone-400">1-click test</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {SAMPLE_DOCS.map(sample => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSampleLoad(sample)}
                disabled={loadingSample !== null}
                className="flex items-start gap-2.5 p-2.5 rounded-lg border border-stone-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-all group disabled:opacity-50"
              >
                <div className="p-1.5 rounded-md bg-stone-100 group-hover:bg-blue-100 text-stone-700 group-hover:text-blue-700 transition-colors">
                  {sample.category === 'invoice' ? <FileText className="w-4 h-4" /> :
                   sample.category === 'research' ? <FileCheck className="w-4 h-4" /> :
                   sample.category === 'spreadsheet' ? <Sheet className="w-4 h-4" /> :
                   <ImageIcon className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-stone-900 truncate group-hover:text-blue-700">
                    {sample.name}
                  </p>
                  <p className="text-[10px] text-stone-500 line-clamp-1">{sample.description}</p>
                  <span className="inline-block mt-1 text-[9px] font-mono text-stone-400 font-medium">
                    {sample.fileType} • {sample.sizeFormatted}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700 pb-1 border-b border-stone-100">
            <span>Selected Files ({selectedFiles.length})</span>
            <button
              type="button"
              onClick={() => {
                setSelectedFiles([]);
                onFilesSelected([]);
              }}
              className="text-[11px] text-stone-400 hover:text-rose-600 transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {selectedFiles.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-stone-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-stone-400">{formatBytes(item.size)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(item.id);
                  }}
                  className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-white transition-colors"
                  title="Remove file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
