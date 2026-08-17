import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Settings,
  Layers,
  FileText,
  Sliders,
  RotateCw,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { FileItem, ProcessedResult, ToolDefinition } from '../types';
import { FileUpload } from './shared/FileUpload';
import { FileList } from './shared/FileList';
import { FilePreview } from './shared/FilePreview';
import { ProcessingStatus } from './shared/ProcessingStatus';
import { ResultPanel } from './shared/ResultPanel';
import { ErrorMessage } from './shared/ErrorMessage';
import { PDFDocument } from 'pdf-lib';
import { renderPdfPages } from '../lib/pdfjsHelper';

interface ToolProcessorProps {
  tool: ToolDefinition;
  onBackToHome: () => void;
  onSaveToHistory: (result: ProcessedResult) => void;
}

export const ToolProcessor: React.FC<ToolProcessorProps> = ({
  tool,
  onBackToHome,
  onSaveToHistory,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [pageCounts, setPageCounts] = useState<Record<string, number>>({});
  const [processingStage, setProcessingStage] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'failed'>('idle');
  const [progressStatus, setProgressStatus] = useState<string>('Processing your document...');
  const [processedResult, setProcessedResult] = useState<ProcessedResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // PDF Page inspection
  const [totalPages, setTotalPages] = useState<number>(1);
  const [primaryArrayBuffer, setPrimaryArrayBuffer] = useState<ArrayBuffer | null>(null);

  // Tool Specific Configurations
  // 1. Split
  const [splitMode, setSplitMode] = useState<'all' | 'custom'>('custom');
  const [customRangeStr, setCustomRangeStr] = useState<string>('1-3, 4-7');

  // 2. Compress
  const [compressionLevel, setCompressionLevel] = useState<'basic' | 'recommended' | 'strong'>('recommended');

  // 3. Extract Pages
  const [selectedExtractPages, setSelectedExtractPages] = useState<number[]>([1]);
  const [extractRangeInput, setExtractRangeInput] = useState<string>('1');

  // 4. Delete Pages
  const [pagesToDelete, setPagesToDelete] = useState<number[]>([]);

  // 5. Rotate PDF
  const [rotationAngle, setRotationAngle] = useState<90 | 180 | 270>(90);
  const [rotateScope, setRotateScope] = useState<'all' | 'selected'>('all');
  const [selectedRotatePages, setSelectedRotatePages] = useState<number[]>([]);
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});

  // 6. Image <-> PDF Settings (JPG to PDF, PNG to PDF)
  const [pageSize, setPageSize] = useState<'a4' | 'original' | 'a5' | 'letter' | 'legal'>('a4');
  const [pageOrientation, setPageOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [pageMargin, setPageMargin] = useState<'none' | 'small' | 'medium' | 'large'>('medium');

  // 7. PDF -> JPG / PNG Settings
  const [imageConvertScope, setImageConvertScope] = useState<'all' | 'selected'>('all');
  const [selectedImagePages, setSelectedImagePages] = useState<number[]>([1]);
  const [jpgQuality, setJpgQuality] = useState<'standard' | 'high' | 'maximum'>('high');
  const [pngDpi, setPngDpi] = useState<72 | 150 | 300>(150);

  // Inspect page counts when files change
  useEffect(() => {
    if (selectedFiles.length === 0) {
      setPageCounts({});
      setPrimaryArrayBuffer(null);
      setTotalPages(1);
      return;
    }

    const inspectFiles = async () => {
      const counts: Record<string, number> = {};
      for (const item of selectedFiles) {
        if (item.name.toLowerCase().endsWith('.pdf')) {
          try {
            const buf = item.arrayBuffer || (await item.file.arrayBuffer());
            const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
            counts[item.id] = doc.getPageCount();
          } catch (_) {
            counts[item.id] = 1;
          }
        }
      }
      setPageCounts(counts);

      const firstPdf = selectedFiles.find((f) => f.name.toLowerCase().endsWith('.pdf'));
      if (firstPdf) {
        const buf = firstPdf.arrayBuffer || (await firstPdf.file.arrayBuffer());
        setPrimaryArrayBuffer(buf);
        const count = counts[firstPdf.id] || 1;
        setTotalPages(count);
        // Default extract / rotate / image page selections
        setSelectedExtractPages([1]);
        setExtractRangeInput('1');
        setSelectedRotatePages(Array.from({ length: count }, (_, i) => i + 1));
        setSelectedImagePages(Array.from({ length: count }, (_, i) => i + 1));
      }
    };

    inspectFiles();
  }, [selectedFiles]);

  const isMultiFileTool = ['merge-pdf', 'jpg-to-pdf', 'png-to-pdf'].includes(tool.id);

  const handleFilesSelected = (newFiles: FileItem[]) => {
    setErrorMessage(null);
    if (isMultiFileTool) {
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    } else {
      setSelectedFiles([newFiles[0]]);
    }
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleReorderFiles = (reordered: FileItem[]) => {
    setSelectedFiles(reordered);
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setProcessingStage('idle');
    setProcessedResult(null);
    setErrorMessage(null);
    setPagesToDelete([]);
    setPageRotations({});
  };

  // Helper for Extract range text sync
  const handleExtractRangeInputChange = (val: string) => {
    setExtractRangeInput(val);
    const tokens = val.split(',').map((t) => t.trim()).filter(Boolean);
    const result: number[] = [];
    for (const token of tokens) {
      if (token.includes('-')) {
        const [start, end] = token.split('-').map((n) => parseInt(n.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
            result.push(p);
          }
        }
      } else {
        const p = parseInt(token, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          result.push(p);
        }
      }
    }
    if (result.length > 0) {
      setSelectedExtractPages(Array.from(new Set(result)).sort((a, b) => a - b));
    }
  };

  const handleToggleExtractPage = (pageNumber: number) => {
    let updated: number[];
    if (selectedExtractPages.includes(pageNumber)) {
      if (selectedExtractPages.length === 1) return; // Keep at least one
      updated = selectedExtractPages.filter((p) => p !== pageNumber);
    } else {
      updated = [...selectedExtractPages, pageNumber].sort((a, b) => a - b);
    }
    setSelectedExtractPages(updated);
    setExtractRangeInput(updated.join(', '));
  };

  const handleToggleDeletePage = (pageNumber: number) => {
    if (pagesToDelete.includes(pageNumber)) {
      setPagesToDelete(pagesToDelete.filter((p) => p !== pageNumber));
    } else {
      if (pagesToDelete.length + 1 >= totalPages) {
        setErrorMessage('Cannot delete all pages. A PDF must retain at least one page.');
        return;
      }
      setErrorMessage(null);
      setPagesToDelete([...pagesToDelete, pageNumber].sort((a, b) => a - b));
    }
  };

  const handleToggleRotatePage = (pageNumber: number) => {
    if (selectedRotatePages.includes(pageNumber)) {
      setSelectedRotatePages(selectedRotatePages.filter((p) => p !== pageNumber));
    } else {
      setSelectedRotatePages([...selectedRotatePages, pageNumber].sort((a, b) => a - b));
    }
  };

  const handleRotateSinglePageVisual = (pageNumber: number) => {
    setPageRotations((prev) => ({
      ...prev,
      [pageNumber]: ((prev[pageNumber] || 0) + 90) % 360,
    }));
  };

  const handleToggleImagePage = (pageNumber: number) => {
    if (selectedImagePages.includes(pageNumber)) {
      if (selectedImagePages.length === 1) return;
      setSelectedImagePages(selectedImagePages.filter((p) => p !== pageNumber));
    } else {
      setSelectedImagePages([...selectedImagePages, pageNumber].sort((a, b) => a - b));
    }
  };

  // Main Execution Routine
  const executeProcessing = async () => {
    if (selectedFiles.length === 0) {
      setErrorMessage('Please select a file first.');
      return;
    }

    if (tool.id === 'merge-pdf' && selectedFiles.length < 2) {
      setErrorMessage('Please select at least 2 PDF files to merge.');
      return;
    }

    setProcessingStage('uploading');
    setProgressStatus('Uploading document...');
    setErrorMessage(null);

    try {
      const primaryFile = selectedFiles[0];
      const baseName = primaryFile.name.replace(/\.[^/.]+$/, '');
      const formData = new FormData();

      let endpoint = `/api/tools/${tool.id}`;
      if (tool.id === 'delete-pages') endpoint = '/api/tools/delete-pages';

      switch (tool.id) {
        case 'merge-pdf': {
          selectedFiles.forEach((item) => {
            formData.append('files', item.file, item.name);
          });
          break;
        }

        case 'split-pdf': {
          formData.append('file', primaryFile.file, primaryFile.name);
          const rangeParam = splitMode === 'all' ? 'all' : customRangeStr;
          formData.append('range', rangeParam);
          break;
        }

        case 'compress-pdf': {
          formData.append('file', primaryFile.file, primaryFile.name);
          formData.append('level', compressionLevel);
          break;
        }

        case 'extract-pages': {
          formData.append('file', primaryFile.file, primaryFile.name);
          formData.append('pages', selectedExtractPages.join(', '));
          break;
        }

        case 'delete-pages': {
          if (pagesToDelete.length === 0) {
            throw new Error('Please select at least one page to delete.');
          }
          formData.append('file', primaryFile.file, primaryFile.name);
          formData.append('pages', pagesToDelete.join(', '));
          break;
        }

        case 'rotate-pdf': {
          formData.append('file', primaryFile.file, primaryFile.name);
          formData.append('angle', rotationAngle.toString());
          const pages = rotateScope === 'all' ? 'all' : selectedRotatePages.join(', ');
          formData.append('pages', pages);
          break;
        }

        case 'jpg-to-pdf':
        case 'png-to-pdf': {
          selectedFiles.forEach((item) => {
            formData.append('files', item.file, item.name);
          });
          formData.append('pageSize', pageSize);
          formData.append('orientation', pageOrientation);
          formData.append('margin', pageMargin);
          break;
        }

        case 'pdf-to-jpg':
        case 'pdf-to-png': {
          // Render the selected pages with high resolution in the browser canvas and package cleanly
          setProgressStatus('Processing your PDF... Please keep this page open.');
          setProcessingStage('processing');

          const buf = primaryFile.arrayBuffer || (await primaryFile.file.arrayBuffer());
          const isJpg = tool.id === 'pdf-to-jpg';
          const scale = isJpg ? (jpgQuality === 'maximum' ? 2.5 : jpgQuality === 'high' ? 2.0 : 1.5) : pngDpi === 300 ? 3.0 : pngDpi === 150 ? 2.0 : 1.0;
          const mime = isJpg ? 'image/jpeg' : 'image/png';
          const quality = isJpg ? (jpgQuality === 'maximum' ? 0.95 : jpgQuality === 'high' ? 0.85 : 0.75) : 1.0;

          const rendered = await renderPdfPages(buf, {
            scale,
            format: mime,
            quality,
          });

          const targetPages = imageConvertScope === 'all'
            ? rendered
            : rendered.filter((p) => selectedImagePages.includes(p.pageNumber));

          if (targetPages.length === 0) {
            throw new Error('No pages selected for image conversion.');
          }

          const imagesPayload = await Promise.all(
            targetPages.map(async (p) => ({
              pageNumber: p.pageNumber,
              base64: p.dataUrl,
            }))
          );

          formData.append('imagesJson', JSON.stringify(imagesPayload));
          formData.append('baseName', baseName);
          break;
        }

        default:
          throw new Error('This tool is not yet implemented.');
      }

      setProcessingStage('processing');
      setProgressStatus('Processing your PDF... Please keep this page open.');

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "We couldn't process this PDF. Please try again.");
      }

      const totalInputBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);

      // Construct verified ProcessedResult
      let blobUrl = data.downloadUrl;
      if (data.dataUrl) {
        // Convert base64 data to native Blob URL for instant downloads without network roundtrip
        const res = await fetch(data.dataUrl);
        const blob = await res.blob();
        blobUrl = URL.createObjectURL(blob);
      }

      const result: ProcessedResult = {
        id: data.fileId || 'res_' + Math.random().toString(36).substring(2, 9),
        toolId: tool.id,
        toolName: tool.name,
        originalFileName: primaryFile.name,
        originalFileSize: data.originalFileSize || totalInputBytes,
        outputFileName: data.outputFileName || 'output.pdf',
        outputFileSize: data.outputFileSize || 1024,
        outputMimeType: data.outputMimeType || 'application/pdf',
        blobUrl,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
      };

      setProcessedResult(result);
      onSaveToHistory(result);
      setProcessingStage('completed');
    } catch (err: any) {
      console.error(err);
      setProcessingStage('failed');
      setErrorMessage(err.message || "We couldn't process this PDF. Please try again.");
    }
  };

  // If tool is coming-soon
  if (tool.status === 'coming-soon') {
    return (
      <div className="w-full max-w-2xl mx-auto py-12 px-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <Clock className="w-7 h-7" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold uppercase tracking-wider mb-2">
          Coming Soon in Phase 2
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{tool.name}</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
          {tool.fullDescription || tool.shortDescription}
        </p>
        <button
          type="button"
          onClick={onBackToHome}
          className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Available Tools
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6" id="tool-processor-container">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <button
          type="button"
          onClick={onBackToHome}
          id="back-to-home-btn"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          Deterministic Engine v1.0
        </div>
      </div>

      {/* Tool Header */}
      <div className="text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1">
          {tool.name}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
          {tool.shortDescription}
        </p>
      </div>

      {/* Global Error Banner */}
      <ErrorMessage
        message={errorMessage}
        onDismiss={() => setErrorMessage(null)}
        onRetry={executeProcessing}
      />

      {/* STAGE: PROCESSING / UPLOADING */}
      {(processingStage === 'uploading' || processingStage === 'processing') && (
        <ProcessingStatus
          stage={processingStage}
          customTitle={
            processingStage === 'uploading'
              ? 'Uploading document...'
              : 'Processing your PDF...'
          }
          customSubtitle={
            processingStage === 'uploading'
              ? 'Validating signatures and streaming to processing service.'
              : 'Please keep this page open.'
          }
          fileName={selectedFiles[0]?.name}
          fileCount={selectedFiles.length}
        />
      )}

      {/* STAGE: COMPLETED RESULT */}
      {processingStage === 'completed' && processedResult && (
        <ResultPanel
          result={processedResult}
          onReset={handleReset}
          title={tool.id === 'merge-pdf' ? '✓ PDF merged successfully' : '✓ Your file is ready'}
          resetButtonLabel={tool.id === 'merge-pdf' ? 'Merge another' : 'Process another file'}
        />
      )}

      {/* STAGE: IDLE / CONFIGURATION */}
      {processingStage !== 'uploading' && processingStage !== 'processing' && processingStage !== 'completed' && (
        <div className="space-y-6">
          {/* 1. File Upload Area (if empty or multi-file) */}
          {selectedFiles.length === 0 ? (
            <FileUpload
              onFilesSelected={handleFilesSelected}
              acceptedExtensions={tool.acceptedExtensions}
              multiple={isMultiFileTool}
              maxSizeMb={50}
              title={
                tool.id === 'merge-pdf'
                  ? 'Drop PDF files here'
                  : tool.id === 'jpg-to-pdf'
                  ? 'Drop JPG images here'
                  : tool.id === 'png-to-pdf'
                  ? 'Drop PNG images here'
                  : `Drop ${tool.acceptedExtensions[0] || 'PDF'} file here`
              }
            />
          ) : (
            <div className="space-y-6">
              {/* Multi-file List */}
              {isMultiFileTool ? (
                <FileList
                  files={selectedFiles}
                  pageCounts={pageCounts}
                  onRemoveFile={handleRemoveFile}
                  onReorderFiles={handleReorderFiles}
                  onAddMoreFiles={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = tool.acceptedExtensions.join(',');
                    input.onchange = (e: any) => {
                      if (e.target?.files?.length) {
                        const items: FileItem[] = Array.from(e.target.files as FileList).map((f) => ({
                          id: 'file_' + Math.random().toString(36).substring(2, 9),
                          file: f,
                          name: f.name,
                          size: f.size,
                          type: f.type,
                        }));
                        handleFilesSelected(items);
                      }
                    };
                    input.click();
                  }}
                />
              ) : (
                /* Single File Header Card */
                <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <FileText className="w-5 h-5 text-slate-800" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate" title={selectedFiles[0].name}>
                        {selectedFiles[0].name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                        <span>{(selectedFiles[0].size / (1024 * 1024)).toFixed(2)} MB</span>
                        {totalPages > 0 && (
                          <>
                            <span>•</span>
                            <span>{totalPages} {totalPages === 1 ? 'page' : 'pages'}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    id="replace-file-btn"
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    Change file
                  </button>
                </div>
              )}

              {/* 2. Tool Specific Controls */}
              {/* A. SPLIT PDF SETTINGS */}
              {tool.id === 'split-pdf' && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4" id="split-settings-card">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <Sliders className="w-4 h-4 text-slate-700" />
                    <span>Split Options</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSplitMode('all')}
                      id="split-every-page-btn"
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        splitMode === 'all'
                          ? 'border-slate-900 bg-slate-50/80 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="font-semibold text-sm text-slate-900 mb-1">Split every page</div>
                      <div className="text-xs text-slate-500">
                        Extract every page into individual files packaged in a ZIP archive.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSplitMode('custom')}
                      id="split-custom-ranges-btn"
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        splitMode === 'custom'
                          ? 'border-slate-900 bg-slate-50/80 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="font-semibold text-sm text-slate-900 mb-1">Custom ranges</div>
                      <div className="text-xs text-slate-500">
                        Separate pages into custom ranges (e.g. 1-3, 4-7, 8-10).
                      </div>
                    </button>
                  </div>

                  {splitMode === 'custom' && (
                    <div className="space-y-1.5 pt-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        Page Ranges (comma separated)
                      </label>
                      <input
                        type="text"
                        value={customRangeStr}
                        onChange={(e) => setCustomRangeStr(e.target.value)}
                        placeholder="e.g. 1-3, 4-7, 8-10"
                        id="split-ranges-input"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                      />
                      <p className="text-[11px] text-slate-400 font-mono">
                        Creates part-1.pdf, part-2.pdf... Total document pages: {totalPages}
                      </p>
                    </div>
                  )}

                  {primaryArrayBuffer && (
                    <div className="pt-2">
                      <FilePreview
                        arrayBuffer={primaryArrayBuffer}
                        totalPages={totalPages}
                        selectedPages={[]}
                        onTogglePage={() => {}}
                        mode="view"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* B. COMPRESS PDF SETTINGS */}
              {tool.id === 'compress-pdf' && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4" id="compress-settings-card">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <Sliders className="w-4 h-4 text-slate-700" />
                    <span>Compression Level</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        key: 'basic',
                        name: 'Basic',
                        desc: 'Small amount of compression. Highest visual quality.',
                      },
                      {
                        key: 'recommended',
                        name: 'Recommended',
                        desc: 'Balanced compression and crisp readability.',
                      },
                      {
                        key: 'strong',
                        name: 'Strong',
                        desc: 'Maximum reasonable compression for sharing.',
                      },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setCompressionLevel(opt.key as any)}
                        id={`compress-level-${opt.key}`}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          compressionLevel === opt.key
                            ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900/10'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="font-semibold text-sm text-slate-900 mb-1">{opt.name}</div>
                        <div className="text-xs text-slate-500 leading-relaxed">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* C. EXTRACT PAGES SETTINGS */}
              {tool.id === 'extract-pages' && primaryArrayBuffer && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4" id="extract-settings-card">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Pages to extract (click cards below or type ranges):
                    </label>
                    <input
                      type="text"
                      value={extractRangeInput}
                      onChange={(e) => handleExtractRangeInputChange(e.target.value)}
                      placeholder="e.g. 1, 3, 5-7, 10"
                      id="extract-pages-input"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>

                  <FilePreview
                    arrayBuffer={primaryArrayBuffer}
                    totalPages={totalPages}
                    selectedPages={selectedExtractPages}
                    onTogglePage={handleToggleExtractPage}
                    onSelectAll={() => {
                      const all = Array.from({ length: totalPages }, (_, i) => i + 1);
                      setSelectedExtractPages(all);
                      setExtractRangeInput(all.join(', '));
                    }}
                    onDeselectAll={() => {
                      setSelectedExtractPages([1]);
                      setExtractRangeInput('1');
                    }}
                    onInvertSelection={() => {
                      const inv = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
                        (p) => !selectedExtractPages.includes(p)
                      );
                      const safe = inv.length > 0 ? inv : [1];
                      setSelectedExtractPages(safe);
                      setExtractRangeInput(safe.join(', '));
                    }}
                    mode="select"
                  />
                </div>
              )}

              {/* D. DELETE PAGES SETTINGS */}
              {tool.id === 'delete-pages' && primaryArrayBuffer && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4" id="delete-pages-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900">Mark pages to remove</div>
                      <div className="text-xs text-slate-500">
                        Selected pages will be excluded. The original file is never modified.
                      </div>
                    </div>
                    {pagesToDelete.length > 0 && (
                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 font-mono">
                        {pagesToDelete.length} {pagesToDelete.length === 1 ? 'page' : 'pages'} marked
                      </span>
                    )}
                  </div>

                  <FilePreview
                    arrayBuffer={primaryArrayBuffer}
                    totalPages={totalPages}
                    selectedPages={pagesToDelete}
                    onTogglePage={handleToggleDeletePage}
                    onDeselectAll={() => setPagesToDelete([])}
                    mode="delete"
                  />
                </div>
              )}

              {/* E. ROTATE PDF SETTINGS */}
              {tool.id === 'rotate-pdf' && primaryArrayBuffer && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4" id="rotate-settings-card">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { angle: 90, label: '90° Clockwise' },
                      { angle: 180, label: '180° Half Turn' },
                      { angle: 270, label: '270° (90° CCW)' },
                    ].map((opt) => (
                      <button
                        key={opt.angle}
                        type="button"
                        onClick={() => setRotationAngle(opt.angle as any)}
                        id={`rotate-angle-${opt.angle}`}
                        className={`p-3 rounded-xl border text-center font-semibold text-sm transition-all ${
                          rotationAngle === opt.angle
                            ? 'border-slate-900 bg-slate-50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="rotateScope"
                        checked={rotateScope === 'all'}
                        onChange={() => setRotateScope('all')}
                        className="text-slate-900 focus:ring-slate-900"
                      />
                      <span>Rotate all pages</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="rotateScope"
                        checked={rotateScope === 'selected'}
                        onChange={() => setRotateScope('selected')}
                        className="text-slate-900 focus:ring-slate-900"
                      />
                      <span>Rotate selected pages only</span>
                    </label>
                  </div>

                  <FilePreview
                    arrayBuffer={primaryArrayBuffer}
                    totalPages={totalPages}
                    selectedPages={rotateScope === 'all' ? [] : selectedRotatePages}
                    onTogglePage={handleToggleRotatePage}
                    pageRotations={pageRotations}
                    onRotateSinglePage={handleRotateSinglePageVisual}
                    mode="rotate"
                  />
                </div>
              )}

              {/* F. JPG -> PDF & PNG -> PDF SETTINGS */}
              {(tool.id === 'jpg-to-pdf' || tool.id === 'png-to-pdf') && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4" id="image-to-pdf-settings-card">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Page Size */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">Page Size</label>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(e.target.value as any)}
                        id="page-size-select"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white text-slate-800 outline-none focus:border-slate-900"
                      >
                        <option value="a4">A4 (Standard)</option>
                        <option value="original">Original Image Fit</option>
                        <option value="a5">A5</option>
                        <option value="letter">US Letter</option>
                        <option value="legal">US Legal</option>
                      </select>
                    </div>

                    {/* Orientation */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">Orientation</label>
                      <select
                        value={pageOrientation}
                        onChange={(e) => setPageOrientation(e.target.value as any)}
                        id="orientation-select"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white text-slate-800 outline-none focus:border-slate-900"
                      >
                        <option value="auto">Automatic (Image Aspect)</option>
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </div>

                    {/* Margins */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">Margins</label>
                      <select
                        value={pageMargin}
                        onChange={(e) => setPageMargin(e.target.value as any)}
                        id="margins-select"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white text-slate-800 outline-none focus:border-slate-900"
                      >
                        <option value="none">None (0 pt)</option>
                        <option value="small">Small (0.25 in)</option>
                        <option value="medium">Medium (0.5 in)</option>
                        <option value="large">Large (1.0 in)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* G. PDF -> JPG & PDF -> PNG SETTINGS */}
              {(tool.id === 'pdf-to-jpg' || tool.id === 'pdf-to-png') && primaryArrayBuffer && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4" id="pdf-to-images-settings-card">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="imageScope"
                          checked={imageConvertScope === 'all'}
                          onChange={() => setImageConvertScope('all')}
                          className="text-slate-900 focus:ring-slate-900"
                        />
                        <span>All pages</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="imageScope"
                          checked={imageConvertScope === 'selected'}
                          onChange={() => setImageConvertScope('selected')}
                          className="text-slate-900 focus:ring-slate-900"
                        />
                        <span>Selected pages</span>
                      </label>
                    </div>

                    {tool.id === 'pdf-to-jpg' ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-700">Quality:</span>
                        <select
                          value={jpgQuality}
                          onChange={(e) => setJpgQuality(e.target.value as any)}
                          id="jpg-quality-select"
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
                        >
                          <option value="standard">Standard (75%)</option>
                          <option value="high">High (85%)</option>
                          <option value="maximum">Maximum (95%)</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-700">Resolution:</span>
                        <select
                          value={pngDpi}
                          onChange={(e) => setPngDpi(parseInt(e.target.value, 10) as any)}
                          id="png-dpi-select"
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
                        >
                          <option value="72">72 DPI (Web)</option>
                          <option value="150">150 DPI (Balanced)</option>
                          <option value="300">300 DPI (High Res)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {imageConvertScope === 'selected' && (
                    <FilePreview
                      arrayBuffer={primaryArrayBuffer}
                      totalPages={totalPages}
                      selectedPages={selectedImagePages}
                      onTogglePage={handleToggleImagePage}
                      mode="select"
                    />
                  )}
                </div>
              )}

              {/* 3. Primary Process Execution Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={executeProcessing}
                  id="process-tool-btn"
                  className="w-full py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>
                    {tool.id === 'merge-pdf'
                      ? 'Merge PDF'
                      : tool.id === 'split-pdf'
                      ? 'Split PDF'
                      : tool.id === 'compress-pdf'
                      ? 'Compress PDF'
                      : tool.id === 'pdf-to-jpg'
                      ? 'Convert PDF to JPG'
                      : tool.id === 'jpg-to-pdf'
                      ? 'Convert JPG to PDF'
                      : tool.id === 'pdf-to-png'
                      ? 'Convert PDF to PNG'
                      : tool.id === 'png-to-pdf'
                      ? 'Convert PNG to PDF'
                      : tool.id === 'extract-pages'
                      ? 'Extract Pages'
                      : tool.id === 'delete-pages'
                      ? 'Delete Selected Pages'
                      : tool.id === 'rotate-pdf'
                      ? 'Rotate PDF'
                      : `Process with ${tool.name}`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
