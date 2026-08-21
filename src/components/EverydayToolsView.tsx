import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Lock, 
  ArrowLeft,
  QrCode as QrIcon,
  Palette,
  Calculator,
  Percent,
  Calendar,
  Clock,
  Shuffle,
  Upload,
  AlertCircle
} from 'lucide-react';
import { ToolDefinition, ProcessedResult } from '../types';
import { 
  generateUUIDs, 
  generateQrCodeDataUrl, 
  decodeQrCodeFromImage,
  generateSecurePassword,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  generateRandomColor,
  convertUnits,
  calculateAge,
  generateRandomNumbers
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

  // 1. QR Code Generator State
  const [qrText, setQrText] = useState('https://docuflow.app');
  const [qrSize, setQrSize] = useState<number>(300);
  const [qrMargin, setQrMargin] = useState<number>(2);
  const [qrColorDark, setQrColorDark] = useState('#0f172a');
  const [qrColorLight, setQrColorLight] = useState('#ffffff');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // 2. QR Code Reader State
  const [qrReaderResult, setQrReaderResult] = useState<string>('');
  const [qrReaderError, setQrReaderError] = useState<string>('');
  const [isDecodingQr, setIsDecodingQr] = useState(false);

  // 3. Color Picker & Converter State
  const [pickerColor, setPickerColor] = useState('#2563eb');
  const [hexInput, setHexInput] = useState('#2563eb');
  const [rgbInput, setRgbInput] = useState({ r: 37, g: 99, b: 235 });

  // 4. Gradient Generator State
  const [gradColor1, setGradColor1] = useState('#3b82f6');
  const [gradColor2, setGradColor2] = useState('#9333ea');
  const [gradAngle, setGradAngle] = useState(135);

  // 5. Random Color Generator State
  const [randomColor, setRandomColor] = useState({ hex: '#2563eb', rgb: 'rgb(37, 99, 235)', hsl: 'hsl(221, 83%, 53%)' });

  // 6. Basic Calculator State
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcHistory, setCalcHistory] = useState<string[]>([]);

  // 7. Percentage Calculator State
  const [pctVal1, setPctVal1] = useState<number>(20);
  const [pctVal2, setPctVal2] = useState<number>(150);
  const [pctMode, setPctMode] = useState<'of' | 'is' | 'change'>('of');

  // 8. Unit Converter State
  const [unitCategory, setUnitCategory] = useState<'length' | 'weight' | 'temperature' | 'storage'>('length');
  const [unitVal, setUnitVal] = useState<number>(1);
  const [fromUnit, setFromUnit] = useState('km');
  const [toUnit, setToUnit] = useState('mile');

  // 9. Date & Age Calculator State
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]);
  const [dobDate, setDobDate] = useState('1998-05-15');

  // 10. Time Converter State
  const [timeInput12, setTimeInput12] = useState('02:30 PM');
  const [timeInput24, setTimeInput24] = useState('14:30');

  // 11. Password Generator State
  const [passLength, setPassLength] = useState<number>(16);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [passwordEntropy, setPasswordEntropy] = useState(0);

  // 12. UUID Generator State
  const [uuidCount, setUuidCount] = useState<number>(5);
  const [uuidList, setUuidList] = useState<string[]>([]);

  // 13. Random Number Generator State
  const [randMin, setRandMin] = useState(1);
  const [randMax, setRandMax] = useState(100);
  const [randQty, setRandQty] = useState(5);
  const [randUnique, setRandUnique] = useState(true);
  const [randResults, setRandResults] = useState<number[]>([]);

  // Clipboard Helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // QR Code Generation
  useEffect(() => {
    if (tool.id === 'qr-code-generator') {
      generateQrCodeDataUrl(qrText || 'https://docuflow.app', {
        width: qrSize,
        margin: qrMargin,
        darkColor: qrColorDark,
        lightColor: qrColorLight,
      }).then(setQrDataUrl).catch(console.error);
    }
  }, [tool.id, qrText, qrSize, qrMargin, qrColorDark, qrColorLight]);

  // QR Reader File Handler
  const handleQrImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDecodingQr(true);
    setQrReaderResult('');
    setQrReaderError('');

    try {
      const decodedText = await decodeQrCodeFromImage(file);
      setQrReaderResult(decodedText);
    } catch (err: any) {
      setQrReaderError(err.message || 'No QR code detected.');
    } finally {
      setIsDecodingQr(false);
    }
  };

  // Password Generator
  const refreshPassword = () => {
    const res = generateSecurePassword({
      length: passLength,
      uppercase: includeUpper,
      lowercase: includeLower,
      numbers: includeNumbers,
      symbols: includeSymbols,
    });
    setGeneratedPassword(res.password);
    setPasswordEntropy(res.entropyBits);
  };

  useEffect(() => {
    if (tool.id === 'password-generator') {
      refreshPassword();
    }
  }, [tool.id, passLength, includeUpper, includeLower, includeNumbers, includeSymbols]);

  // UUID Generation
  useEffect(() => {
    if (tool.id === 'uuid-generator') {
      setUuidList(generateUUIDs(uuidCount));
    }
  }, [tool.id, uuidCount]);

  // Random Color Generation
  useEffect(() => {
    if (tool.id === 'random-color-generator') {
      setRandomColor(generateRandomColor());
    }
  }, [tool.id]);

  // Random Number Generation
  const handleGenerateRandomNumbers = () => {
    try {
      const nums = generateRandomNumbers(randMin, randMax, randQty, randUnique);
      setRandResults(nums);
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    if (tool.id === 'random-number-generator') {
      handleGenerateRandomNumbers();
    }
  }, [tool.id, randMin, randMax, randQty, randUnique]);

  // Calculator Logic
  const handleCalcClick = (val: string) => {
    if (val === 'C') {
      setCalcDisplay('0');
      return;
    }
    if (val === '=') {
      try {
        // Safe evaluation for basic math
        const expr = calcDisplay.replace(/×/g, '*').replace(/÷/g, '/');
        const res = Function(`"use strict"; return (${expr})`)();
        setCalcHistory(prev => [`${calcDisplay} = ${res}`, ...prev.slice(0, 9)]);
        setCalcDisplay(String(res));
      } catch {
        setCalcDisplay('Error');
      }
      return;
    }
    setCalcDisplay(prev => (prev === '0' || prev === 'Error' ? val : prev + val));
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

        {/* 1. QR CODE GENERATOR */}
        {tool.id === 'qr-code-generator' && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-slate-800 block mb-1">
                Enter Text, URL, Email, Phone, or Wi-Fi info:
              </label>
              <textarea
                value={qrText}
                onChange={(e) => setQrText(e.target.value)}
                rows={3}
                className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                placeholder="https://example.com or text content..."
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Size (px)</label>
                <input
                  type="number"
                  value={qrSize}
                  onChange={(e) => setQrSize(Number(e.target.value))}
                  min={100}
                  max={1000}
                  className="w-full p-2 border border-slate-200 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Margin</label>
                <input
                  type="number"
                  value={qrMargin}
                  onChange={(e) => setQrMargin(Number(e.target.value))}
                  min={0}
                  max={10}
                  className="w-full p-2 border border-slate-200 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Dark Color</label>
                <input
                  type="color"
                  value={qrColorDark}
                  onChange={(e) => setQrColorDark(e.target.value)}
                  className="w-full h-9 p-1 border border-slate-200 rounded-md cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Light Color</label>
                <input
                  type="color"
                  value={qrColorLight}
                  onChange={(e) => setQrColorLight(e.target.value)}
                  className="w-full h-9 p-1 border border-slate-200 rounded-md cursor-pointer"
                />
              </div>
            </div>

            {qrDataUrl && (
              <div className="flex flex-col items-center justify-center pt-4 border-t border-slate-100">
                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs mb-4">
                  <img src={qrDataUrl} alt="Generated QR Code" className="w-48 h-48" />
                </div>
                <a
                  href={qrDataUrl}
                  download="qrcode.png"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PNG</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* 2. QR CODE READER */}
        {tool.id === 'qr-code-reader' && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100/50 transition-colors relative cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleQrImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <QrIcon className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">Upload an image containing a QR code</p>
              <p className="text-xs text-slate-500 mt-1">Supports PNG, JPG, JPEG, WEBP</p>
            </div>

            {isDecodingQr && (
              <div className="text-center py-4 text-sm text-slate-600 animate-pulse">
                Scanning image for QR code...
              </div>
            )}

            {qrReaderError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{qrReaderError}</span>
              </div>
            )}

            {qrReaderResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Decoded QR Content</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(qrReaderResult)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-sm font-mono text-slate-900 break-all bg-white p-3 rounded-md border border-emerald-100">
                  {qrReaderResult}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3. COLOR PICKER */}
        {tool.id === 'color-picker' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <input
                type="color"
                value={pickerColor}
                onChange={(e) => setPickerColor(e.target.value)}
                className="w-32 h-32 p-1 rounded-2xl border-2 border-slate-200 cursor-pointer shadow-xs"
              />
              <div className="space-y-3 flex-1 w-full">
                {(() => {
                  const rgb = hexToRgb(pickerColor) || { r: 0, g: 0, b: 0 };
                  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                  return (
                    <>
                      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="text-xs font-bold text-slate-500">HEX</span>
                        <span className="font-mono text-sm font-semibold text-slate-900">{pickerColor.toUpperCase()}</span>
                        <button
                          onClick={() => copyToClipboard(pickerColor.toUpperCase())}
                          className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="text-xs font-bold text-slate-500">RGB</span>
                        <span className="font-mono text-sm font-semibold text-slate-900">rgb({rgb.r}, {rgb.g}, {rgb.b})</span>
                        <button
                          onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}
                          className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="text-xs font-bold text-slate-500">HSL</span>
                        <span className="font-mono text-sm font-semibold text-slate-900">hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</span>
                        <button
                          onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}
                          className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* 4. COLOR CONVERTER */}
        {tool.id === 'color-converter' && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-slate-800 block mb-1">Enter HEX Color:</label>
              <input
                type="text"
                value={hexInput}
                onChange={(e) => {
                  setHexInput(e.target.value);
                  const rgb = hexToRgb(e.target.value);
                  if (rgb) setRgbInput(rgb);
                }}
                className="w-full p-3 border border-slate-200 rounded-lg text-sm font-mono"
                placeholder="#2563eb"
              />
            </div>

            {(() => {
              const hsl = rgbToHsl(rgbInput.r, rgbInput.g, rgbInput.b);
              const hex = rgbToHex(rgbInput.r, rgbInput.g, rgbInput.b);
              return (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="h-16 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center text-white font-bold text-sm shadow-inner" style={{ backgroundColor: hex }}>
                    {hex.toUpperCase()}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <span className="text-xs text-slate-500 block font-semibold">HEX</span>
                      <span className="font-mono text-sm font-bold text-slate-900">{hex.toUpperCase()}</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <span className="text-xs text-slate-500 block font-semibold">RGB</span>
                      <span className="font-mono text-sm font-bold text-slate-900">rgb({rgbInput.r}, {rgbInput.g}, {rgbInput.b})</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <span className="text-xs text-slate-500 block font-semibold">HSL</span>
                      <span className="font-mono text-sm font-bold text-slate-900">hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 5. GRADIENT GENERATOR */}
        {tool.id === 'gradient-generator' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Color 1</label>
                <input
                  type="color"
                  value={gradColor1}
                  onChange={(e) => setGradColor1(e.target.value)}
                  className="w-full h-10 p-1 border border-slate-200 rounded-md cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Color 2</label>
                <input
                  type="color"
                  value={gradColor2}
                  onChange={(e) => setGradColor2(e.target.value)}
                  className="w-full h-10 p-1 border border-slate-200 rounded-md cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Angle ({gradAngle}°)</label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={gradAngle}
                  onChange={(e) => setGradAngle(Number(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
            </div>

            {(() => {
              const cssCode = `background: linear-gradient(${gradAngle}deg, ${gradColor1}, ${gradColor2});`;
              return (
                <div className="space-y-4">
                  <div
                    className="w-full h-40 rounded-xl border border-slate-200 shadow-xs transition-all"
                    style={{ background: `linear-gradient(${gradAngle}deg, ${gradColor1}, ${gradColor2})` }}
                  />
                  <div className="flex items-center justify-between p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs">
                    <span>{cssCode}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(cssCode)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 text-xs font-sans cursor-pointer"
                    >
                      {copied ? 'Copied' : 'Copy CSS'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 6. RANDOM COLOR GENERATOR */}
        {tool.id === 'random-color-generator' && (
          <div className="space-y-6 text-center">
            <div
              className="w-full h-36 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-center text-white font-bold text-lg shadow-inner transition-colors"
              style={{ backgroundColor: randomColor.hex }}
            >
              {randomColor.hex.toUpperCase()}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs text-slate-500 font-semibold block">HEX</span>
                <span className="font-mono text-sm font-bold">{randomColor.hex.toUpperCase()}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs text-slate-500 font-semibold block">RGB</span>
                <span className="font-mono text-sm font-bold">{randomColor.rgb}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs text-slate-500 font-semibold block">HSL</span>
                <span className="font-mono text-sm font-bold">{randomColor.hsl}</span>
              </div>
            </div>

            <button
              onClick={() => setRandomColor(generateRandomColor())}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              <Shuffle className="w-4 h-4" />
              <span>Generate Random Color</span>
            </button>
          </div>
        )}

        {/* 7. BASIC CALCULATOR */}
        {tool.id === 'basic-calculator' && (
          <div className="max-w-xs mx-auto space-y-4">
            <div className="p-4 bg-slate-900 text-white text-right font-mono text-2xl rounded-xl tracking-wider overflow-x-auto">
              {calcDisplay}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {['C', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '%', '='].map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleCalcClick(btn)}
                  className={`p-3 text-base font-bold rounded-lg cursor-pointer transition-colors ${
                    ['÷', '×', '-', '+', '='].includes(btn)
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : btn === 'C'
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>

            {calcHistory.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 block mb-1">History</span>
                <div className="space-y-1 max-h-24 overflow-y-auto text-xs font-mono text-slate-600">
                  {calcHistory.map((h, i) => (
                    <div key={i}>{h}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 8. PERCENTAGE CALCULATOR */}
        {tool.id === 'percentage-calculator' && (
          <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setPctMode('of')}
                className={`flex-1 py-1.5 rounded-md cursor-pointer ${pctMode === 'of' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'}`}
              >
                What is X% of Y?
              </button>
              <button
                onClick={() => setPctMode('is')}
                className={`flex-1 py-1.5 rounded-md cursor-pointer ${pctMode === 'is' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'}`}
              >
                X is what % of Y?
              </button>
              <button
                onClick={() => setPctMode('change')}
                className={`flex-1 py-1.5 rounded-md cursor-pointer ${pctMode === 'change' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'}`}
              >
                % Increase/Decrease
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  {pctMode === 'of' ? 'Percentage (X%)' : 'Value X'}
                </label>
                <input
                  type="number"
                  value={pctVal1}
                  onChange={(e) => setPctVal1(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  {pctMode === 'of' ? 'Total Value (Y)' : 'Total Value (Y)'}
                </label>
                <input
                  type="number"
                  value={pctVal2}
                  onChange={(e) => setPctVal2(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider mb-1">Result</span>
              <span className="text-2xl font-bold text-slate-900">
                {pctMode === 'of' && ((pctVal1 / 100) * pctVal2).toFixed(2)}
                {pctMode === 'is' && pctVal2 !== 0 && `${((pctVal1 / pctVal2) * 100).toFixed(2)}%`}
                {pctMode === 'change' && pctVal1 !== 0 && `${(((pctVal2 - pctVal1) / Math.abs(pctVal1)) * 100).toFixed(2)}%`}
              </span>
            </div>
          </div>
        )}

        {/* 9. UNIT CONVERTER */}
        {tool.id === 'unit-converter' && (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Category</label>
              <select
                value={unitCategory}
                onChange={(e) => {
                  const cat = e.target.value as any;
                  setUnitCategory(cat);
                  if (cat === 'length') { setFromUnit('km'); setToUnit('mile'); }
                  if (cat === 'weight') { setFromUnit('kg'); setToUnit('lb'); }
                  if (cat === 'temperature') { setFromUnit('C'); setToUnit('F'); }
                  if (cat === 'storage') { setFromUnit('MB'); setToUnit('GB'); }
                }}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-semibold"
              >
                <option value="length">Length (km, miles, meters, feet)</option>
                <option value="weight">Weight (kg, pounds, grams, oz)</option>
                <option value="temperature">Temperature (°C, °F, Kelvin)</option>
                <option value="storage">Data Storage (B, KB, MB, GB, TB)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">From Value</label>
                <input
                  type="number"
                  value={unitVal}
                  onChange={(e) => setUnitVal(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">From Unit</label>
                <select
                  value={fromUnit}
                  onChange={(e) => setFromUnit(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                >
                  {unitCategory === 'length' && ['mm', 'cm', 'm', 'km', 'inch', 'feet', 'yard', 'mile'].map(u => <option key={u} value={u}>{u}</option>)}
                  {unitCategory === 'weight' && ['mg', 'g', 'kg', 'oz', 'lb', 'ton'].map(u => <option key={u} value={u}>{u}</option>)}
                  {unitCategory === 'temperature' && ['C', 'F', 'K'].map(u => <option key={u} value={u}>{u}</option>)}
                  {unitCategory === 'storage' && ['B', 'KB', 'MB', 'GB', 'TB'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">To Unit</label>
                <select
                  value={toUnit}
                  onChange={(e) => setToUnit(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                >
                  {unitCategory === 'length' && ['mm', 'cm', 'm', 'km', 'inch', 'feet', 'yard', 'mile'].map(u => <option key={u} value={u}>{u}</option>)}
                  {unitCategory === 'weight' && ['mg', 'g', 'kg', 'oz', 'lb', 'ton'].map(u => <option key={u} value={u}>{u}</option>)}
                  {unitCategory === 'temperature' && ['C', 'F', 'K'].map(u => <option key={u} value={u}>{u}</option>)}
                  {unitCategory === 'storage' && ['B', 'KB', 'MB', 'GB', 'TB'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider mb-1">Converted Result</span>
              <span className="text-2xl font-bold text-slate-900">
                {convertUnits(unitVal, unitCategory, fromUnit, toUnit).toFixed(4)} {toUnit}
              </span>
            </div>
          </div>
        )}

        {/* 10. DATE & AGE CALCULATOR */}
        {(tool.id === 'date-calculator' || tool.id === 'age-calculator') && (
          <div className="space-y-6">
            {tool.id === 'age-calculator' ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dobDate}
                    onChange={(e) => setDobDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                {(() => {
                  const age = calculateAge(dobDate);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                        <span className="text-xs text-slate-500 font-semibold block">Age</span>
                        <span className="text-xl font-bold text-slate-900">{age.years} yrs {age.months} mos</span>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                        <span className="text-xs text-slate-500 font-semibold block">Days</span>
                        <span className="text-xl font-bold text-slate-900">{age.days} days</span>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                        <span className="text-xs text-slate-500 font-semibold block">Next Birthday</span>
                        <span className="text-xl font-bold text-blue-600">In {age.daysToNextBirthday} days</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {(() => {
                  const diff = Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime());
                  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                  return (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider mb-1">Difference</span>
                      <span className="text-2xl font-bold text-slate-900">{days} Days</span>
                      <span className="text-xs text-slate-500 block mt-1">({(days / 7).toFixed(1)} weeks)</span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* 11. TIME CONVERTER */}
        {tool.id === 'time-converter' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">12-Hour Format (e.g. 02:30 PM)</label>
                <input
                  type="text"
                  value={timeInput12}
                  onChange={(e) => {
                    setTimeInput12(e.target.value);
                    const match = e.target.value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
                    if (match) {
                      let [_, h, m, ampm] = match;
                      let hr = parseInt(h, 10);
                      if (ampm.toUpperCase() === 'PM' && hr < 12) hr += 12;
                      if (ampm.toUpperCase() === 'AM' && hr === 12) hr = 0;
                      setTimeInput24(`${String(hr).padStart(2, '0')}:${m}`);
                    }
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono"
                  placeholder="02:30 PM"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">24-Hour Format (Military)</label>
                <input
                  type="text"
                  value={timeInput24}
                  onChange={(e) => {
                    setTimeInput24(e.target.value);
                    const match = e.target.value.match(/^(\d{1,2}):(\d{2})$/);
                    if (match) {
                      let [_, h, m] = match;
                      let hr = parseInt(h, 10);
                      const ampm = hr >= 12 ? 'PM' : 'AM';
                      let hr12 = hr % 12 || 12;
                      setTimeInput12(`${String(hr12).padStart(2, '0')}:${m} ${ampm}`);
                    }
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono"
                  placeholder="14:30"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Converted Time</span>
                <span className="font-mono text-lg font-bold text-slate-900">{timeInput12} = {timeInput24}</span>
              </div>
              <button
                onClick={() => copyToClipboard(`${timeInput12} / ${timeInput24}`)}
                className="p-2 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 12. PASSWORD GENERATOR */}
        {tool.id === 'password-generator' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl">
              <span className="font-mono text-lg tracking-wider font-bold break-all">{generatedPassword}</span>
              <button
                onClick={() => copyToClipboard(generatedPassword)}
                className="p-2 text-slate-300 hover:text-white cursor-pointer flex-shrink-0"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Length: {passLength} characters</span>
                  <span>Entropy: {passwordEntropy} bits</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={64}
                  value={passLength}
                  onChange={(e) => setPassLength(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={includeUpper} onChange={(e) => setIncludeUpper(e.target.checked)} />
                  <span>Uppercase (A-Z)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={includeLower} onChange={(e) => setIncludeLower(e.target.checked)} />
                  <span>Lowercase (a-z)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={includeNumbers} onChange={(e) => setIncludeNumbers(e.target.checked)} />
                  <span>Numbers (0-9)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={includeSymbols} onChange={(e) => setIncludeSymbols(e.target.checked)} />
                  <span>Symbols (!@#$)</span>
                </label>
              </div>

              <button
                onClick={refreshPassword}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Generate New Password</span>
              </button>
            </div>
          </div>
        )}

        {/* 13. UUID GENERATOR */}
        {tool.id === 'uuid-generator' && (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Quantity</label>
              <select
                value={uuidCount}
                onChange={(e) => setUuidCount(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-semibold"
              >
                <option value={1}>1 UUID</option>
                <option value={5}>5 UUIDs</option>
                <option value={10}>10 UUIDs</option>
                <option value={50}>50 UUIDs</option>
                <option value={100}>100 UUIDs</option>
              </select>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-500">Generated UUIDs</span>
                <button
                  onClick={() => copyToClipboard(uuidList.join('\n'))}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  {copied ? 'Copied All' : 'Copy List'}
                </button>
              </div>
              <div className="space-y-1 font-mono text-xs text-slate-800 max-h-48 overflow-y-auto">
                {uuidList.map((id, idx) => (
                  <div key={idx} className="p-1 hover:bg-slate-100 rounded">{id}</div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setUuidList(generateUUIDs(uuidCount))}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Generate Fresh UUIDs
            </button>
          </div>
        )}

        {/* 14. RANDOM NUMBER GENERATOR */}
        {tool.id === 'random-number-generator' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Min</label>
                <input
                  type="number"
                  value={randMin}
                  onChange={(e) => setRandMin(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Max</label>
                <input
                  type="number"
                  value={randMax}
                  onChange={(e) => setRandMax(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Quantity</label>
                <input
                  type="number"
                  value={randQty}
                  onChange={(e) => setRandQty(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="w-full p-2 border border-slate-200 rounded-md text-sm"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={randUnique}
                onChange={(e) => setRandUnique(e.target.checked)}
              />
              <span>Generate unique numbers only</span>
            </label>

            <button
              onClick={handleGenerateRandomNumbers}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Generate Random Numbers
            </button>

            {randResults.length > 0 && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Results</span>
                  <button
                    onClick={() => copyToClipboard(randResults.join(', '))}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    {copied ? 'Copied' : 'Copy Values'}
                  </button>
                </div>
                <div className="font-mono text-sm font-bold text-slate-900 break-all p-2 bg-white rounded-lg border border-slate-200">
                  {randResults.join(', ')}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
