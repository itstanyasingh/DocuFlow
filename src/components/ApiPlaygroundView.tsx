import React, { useState } from 'react';
import { 
  Code2, 
  Terminal, 
  Copy, 
  Check, 
  Send, 
  Key, 
  Layers, 
  Globe, 
  ShieldCheck, 
  CheckCircle2, 
  BookOpen, 
  RefreshCw 
} from 'lucide-react';

export const ApiPlaygroundView: React.FC = () => {
  const [activeLang, setActiveLang] = useState<'curl' | 'python' | 'node'>('curl');
  const [selectedEndpoint, setSelectedEndpoint] = useState<'convert' | 'ocr' | 'merge' | 'compress'>('convert');
  const [apiKey, setApiKey] = useState('docuflow_live_sk_948194b8e2194a8');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const generateApiKey = () => {
    const newKey = 'docuflow_live_sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiKey(newKey);
  };

  const getCodeSnippet = () => {
    if (activeLang === 'curl') {
      if (selectedEndpoint === 'convert') {
        return `curl -X POST https://docuflow.api/v1/convert \\
  -H "Authorization: Bearer ${apiKey}" \\
  -F "file=@presentation.pdf" \\
  -F "targetFormat=docx"`;
      }
      if (selectedEndpoint === 'ocr') {
        return `curl -X POST https://docuflow.api/v1/ocr \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@receipt_scan.jpg" \\
  -F "extractTables=true"`;
      }
      if (selectedEndpoint === 'merge') {
        return `curl -X POST https://docuflow.api/v1/pdf/merge \\
  -H "Authorization: Bearer ${apiKey}" \\
  -F "files=@chapter1.pdf" \\
  -F "files=@chapter2.pdf"`;
      }
      return `curl -X POST https://docuflow.api/v1/pdf/compress \\
  -H "Authorization: Bearer ${apiKey}" \\
  -F "file=@report.pdf" \\
  -F "level=recommended"`;
    }

    if (activeLang === 'python') {
      return `import requests

API_KEY = "${apiKey}"
url = "https://docuflow.api/v1/${selectedEndpoint === 'convert' ? 'convert' : selectedEndpoint === 'ocr' ? 'ocr' : 'pdf/' + selectedEndpoint}"

headers = {
    "Authorization": f"Bearer {API_KEY}"
}

files = {
    "file": open("document.pdf", "rb")
}

response = requests.post(url, files=files, headers=headers)
print(response.json())`;
    }

    return `import { DocuFlowClient } from '@docuflow/sdk';

const docuflow = new DocuFlowClient({
  apiKey: '${apiKey}',
});

async function main() {
  const result = await docuflow.${selectedEndpoint === 'convert' ? 'convert' : selectedEndpoint === 'ocr' ? 'ocr' : 'pdf'}({
    file: './document.pdf',
  });

  console.log('Processed:', result);
}

main();`;
  };

  const handleTestRun = async () => {
    setIsRunning(true);
    setTestResponse(null);
    await new Promise(r => setTimeout(r, 500));

    if (selectedEndpoint === 'ocr') {
      setTestResponse(JSON.stringify({
        status: 'success',
        statusCode: 200,
        data: {
          fullText: "INVOICE #8912\nTOTAL: $142.50\nTAX: $11.40\nDATE: 2026-08-16",
          tablesDetected: 1,
          language: "en",
          confidenceScore: 0.98
        }
      }, null, 2));
    } else {
      setTestResponse(JSON.stringify({
        status: 'success',
        statusCode: 200,
        data: {
          jobId: "job_9481a7",
          downloadUrl: "https://docuflow.api/v1/downloads/processed_doc.pdf",
          fileSizeBytes: 249120,
          expiresInSeconds: 86400
        }
      }, null, 2));
    }
    setIsRunning(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex items-center gap-2 text-slate-400">
          <Code2 className="w-5 h-5 text-blue-400" />
          <span className="text-xs uppercase tracking-wider font-semibold">Developer Platform</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">DocuFlow REST API & SDKs</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Integrate high-speed PDF conversions, merge/split operations, and OCR text extraction directly into your backend, CI/CD pipeline, or application.
        </p>
      </div>

      {/* API Key Manager Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Your Live Secret API Key</h3>
          </div>
          <button
            type="button"
            onClick={generateApiKey}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Roll New Key
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={apiKey}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono text-slate-800"
          />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(apiKey);
              setCopiedKey(true);
              setTimeout(() => setCopiedKey(false), 2000);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Endpoint selector & Code View */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select API Endpoint</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'convert', label: 'POST /v1/convert' },
                { id: 'ocr', label: 'POST /v1/ocr' },
                { id: 'merge', label: 'POST /v1/pdf/merge' },
                { id: 'compress', label: 'POST /v1/pdf/compress' },
              ].map(ep => (
                <button
                  key={ep.id}
                  onClick={() => setSelectedEndpoint(ep.id as any)}
                  className={`p-2 rounded-lg text-xs font-mono font-semibold text-left border transition-all ${
                    selectedEndpoint === ep.id
                      ? 'bg-blue-50 border-blue-300 text-blue-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {ep.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language selector */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              {(['curl', 'python', 'node'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`px-3 py-1 rounded-md font-medium uppercase text-[11px] transition-colors ${
                    activeLang === lang ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-500'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(getCodeSnippet());
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Code Block */}
          <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-blue-300 overflow-x-auto shadow-inner border border-slate-800">
            <pre>{getCodeSnippet()}</pre>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleTestRun}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Send Live API Request</span>
            </button>
          </div>
        </div>

        {/* Right: Live Response Output */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-600" />
              <span>Response Payload</span>
            </span>
            {testResponse && (
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                HTTP 200 OK
              </span>
            )}
          </div>

          <div className="flex-1 bg-slate-950 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-y-auto min-h-[340px] shadow-inner border border-slate-800">
            {testResponse ? (
              <pre>{testResponse}</pre>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-center p-6">
                <p>Click "Send Live API Request" to test endpoint response with your active API key.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
