import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Activity, 
  HardDrive, 
  Server, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Cpu, 
  Zap, 
  FileCheck 
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const [stats, setStats] = useState<any>({
    totalProcessedDocs: 14280,
    totalStorageVolumeGB: 34.8,
    activeWorkers: 4,
    uptimePercent: 99.98,
    conversionsToday: 1840,
    avgProcessingTimeMs: 420,
    toolUsage: [
      { name: 'PDF to Word Converter', count: 4890, percentage: 34 },
      { name: 'Merge & Split PDF', count: 3410, percentage: 24 },
      { name: 'Compress & Optimize PDF', count: 2150, percentage: 15 },
      { name: 'OCR Scanner & Text Extraction', count: 1890, percentage: 13 },
      { name: 'Image Converter & Compress', count: 1240, percentage: 9 },
      { name: 'Spreadsheet Converter', count: 700, percentage: 5 },
    ],
    recentJobs: [
      { id: 'job_883', tool: 'Compress PDF (Extreme)', status: 'Completed', latency: '480ms', timestamp: 'Just now' },
      { id: 'job_882', tool: 'Merge PDF (4 files)', status: 'Completed', latency: '210ms', timestamp: '1m ago' },
      { id: 'job_881', tool: 'OCR Table Extractor', status: 'Completed', latency: '820ms', timestamp: '2m ago' },
      { id: 'job_880', tool: 'PDF Watermark & Number', status: 'Completed', latency: '140ms', timestamp: '4m ago' },
      { id: 'job_879', tool: 'PDF to Word Reconstruct', status: 'Completed', latency: '350ms', timestamp: '6m ago' },
    ]
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">System Telemetry & Health</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">Platform Admin & Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Real-time cluster metrics, job queues, WebAssembly workers, and conversion pipeline throughput.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStats}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Processed Files</span>
            <HardDrive className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalProcessedDocs?.toLocaleString() || '14,280'}</p>
          <span className="text-[11px] text-emerald-600 font-semibold">+18.4% this month</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Conversions Today</span>
            <FileCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.conversionsToday?.toLocaleString() || '1,840'}</p>
          <span className="text-[11px] text-blue-600 font-semibold">High-speed WASM pipeline</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Latency</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.avgProcessingTimeMs || 420} ms</p>
          <span className="text-[11px] text-emerald-600 font-semibold">Real-time Node workers</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Uptime SLA</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.uptimePercent || 99.98}%</p>
          <span className="text-[11px] text-slate-400 font-medium">All systems operational</span>
        </div>

      </div>

      {/* 2-Column Section: Tool Popularity & Recent Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tool Popularity Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Tool Pipeline Breakdown</span>
          </h3>

          <div className="space-y-3.5">
            {stats.toolUsage?.map((t: any, i: number) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>{t.name}</span>
                  <span className="text-slate-500 font-mono">{t.count.toLocaleString()} ({t.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${t.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Queue & Job Logs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Live Worker Execution Log</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              Active Workers: {stats.activeWorkers || 4}
            </span>
          </div>

          <div className="space-y-2">
            {stats.recentJobs?.map((job: any) => (
              <div key={job.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{job.tool}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{job.id} • Latency: {job.latency}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {job.status}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{job.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
