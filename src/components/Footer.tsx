import React from 'react';
import { FileText } from 'lucide-react';
import { MainNavTab } from './Navbar';

interface FooterProps {
  onNavigateTab: (tab: MainNavTab) => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenSecurity?: () => void;
  onOpenSupport?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateTab,
  onOpenPrivacy,
  onOpenTerms,
  onOpenSecurity,
  onOpenSupport,
}) => {
  return (
    <footer className="w-full border-t border-slate-200 bg-white text-slate-600 font-sans pt-12 pb-8">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 4-column Footer Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          
          {/* Column 1: Product */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 tracking-wider uppercase mb-4">
              Product
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button 
                  onClick={() => onNavigateTab('all')} 
                  className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigateTab('pdf')} 
                  className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                >
                  PDF Tools
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigateTab('documents')} 
                  className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                >
                  Document Tools
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigateTab('images')} 
                  className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                >
                  Image Tools
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigateTab('ocr')} 
                  className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                >
                  OCR Text Extraction
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Resources */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 tracking-wider uppercase mb-4">
              Resources
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button 
                  onClick={onOpenSupport} 
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Help Center
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenSupport} 
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Documentation
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenSupport} 
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  API
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenSupport} 
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Blog
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 tracking-wider uppercase mb-4">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button 
                  onClick={onOpenSupport} 
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  About
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenSupport} 
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Contact
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenSecurity} 
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Security
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 tracking-wider uppercase mb-4">
              Legal
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button 
                  onClick={onOpenPrivacy} 
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Privacy
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenTerms} 
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Terms
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenPrivacy} 
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Cookie Policy
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright & brand */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center">
              <FileText className="w-3 h-3" />
            </div>
            <span className="font-semibold text-slate-800">DocuFlow</span>
            <span>— The document utility platform</span>
          </div>
          <div>
            © 2026 DocuFlow. All rights reserved.
          </div>
        </div>

      </div>
    </footer>
  );
};
