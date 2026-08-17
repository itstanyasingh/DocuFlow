import React from 'react';
import { Check, Zap, Shield, ArrowRight } from 'lucide-react';

interface PricingViewProps {
  onBackToHome: () => void;
}

export const PricingView: React.FC<PricingViewProps> = ({ onBackToHome }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Simple, Transparent Plans
        </h1>
        <p className="mt-3 text-base text-slate-600 max-w-xl mx-auto">
          Fast, deterministic document and file tools that work without cloud delays, subscriptions traps, or artificial intelligence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* Free Plan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Standard Free</h2>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
                Always Free
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Complete access to everyday document conversion, organization, and OCR tools.
            </p>

            <div className="mt-6 mb-8">
              <span className="text-4xl font-bold text-slate-900">$0</span>
              <span className="text-slate-500 text-sm ml-1.5">/ forever</span>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              {[
                'Full access to all PDF, Word, Excel, Image & Text tools',
                'Up to 50 MB per file limit',
                'Tesseract OCR engine (100% deterministic)',
                'In-browser private cryptographic hashing & password tools',
                'Zero server data retention (Instant client processing)',
                'Standard single-file processing',
              ].map((feat, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToHome}
            className="mt-8 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Start Free
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-slate-900 text-white rounded-2xl p-8 flex flex-col justify-between shadow-md relative border border-slate-800">
          <div className="absolute -top-3 right-6 px-3 py-1 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider rounded-full shadow-xs">
            Most Popular
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">DocuFlow Pro</h2>
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              For high-volume professionals, researchers, and small teams needing bulk batch processing.
            </p>

            <div className="mt-6 mb-8">
              <span className="text-4xl font-bold text-white">$6</span>
              <span className="text-slate-400 text-sm ml-1.5">/ month</span>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              {[
                'Everything in Standard Free',
                'Increased 500 MB file size limit',
                'Concurrent multi-file batch processing',
                'Unlimited parallel OCR threads',
                'Extended 30-day processing history logs',
                'Priority lossless compression algorithms',
                'Dedicated desktop & offline CLI utilities',
              ].map((feat, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToHome}
            className="mt-8 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <span>Upgrade to Pro</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
