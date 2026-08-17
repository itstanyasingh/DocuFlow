import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Download, 
  ArrowLeft,
  FileCheck,
  Shield,
  FileSearch,
  Archive,
  Layers,
  FileText,
  AlertCircle
} from 'lucide-react';
import { ToolDefinition, ProcessedResult, FileItem } from '../types';
import { UniversalDropzone } from './UniversalDropzone';
import { 
  createZipArchive, 
  extractZipArchive, 
  generateFileHashes, 
  detectFileSignature, 
  checkDuplicateFiles,
  FileHashResult,
  FileTypeSignature,
  ExtractedZipItem
} from '../lib/fileUtilitiesEngine';

interface FileUtilitiesViewProps {
  tool: ToolDefinition;
  onBackToHome: () => void;
  onSaveToHistory: (result: ProcessedResult) => void;
}

export const FileUtilitiesView: React.FC<FileUtilitiesViewProps> = ({
  tool,
  onBackToHome,
  onSaveToHistory,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // States for outputs
  const [hashResult, setHashResult] = useState<FileHashResult | null>(null);
  const [signatureResult, setSignatureResult] = useState<FileTypeSignature | null>(null);
  const [extractedFiles, setExtractedFiles] = useState<ExtractedZipItem[]>([]);
  const [createdZipBlob, setCreatedZipBlob] = useState<Blob | null>(null);
  const [createdZipName, setCreatedZipName] = useState<string>('Archive.zip');
  const [duplicateReport, setDuplicateReport] = useState<{
    duplicates: { hash: string; files: string[]; sizeBytes: number }[];
    uniqueCount: number;
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes < 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFilesSelected = async (files: FileItem[]) => {
    setSelectedFiles(files);
    if (files.length === 0) return;

    setProcessing(true);
    try {
      if (tool.id === 'hash-generator') {
        const hashes = await generateFileHashes(files[0].file);
        setHashResult(hashes);
      } else if (tool.id === 'file-type-detector' || tool.id === 'file-type-checker' || tool.id === 'file-metadata-viewer' || tool.id === 'file-size-analyzer') {
        const sig = await detectFileSignature(files[0].file);
        setSignatureResult(sig);
      } else if (tool.id === 'zip-extractor') {
        const items = await extractZipArchive(files[0].file);
        setExtractedFiles(items);
      } else if (tool.id === 'zip-creator' || tool.id === 'file-compressor') {
        const zipBlob = await createZipArchive(
          files.map(f => ({ name: f.name, fileOrBuffer: f.file }))
        );
        setCreatedZipBlob(zipBlob);
        setCreatedZipName(`Archive_${files.length}_Files.zip`);
      } else if (tool.id === 'duplicate-checker' || tool.id === 'duplicate-file-checker') {
        const rawFiles = files.map(f => f.file);
        const report = await checkDuplicateFiles(rawFiles);
        setDuplicateReport(report);
      } else if (tool.id === 'file-renamer' || tool.id === 'multiple-file-renamer') {
        const zipBlob = await createZipArchive(
          files.map((f, idx) => ({ name: `file_${idx + 1}_${f.name}`, fileOrBuffer: f.file }))
        );
        setCreatedZipBlob(zipBlob);
        setCreatedZipName(`Renamed_${files.length}_Files.zip`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const downloadExtractedFile = (item: ExtractedZipItem) => {
    const url = URL.createObjectURL(item.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadCreatedZip = () => {
    if (!createdZipBlob) return;
    const url = URL.createObjectURL(createdZipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = createdZipName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-6 font-sans">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all tools</span>
        </button>
      </div>

      {/* Tool Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {tool.name}
        </h1>
        <p className="mt-2 text-base text-slate-600 max-w-xl mx-auto">
          {tool.shortDescription}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Upload dropzone */}
        <UniversalDropzone
          acceptedExtensions={tool.acceptedExtensions}
          maxSizeMb={tool.maxSizeMb}
          multiple={tool.id === 'zip-creator' || tool.id === 'duplicate-checker'}
          onFilesSelected={handleFilesSelected}
        />

        {processing && (
          <div className="py-8 text-center text-sm text-slate-500 font-medium animate-pulse">
            Analyzing file structure and computing checksums...
          </div>
        )}

        {/* 1. Hash Generator Results */}
        {hashResult && !processing && tool.id === 'hash-generator' && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Cryptographic Hashes for: {hashResult.fileName} ({formatBytes(hashResult.fileSizeBytes)})
              </span>
            </div>

            <div className="space-y-3">
              {[
                { label: 'SHA-256 (Recommended)', val: hashResult.sha256, key: 'sha256' },
                { label: 'SHA-512 (High Security)', val: hashResult.sha512, key: 'sha512' },
                { label: 'SHA-1 (Legacy Integrity)', val: hashResult.sha1, key: 'sha1' },
                { label: 'MD5 (Checksum)', val: hashResult.md5, key: 'md5' },
              ].map((h) => (
                <div key={h.key} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{h.label}</span>
                    <button
                      type="button"
                      onClick={() => copyText(h.val, h.key)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
                    >
                      {copiedKey === h.key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === h.key ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs text-slate-800 break-all select-all">
                    {h.val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. File Type & Signature Detector */}
        {signatureResult && !processing && tool.id === 'file-type-detector' && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              File Binary Signature Analysis
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <span className="text-xs text-slate-500 font-semibold uppercase">Detected Format</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{signatureResult.description}</p>
                <p className="text-xs text-slate-600 font-mono mt-0.5">MIME: {signatureResult.mime}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <span className="text-xs text-slate-500 font-semibold uppercase">Magic Bytes (Hex Header)</span>
                <p className="text-sm font-mono font-bold text-slate-900 mt-1">{signatureResult.magicHex}</p>
                <p className="text-xs text-emerald-700 font-medium mt-0.5">Verified Binary Header</p>
              </div>
            </div>
          </div>
        )}

        {/* 3. ZIP Creator Result */}
        {createdZipBlob && !processing && tool.id === 'zip-creator' && (
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 p-4 rounded-xl border">
            <div>
              <p className="text-sm font-bold text-slate-900">{createdZipName}</p>
              <p className="text-xs text-slate-500">{formatBytes(createdZipBlob.size)} • Compressed archive ready</p>
            </div>
            <button
              type="button"
              onClick={downloadCreatedZip}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download ZIP</span>
            </button>
          </div>
        )}

        {/* 4. ZIP Extractor Result */}
        {extractedFiles.length > 0 && !processing && tool.id === 'zip-extractor' && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Extracted Files ({extractedFiles.length})
              </span>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              {extractedFiles.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between hover:bg-white transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-800 truncate">{item.name}</span>
                    <span className="text-[11px] text-slate-400">({formatBytes(item.size)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadExtractedFile(item)}
                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md cursor-pointer"
                    title="Download this file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Duplicate File Checker Result */}
        {duplicateReport && !processing && tool.id === 'duplicate-checker' && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Duplicate Check Results ({duplicateReport.uniqueCount} Unique Hashes)
            </h3>

            {duplicateReport.duplicates.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>All uploaded files are distinct! No duplicate SHA-256 hashes found.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {duplicateReport.duplicates.map((dup, i) => (
                  <div key={i} className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1.5">
                    <div className="font-bold text-amber-900">Duplicate Group #{i + 1} ({formatBytes(dup.sizeBytes)})</div>
                    <ul className="list-disc list-inside text-amber-800 font-mono text-[11px]">
                      {dup.files.map((name, idx) => (
                        <li key={idx}>{name}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
