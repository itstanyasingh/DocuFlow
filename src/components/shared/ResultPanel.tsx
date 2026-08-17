import React, { useEffect } from 'react';
import { CheckCircle2, FileText, Download, RotateCcw, Share2, Copy, Check, ArrowRight } from 'lucide-react';
import { ProcessedResult } from '../../types';
import { DownloadButton } from './DownloadButton';
import confetti from 'canvas-confetti';

interface ResultPanelProps {
  result: ProcessedResult;
  onReset: () => void;
  title?: string;
  resetButtonLabel?: string;
  className?: string;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  result,
  onReset,
  title,
  resetButtonLabel = 'Process another file',
  className = '',
}) => {
  const [copiedLink, setCopiedLink] = React.useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 36,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#0f172a', '#2563eb', '#10b981'],
        disableForReducedMotion: true,
      });
    } catch (_) {}
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes < 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const isCompressed =
    result.originalFileSize > 0 &&
    result.outputFileSize > 0 &&
    result.originalFileSize > result.outputFileSize;

  const reductionPercent =
    result.originalFileSize > 0
      ? (
          ((result.originalFileSize - result.outputFileSize) /
            result.originalFileSize) *
          100
        ).toFixed(1)
      : '0.0';

  const handleCopyLink = () => {
    if (result.blobUrl) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const isZip = result.outputFileName.toLowerCase().endsWith('.zip');
  const defaultHeading = isZip ? '✓ Your ZIP archive is ready' : '✓ Your file is ready';

  return (
    <div
      className={`w-full max-w-xl mx-auto py-10 px-6 sm:px-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col items-center text-center animate-fade-in ${className}`}
      id="processing-result-panel"
    >
      {/* Success Badge */}
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 border border-emerald-100/80">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
        {title || defaultHeading}
      </h3>

      <p className="text-sm text-slate-500 mb-6">
        The document was processed using DocuFlow's deterministic engine.
      </p>

      {/* Main File Information Box */}
      <div className="w-full rounded-xl bg-slate-50 border border-slate-200/80 p-4 mb-6 text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <FileText className="w-5 h-5 text-slate-800" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-slate-900 truncate" title={result.outputFileName}>
              {result.outputFileName}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
              <span>{formatBytes(result.outputFileSize)}</span>
              <span>•</span>
              <span className="uppercase text-[10px] bg-slate-200/70 text-slate-700 font-semibold px-1.5 py-0.5 rounded">
                {result.outputMimeType.split('/')[1] || 'PDF'}
              </span>
            </div>
          </div>
        </div>

        {/* Compression Statistics Breakdown if available */}
        {isCompressed && (
          <div className="mt-4 pt-3 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-white border border-slate-100">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Original</div>
              <div className="text-xs font-mono font-semibold text-slate-700 mt-0.5">
                {formatBytes(result.originalFileSize)}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-white border border-slate-100">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Compressed</div>
              <div className="text-xs font-mono font-semibold text-slate-900 mt-0.5">
                {formatBytes(result.outputFileSize)}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
              <div className="text-[11px] uppercase tracking-wider text-emerald-600 font-bold">Reduction</div>
              <div className="text-xs font-mono font-bold text-emerald-700 mt-0.5">
                {reductionPercent}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Primary Actions */}
      <div className="w-full flex flex-col sm:flex-row items-center gap-3 justify-center mb-4">
        <DownloadButton
          href={result.blobUrl}
          downloadName={result.outputFileName}
          label={isZip ? 'Download ZIP' : 'Download File'}
          size="lg"
          variant="primary"
          className="w-full sm:w-auto"
        />

        <button
          type="button"
          onClick={onReset}
          id="process-another-file-btn"
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-sm font-semibold transition-all inline-flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          {resetButtonLabel}
        </button>
      </div>

      {/* Direct preview action if it's a PDF */}
      {result.blobUrl && result.outputMimeType.includes('pdf') && (
        <a
          href={result.blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          id="preview-pdf-newtab-link"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors pt-2"
        >
          <span>Open PDF in new tab</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
};
