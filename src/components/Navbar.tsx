import React, { useState } from 'react';
import { 
  FileText, 
  Menu, 
  X,
  Search,
  Settings,
  LayoutDashboard,
  Shield,
  CreditCard
} from 'lucide-react';

export type MainNavTab = 
  | 'all' 
  | 'pdf' 
  | 'documents' 
  | 'images' 
  | 'ocr' 
  | 'text-data' 
  | 'file-utilities' 
  | 'pricing' 
  | 'dashboard' 
  | 'admin';

interface NavbarProps {
  activeTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  openSearch?: () => void;
  openSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  openSearch,
  openSettings,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { id: MainNavTab; label: string }[] = [
    { id: 'pdf', label: 'PDF Tools' },
    { id: 'documents', label: 'Documents' },
    { id: 'images', label: 'Images' },
    { id: 'ocr', label: 'OCR' },
    { id: 'text-data', label: 'Text & Data' },
    { id: 'file-utilities', label: 'File Utilities' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'dashboard', label: 'Dashboard' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-900 font-sans">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand Logo & Navigation */}
          <div className="flex items-center gap-6 lg:gap-8">
            
            {/* Brand Logo */}
            <button
              id="brand-logo-btn"
              onClick={() => onSelectTab('all')}
              className="flex items-center gap-2.5 text-slate-900 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer shrink-0"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <FileText className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">DocuFlow</span>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-0.5 h-16">
              {navLinks.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`nav-tab-${tab.id}`}
                    onClick={() => onSelectTab(tab.id)}
                    className={`px-2.5 py-1.5 text-xs xl:text-sm font-medium transition-colors rounded-md cursor-pointer ${
                      isActive
                        ? 'text-blue-600 font-semibold bg-blue-50/70'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Search, Admin & All Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {openSearch && (
              <button
                id="quick-search-nav-btn"
                onClick={openSearch}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search tools...</span>
                <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-300 rounded font-mono text-slate-400">⌘K</kbd>
              </button>
            )}

            <button
              id="admin-nav-btn"
              onClick={() => onSelectTab('admin')}
              className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'admin' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Admin Settings & Limits"
            >
              <Shield className="w-4 h-4" />
            </button>

            <button
              id="all-tools-header-btn"
              onClick={() => onSelectTab('all')}
              className="hidden sm:inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              All Tools
            </button>

            {/* Mobile menu trigger */}
            <button
              id="mobile-nav-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {navLinks.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onSelectTab(tab.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => {
              onSelectTab('admin');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Admin Panel
          </button>
        </div>
      )}
    </header>
  );
};
