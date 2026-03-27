"use client";

import React, { useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Chapter, StyleProfile } from '../types';
import { BookOpen, Plus, Upload, Trash2, Edit3, FileText, Settings, Terminal, CheckCircle2 } from 'lucide-react';

export default function Sidebar() {
  const { 
    chapters, setChapters, 
    activeChapterId, setActiveChapterId, 
    setConfirmDialog, setPromptDialog,
    setIsSettingsOpen, setIsConsoleOpen,
    worldState, setWorldState
  } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draggedChapterId = useRef<string | null>(null);

  const handleDragStart = (e: React.DragEvent, chapterId: string) => {
    draggedChapterId.current = chapterId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, volumeId: string | undefined) => {
    e.preventDefault();
    if (draggedChapterId.current) {
      const chapterId = draggedChapterId.current;
      setWorldState(prev => {
        const newVolumes = (prev.volumes || []).map(vol => ({
          ...vol,
          chapterIds: vol.chapterIds.filter(id => id !== chapterId)
        }));
        if (volumeId) {
          const targetVolIndex = newVolumes.findIndex(v => v.id === volumeId);
          if (targetVolIndex !== -1) {
            newVolumes[targetVolIndex].chapterIds.push(chapterId);
          }
        }
        return { ...prev, volumes: newVolumes };
      });
      draggedChapterId.current = null;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

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
          status: 'reading',
          characterIds: [],
          threadIds: []
        };
        setChapters(prev => [...prev, newChapter]);
        setActiveChapterId(newChapter.id);
      };
      reader.readAsText(file);
    }
  };

  const addChapter = (volumeId?: string) => {
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
            status: 'planning',
            characterIds: [],
            threadIds: []
          };
          setChapters(prev => [...prev, newChapter]);
          if (volumeId) {
            setWorldState(prev => ({
              ...prev,
              volumes: (prev.volumes || []).map(vol => vol.id === volumeId ? { ...vol, chapterIds: [...vol.chapterIds, newChapter.id] } : vol)
            }));
          }
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
        setWorldState(prev => ({
          ...prev,
          volumes: (prev.volumes || []).map(vol => ({
            ...vol,
            chapterIds: vol.chapterIds.filter(cid => cid !== id)
          }))
        }));
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

  const deleteVolume = (volumeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      message: '确定要删除这一卷吗？卷内的章节将变为未分类。',
      onConfirm: () => {
        setWorldState(prev => ({
          ...prev,
          volumes: prev.volumes.filter(v => v.id !== volumeId)
        }));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const editVolumeTitle = (volumeId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPromptDialog({
      isOpen: true,
      message: '请输入新的卷名称：',
      value: currentTitle,
      onConfirm: (newTitle) => {
        if (newTitle.trim()) {
          setWorldState(prev => ({
            ...prev,
            volumes: prev.volumes.map(v => v.id === volumeId ? { ...v, title: newTitle.trim() } : v)
          }));
        }
        setPromptDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="w-full bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800">
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-indigo-500/20 p-2 rounded-lg">
          <BookOpen className="w-5 h-5 text-indigo-400" />
        </div>
        <h1 className="font-bold text-slate-100 tracking-wide">AI 小说工作室</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2 mt-2 flex items-center justify-between">
          <span>目录</span>
          <button onClick={() => {
            setPromptDialog({
              isOpen: true, message: '请输入新卷名称：', value: '',
              onConfirm: (title) => {
                if (title.trim()) {
                  setWorldState(prev => ({
                    ...prev,
                    volumes: [...(prev.volumes || []), { id: `vol-${Date.now()}`, title: title.trim(), chapterIds: [] }]
                  }));
                }
                setPromptDialog(prev => ({ ...prev, isOpen: false }));
              }
            });
          }} className="hover:text-indigo-400"><Plus className="w-3 h-3"/></button>
        </div>
        
        {/* Volumes and Chapters */}
        <div className="space-y-4">
          {(worldState.volumes || []).map(volume => (
            <div key={volume.id} className="space-y-1" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, volume.id)}>
              <div className="px-2 text-xs font-bold text-slate-400 flex items-center justify-between group/vol">
                <span className="truncate flex-1 cursor-pointer hover:text-slate-200 transition-colors" onClick={(e) => editVolumeTitle(volume.id, volume.title, e)} title="点击修改卷名">
                  {volume.title}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover/vol:opacity-100 transition-opacity">
                  <button onClick={(e) => {
                    e.stopPropagation();
                    setPromptDialog({
                      isOpen: true,
                      message: `请输入"${volume.title}"的文风描述：`,
                      value: volume.styleProfile?.description || '',
                      onConfirm: (desc) => {
                        setWorldState(prev => ({
                          ...prev,
                          volumes: prev.volumes.map(v => v.id === volume.id ? { 
                            ...v, 
                            styleProfile: { ...v.styleProfile, description: desc.trim() } as StyleProfile 
                          } : v)
                        }));
                        setPromptDialog(prev => ({ ...prev, isOpen: false }));
                      }
                    });
                  }} className="hover:text-indigo-400 p-1" title="设置文风"><Settings className="w-3 h-3"/></button>
                  <button onClick={(e) => { e.stopPropagation(); addChapter(volume.id); }} className="hover:text-indigo-400 p-1" title="添加章节"><Plus className="w-3 h-3"/></button>
                  <button onClick={(e) => deleteVolume(volume.id, e)} className="hover:text-red-400 p-1" title="删除该卷"><Trash2 className="w-3 h-3"/></button>
                </div>
              </div>
              {volume.chapterIds.map(chapterId => {
                const chapter = chapters.find(ch => ch.id === chapterId);
                if (!chapter) return null;
                return (
                  <div
                    key={chapter.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, chapter.id)}
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
                      {chapter.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
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
                );
              })}
            </div>
          ))}
          
          {/* Chapters without volume */}
          {chapters.filter(ch => !worldState.volumes.some(v => v.chapterIds.includes(ch.id))).length > 0 && (
            <div className="space-y-1" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, undefined)}>
              <div className="px-2 text-xs font-bold text-slate-400">未分类</div>
              {chapters.filter(ch => !worldState.volumes.some(v => v.chapterIds.includes(ch.id))).map(chapter => (
                <div
                  key={chapter.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, chapter.id)}
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
                    {chapter.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
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
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={() => addChapter()}
          className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all hover:scale-110 active:scale-95 shadow-lg shadow-indigo-500/20"
          title="新建章节"
        >
          <Plus className="w-5 h-5" />
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
          className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-all hover:scale-110 active:scale-95"
          title="导入本地小说 (MD)"
        >
          <Upload className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-all hover:scale-110 active:scale-95"
          title="API 设置"
        >
          <Settings className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsConsoleOpen(true)}
          className="w-10 h-10 flex items-center justify-center bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-indigo-400 rounded-full transition-all hover:scale-110 active:scale-95 border border-slate-700/50"
          title="API 控制台"
        >
          <Terminal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
