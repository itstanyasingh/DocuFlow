import React, { useState } from 'react';
import { X, Settings, Sliders, Shield, Zap, Bell, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [defaultCompression, setDefaultCompression] = useState('medium');
  const [autoOcr, setAutoOcr] = useState(true);
  const [saveHistory, setSaveHistory] = useState(true);
  const [savedMessage, setSavedMessage] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150 space-y-6">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Workspace Settings</h2>
            <p className="text-xs text-stone-500">Configure global processing preferences and output quality.</p>
          </div>
        </div>

        {/* Settings Options */}
        <div className="space-y-4 text-xs">
          
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <label className="font-semibold text-stone-800 block">Default Compression Preset</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low', label: 'Low (Highest Quality)' },
                { id: 'medium', label: 'Recommended (Balanced)' },
                { id: 'high', label: 'Extreme (Smallest Size)' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setDefaultCompression(preset.id)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    defaultCompression === preset.id
                      ? 'border-stone-900 bg-white font-bold text-stone-900 shadow-2xs'
                      : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
            <div>
              <p className="font-semibold text-stone-800">Auto Multimodal OCR Enhancement</p>
              <p className="text-stone-500 text-[11px]">Automatically recognize text on scanned PDFs when converting</p>
            </div>
            <input
              type="checkbox"
              checked={autoOcr}
              onChange={(e) => setAutoOcr(e.target.checked)}
              className="w-4 h-4 rounded text-stone-900 focus:ring-stone-900"
            />
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
            <div>
              <p className="font-semibold text-stone-800">Local Processing History</p>
              <p className="text-stone-500 text-[11px]">Keep a temporary private record of processed downloads in browser</p>
            </div>
            <input
              type="checkbox"
              checked={saveHistory}
              onChange={(e) => setSaveHistory(e.target.checked)}
              className="w-4 h-4 rounded text-stone-900 focus:ring-stone-900"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-2xs flex items-center gap-1.5"
          >
            {savedMessage ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
