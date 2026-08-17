import React, { useState } from 'react';
import { 
  Clock, 
  Download, 
  Trash2, 
  FileText, 
  Star, 
  Search, 
  HardDrive, 
  ArrowRight, 
  Layers,
  Filter
} from 'lucide-react';
import { ProcessedResult, ToolDefinition } from '../types';
import { TOOLS } from '../data/tools';

interface DashboardViewProps {
  history: ProcessedResult[];
  favorites: string[];
  onToggleFavorite: (toolId: string) => void;
  onSelectTool: (tool: ToolDefinition) => void;
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  history,
  favorites,
  onToggleFavorite,
  onSelectTool,
  onClearHistory,
  onDeleteHistoryItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTool, setFilterTool] = useState<string>('all');

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.outputFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.toolName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterTool === 'all' || item.toolId === filterTool;
    return matchesSearch && matchesFilter;
  });

  const totalBytesProcessed = history.reduce((acc, h) => acc + (h.outputFileSize || 0), 0);
  const favoriteTools = TOOLS.filter(t => favorites.includes(t.id));

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleDownload = (item: ProcessedResult) => {
    if (item.blobUrl) {
      const a = document.createElement('a');
      a.href = item.blobUrl;
      a.download = item.outputFileName;
      a.click();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Workspace Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Recent File History & Assets</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Access, download, or re-process all your recently converted, optimized, and managed documents.
          </p>
        </div>

        {/* Storage Widget */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-[240px] space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600 font-semibold">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              <span>Processed Volume</span>
            </span>
            <span className="text-slate-900 font-bold">{formatBytes(totalBytesProcessed)}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '8%' }} />
          </div>
          <p className="text-[10px] text-slate-400">Files automatically expire after 24h for security.</p>
        </div>
      </div>

      {/* Favorite Tools Quick Launcher */}
      {favoriteTools.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Starred Tools ({favoriteTools.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {favoriteTools.map(tool => (
              <button
                key={tool.id}
                onClick={() => onSelectTool(tool)}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-600 hover:bg-slate-50 text-left transition-all group flex items-start justify-between cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600">{tool.name}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{tool.shortDescription || tool.description}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* History Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        
        {/* Table Filters Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search history by name or tool..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                Clear History
              </button>
            )}
          </div>
        </div>

        {/* History Records */}
        {filteredHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Output Document</th>
                  <th className="p-3">Tool Pipeline</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Processed</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 truncate max-w-xs">{item.outputFileName}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-xs">Src: {item.originalFileName}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                        {item.toolName}
                      </span>
                    </td>

                    <td className="p-3 font-mono text-slate-600">
                      {formatBytes(item.outputFileSize)}
                    </td>

                    <td className="p-3 text-slate-500">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.blobUrl && (
                          <button
                            type="button"
                            onClick={() => handleDownload(item)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteHistoryItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No recent processed files</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Documents you process using any tool will appear here with instant download links.
            </p>
          </div>
        )}

      </div>

    </div>
  );
};
