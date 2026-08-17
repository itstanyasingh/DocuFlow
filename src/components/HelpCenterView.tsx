import React, { useState } from 'react';
import { Search, HelpCircle, FileText, Lock, Shield, ArrowRight } from 'lucide-react';

interface HelpCenterViewProps {
  onBackToHome: () => void;
}

export const HelpCenterView: React.FC<HelpCenterViewProps> = ({ onBackToHome }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const helpArticles = [
    {
      category: 'Getting Started',
      articles: [
        { title: 'How to use DocuFlow tools', desc: 'Step-by-step guide to uploading, processing, and downloading your files instantly.' },
        { title: 'Keyboard shortcuts & Quick Search (⌘K)', desc: 'Instantly find any tool across the entire catalog using command palette search.' },
      ]
    },
    {
      category: 'PDF Tools',
      articles: [
        { title: 'How to convert PDF to Word without losing formatting', desc: 'Preserve tables, paragraphs, and styles when converting PDFs.' },
        { title: 'Merging and reordering PDF pages', desc: 'Combine multiple PDF documents into a single organized file with drag-and-drop.' },
        { title: 'Compressing large PDF files', desc: 'Reduce PDF file size while maintaining high visual quality.' },
      ]
    },
    {
      category: 'Security & Privacy',
      articles: [
        { title: 'Are my uploaded files secure?', desc: 'All files are processed with strict privacy standards and automatically deleted after processing.' },
        { title: 'Data retention policy', desc: 'We never store, retain, or share your personal documents or data.' },
      ]
    },
  ];

  const filteredArticles = helpArticles.map(cat => ({
    ...cat,
    articles: cat.articles.filter(a => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.desc.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.articles.length > 0);

  return (
    <div className="min-h-screen bg-[#fcfcfb] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header & Search */}
        <div className="text-center space-y-4 border-b border-slate-200 pb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            DocuFlow Help Center
          </h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Find answers to common questions about document conversion, PDF management, and file security.
          </p>

          <div className="max-w-md mx-auto relative pt-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 translate-y-0.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help articles..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>
        </div>

        {/* Categories & Articles */}
        <div className="space-y-8">
          {filteredArticles.map((cat) => (
            <div key={cat.category} className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{cat.category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cat.articles.map((art) => (
                  <div key={art.title} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-colors">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">{art.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">{art.desc}</p>
                    <span className="text-xs font-semibold text-blue-600 inline-flex items-center gap-1 cursor-pointer hover:underline">
                      Read guide <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 text-center border-t border-slate-200">
          <button
            onClick={onBackToHome}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
          >
            Back to Tools
          </button>
        </div>

      </div>
    </div>
  );
};
