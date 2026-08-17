import React from 'react';
import { Star, Clock, ArrowRight, FileText } from 'lucide-react';
import { ToolDefinition } from '../types';
import { TOOLS } from '../data/tools';
import { renderToolIcon } from './HomeView';

interface MyToolsViewProps {
  favorites: string[];
  onToggleFavorite: (toolId: string) => void;
  onSelectTool: (tool: ToolDefinition) => void;
  onBackToHome: () => void;
}

export const MyToolsView: React.FC<MyToolsViewProps> = ({
  favorites,
  onToggleFavorite,
  onSelectTool,
  onBackToHome,
}) => {
  const favoriteTools = TOOLS.filter(t => favorites.includes(t.id));
  
  // Get recently used or top tools for display
  const recentlyUsedTools = TOOLS.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#fcfcfb] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Tools
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Quickly access your starred favorite tools and recently used workflows.
            </p>
          </div>
          <button
            onClick={onBackToHome}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            Explore All Tools
          </button>
        </div>

        {/* Favorites Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h2 className="text-base font-bold text-slate-900">Favorite Tools ({favoriteTools.length})</h2>
          </div>

          {favoriteTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {favoriteTools.map(tool => (
                <div
                  key={tool.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {renderToolIcon(tool.icon, "w-5 h-5")}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(tool.id);
                        }}
                        className="text-amber-500 hover:text-amber-600 p-1 cursor-pointer"
                        title="Remove from favorites"
                      >
                        <Star className="w-4 h-4 fill-amber-500" />
                      </button>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {tool.shortDescription}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {tool.majorCategory}
                    </span>
                    <button
                      onClick={() => onSelectTool(tool)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      Use tool →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 text-xs">
              No favorite tools yet. Click the star icon on any tool card to add it to your favorites.
            </div>
          )}
        </div>

        {/* Recently Used Section */}
        <div className="space-y-4 pt-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">Recently Used</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recentlyUsedTools.map(tool => (
              <div
                key={tool.id}
                onClick={() => onSelectTool(tool)}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all cursor-pointer flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  {renderToolIcon(tool.icon, "w-4 h-4")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">{tool.name}</div>
                  <div className="text-[11px] text-slate-400">Used recently</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
