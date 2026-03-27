"use client";

import React from 'react';
import { useAppContext } from '../context/AppContext';
import { X, Search, Settings, Loader2, CheckCircle2, AlertCircle, RotateCcw, RefreshCw, Book } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ApiConsole from './ApiConsole';

export default function Modals() {
  const { 
    confirmDialog, setConfirmDialog,
    alertDialog, setAlertDialog,
    promptDialog, setPromptDialog,
    isClearDataModalOpen, setIsClearDataModalOpen, handleClearData,
    rabbitHole, setRabbitHole,
    isSettingsOpen, setIsSettingsOpen,
    apiSettings, setApiSettings,
    testApiConnection, fetchModels,
    worldState, setWorldState
  } = useAppContext();

  const [testStatus, setTestStatus] = React.useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });
  const [fetchingModels, setFetchingModels] = React.useState(false);
  const [fetchedModels, setFetchedModels] = React.useState<string[]>([]);

  const handleFetchModels = async () => {
    setFetchingModels(true);
    try {
      const models = await fetchModels(apiSettings);
      if (models.length > 0) {
        setFetchedModels(models);
      } else {
        alert("未能获取到模型列表，请检查 API Key 和网络设置。");
      }
    } catch (error) {
      console.error("Fetch models error:", error);
    } finally {
      setFetchingModels(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingsOpen(false);
    setTestStatus({ loading: false });
  };

  const handleTestConnection = async () => {
    setTestStatus({ loading: true });
    const result = await testApiConnection(apiSettings);
    setTestStatus({ loading: false, success: result.success, message: result.message });
  };

  const handleResetSettings = () => {
    setApiSettings({
      provider: 'gemini',
      apiKey: '',
      baseUrl: '',
      model: 'gemini-3-flash-preview'
    });
    setTestStatus({ loading: false });
  };

  return (
    <>
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsSettingsOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5"/>
            </button>
            <h3 className="text-xl font-bold mb-4 text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" />
              API 设置
            </h3>
            
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API 提供商</label>
                <select
                  value={apiSettings.provider}
                  onChange={(e) => {
                    const provider = e.target.value as 'gemini' | 'openai';
                    setFetchedModels([]);
                    setApiSettings(prev => ({ 
                      ...prev, 
                      provider,
                      model: provider === 'gemini' ? 'gemini-3-flash-preview' : 'gpt-3.5-turbo'
                    }));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI / 兼容接口</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {apiSettings.provider === 'gemini' ? 'Gemini API Key' : 'API Key'}
                </label>
                <input
                  type="password"
                  value={apiSettings.apiKey}
                  onChange={(e) => setApiSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="输入您的 API Key"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {apiSettings.provider === 'gemini' ? '如果不填写，将尝试使用系统默认 Key。' : '必须填写您的 API Key。'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {apiSettings.provider === 'gemini' ? '自定义 API 代理地址 (可选)' : 'API 基础地址 (Base URL)'}
                </label>
                <input
                  type="text"
                  value={apiSettings.baseUrl}
                  onChange={(e) => setApiSettings(prev => ({ ...prev, baseUrl: e.target.value }))}
                  placeholder={apiSettings.provider === 'gemini' ? "例如: https://your-proxy.com" : "例如: https://api.openai.com/v1"}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {apiSettings.provider === 'gemini' ? '留空则使用官方地址。' : '留空则使用 OpenAI 默认地址。'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">模型选择</label>
                  <button
                    type="button"
                    onClick={handleFetchModels}
                    disabled={fetchingModels || !apiSettings.apiKey}
                    className="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    {fetchingModels ? (
                      <div className="w-2 h-2 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <RefreshCw size={10} />
                    )}
                    自动拉取模型
                  </button>
                </div>
                <div className="space-y-2">
                  <select
                    value={apiSettings.model}
                    onChange={(e) => setApiSettings(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    {apiSettings.provider === 'gemini' ? (
                      <>
                        <option value="gemini-3-flash-preview">Gemini 3 Flash (推荐)</option>
                        <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (更强但更慢)</option>
                        <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite (极速)</option>
                      </>
                    ) : (
                      <>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      </>
                    )}
                    {fetchedModels.length > 0 && (
                      <optgroup label="已拉取的模型">
                        {fetchedModels.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </optgroup>
                    )}
                    <option value="custom">自定义模型名称...</option>
                  </select>
                  
                  {(apiSettings.model === 'custom' || (apiSettings.provider === 'gemini' && !['gemini-3-flash-preview', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite-preview', ...fetchedModels].includes(apiSettings.model)) || (apiSettings.provider === 'openai' && !['gpt-3.5-turbo', 'gpt-4o', 'gpt-4-turbo', ...fetchedModels].includes(apiSettings.model))) ? (
                    <input
                      type="text"
                      value={apiSettings.model === 'custom' ? '' : apiSettings.model}
                      onChange={(e) => setApiSettings(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="输入自定义模型 ID"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : null}
                </div>
              </div>

              {testStatus.message && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${testStatus.success ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {testStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {testStatus.message}
                </div>
              )}

              <div className="pt-4 flex items-center justify-between">
                <button 
                  type="button"
                  onClick={handleResetSettings}
                  className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> 重置为默认
                </button>
                
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus.loading}
                    className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {testStatus.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    测试连接
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
                  >
                    保存并关闭
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Clear Data Modal */}
      {isClearDataModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-2 text-slate-900">清空所有数据？</h3>
            <p className="text-sm text-slate-600 mb-6">
              确定要清空所有数据吗？这将永久删除您的章节、大纲、世界设定和聊天记录。此操作不可恢复。
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsClearDataModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                取消
              </button>
              <button 
                onClick={handleClearData}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Confirm Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-2 text-slate-900">确认操作</h3>
            <p className="text-sm text-slate-600 mb-6">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                取消
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Alert Modal */}
      {alertDialog.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-2 text-slate-900">提示</h3>
            <p className="text-sm text-slate-600 mb-6">
              {alertDialog.message}
            </p>
            <div className="flex justify-end">
              <button 
                onClick={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
              >
                好的
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Prompt Modal */}
      {promptDialog.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-2 text-slate-900">需要输入</h3>
            <p className="text-sm text-slate-600 mb-4">
              {promptDialog.message}
            </p>
            <input
              type="text"
              autoFocus
              value={promptDialog.value}
              onChange={(e) => setPromptDialog(prev => ({ ...prev, value: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  promptDialog.onConfirm(promptDialog.value);
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-6"
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setPromptDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                取消
              </button>
              <button 
                onClick={() => promptDialog.onConfirm(promptDialog.value)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rabbit Hole Modal */}
      {rabbitHole && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
            <button 
              onClick={() => setRabbitHole(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5"/>
            </button>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-800">
              <Search className="w-5 h-5 text-purple-500"/> 
              {rabbitHole.term}
            </h3>
            <div className="prose prose-sm prose-slate max-w-none overflow-y-auto pr-2 flex-1">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{rabbitHole.explanation}</ReactMarkdown>
            </div>
            <div className="mt-6 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setRabbitHole(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                关闭
              </button>
              <button 
                onClick={() => {
                  setWorldState(prev => ({
                    ...prev,
                    lore: [...(prev.lore || []), {
                      id: `lore-${Date.now()}`,
                      concept: rabbitHole.term,
                      explanation: rabbitHole.explanation,
                      category: 'other'
                    }]
                  }));
                  setRabbitHole(null);
                  setAlertDialog({ isOpen: true, message: `已将 "${rabbitHole.term}" 保存至世界法典。` });
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
              >
                <Book className="w-4 h-4" />
                保存至法典
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Console */}
      <ApiConsole />
    </>
  );
}
