"use client";

import React from 'react';
import { useAppContext } from '../context/AppContext';
import { X, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Modals() {
  const { 
    confirmDialog, setConfirmDialog,
    alertDialog, setAlertDialog,
    promptDialog, setPromptDialog,
    isClearDataModalOpen, setIsClearDataModalOpen, handleClearData,
    rabbitHole, setRabbitHole
  } = useAppContext();

  return (
    <>
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
            <div className="prose prose-sm prose-slate max-w-none overflow-y-auto pr-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{rabbitHole.explanation}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
