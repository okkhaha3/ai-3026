"use client";

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ApiLog } from '../types';
import { X, Terminal, ChevronRight, ChevronDown, Clock, Cpu, CheckCircle2, AlertCircle, Trash2, Search, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ApiConsole() {
  const { isConsoleOpen, setIsConsoleOpen, apiLogs, clearApiLogs } = useAppContext();
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isConsoleOpen) return null;

  const filteredLogs = apiLogs.filter(log => 
    log.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.request.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.response.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-300 font-mono"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Terminal className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">API 控制台</h2>
              <p className="text-xs text-slate-400">实时监控 AI 请求与响应数据</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="搜索请求或响应..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
              />
            </div>
            <button 
              onClick={clearApiLogs}
              className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
              title="清空日志"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsConsoleOpen(false)}
              className="p-2 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Log List */}
          <div className="w-1/3 border-r border-slate-700 overflow-y-auto bg-slate-950/30">
            {filteredLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                <Terminal className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">暂无 API 日志</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {filteredLogs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={`w-full text-left p-4 hover:bg-slate-800/50 transition-colors relative ${selectedLogId === log.id ? 'bg-indigo-500/10 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${log.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {log.status}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-200 truncate mb-1">
                      {log.model}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {log.duration}ms</span>
                      <span className="flex items-center gap-1 uppercase"><Cpu className="w-3 h-3" /> {log.provider}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Log Details */}
          <div className="flex-1 overflow-y-auto bg-slate-900 p-6">
            <AnimatePresence mode="wait">
              {selectedLogId ? (
                <LogDetails 
                  key={selectedLogId} 
                  log={apiLogs.find(l => l.id === selectedLogId)!} 
                  onCopy={handleCopy}
                  copiedId={copiedId}
                />
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-slate-500"
                >
                  <ChevronRight className="w-12 h-12 mb-4 opacity-20" />
                  <p>选择一条日志查看详情</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function LogDetails({ log, onCopy, copiedId }: { log: ApiLog, onCopy: (text: string, id: string) => void, copiedId: string | null }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      {/* Metadata */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
          <div className="text-[10px] text-slate-500 uppercase mb-1">Provider</div>
          <div className="text-sm font-bold text-indigo-400 uppercase">{log.provider}</div>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
          <div className="text-[10px] text-slate-500 uppercase mb-1">Model</div>
          <div className="text-sm font-bold text-white truncate">{log.model}</div>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
          <div className="text-[10px] text-slate-500 uppercase mb-1">Duration</div>
          <div className="text-sm font-bold text-amber-400">{log.duration}ms</div>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
          <div className="text-[10px] text-slate-500 uppercase mb-1">Status</div>
          <div className="flex items-center gap-2">
            {log.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span className={`text-sm font-bold uppercase ${log.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>{log.status}</span>
          </div>
        </div>
      </div>

      {/* Request Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
            <ChevronDown className="w-4 h-4" /> Request Payload
          </h3>
          <button 
            onClick={() => onCopy(JSON.stringify(log.request, null, 2), 'req')}
            className="p-1.5 hover:bg-slate-700 rounded-md transition-colors text-slate-500 hover:text-white"
          >
            {copiedId === 'req' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-x-auto">
          <pre className="text-xs text-indigo-300 leading-relaxed">
            {JSON.stringify(log.request, null, 2)}
          </pre>
        </div>
      </section>

      {/* Response Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
            <ChevronDown className="w-4 h-4" /> Response Data
          </h3>
          <button 
            onClick={() => onCopy(log.status === 'success' ? log.response : (log.error || ''), 'res')}
            className="p-1.5 hover:bg-slate-700 rounded-md transition-colors text-slate-500 hover:text-white"
          >
            {copiedId === 'res' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className={`bg-slate-950 rounded-xl p-4 border ${log.status === 'success' ? 'border-slate-800' : 'border-rose-900/50'} overflow-x-auto`}>
          {log.status === 'success' ? (
            <pre className="text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap">
              {log.response}
            </pre>
          ) : (
            <div className="text-xs text-rose-400 font-bold">
              Error: {log.error}
            </div>
          )}
        </div>
      </section>

      {/* Raw Prompt (if available) */}
      {log.request.prompt && (
        <section>
          <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
            <ChevronDown className="w-4 h-4" /> Raw Prompt
          </h3>
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs text-slate-400 leading-relaxed whitespace-pre-wrap italic">
            {log.request.prompt}
          </div>
        </section>
      )}
    </motion.div>
  );
}
