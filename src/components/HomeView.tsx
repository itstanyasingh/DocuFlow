import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowRight,
  Shield,
  Zap,
  Lock,
  Star,
  FileText,
  FileEdit,
  Split,
  RotateCw,
  Image as ImageIcon,
  Trash2,
  Table,
  FileCheck,
  Combine,
  ListOrdered,
  Layers,
  Minimize2,
  Wrench,
  ScanText,
  FileSpreadsheet,
  Binary,
  Shrink,
  Scaling,
  Crop,
  Copy,
  FileX,
  Type,
  ImageDown,
  SearchCheck,
  FileSearch,
  FileCode,
  TableProperties,
  QrCode,
  Key,
  Hash,
  ArrowLeftRight,
  Archive,
  FolderArchive,
  FileSignature,
  Stamp,
  ShieldCheck,
  EyeOff,
  Eye,
  FileDigit,
  FileOutput,
  CaseSensitive,
  Space,
  AlignLeft,
  Scissors,
  Database,
  ArrowDown
} from 'lucide-react';
import { ToolDefinition, FileItem } from '../types';
import { TOOLS, CATEGORIES_LIST } from '../data/tools';
import { MainNavTab } from './Navbar';

interface HomeViewProps {
  activeTab: MainNavTab;
  onSelectTool: (tool: ToolDefinition, initialFile?: FileItem) => void;
  openSearch: () => void;
  favorites: string[];
  onToggleFavorite: (toolId: string) => void;
}

// Icon mapping helper
export const renderToolIcon = (iconName: string, className = "w-5 h-5") => {
  switch (iconName) {
    case 'FileText': return <FileText className={className} />;
    case 'FileEdit': return <FileEdit className={className} />;
    case 'Split': return <Split className={className} />;
    case 'RotateCw': return <RotateCw className={className} />;
    case 'Image': return <ImageIcon className={className} />;
    case 'Trash2': return <Trash2 className={className} />;
    case 'Table': return <Table className={className} />;
    case 'FileCheck': return <FileCheck className={className} />;
    case 'Combine': return <Combine className={className} />;
    case 'ListOrdered': return <ListOrdered className={className} />;
    case 'Layers': return <Layers className={className} />;
    case 'Minimize2': return <Minimize2 className={className} />;
    case 'Wrench': return <Wrench className={className} />;
    case 'Lock': return <Lock className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'ScanText': return <ScanText className={className} />;
    case 'FileSpreadsheet': return <FileSpreadsheet className={className} />;
    case 'Binary': return <Binary className={className} />;
    case 'Shrink': return <Shrink className={className} />;
    case 'Scaling': return <Scaling className={className} />;
    case 'Crop': return <Crop className={className} />;
    case 'Copy': return <Copy className={className} />;
    case 'FileX': return <FileX className={className} />;
    case 'Type': return <Type className={className} />;
    case 'ImageDown': return <ImageDown className={className} />;
    case 'SearchCheck': return <SearchCheck className={className} />;
    case 'FileSearch': return <FileSearch className={className} />;
    case 'FileCode': return <FileCode className={className} />;
    case 'TableProperties': return <TableProperties className={className} />;
    case 'QrCode': return <QrCode className={className} />;
    case 'Key': return <Key className={className} />;
    case 'Hash': return <Hash className={className} />;
    case 'ArrowLeftRight': return <ArrowLeftRight className={className} />;
    case 'Archive': return <Archive className={className} />;
    case 'FolderArchive': return <FolderArchive className={className} />;
    case 'FileSignature': return <FileSignature className={className} />;
    case 'Stamp': return <Stamp className={className} />;
    case 'ShieldCheck': return <ShieldCheck className={className} />;
    case 'EyeOff': return <EyeOff className={className} />;
    case 'Eye': return <Eye className={className} />;
    case 'FileDigit': return <FileDigit className={className} />;
    case 'FileOutput': return <FileOutput className={className} />;
    case 'CaseSensitive': return <CaseSensitive className={className} />;
    case 'Space': return <Space className={className} />;
    case 'AlignLeft': return <AlignLeft className={className} />;
    case 'Scissors': return <Scissors className={className} />;
    case 'Database': return <Database className={className} />;
    default: return <FileText className={className} />;
  }
};

