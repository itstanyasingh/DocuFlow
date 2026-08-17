import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Lock, 
  ShieldCheck, 
  ArrowLeft,
  QrCode as QrIcon,
  KeyRound,
  FileCode,
  Binary
} from 'lucide-react';
import { ToolDefinition, ProcessedResult } from '../types';
import { 
  encodeBase64, 
  decodeBase64, 
  encodeUrlString, 
  decodeUrlString, 
  generateUUIDs, 
  generateQrCodeDataUrl, 
  generateSecurePassword 
} from '../lib/everydayEngine';

interface EverydayToolsViewProps {
  tool: ToolDefinition;
  onBackToHome: () => void;
  onSaveToHistory: (result: ProcessedResult) => void;
}

export const EverydayToolsView: React.FC<EverydayToolsViewProps> = ({
  tool,
  onBackToHome,
  onSaveToHistory,
}) => {
  const [copied, setCopied] = useState(false);

  // 1. Base64 state
  const [base64Input, setBase64Input] = useState('Hello DocuFlow! 100% deterministic file tools.');
  const [base64Output, setBase64Output] = useState('');
  const [base64Mode, setBase64Mode] = useState<'encode' | 'decode'>('encode');

  // 2. URL encode/decode state
  const [urlInput, setUrlInput] = useState('https://docuflow.app/tools?query=pdf to word&category=essentials#preview');
  const [urlOutput, setUrlOutput] = useState('');
  const [urlMode, setUrlMode] = useState<'encode' | 'decode'>('encode');

  // 3. UUID state
  const [uuidCount, setUuidCount] = useState<number>(5);
  const [uuidList, setUuidList] = useState<string[]>([]);

  // 4. QR Code state
  const [qrText, setQrText] = useState('https://docuflow.app');
  const [qrColorDark, setQrColorDark] = useState('#0f172a');
  const [qrColorLight, setQrColorLight] = useState('#ffffff');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // 5. Password Generator state
  const [passLength, setPassLength] = useState<number>(16);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [passwordEntropy, setPasswordEntropy] = useState(0);

  // Base64 processing
  useEffect(() => {
    if (tool.id === 'base64-tool' || tool.id === 'base64-encoder' || tool.id === 'base64-decoder') {
      try {
        if (base64Mode === 'encode') {
          setBase64Output(encodeBase64(base64Input));
        } else {
          setBase64Output(decodeBase64(base64Input));
        }
      } catch (err: any) {
        setBase64Output(`[Error]: ${err?.message || 'Invalid input for Base64 decode'}`);
      }
    }
  }, [tool.id, base64Input, base64Mode]);

  // URL processing
  useEffect(() => {
    if (tool.id === 'url-encoder-decoder' || tool.id === 'url-encoder' || tool.id === 'url-decoder') {
      try {
        if (urlMode === 'encode') {
          setUrlOutput(encodeUrlString(urlInput));
        } else {
          setUrlOutput(decodeUrlString(urlInput));
        }
      } catch (err: any) {
        setUrlOutput(`[Error]: ${err?.message || 'Invalid URL encoding'}`);
      }
    }
  }, [tool.id, urlInput, urlMode]);

  // UUID generation
  useEffect(() => {
    if (tool.id === 'uuid-generator') {
      setUuidList(generateUUIDs(uuidCount));
    }
  }, [tool.id, uuidCount]);

  // QR Code generation
  useEffect(() => {
    if (tool.id === 'qr-code-generator' || tool.id === 'qr-code-reader') {
      generateQrCodeDataUrl(qrText, {
        color: { dark: qrColorDark, light: qrColorLight },
      }).then(setQrDataUrl).catch(console.error);
    }
  }, [tool.id, qrText, qrColorDark, qrColorLight]);

  // Password generator
  const refreshPassword = () => {
    const res = generateSecurePassword({
      length: passLength,
      includeUppercase: includeUpper,
      includeLowercase: includeLower,
      includeNumbers: includeNumbers,
      includeSymbols: includeSymbols,
      excludeSimilar,
    });
    setGeneratedPassword(res.password);
    setPasswordEntropy(res.entropyBits);
  };

  useEffect(() => {
    if (tool.id === 'password-generator') {
      refreshPassword();
    }
  }, [tool.id, passLength, includeUpper, includeLower, includeNumbers, includeSymbols, excludeSimilar]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-6 font-sans">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all tools</span>
        </button>
      </div>

      {/* Tool Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {tool.name}
        </h1>
        <p className="mt-2 text-base text-slate-600 max-w-xl mx-auto">
          {tool.shortDescription}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">

        {/* 1. Base64 Tool */}
        {(tool.id === 'base64-tool' || tool.id === 'base64-encoder' || tool.id === 'base64-decoder') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => setBase64Mode('encode')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                  base64Mode === 'encode' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Encode to Base64
              </button>
              <button
                type="button"
                onClick={() => setBase64Mode('decode')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                  base64Mode === 'decode' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Decode from Base64
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                {base64Mode === 'encode' ? 'Input Text' : 'Input Base64 String'}
              </label>
              <textarea
                value={base64Input}
                onChange={(e) => setBase64Input(e.target.value)}
                rows={4}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                placeholder={base64Mode === 'encode' ? 'Enter text to encode...' : 'Paste Base64 string here...'}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {base64Mode === 'encode' ? 'Base64 Encoded Result' : 'Decoded Text'}
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(base64Output)}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={base64Output}
                rows={4}
                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-800"
              />
            </div>
          </div>
        )}

        {/* 2. URL Encoder / Decoder */}
        {(tool.id === 'url-encoder-decoder' || tool.id === 'url-encoder' || tool.id === 'url-decoder') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => setUrlMode('encode')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                  urlMode === 'encode' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Encode URL
              </button>
              <button
                type="button"
                onClick={() => setUrlMode('decode')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                  urlMode === 'decode' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Decode URL
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                {urlMode === 'encode' ? 'Raw URL or Query String' : 'Encoded URL String'}
              </label>
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {urlMode === 'encode' ? 'Percent-Encoded Output' : 'Decoded URL'}
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(urlOutput)}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={urlOutput}
                rows={3}
                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-800"
              />
            </div>
          </div>
        )}

        {/* 3. UUID Generator */}
        {tool.id === 'uuid-generator' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-slate-700 block">Quantity</label>
                <div className="flex items-center gap-2 mt-1">
                  {[1, 5, 10, 25].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setUuidCount(cnt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        uuidCount === cnt ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUuidList(generateUUIDs(uuidCount))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Generated UUIDs (v4)</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(uuidList.join('\n'))}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy All</span>
                </button>
              </div>
              {uuidList.map((uuid, i) => (
                <div key={i} className="flex items-center justify-between py-1 font-mono text-xs text-slate-800 hover:bg-white px-2 rounded-sm">
                  <span>{uuid}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(uuid)}
                    className="text-slate-400 hover:text-slate-700 p-1"
                    title="Copy this UUID"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. QR Code Generator */}
        {(tool.id === 'qr-code-generator' || tool.id === 'qr-code-reader') && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Text or URL Content
                  </label>
                  <textarea
                    value={qrText}
                    onChange={(e) => setQrText(e.target.value)}
                    rows={4}
                    placeholder="Enter URL, text, Wi-Fi details..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Color (Foreground)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={qrColorDark}
                        onChange={(e) => setQrColorDark(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                      />
                      <span className="text-xs font-mono text-slate-600">{qrColorDark}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={qrColorLight}
                        onChange={(e) => setQrColorLight(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                      />
                      <span className="text-xs font-mono text-slate-600">{qrColorLight}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Preview & Download */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-xl">
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="Generated QR Code"
                    className="w-48 h-48 border border-slate-200 rounded-lg shadow-xs bg-white p-2"
                  />
                )}
                <div className="mt-4 flex items-center gap-2">
                  <a
                    href={qrDataUrl}
                    download="qrcode.png"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Secure Password Generator */}
        {tool.id === 'password-generator' && (
          <div className="space-y-6">
            {/* Generated Password Box */}
            <div className="p-4 bg-slate-900 rounded-xl text-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Secure Password (100% In-Browser)
                </span>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Entropy: ~{passwordEntropy} bits</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="font-mono text-lg font-bold tracking-wide select-all text-emerald-300 break-all">
                  {generatedPassword}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedPassword)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
                    title="Copy Password"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={refreshPassword}
                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Password Length: {passLength} characters</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={passLength}
                  onChange={(e) => setPassLength(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Uppercase (A-Z)', checked: includeUpper, onChange: setIncludeUpper },
                  { label: 'Lowercase (a-z)', checked: includeLower, onChange: setIncludeLower },
                  { label: 'Numbers (0-9)', checked: includeNumbers, onChange: setIncludeNumbers },
                  { label: 'Symbols (!@#$%)', checked: includeSymbols, onChange: setIncludeSymbols },
                  { label: 'Exclude Similar (l, 1, O, 0)', checked: excludeSimilar, onChange: setExcludeSimilar },
                ].map((item, i) => (
                  <label key={i} className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => item.onChange(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
