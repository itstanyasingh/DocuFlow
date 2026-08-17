import React, { useState, useEffect } from 'react';
import { Navbar, MainNavTab } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { Footer } from './components/Footer';
import { ToolProcessor } from './components/ToolProcessor';
import { QuickSearchModal } from './components/QuickSearchModal';
import { SettingsModal } from './components/SettingsModal';
import { SupportModal } from './components/SupportModal';

import { OcrTool } from './components/OcrTool';
import { EverydayToolsView } from './components/EverydayToolsView';
import { FileUtilitiesView } from './components/FileUtilitiesView';
import { TextDataToolsView } from './components/TextDataToolsView';
import { PricingView } from './components/PricingView';
import { DashboardView } from './components/DashboardView';
import { AdminView } from './components/AdminView';

import { ToolDefinition, ProcessedResult, FileItem } from './types';
import { TOOLS } from './data/tools';

export function App() {
  const [activeNavTab, setActiveNavTab] = useState<MainNavTab>('all');
  const [activeView, setActiveView] = useState<'home' | 'tool'>('home');
  const [activeTool, setActiveTool] = useState<ToolDefinition | null>(null);
  const [initialFile, setInitialFile] = useState<FileItem | undefined>(undefined);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Favorites & History persistence
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('docuflow_favorites');
      return saved ? JSON.parse(saved) : ['pdf-to-word', 'compress-pdf', 'merge-pdf', 'jpg-to-pdf'];
    } catch {
      return ['pdf-to-word', 'compress-pdf', 'merge-pdf'];
    }
  });

  const [history, setHistory] = useState<ProcessedResult[]>(() => {
    try {
      const saved = localStorage.getItem('docuflow_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('docuflow_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem('docuflow_history', JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  }, [history]);

  // Sync with browser URL
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path.startsWith('/tools/')) {
        const toolId = path.replace('/tools/', '').trim();
        const matchedTool = TOOLS.find(
          (t) => t.id === toolId || (toolId === 'delete-pdf-pages' && t.id === 'delete-pages')
        );
        if (matchedTool) {
          setActiveTool(matchedTool);
          setActiveView('tool');
          return;
        }
      } else if (path === '/' || path === '') {
        setActiveView('home');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleSelectTool = (tool: ToolDefinition, file?: FileItem) => {
    setActiveTool(tool);
    setInitialFile(file);
    setActiveView('tool');
    window.history.pushState(null, '', `/tools/${tool.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setActiveView('home');
    setActiveTool(null);
    window.history.pushState(null, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveToHistory = (result: ProcessedResult) => {
    setHistory(prev => [result, ...prev.slice(0, 49)]);
  };

  const handleToggleFavorite = (toolId: string) => {
    setFavorites(prev => 
      prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
    );
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleNavTabSelect = (tab: MainNavTab) => {
    setActiveNavTab(tab);
    setActiveView('home');
    setActiveTool(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check which component to render for active tool
  const renderActiveToolComponent = () => {
    if (!activeTool) return null;

    if (activeTool.majorCategory === 'everyday-utilities' || 
        activeTool.category === 'everyday-utilities' || 
        ['base64-tool', 'base64-encoder', 'base64-decoder', 'url-encoder-decoder', 'url-encoder', 'url-decoder', 'uuid-generator', 'qr-code-generator', 'qr-code-reader', 'password-generator'].includes(activeTool.id)) {
      return (
        <EverydayToolsView
          tool={activeTool}
          onBackToHome={() => setActiveView('home')}
          onSaveToHistory={handleSaveToHistory}
        />
      );
    }

    if (activeTool.majorCategory === 'file-utilities' || 
        activeTool.category === 'file-utilities' || 
        ['zip-creator', 'zip-extractor', 'hash-generator', 'file-type-detector', 'file-type-checker', 'duplicate-checker', 'duplicate-file-checker', 'file-renamer', 'multiple-file-renamer', 'file-compressor'].includes(activeTool.id)) {
      return (
        <FileUtilitiesView
          tool={activeTool}
          onBackToHome={() => setActiveView('home')}
          onSaveToHistory={handleSaveToHistory}
        />
      );
    }

    if (activeTool.majorCategory === 'text-tools' || 
        activeTool.majorCategory === 'data-tools' || 
        activeTool.category === 'text-tools' || 
        activeTool.category === 'data-utilities' ||
        ['text-statistics', 'word-counter', 'character-counter', 'line-counter', 'text-case-converter', 'case-converter', 'remove-extra-spaces', 'find-and-replace-text', 'csv-to-json', 'json-to-csv', 'json-formatter', 'json-validator', 'csv-viewer', 'csv-merger', 'csv-splitter', 'csv-to-excel', 'excel-to-csv', 'csv-to-xlsx', 'xlsx-to-csv'].includes(activeTool.id)) {
      return (
        <TextDataToolsView
          tool={activeTool}
          onBackToHome={() => setActiveView('home')}
          onSaveToHistory={handleSaveToHistory}
        />
      );
    }

    if (activeTool.majorCategory === 'ocr' || activeTool.category === 'ocr' || activeTool.id.startsWith('ocr-') || activeTool.id === 'pdf-ocr') {
      return (
        <OcrTool
          initialFile={initialFile}
          onBackToHome={() => setActiveView('home')}
          onSaveToHistory={handleSaveToHistory}
        />
      );
    }

    return (
      <ToolProcessor
        tool={activeTool}
        onBackToHome={handleBackToHome}
        onSaveToHistory={handleSaveToHistory}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#fcfcfb] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 1. Header Navigation */}
      <Navbar
        activeTab={activeNavTab}
        onSelectTab={handleNavTabSelect}
        openSearch={() => setIsSearchOpen(true)}
        openSettings={() => setIsSettingsOpen(true)}
      />

      {/* 2. Main Body Content */}
      <div className="flex-1 w-full">
        <main>
          
          {/* A. Top Navigation Specific Views */}
          {activeView === 'home' && activeNavTab === 'pricing' && (
            <PricingView onBackToHome={() => handleNavTabSelect('all')} />
          )}

          {activeView === 'home' && activeNavTab === 'dashboard' && (
            <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <DashboardView
                history={history}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onSelectTool={handleSelectTool}
                onClearHistory={handleClearHistory}
                onDeleteHistoryItem={handleDeleteHistoryItem}
              />
            </div>
          )}

          {activeView === 'home' && activeNavTab === 'admin' && (
            <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <AdminView />
            </div>
          )}

          {/* B. Main Home / Category Filtered View */}
          {activeView === 'home' && activeNavTab !== 'pricing' && activeNavTab !== 'dashboard' && activeNavTab !== 'admin' && (
            <HomeView
              activeTab={activeNavTab}
              onSelectTool={handleSelectTool}
              openSearch={() => setIsSearchOpen(true)}
            />
          )}

          {/* C. Dedicated Individual Tool Execution View */}
          {activeView === 'tool' && activeTool && (
            <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {renderActiveToolComponent()}
            </div>
          )}

        </main>
      </div>

      {/* 3. Footer */}
      <Footer
        onNavigateTab={handleNavTabSelect}
        onOpenPrivacy={() => setIsSupportOpen(true)}
        onOpenTerms={() => setIsSupportOpen(true)}
        onOpenSecurity={() => setIsSupportOpen(true)}
        onOpenSupport={() => setIsSupportOpen(true)}
      />

      {/* Global Modals */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTool={handleSelectTool}
        favorites={favorites}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />

    </div>
  );
}

export default App;
