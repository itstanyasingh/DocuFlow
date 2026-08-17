import React from 'react';
import { FileText, Image as ImageIcon, Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { FileItem } from '../../types';

interface FileListProps {
  files: FileItem[];
  pageCounts?: Record<string, number>;
  onRemoveFile: (id: string) => void;
  onReorderFiles: (newFiles: FileItem[]) => void;
  onAddMoreFiles?: () => void;
  disabled?: boolean;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  pageCounts = {},
  onRemoveFile,
  onReorderFiles,
  onAddMoreFiles,
  disabled = false,
}) => {
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes < 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (disabled) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;

    const updated = [...files];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onReorderFiles(updated);
  };

  return (
    <div className="w-full space-y-3" id="file-list-container">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
        <span>Files ({files.length})</span>
        <span className="normal-case text-slate-400">Reorder with arrows or drag</span>
      </div>

      <div className="space-y-2">
        {files.map((file, index) => {
          const numStr = (index + 1).toString().padStart(2, '0');
          const isPdf = file.name.toLowerCase().endsWith('.pdf');
          const pageCount = pageCounts[file.id];

          return (
            <div
              key={file.id}
              id={`file-item-${file.id}`}
              className="group flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all gap-3"
            >
              {/* Order index + icon + name */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="font-mono text-xs font-bold text-slate-400 shrink-0 w-6">
                  {numStr}
                </span>

                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                  {isPdf ? (
                    <FileText className="w-4 h-4 text-red-600" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-800 truncate" title={file.name}>
                    {file.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                    <span>{formatBytes(file.size)}</span>
                    {typeof pageCount === 'number' && pageCount > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-slate-700 font-medium">
                          {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Controls: Move Up / Down & Remove */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  onClick={() => moveItem(index, 'up')}
                  id={`move-up-file-${file.id}`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Move up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={disabled || index === files.length - 1}
                  onClick={() => moveItem(index, 'down')}
                  id={`move-down-file-${file.id}`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Move down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRemoveFile(file.id)}
                  id={`remove-file-${file.id}`}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {onAddMoreFiles && (
        <button
          type="button"
          disabled={disabled}
          onClick={onAddMoreFiles}
          id="add-more-files-btn"
          className="w-full py-2.5 px-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/60 hover:bg-slate-100 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add more files
        </button>
      )}
    </div>
  );
};
