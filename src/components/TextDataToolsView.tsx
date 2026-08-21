import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  Download, 
  ArrowLeft,
  FileCode,
  Type,
  Binary,
  TableProperties,
  Clock,
  Mic,
  AlignLeft,
  Upload,
  Search,
  Filter,
  FileText
} from 'lucide-react';
import { ToolDefinition, ProcessedResult } from '../types';
import { 
  calculateTextStats, 
  convertTextCase, 
  sortTextLines, 
  removeDuplicateLines, 
  cleanTextContent, 
  findAndReplaceText,
  TextStats,
  CaseType
} from '../lib/textEngine';
import { 
  formatJsonString, 
  minifyJsonString, 
  validateJsonString, 
  formatCsvString, 
  validateCsvString, 
  convertCsvToJson, 
  convertJsonToCsv 
} from '../lib/dataEngine';

interface TextDataToolsViewProps {
  tool: ToolDefinition;
  onBackToHome: () => void;
  onSaveToHistory: (result: ProcessedResult) => void;
}

export const TextDataToolsView: React.FC<TextDataToolsViewProps> = ({
  tool,
  onBackToHome,
  onSaveToHistory,
}) => {
  const [copied, setCopied] = useState(false);

  // 1. Text Tools State
  const [rawText, setRawText] = useState('DocuFlow is a fast, local-first document and utility platform processing files directly in your browser.');
  const [textStats, setTextStats] = useState<TextStats | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseType>('uppercase');
  const [caseResult, setCaseResult] = useState('');
  
  // Sort State
  const [sortMode, setSortMode] = useState<'a-z' | 'z-a' | 'num-asc' | 'num-desc'>('a-z');
  const [sortRemoveDupes, setSortRemoveDupes] = useState(false);

  // Find & Replace State
  const [findStr, setFindStr] = useState('');
  const [replaceStr, setReplaceStr] = useState('');
  const [findCaseSensitive, setFindCaseSensitive] = useState(false);
  const [replaceMatchCount, setReplaceMatchCount] = useState(0);

  // Text Cleaner State
  const [cleanExtraSpaces, setCleanExtraSpaces] = useState(true);
  const [cleanEmptyLines, setCleanEmptyLines] = useState(true);
  const [cleanTrimLines, setCleanTrimLines] = useState(true);

  // Text Reverse State
  const [reverseMode, setReverseMode] = useState<'text' | 'lines' | 'words'>('text');

  // Text Diff State
  const [diffText1, setDiffText1] = useState('Hello World\nWelcome to DocuFlow\nFast browser tools');
  const [diffText2, setDiffText2] = useState('Hello World!\nWelcome to DocuFlow App\nFast browser utilities');

  // TXT File State
  const [uploadedTxtName, setUploadedTxtName] = useState('');

  // 2. Data Tools State
  const [jsonInput, setJsonInput] = useState('{\n  "name": "DocuFlow",\n  "tools": 62,\n  "localProcessing": true\n}');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState('');
  
  const [csvInput, setCsvInput] = useState('ID,Name,Role,City\n1,Alice,Developer,New York\n2,Bob,Designer,London\n3,Charlie,Product,Tokyo');
  const [csvTableData, setCsvTableData] = useState<{ headers: string[]; rows: string[][] }>({ headers: [], rows: [] });

  // Clipboard Helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download File Helper
  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Recalculate text statistics
  useEffect(() => {
    if (tool.id === 'word-counter' || tool.id === 'text-statistics') {
      setTextStats(calculateTextStats(rawText));
    }
  }, [tool.id, rawText]);

  // Recalculate Case Conversion
  useEffect(() => {
    if (tool.id === 'case-converter') {
      setCaseResult(convertTextCase(rawText, selectedCase));
    }
  }, [tool.id, rawText, selectedCase]);

  // JSON Formatting / Minifying / Validating / Viewing
  useEffect(() => {
    if (tool.id === 'json-formatter' || tool.id === 'json-viewer') {
      const res = formatJsonString(jsonInput, 2);
      if (res.isValid) {
        setJsonOutput(res.result);
        setJsonError('');
      } else {
        setJsonOutput('');
        setJsonError(res.error || 'Invalid JSON format');
      }
    } else if (tool.id === 'json-validator') {
      const val = validateJsonString(jsonInput);
      if (val.isValid) {
        setJsonOutput('Valid JSON! No syntax errors detected.');
        setJsonError('');
      } else {
        setJsonOutput('');
        setJsonError(`Syntax Error (Line ${val.errorLine || 1}, Col ${val.errorColumn || 1}): ${val.error}`);
      }
    } else if (tool.id === 'json-minifier') {
      const res = minifyJsonString(jsonInput);
      if (res.isValid) {
        setJsonOutput(res.result);
        setJsonError('');
      } else {
        setJsonOutput('');
        setJsonError(res.error || 'Invalid JSON format');
      }
    } else if (tool.id === 'json-to-csv') {
      try {
        const csv = convertJsonToCsv(jsonInput);
        setJsonOutput(csv);
        setJsonError('');
      } catch (err: any) {
        setJsonOutput('');
        setJsonError(err.message || 'Error converting JSON to CSV');
      }
    }
  }, [tool.id, jsonInput]);

  // CSV Formatting / Viewing / Cleaning / JSON Conversion
  useEffect(() => {
    if (tool.id === 'csv-viewer' || tool.id === 'csv-cleaner') {
      const { headers, rows } = formatCsvString(csvInput);
      setCsvTableData({ headers, rows });
    } else if (tool.id === 'csv-to-json') {
      try {
        const jsonArr = convertCsvToJson(csvInput);
        setJsonOutput(JSON.stringify(jsonArr, null, 2));
        setJsonError('');
      } catch (err: any) {
        setJsonOutput('');
        setJsonError(err.message || 'Error converting CSV to JSON');
      }
    }
  }, [tool.id, csvInput]);

  // File Upload Handler for TXT Viewer
  const handleTxtFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedTxtName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setRawText(event.target?.result as string || '');
    };
    reader.readAsText(file);
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

        {/* 1. WORD COUNTER */}
        {tool.id === 'word-counter' && textStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
                <span className="text-xs text-slate-500 font-semibold uppercase">Words</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{textStats.words}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
                <span className="text-xs text-slate-500 font-semibold uppercase">Characters</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{textStats.characters}</p>
                <span className="text-[10px] text-slate-400">({textStats.charactersNoSpaces} no spaces)</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
                <span className="text-xs text-slate-500 font-semibold uppercase">Lines</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{textStats.lines}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
                <span className="text-xs text-slate-500 font-semibold uppercase">Paragraphs</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{textStats.paragraphs}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs text-slate-700">
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Reading Time: ~{textStats.readingTimeMinutes} min</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Mic className="w-4 h-4 text-blue-600" />
                <span>Speaking Time: ~{textStats.speakingTimeMinutes} min</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <AlignLeft className="w-4 h-4 text-blue-600" />
                <span>Avg Word: {textStats.avgWordLength} chars</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Enter or Paste Text:</label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={6}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* 2. CASE CONVERTER */}
        {tool.id === 'case-converter' && (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Original Text</label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">Target Case Format</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'uppercase', label: 'UPPERCASE' },
                  { id: 'lowercase', label: 'lowercase' },
                  { id: 'title', label: 'Title Case' },
                  { id: 'sentence', label: 'Sentence case' },
                  { id: 'camel', label: 'camelCase' },
                  { id: 'snake', label: 'snake_case' },
                  { id: 'kebab', label: 'kebab-case' },
                  { id: 'constant', label: 'CONSTANT_CASE' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCase(c.id as any)}
                    className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                      selectedCase === c.id
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Converted Output</label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(caseResult)}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={caseResult}
                rows={3}
                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-800"
              />
            </div>
          </div>
        )}

        {/* 3. REMOVE EXTRA SPACES */}
        {tool.id === 'remove-extra-spaces' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Input Text</label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={4}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            {(() => {
              const cleaned = cleanTextContent(rawText, { removeExtraSpaces: true, trimLines: true });
              return (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Cleaned Text (Spaces Normalized)</label>
                    <button
                      onClick={() => copyToClipboard(cleaned)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      {copied ? 'Copied' : 'Copy Cleaned Text'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={cleaned}
                    rows={4}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              );
            })()}
          </div>
        )}

        {/* 4. REMOVE DUPLICATE LINES */}
        {tool.id === 'remove-duplicate-lines' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Input Lines</label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={4}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            {(() => {
              const deduplicated = removeDuplicateLines(rawText, true);
              const originalLines = rawText.split('\n').length;
              const uniqueLines = deduplicated.split('\n').length;
              return (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-600">Unique Lines: {uniqueLines} (Removed {originalLines - uniqueLines} duplicate lines)</span>
                    <button
                      onClick={() => copyToClipboard(deduplicated)}
                      className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      {copied ? 'Copied' : 'Copy Deduplicated Lines'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={deduplicated}
                    rows={4}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              );
            })()}
          </div>
        )}

        {/* 5. TEXT SORTER */}
        {tool.id === 'text-sorter' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as any)}
                className="p-2 border border-slate-200 rounded-lg text-xs font-semibold"
              >
                <option value="a-z">Sort A to Z</option>
                <option value="z-a">Sort Z to A</option>
                <option value="num-asc">Numeric Ascending</option>
                <option value="num-desc">Numeric Descending</option>
              </select>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sortRemoveDupes}
                  onChange={(e) => setSortRemoveDupes(e.target.checked)}
                />
                <span>Remove Duplicates</span>
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Input Lines</label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={4}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            {(() => {
              const sorted = sortTextLines(rawText, sortMode, sortRemoveDupes);
              return (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Sorted Output</label>
                    <button
                      onClick={() => copyToClipboard(sorted)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      {copied ? 'Copied' : 'Copy Sorted Lines'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={sorted}
                    rows={4}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              );
            })()}
          </div>
        )}

        {/* 6. FIND AND REPLACE */}
        {tool.id === 'find-and-replace' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Find String</label>
                <input
                  type="text"
                  value={findStr}
                  onChange={(e) => setFindStr(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="Find..."
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Replace With</label>
                <input
                  type="text"
                  value={replaceStr}
                  onChange={(e) => setReplaceStr(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="Replace with..."
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={findCaseSensitive}
                onChange={(e) => setFindCaseSensitive(e.target.checked)}
              />
              <span>Case Sensitive Matching</span>
            </label>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Original Text</label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={4}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            {(() => {
              const { resultText, matchCount } = findAndReplaceText(rawText, findStr, replaceStr, findCaseSensitive);
              return (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Replaced Result ({matchCount} replacements made)</label>
                    <button
                      onClick={() => copyToClipboard(resultText)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      {copied ? 'Copied' : 'Copy Result'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={resultText}
                    rows={4}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              );
            })()}
          </div>
        )}

        {/* 7. TEXT CLEANER */}
        {tool.id === 'text-cleaner' && (
          <div className="space-y-4">
            <div className="flex gap-4 text-xs font-semibold text-slate-700">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={cleanExtraSpaces} onChange={(e) => setCleanExtraSpaces(e.target.checked)} />
                <span>Remove Extra Spaces</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={cleanEmptyLines} onChange={(e) => setCleanEmptyLines(e.target.checked)} />
                <span>Remove Empty Lines</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={cleanTrimLines} onChange={(e) => setCleanTrimLines(e.target.checked)} />
                <span>Trim Lines</span>
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Input Text</label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={4}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            {(() => {
              const cleaned = cleanTextContent(rawText, {
                removeExtraSpaces: cleanExtraSpaces,
                removeEmptyLines: cleanEmptyLines,
                trimLines: cleanTrimLines,
                normalizeLineBreaks: true
              });
              return (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Cleaned Text Output</label>
                    <button
                      onClick={() => copyToClipboard(cleaned)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      {copied ? 'Copied' : 'Copy Cleaned Text'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={cleaned}
                    rows={4}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              );
            })()}
          </div>
        )}

        {/* 8. TEXT REVERSE */}
        {tool.id === 'text-reverse' && (
          <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setReverseMode('text')}
                className={`flex-1 py-1 rounded cursor-pointer ${reverseMode === 'text' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600'}`}
              >
                Entire Text
              </button>
              <button
                onClick={() => setReverseMode('lines')}
                className={`flex-1 py-1 rounded cursor-pointer ${reverseMode === 'lines' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600'}`}
              >
                Line Order
              </button>
              <button
                onClick={() => setReverseMode('words')}
                className={`flex-1 py-1 rounded cursor-pointer ${reverseMode === 'words' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600'}`}
              >
                Word Order
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Input Text</label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={4}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            {(() => {
              let reversed = '';
              if (reverseMode === 'text') reversed = rawText.split('').reverse().join('');
              if (reverseMode === 'lines') reversed = rawText.split('\n').reverse().join('\n');
              if (reverseMode === 'words') reversed = rawText.split(' ').reverse().join(' ');
              return (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Reversed Output</label>
                    <button
                      onClick={() => copyToClipboard(reversed)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      {copied ? 'Copied' : 'Copy Reversed Text'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={reversed}
                    rows={4}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              );
            })()}
          </div>
        )}

        {/* 9. TEXT TO TXT & 10. TXT VIEWER */}
        {(tool.id === 'text-to-txt' || tool.id === 'txt-viewer') && (
          <div className="space-y-4">
            {tool.id === 'txt-viewer' && (
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 relative cursor-pointer">
                <input
                  type="file"
                  accept=".txt,text/plain"
                  onChange={handleTxtFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800">Upload a .TXT file to view and edit</p>
                {uploadedTxtName && <p className="text-xs font-mono text-blue-600 mt-1">{uploadedTxtName}</p>}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Text Content</label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={6}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => downloadFile(rawText, 'document.txt', 'text/plain')}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download as .TXT</span>
              </button>
              <button
                onClick={() => copyToClipboard(rawText)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-semibold cursor-pointer"
              >
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            </div>
          </div>
        )}

        {/* 11. TEXT DIFF */}
        {tool.id === 'text-diff' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Original Text (Text 1)</label>
                <textarea
                  value={diffText1}
                  onChange={(e) => setDiffText1(e.target.value)}
                  rows={6}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Modified Text (Text 2)</label>
                <textarea
                  value={diffText2}
                  onChange={(e) => setDiffText2(e.target.value)}
                  rows={6}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Line Differences</span>
              <div className="space-y-1 font-mono text-xs">
                {(() => {
                  const l1 = diffText1.split('\n');
                  const l2 = diffText2.split('\n');
                  const maxL = Math.max(l1.length, l2.length);
                  const diffs = [];

                  for (let i = 0; i < maxL; i++) {
                    const line1 = l1[i] ?? '';
                    const line2 = l2[i] ?? '';
                    if (line1 !== line2) {
                      diffs.push(
                        <div key={i} className="p-2 bg-amber-50 border-l-4 border-amber-500 rounded text-slate-800">
                          <span className="font-bold text-amber-800 block mb-0.5">Line {i + 1}:</span>
                          <div className="text-red-600 line-through">- {line1 || '(empty)'}</div>
                          <div className="text-emerald-600">+ {line2 || '(empty)'}</div>
                        </div>
                      );
                    }
                  }

                  if (diffs.length === 0) {
                    return <div className="p-3 text-emerald-700 bg-emerald-50 rounded text-xs font-semibold">Both texts are identical! No differences found.</div>;
                  }

                  return diffs;
                })()}
              </div>
            </div>
          </div>
        )}

        {/* DATA TOOLS (JSON & CSV) */}
        {(tool.id === 'json-formatter' || tool.id === 'json-validator' || tool.id === 'json-minifier' || tool.id === 'json-viewer' || tool.id === 'json-to-csv') && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Input JSON String</label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={6}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            {jsonError ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-mono text-red-700">
                {jsonError}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">Processed JSON Output</label>
                  <button
                    onClick={() => copyToClipboard(jsonOutput)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    {copied ? 'Copied' : 'Copy Output'}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={jsonOutput}
                  rows={6}
                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>
            )}
          </div>
        )}

        {(tool.id === 'csv-viewer' || tool.id === 'csv-to-json' || tool.id === 'csv-cleaner') && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Input CSV Text</label>
              <textarea
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                rows={5}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            {tool.id === 'csv-to-json' ? (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">JSON Array Output</label>
                  <button
                    onClick={() => copyToClipboard(jsonOutput)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    {copied ? 'Copied' : 'Copy Output'}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={jsonOutput}
                  rows={6}
                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      {csvTableData.headers.map((h, i) => (
                        <th key={i} className="p-3 font-bold text-slate-700">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvTableData.rows.map((r, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-slate-100 hover:bg-slate-50/80">
                        {r.map((cell, cellIndex) => (
                          <td key={cellIndex} className="p-3 text-slate-800">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