export const HomeView: React.FC<HomeViewProps> = ({
  activeTab,
  onSelectTool,
  openSearch,
  favorites,
  onToggleFavorite,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (activeTab === 'pdf') return 'pdf';
    if (activeTab === 'documents') return 'documents';
    if (activeTab === 'images') return 'images';
    if (activeTab === 'ocr') return 'ocr';
    if (activeTab === 'text-data') return 'text-tools';
    if (activeTab === 'file-utilities') return 'file-utilities';
    return 'all';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubcategoryFilter, setActiveSubcategoryFilter] = useState<string>('all');

  // Synchronize category selection when main nav tab changes
  React.useEffect(() => {
    if (activeTab === 'pdf') { setSelectedCategory('pdf'); setActiveSubcategoryFilter('all'); }
    else if (activeTab === 'documents') { setSelectedCategory('documents'); setActiveSubcategoryFilter('all'); }
    else if (activeTab === 'images') { setSelectedCategory('images'); setActiveSubcategoryFilter('all'); }
    else if (activeTab === 'ocr') { setSelectedCategory('ocr'); setActiveSubcategoryFilter('all'); }
    else if (activeTab === 'text-data') { setSelectedCategory('text-tools'); setActiveSubcategoryFilter('all'); }
    else if (activeTab === 'file-utilities') { setSelectedCategory('file-utilities'); setActiveSubcategoryFilter('all'); }
    else if (activeTab === 'all') { setSelectedCategory('all'); setActiveSubcategoryFilter('all'); }
  }, [activeTab]);

  // Top 12 Popular tools
  const popularToolIds = [
    'merge-pdf',
    'split-pdf',
    'extract-pdf-pages',
    'pdf-to-jpg',
    'jpg-to-pdf',
    'compress-image',
    'resize-image',
    'convert-image',
    'docx-preview',
    'excel-viewer',
    'word-counter',
    'json-formatter',
  ];
  const popularTools = useMemo(() => {
    return popularToolIds.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) as ToolDefinition[];
  }, []);

  // Filtered tools based on search and category
  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = q === '' || 
        tool.name.toLowerCase().includes(q) ||
        (tool.shortDescription || '').toLowerCase().includes(q) ||
        (tool.fromFormat || '').toLowerCase().includes(q) ||
        (tool.toFormat || '').toLowerCase().includes(q) ||
        tool.tags.some(t => t.toLowerCase().includes(q));

      let matchesCategory = selectedCategory === 'all' || tool.majorCategory === selectedCategory;
      if (selectedCategory === 'text-data') {
        matchesCategory = tool.majorCategory === 'text-tools' || tool.majorCategory === 'data-tools';
      }

      let matchesSubcategory = activeSubcategoryFilter === 'all' || tool.subcategory === activeSubcategoryFilter;

      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [searchQuery, selectedCategory, activeSubcategoryFilter]);

  // Group tools by category and subcategory for directory view
  const categoryGroups = useMemo(() => {
    return CATEGORIES_LIST.map((cat) => {
      const catTools = TOOLS.filter((t) => t.majorCategory === cat.majorCategory);
      
      // Extract subcategories
      const subcategories = Array.from(new Set(catTools.map((t) => t.subcategory || 'general')));

      return {
        ...cat,
        toolsCount: catTools.length,
        tools: catTools,
        subcategories: subcategories.map((sub) => ({
          name: sub,
          tools: catTools.filter((t) => (t.subcategory || 'general') === sub),
        })),
      };
    });
  }, []);

  const currentCategoryInfo = useMemo(() => {
    return CATEGORIES_LIST.find((c) => c.id === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="w-full font-sans bg-[#fcfcfb]">
      
      {/* 1. Hero Section */}
      <section className="border-b border-slate-200 bg-white py-10 sm:py-12 text-center">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl mx-auto">
            Work with any file, all in one place.
          </h1>
          
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Convert, organize, edit, compress, scan, and manage your documents, images, and files.
          </p>

          {/* Search Box */}
          <div className="mt-6 max-w-xl mx-auto relative">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                id="homepage-main-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools, e.g. PDF to Word, Compress, Merge..."
                className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-blue-500 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-xs"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Filter Tags */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-400">Popular:</span>
              {['PDF to Word', 'Word to PDF', 'Merge PDF', 'Compress PDF', 'JPG to PDF', 'PDF OCR'].map((name) => {
                const matched = TOOLS.find((t) => t.name.toLowerCase() === name.toLowerCase());
                if (!matched) return null;
                return (
                  <button
                    key={name}
                    onClick={() => onSelectTool(matched)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors text-[11px] font-medium cursor-pointer"
                  >
                    {name}
                  </button>
                );
              })}
            </div>

            {searchQuery && (
              <div className="text-left mt-3 text-xs text-slate-600 font-medium">
                Found {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} matching "{searchQuery}"
              </div>
            )}

            {/* Hero Trust Strip */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><span className="text-green-600 font-bold">✓</span> No software installation</span>
              <span className="flex items-center gap-1.5"><span className="text-green-600 font-bold">✓</span> Fast browser processing</span>
              <span className="flex items-center gap-1.5"><span className="text-green-600 font-bold">✓</span> Works on desktop & mobile</span>
              <span className="flex items-center gap-1.5"><span className="text-green-600 font-bold">✓</span> Simple file utilities</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. Most Popular Tools (~12 tools) */}
      {selectedCategory === 'all' && searchQuery === '' && (
        <section className="py-8 border-b border-slate-200 bg-white">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Most Popular Tools
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Everyday document and file utilities</p>
              </div>

              <a
                href="#all-tools-directory"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                <span>View all tools</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {popularTools.map((tool) => {
                const isFav = favorites.includes(tool.id);
                const isHighUse = ['pdf-to-word', 'merge-pdf', 'compress-pdf', 'jpg-to-pdf', 'pdf-to-jpg', 'word-to-pdf'].includes(tool.id);
                return (
                  <div
                    key={tool.id}
                    id={`popular-tool-${tool.id}`}
                    onClick={() => onSelectTool(tool)}
                    className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs p-3.5 rounded-xl transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {renderToolIcon(tool.icon, "w-4 h-4")}
                          </div>
                          {isHighUse && (
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                              Popular
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(tool.id);
                          }}
                          className="text-slate-300 hover:text-amber-500 p-1 transition-colors"
                          title={isFav ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'text-amber-500 fill-amber-500' : ''}`} />
                        </button>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {tool.shortDescription}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-medium">
                      <span className="text-[11px] text-blue-600 font-semibold">Use tool →</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 2.5 Popular Workflows Section */}
      {selectedCategory === 'all' && searchQuery === '' && (
        <section className="py-8 border-b border-slate-200 bg-slate-50/60">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">Popular workflows</h2>
              <p className="text-xs text-slate-500">Common tasks, simplified.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                { title: 'Edit a PDF', steps: ['Upload', 'Edit', 'Download'], toolId: 'edit-pdf' },
                { title: 'Convert a document', steps: ['Upload', 'Convert', 'Download'], toolId: 'pdf-to-word' },
                { title: 'Reduce file size', steps: ['Upload', 'Compress', 'Download'], toolId: 'compress-pdf' },
                { title: 'Combine documents', steps: ['Upload', 'Arrange', 'Merge'], toolId: 'merge-pdf' },
              ].map((wf, idx) => {
                const tool = TOOLS.find(t => t.id === wf.toolId) || TOOLS[0];
                return (
                  <div
                    key={idx}
                    onClick={() => onSelectTool(tool)}
                    className="bg-white border border-slate-200 hover:border-blue-400 p-4 rounded-xl shadow-xs transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {wf.title}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <span>{wf.steps[0]}</span>
                      <span className="text-slate-300">→</span>
                      <span>{wf.steps[1]}</span>
                      <span className="text-slate-300">→</span>
                      <span>{wf.steps[2]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}



      {/* 3. Comprehensive All Tools Directory */}
      <section id="all-tools-directory" className="py-10">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Category Filter Bar */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {selectedCategory === 'all' ? 'All Document & File Tools' : currentCategoryInfo?.label || 'Tool Catalog'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedCategory === 'all' 
                  ? 'Explore the complete directory of deterministic document and data utilities' 
                  : currentCategoryInfo?.description}
              </p>
            </div>

            <div className="text-xs font-semibold text-slate-500 shrink-0">
              {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} available
            </div>
          </div>

          {/* Horizontal Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 no-scrollbar border-b border-slate-200">
            <button
              onClick={() => { setSelectedCategory('all'); setActiveSubcategoryFilter('all'); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              All Tools ({TOOLS.length})
            </button>

            {CATEGORIES_LIST.map((cat) => {
              const count = TOOLS.filter((t) => t.majorCategory === cat.majorCategory).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setActiveSubcategoryFilter('all'); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{cat.shortLabel}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === cat.id ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filtered Search / Category View */}
          {selectedCategory !== 'all' || searchQuery !== '' ? (
            <div className="space-y-6">
              {/* If viewing a specific category with subcategories, show subcategory filter chips */}
              {selectedCategory !== 'all' && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subgroup:</span>
                  <button
                    onClick={() => setActiveSubcategoryFilter('all')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                      activeSubcategoryFilter === 'all'
                        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                        : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                    }`}
                  >
                    All
                  </button>
                  {Array.from(new Set(TOOLS.filter((t) => t.majorCategory === selectedCategory).map((t) => t.subcategory || 'general'))).map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setActiveSubcategoryFilter(sub)}
                      className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors cursor-pointer ${
                        activeSubcategoryFilter === sub
                          ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                          : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}

              {/* Grid of Filtered Tools */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {filteredTools.map((tool) => (
                  <div
                    key={tool.id}
                    id={`tool-item-${tool.id}`}
                    onClick={() => onSelectTool(tool)}
                    className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs p-4 rounded-xl transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {renderToolIcon(tool.icon, "w-4 h-4")}
                        </div>
                        {tool.popular && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                            Popular
                          </span>
                        )}
                        {!tool.popular && (
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {tool.fromFormat} → {tool.toFormat}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {tool.shortDescription}
                      </p>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-medium">
                      <span className="text-[11px] text-slate-400 group-hover:text-blue-600 transition-colors">Open Tool</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>

              {filteredTools.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                  <p className="text-sm text-slate-600 font-medium">No tools found matching your criteria.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setActiveSubcategoryFilter('all'); }}
                    className="mt-3 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Categorized Directory View (When browsing All Tools with no active search) */
            <div className="space-y-12">
              {categoryGroups.map((catGroup) => (
                <div key={catGroup.id} id={`category-section-${catGroup.id}`} className="space-y-4">
                  
                  {/* Category Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-1">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        {renderToolIcon(catGroup.icon, "w-4 h-4 text-blue-600")}
                        {catGroup.label}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{catGroup.description}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCategory(catGroup.id)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline text-left sm:text-right cursor-pointer"
                    >
                      View all {catGroup.toolsCount} tools →
                    </button>
                  </div>

                  {/* Subcategories Breakdowns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catGroup.subcategories.map((sub) => (
                      <div 
                        key={sub.name} 
                        className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2 mb-2 border-b border-slate-100 capitalize">
                            {sub.name}
                          </div>

                          <div className="space-y-1.5">
                            {sub.tools.map((tool) => (
                              <button
                                key={tool.id}
                                id={`catalog-tool-${tool.id}`}
                                onClick={() => onSelectTool(tool)}
                                className="w-full text-left flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 text-xs transition-colors group cursor-pointer"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-slate-400 group-hover:text-blue-600 shrink-0">
                                    {renderToolIcon(tool.icon, "w-3.5 h-3.5")}
                                  </span>
                                  <span className="font-semibold text-slate-800 group-hover:text-blue-600 truncate">
                                    {tool.name}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 group-hover:text-blue-600 font-mono shrink-0 ml-2">
                                  {tool.toFormat}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </section>



    </div>
  );
};
