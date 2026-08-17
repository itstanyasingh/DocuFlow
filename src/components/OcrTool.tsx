import React, { useState } from 'react';
import { 
  ScanText, 
  Table as TableIcon, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  FileSpreadsheet, 
  ArrowLeft,
  FileText
} from 'lucide-react';
import { OcrResult, FileItem, ProcessedResult } from '../types';
import { UniversalDropzone } from './UniversalDropzone';
import { tableToXlsx } from '../lib/tableEngine';
import { performOcr } from '../lib/ocrEngine';
import confetti from 'canvas-confetti';

interface OcrToolProps {
  initialFile?: FileItem;
  onBackToHome?: () => void;
  onSaveToHistory?: (result: ProcessedResult) => void;
}

export const OcrTool: React.FC<OcrToolProps> = ({ initialFile, onBackToHome, onSaveToHistory }) => {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(initialFile || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState<string>('Initializing OCR...');
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'tables'>('text');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesSelected = (files: FileItem[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setOcrResult(null);
      setErrorMessage(null);
      setOcrProgress(0);
    }
  };

  const runOcr = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setOcrProgress(10);
    setProgressStatus('Loading document...');

    try {
      // Execute client-side OCR via Tesseract Engine with live progress
      const result = await performOcr(selectedFile.file, (prog, stat) => {
        setOcrProgress(prog);
        setProgressStatus(stat === 'recognizing text' ? `Recognizing text (${prog}%)` : stat);
      });

      setOcrResult(result);
      if (result.tables && result.tables.length > 0) {
        setActiveTab('tables');
      }
      confetti({ particleCount: 50, spread: 50 });

      if (onSaveToHistory) {
        const textBlob = new Blob([result.fullText || ''], { type: 'text/plain;charset=utf-8' });
        const blobUrl = URL.createObjectURL(textBlob);
        onSaveToHistory({
          id: 'ocr_' + Date.now(),
          toolId: 'ocr-image-to-text',
          toolName: 'OCR Text & Table Extractor',
          originalFileName: selectedFile.name,
          originalFileSize: selectedFile.size,
          outputFileName: `${selectedFile.name.replace(/\.[^/.]+$/, '')}_OCR.txt`,
          outputFileSize: textBlob.size,
          outputMimeType: 'text/plain',
          blobUrl,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    } catch (err: any) {
      console.error('OCR Error:', err);
      setErrorMessage(err.message || 'Error occurred during OCR recognition. Please verify the image or PDF format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyText = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTextFile = () => {
    if (!ocrResult || !selectedFile) return;
    const blob = new Blob([ocrResult.fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}_Extracted_Text.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTableExcel = (table: { headers: string[]; rows: string[][] }, idx: number) => {
    if (!selectedFile) return;
    const xlsxBytes = tableToXlsx(table.headers, table.rows, `Table_${idx + 1}`);
    const blob = new Blob([xlsxBytes as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}_Table_${idx + 1}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      
      {/* Back button */}
      {onBackToHome && (
        <div>
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tools</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          OCR & Document Text Scanner
        </h1>
        <p className="mt-2 text-base text-slate-600 max-w-xl mx-auto">
          Extract editable text and structured grid tables from scanned PDF documents, invoices, receipts, and images.
        </p>
      </div>

      {/* Upload Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Upload Document Image or Scanned PDF
          </label>
          <UniversalDropzone
            acceptedExtensions={['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.pdf']}
            maxSizeMb={30}
            multiple={false}
            onFilesSelected={handleFilesSelected}
            title="Drop image or scanned PDF here"
            subtitle="JPG, PNG, WEBP, or PDF up to 30 MB"
          />
        </div>

        {selectedFile && (
          <div className="pt-2 space-y-3">
            {isProcessing && (
              <div className="space-y-1.5 p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex items-center justify-between text-xs font-medium text-blue-900">
                  <span>{progressStatus}</span>
                  <span>{ocrProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${Math.max(5, ocrProgress)}%` }} 
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                id="execute-ocr-btn"
                type="button"
                onClick={runOcr}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg shadow-xs transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing OCR Recognition...</span>
                  </>
                ) : (
                  <>
                    <ScanText className="w-4 h-4" />
                    <span>Extract Text & Tables</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {errorMessage}
          </div>
        )}
      </div>

      {/* OCR Results */}
      {ocrResult && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Metadata Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-800">Confidence: {(ocrResult.confidenceScore * 100).toFixed(0)}%</span>
              </div>
              <div className="text-slate-500">
                Language: <span className="font-semibold text-slate-800 uppercase">{ocrResult.language || 'EN'}</span>
              </div>
              <div className="text-slate-500">
                Word Count: <span className="font-semibold text-slate-800">{ocrResult.wordCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activeTab === 'text' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
                  }`}
                >
                  Extracted Text
                </button>
                {ocrResult.tables && ocrResult.tables.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('tables')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                      activeTab === 'tables' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    <TableIcon className="w-3 h-3 text-blue-600" />
                    <span>Tables ({ocrResult.tables.length})</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => copyText(ocrResult.fullText)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={downloadTextFile}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export TXT</span>
              </button>
            </div>
          </div>

          {/* Text Tab */}
          {activeTab === 'text' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg max-h-[500px] overflow-y-auto">
                <p className="text-xs sm:text-sm text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                  {ocrResult.fullText}
                </p>
              </div>
            </div>
          )}

          {/* Tables Tab */}
          {activeTab === 'tables' && ocrResult.tables && (
            <div className="space-y-4">
              {ocrResult.tables.map((table, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <TableIcon className="w-4 h-4 text-blue-600" />
                      <span>{table.title || `Detected Table #${idx + 1}`}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => downloadTableExcel(table, idx)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Export to Excel (XLSX)</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          {table.headers.map((h, hIdx) => (
                            <th key={hIdx} className="p-2.5 font-bold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {table.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2.5 text-slate-800">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* How to use OCR */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          How to extract text with OCR
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-white border border-slate-200/80 rounded-xl">
            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center mb-2">1</span>
            <h3 className="font-semibold text-slate-900 text-xs mb-1">Upload scanned document</h3>
            <p className="text-xs text-slate-500">Select or drop your image (JPG, PNG) or scanned PDF.</p>
          </div>
          <div className="p-4 bg-white border border-slate-200/80 rounded-xl">
            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center mb-2">2</span>
            <h3 className="font-semibold text-slate-900 text-xs mb-1">OCR character recognition</h3>
            <p className="text-xs text-slate-500">DocuFlow scans text, headers, and structured tables.</p>
          </div>
          <div className="p-4 bg-white border border-slate-200/80 rounded-xl">
            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center mb-2">3</span>
            <h3 className="font-semibold text-slate-900 text-xs mb-1">Export TXT or Excel</h3>
            <p className="text-xs text-slate-500">Copy text to clipboard or download TXT and XLSX files.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
