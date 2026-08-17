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
  AlignLeft
} from 'lucide-react';
import { ToolDefinition, ProcessedResult } from '../types';
import { 
  analyzeTextStatistics, 
  convertTextCase, 
  TextCaseType, 
  TextStatistics 
} from '../lib/textEngine';
import { 
  convertCsvToJson, 
  convertJsonToCsv, 
  formatJsonString, 
  validateJsonString 
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

  // 1. Text Counter & Case Converter
  const [rawText, setRawText] = useState(
    'DocuFlow provides fast, deterministic everyday tools for PDFs, documents, images, and data processing.'
  );
  const [textStats, setTextStats] = useState<TextStatistics | null>(null);
  const [selectedCase, setSelectedCase] = useState<TextCaseType>('uppercase');
  const [convertedText, setConvertedText] = useState('');

  // 2. CSV to JSON & JSON to CSV
  const [csvInput, setCsvInput] = useState('Name,Role,Department\nAlice,Developer,Engineering\nBob,Designer,Product');
  const [jsonCsvOutput, setJsonCsvOutput] = useState('');

  // 3. JSON Formatter & Validator
  const [rawJsonInput, setRawJsonInput] = useState('{"platform":"DocuFlow","tools":160,"no_ai":true,"status":"ready"}');
  const [formattedJsonOutput, setFormattedJsonOutput] = useState('');
  const [jsonValidation, setJsonValidation] = useState<{ valid: boolean; error?: string; line?: number; column?: number }>({ valid: true });

  // Recalculate text statistics
  useEffect(() => {
    if (
      tool.id === 'text-statistics' ||
      tool.id === 'word-counter' ||
      tool.id === 'character-counter' ||
      tool.id === 'line-counter' ||
      tool.id === 'remove-extra-spaces' ||
      tool.id === 'find-and-replace-text'
    ) {
      setTextStats(analyzeTextStatistics(rawText));
    }
  }, [tool.id, rawText]);

  // Recalculate case conversion
  useEffect(() => {
    if (tool.id === 'text-case-converter' || tool.id === 'case-converter') {
      setConvertedText(convertTextCase(rawText, selectedCase));
    }
  }, [tool.id, rawText, selectedCase]);

  // CSV to JSON / JSON to CSV / CSV Tools
  useEffect(() => {
    if (tool.id === 'csv-to-json') {
      try {
        const jsonArr = convertCsvToJson(csvInput);
        setJsonCsvOutput(JSON.stringify(jsonArr, null, 2));
      } catch (err: any) {
        setJsonCsvOutput(`[Error]: ${err?.message || 'Invalid CSV data'}`);
      }
    } else if (
      tool.id === 'json-to-csv' ||
      tool.id === 'csv-viewer' ||
      tool.id === 'csv-merger' ||
      tool.id === 'csv-splitter' ||
      tool.id === 'csv-to-excel' ||
      tool.id === 'excel-to-csv' ||
      tool.id === 'csv-to-xlsx' ||
      tool.id === 'xlsx-to-csv'
    ) {
      try {
        const csv = convertJsonToCsv(csvInput);
        setJsonCsvOutput(csv);
      } catch (err: any) {
        setJsonCsvOutput(`[Error]: ${err?.message || 'Invalid JSON format. Expected array of objects.'}`);
      }
    }
  }, [tool.id, csvInput]);

  // JSON Formatter / Validator
  useEffect(() => {
    if (tool.id === 'json-formatter' || tool.id === 'json-validator') {
      const validation = validateJsonString(rawJsonInput);
      setJsonValidation(validation);
      if (validation.valid) {
        try {
          setFormattedJsonOutput(formatJsonString(rawJsonInput, 2));
        } catch {
          setFormattedJsonOutput(rawJsonInput);
        }
      }
    }
  }, [tool.id, rawJsonInput]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTextFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
        
        {/* 1. Word Counter & Statistics */}
        {(tool.id === 'text-statistics' || tool.id === 'word-counter' || tool.id === 'character-counter' || tool.id === 'line-counter' || tool.id === 'remove-extra-spaces' || tool.id === 'find-and-replace-text') && textStats && (
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
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Input Text for Live Analysis</label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={6}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* 2. Text Case Converter */}
        {(tool.id === 'text-case-converter' || tool.id === 'case-converter') && (
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
                  onClick={() => copyToClipboard(convertedText)}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={convertedText}
                rows={3}
                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-800"
              />
            </div>
          </div>
        )}

        {/* 3. CSV to JSON & JSON to CSV */}
        {(tool.id === 'csv-to-json' || tool.id === 'json-to-csv' || tool.id === 'csv-viewer' || tool.id === 'csv-merger' || tool.id === 'csv-splitter' || tool.id === 'csv-to-excel' || tool.id === 'excel-to-csv' || tool.id === 'csv-to-xlsx' || tool.id === 'xlsx-to-csv') && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                {tool.id === 'csv-to-json' ? 'Input CSV Text (or paste spreadsheet rows)' : 'Input JSON Array (e.g. [{"name":"Alice"}])'}
              </label>
              <textarea
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                rows={5}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {tool.id === 'csv-to-json' ? 'Structured JSON Result' : 'CSV Spreadsheet Result'}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(jsonCsvOutput)}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadTextFile(
                        jsonCsvOutput,
                        tool.id === 'csv-to-json' ? 'data.json' : 'data.csv',
                        tool.id === 'csv-to-json' ? 'application/json' : 'text/csv'
                      )
                    }
                    className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 font-medium cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={jsonCsvOutput}
                rows={6}
                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
              />
            </div>
          </div>
        )}

        {/* 4. JSON Formatter & Validator */}
        {(tool.id === 'json-formatter' || tool.id === 'json-validator') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Validation Status</span>
              {jsonValidation.valid ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <Check className="w-3.5 h-3.5" />
                  <span>Valid JSON</span>
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-600">
                  Syntax Error (Line {jsonValidation.line}, Col {jsonValidation.column})
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Raw JSON Input</label>
              <textarea
                value={rawJsonInput}
                onChange={(e) => setRawJsonInput(e.target.value)}
                rows={4}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Formatted & Beautified JSON</label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(formattedJsonOutput)}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={formattedJsonOutput}
                rows={6}
                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
