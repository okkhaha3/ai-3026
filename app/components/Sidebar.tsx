"use client";

import React, { useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Chapter } from '../types';
import { BookOpen, Plus, Upload, Trash2, Edit3, FileText, Settings } from 'lucide-react';

export default function Sidebar() {
  const { chapters, setChapters, activeChapterId, setActiveChapterId, setConfirmDialog, setPromptDialog } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const newChapter: Chapter = {
          id: `ch-${Date.now()}`,
          title: file.name.replace('.md', ''),
          content: text,
          intent: '',
          beats: [],
          status: 'reading'
        };
        setChapters(prev => [...prev, newChapter]);
        setActiveChapterId(newChapter.id);
      };
      reader.readAsText(file);
    }
  };

  const addChapter = () => {
    setPromptDialog({
      isOpen: true,
      message: '请输入新章节标题：',
      value: '',
      onConfirm: (title) => {
        if (title.trim()) {
          const newChapter: Chapter = {
            id: `ch-${Date.now()}`,
            title: title.trim(),
            content: '',
            intent: '',
            beats: [],
            status: 'planning'
          };
          setChapters(prev => [...prev, newChapter]);
          setActiveChapterId(newChapter.id);
        }
        setPromptDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const deleteChapter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      message: '确定要删除此章节吗？此操作不可恢复。',
      onConfirm: () => {
        setChapters(prev => prev.filter(ch => ch.id !== id));
        if (activeChapterId === id) setActiveChapterId(null);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const editChapterTitle = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPromptDialog({
      isOpen: true,
      message: '修改章节标题：',
      value: currentTitle,
      onConfirm: (newTitle) => {
        if (newTitle.trim()) {
          setChapters(prev => prev.map(ch => ch.id === id ? { ...ch, title: newTitle.trim() } : ch));
        }
        setPromptDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800">
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-indigo-500/20 p-2 rounded-lg">
          <BookOpen className="w-5 h-5 text-indigo-400" />
        </div>
        <h1 className="font-bold text-slate-100 tracking-wide">AI 小说工作室</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2 mt-2">目录</div>
        
        {chapters.length === 0 ? (
          <div className="text-sm text-slate-500 px-2 py-4 text-center italic">
            暂无章节，请新建或导入。
          </div>
        ) : (
          chapters.map(chapter => (
            <div
              key={chapter.id}
              onClick={() => setActiveChapterId(chapter.id)}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                activeChapterId === chapter.id 
                  ? 'bg-indigo-500/10 text-indigo-300' 
                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 shrink-0 opacity-70" />
                <span className="truncate text-sm font-medium">{chapter.title}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => editChapterTitle(chapter.id, chapter.title, e)} className="p-1 hover:text-indigo-400 transition-colors">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={(e) => deleteChapter(chapter.id, e)} className="p-1 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <button
          onClick={addChapter}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建章节
        </button>
        
        <input
          type="file"
          accept=".md,.txt"
          onChange={handleFileUpload}
          ref={fileInputRef}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          导入本地小说 (MD)
        </button>
      </div>
    </div>
  );
}
