import React from 'react';
import { Loader2, FileText, CheckCircle2 } from 'lucide-react';

interface ProcessingStatusProps {
  stage: 'uploading' | 'processing' | 'completed' | 'failed';
  customTitle?: string;
  customSubtitle?: string;
  progressPercent?: number; // Only if real progress is measured
  fileCount?: number;
  fileName?: string;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  stage,
  customTitle,
  customSubtitle,
  progressPercent,
  fileCount,
  fileName,
}) => {
  const isUploading = stage === 'uploading';
  const isProcessing = stage === 'processing';

  const defaultTitle = isUploading ? 'Uploading document...' : 'Processing your PDF...';
  const defaultSubtitle = isUploading
    ? 'Validating document signatures and uploading securely.'
    : 'Please keep this page open.';

  return (
    <div
      className="w-full max-w-xl mx-auto py-12 px-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col items-center text-center animate-fade-in"
      id="processing-status-card"
    >
      {/* Animated Spinner with PDF Icon Accent */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-slate-900 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <FileText className="w-6 h-6 text-slate-700 animate-pulse" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-2">
        {customTitle || defaultTitle}
      </h3>

      <p className="text-sm text-slate-500 max-w-sm mb-6">
        {customSubtitle || defaultSubtitle}
      </p>

      {/* Real measured progress bar if provided */}
      {typeof progressPercent === 'number' && progressPercent >= 0 && progressPercent <= 100 && (
        <div className="w-full max-w-xs mb-3">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-slate-900 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1 font-mono">
            <span>Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
        </div>
      )}

      {fileName && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 truncate max-w-md">
          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{fileName}</span>
          {fileCount && fileCount > 1 && (
            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold text-[10px]">
              +{fileCount - 1} more
            </span>
          )}
        </div>
      )}
    </div>
  );
};
