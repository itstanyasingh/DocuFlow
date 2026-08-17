import React, { useEffect, useState } from 'react';
import { Check, RotateCw, FileText, CheckSquare, Square, Eye } from 'lucide-react';
import { renderPdfPages, RenderedPdfPage } from '../../lib/pdfjsHelper';

interface FilePreviewProps {
  arrayBuffer?: ArrayBuffer;
  totalPages?: number;
  selectedPages: number[]; // 1-indexed
  onTogglePage: (pageNumber: number) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onInvertSelection?: () => void;
  pageRotations?: Record<number, number>; // pageNumber -> degrees
  onRotateSinglePage?: (pageNumber: number) => void;
  mode?: 'select' | 'delete' | 'rotate' | 'view';
  disabled?: boolean;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  arrayBuffer,
  totalPages = 1,
  selectedPages,
  onTogglePage,
  onSelectAll,
  onDeselectAll,
  onInvertSelection,
  pageRotations = {},
  onRotateSinglePage,
  mode = 'select',
  disabled = false,
}) => {
  const [renderedPages, setRenderedPages] = useState<RenderedPdfPage[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    if (!arrayBuffer) {
      setRenderedPages([]);
      return;
    }

    const loadThumbnails = async () => {
      try {
        setLoadingThumbnails(true);
        // Render at lightweight thumbnail scale (0.5)
        const pages = await renderPdfPages(arrayBuffer, { scale: 0.5, quality: 0.8 });
        if (!isCancelled) {
          setRenderedPages(pages);
        }
      } catch (err) {
        console.warn('PDF thumbnail rendering failed, using fallback cards:', err);
      } finally {
        if (!isCancelled) setLoadingThumbnails(false);
      }
    };

    loadThumbnails();

    return () => {
      isCancelled = true;
    };
  }, [arrayBuffer]);

  const count = renderedPages.length > 0 ? renderedPages.length : totalPages;
  const pageNumbers = Array.from({ length: Math.max(1, count) }, (_, i) => i + 1);

  return (
    <div className="w-full space-y-4" id="pdf-page-preview-system">
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 text-xs text-slate-600">
        <div className="flex items-center gap-2 font-medium">
          <span>
            {mode === 'delete'
              ? 'Click pages to mark for deletion'
              : mode === 'rotate'
              ? 'Click pages to rotate'
              : 'Select pages to include'}
          </span>
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono font-semibold">
            {selectedPages.length} of {count} selected
          </span>
        </div>

        {/* Selection quick actions */}
        <div className="flex items-center gap-1.5">
          {onSelectAll && (
            <button
              type="button"
              disabled={disabled}
              onClick={onSelectAll}
              id="select-all-pages-btn"
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              Select All
            </button>
          )}
          {onDeselectAll && (
            <button
              type="button"
              disabled={disabled}
              onClick={onDeselectAll}
              id="deselect-all-pages-btn"
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              Clear
            </button>
          )}
          {onInvertSelection && (
            <button
              type="button"
              disabled={disabled}
              onClick={onInvertSelection}
              id="invert-selection-btn"
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              Invert
            </button>
          )}
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 p-1 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
        {pageNumbers.map((pageNum) => {
          const isSelected = selectedPages.includes(pageNum);
          const rotation = pageRotations[pageNum] || 0;
          const rendered = renderedPages[pageNum - 1];

          let borderClass = 'border-slate-200 hover:border-slate-400 bg-white';
          if (isSelected) {
            if (mode === 'delete') {
              borderClass = 'border-red-500 ring-2 ring-red-500/20 bg-red-50/40';
            } else {
              borderClass = 'border-slate-900 ring-2 ring-slate-900/15 bg-slate-50';
            }
          }

          return (
            <div
              key={pageNum}
              id={`page-card-${pageNum}`}
              onClick={() => !disabled && onTogglePage(pageNum)}
              className={`group relative flex flex-col rounded-xl border p-2 cursor-pointer transition-all duration-150 shadow-xs select-none ${borderClass} ${
                disabled ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {/* Header: Checkbox & Page Label */}
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[11px] font-mono font-bold text-slate-600">
                  Page {pageNum}
                </span>

                <div
                  className={`w-4 h-4 rounded flex items-center justify-center text-[10px] transition-colors ${
                    isSelected
                      ? mode === 'delete'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-900 text-white'
                      : 'border border-slate-300 bg-white text-transparent group-hover:border-slate-400'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              {/* Page Thumbnail Canvas / Box */}
              <div className="relative aspect-[3/4] w-full rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200/60">
                {rendered?.dataUrl ? (
                  <img
                    src={rendered.dataUrl}
                    alt={`Page ${pageNum}`}
                    className="w-full h-full object-contain transition-transform duration-200"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center transition-transform duration-200"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    <FileText className="w-8 h-8 mb-1 text-slate-300 stroke-[1.5]" />
                    <span className="text-[10px] font-mono text-slate-400">P. {pageNum}</span>
                  </div>
                )}

                {/* Single Page Rotate Quick Action */}
                {mode === 'rotate' && onRotateSinglePage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRotateSinglePage(pageNum);
                    }}
                    id={`rotate-btn-page-${pageNum}`}
                    className="absolute bottom-1.5 right-1.5 p-1 rounded-md bg-white/90 hover:bg-white text-slate-800 shadow-sm border border-slate-200 transition-all active:scale-95"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Rotation degree badge */}
                {rotation > 0 && (
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-mono font-semibold">
                    {rotation}°
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
