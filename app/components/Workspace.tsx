"use client";

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Chapter, Beat } from '../types';
import { Loader2, Play, CheckCircle2, Circle, Edit3, Save, Sparkles, BookOpen, PenTool, Search, Maximize2, Minimize2, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Workspace() {
  const { chapters, setChapters, activeChapterId, getAiClient, setAlertDialog, worldState, setRabbitHole, isDigging, setIsDigging, isPolishing, setIsPolishing } = useAppContext();
  const [activeTab, setActiveTab] = useState<'reader' | 'writer'>('reader');
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [polishResult, setPolishResult] = useState<{ original: string, polished: string } | null>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      if (activeTab !== 'reader' || isEditingContent) return;
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 0) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelection({
          text: sel.toString().trim(),
          x: rect.left + rect.width / 2,
          y: rect.top
        });
      } else {
        setSelection(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [activeTab, isEditingContent]);

  const handlePolish = async (type: 'expand' | 'rewrite' | 'shorten') => {
    if (!selection) return;
    const ai = getAiClient();
    if (!ai) return;
    setIsPolishing(true);
    try {
      let instruction = '';
      if (type === 'expand') instruction = '请扩写这段文字，增加丰富的感官细节（视觉、听觉、触觉等），贯彻 "Show, Don\'t Tell" 原则，增强画面感。';
      if (type === 'rewrite') instruction = '请重写这段文字，使其更具文学性，修辞更优美，人物情感更饱满，消除AI味。';
      if (type === 'shorten') instruction = '请缩写这段文字，保留核心信息，使其更加精炼、紧凑、有力。';
      
      const prompt = `你是一个顶级的文学编辑。${instruction}
      
      文风基调要求：${worldState.styleProfile || '无特殊要求'}
      
      原文本：
      "${selection.text}"
      
      请直接输出修改后的文本，不要包含任何解释、引号或标题。`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });
      setPolishResult({ original: selection.text, polished: response.text?.trim() || '' });
    } catch (error) {
      console.error(error);
      setAlertDialog({ isOpen: true, message: "润色失败，请重试。" });
    } finally {
      setIsPolishing(false);
    }
  };

  const applyPolish = () => {
    if (polishResult && activeChapter) {
      const newContent = activeChapter.content.replace(polishResult.original, polishResult.polished);
      updateChapter({ content: newContent });
      setEditedContent(newContent);
      setPolishResult(null);
      setSelection(null);
    }
  };

  const digRabbitHole = async () => {
    if (!selection) return;
    const term = selection.text;
    const ai = getAiClient();
    if (!ai) return;

    setIsDigging(true);
    try {
      const prompt = `你是一个知识渊博的向导。请解释以下名词或概念："${term}"。
      请保持简洁、有趣且易于理解。使用 Markdown 格式。
      
      当前章节上下文：
      ${activeChapter?.content.substring(0, 3000)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setRabbitHole({ term, explanation: response.text || "无法生成解释。" });
    } catch (error) {
      console.error(error);
      setAlertDialog({ isOpen: true, message: "生成解释失败，请重试。" });
    } finally {
      setIsDigging(false);
      setSelection(null);
    }
  };

  const activeChapter = chapters.find(ch => ch.id === activeChapterId);

  useEffect(() => {
    if (activeChapter) {
      setEditedContent(activeChapter.content);
    }
  }, [activeChapter]);

  if (!activeChapter) {
    return (
      <div className="flex-1 bg-slate-50 flex items-center justify-center text-slate-400 flex-col gap-4">
        <BookOpen className="w-16 h-16 opacity-20" />
        <p>请在左侧选择或新建一个章节开始创作</p>
      </div>
    );
  }

  const updateChapter = (updates: Partial<Chapter>) => {
    setChapters(prev => prev.map(ch => ch.id === activeChapter.id ? { ...ch, ...updates } : ch));
  };

  const handleSaveContent = () => {
    updateChapter({ content: editedContent });
    setIsEditingContent(false);
  };

  const planBeats = async () => {
    const ai = getAiClient();
    if (!ai) return;

    setIsPlanning(true);
    updateChapter({ status: 'planning' });

    try {
      const prompt = `你是一个顶级小说家和故事架构师。请根据以下世界观设定和前文内容，为当前章节构思一个精彩的大纲和 3-5 个场景节拍（细纲）。
      
      世界规则：${worldState.rules.join(' | ')}
      角色状态：${JSON.stringify(worldState.characters)}
      过去事件：${worldState.pastEvents.slice(-5).join(' | ')}
      文风基调：${worldState.styleProfile || '无特殊要求'}
      未回收的伏笔：${(worldState.threads || []).filter(t => t.status === 'open').map(t => t.title + ': ' + t.description).join(' | ') || '无'}
      
      当前章节标题：${activeChapter.title}
      
      请返回一个 JSON 对象，包含：
      1. "intent": 字符串，本章的宏观意图或核心冲突。
      2. "beats": 字符串数组，描述本章的 3-5 个具体场景节拍。
      
      要求：
      1. 必须使用中文输出，并且严格遵守 JSON 格式。
      2. 构思时，请尽量贴合【文风基调】。
      3. 视剧情发展情况，考虑是否在节拍中推进或回收【未回收的伏笔】。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              intent: { type: "STRING" },
              beats: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ["intent", "beats"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      if (result.beats && Array.isArray(result.beats)) {
        const newBeats: Beat[] = result.beats.map((desc: string, i: number) => ({
          id: `beat-${Date.now()}-${i}`,
          description: desc,
          status: 'pending'
        }));
        updateChapter({ intent: result.intent || '', beats: newBeats, status: 'drafting' });
      }
    } catch (error) {
      console.error(error);
      setAlertDialog({ isOpen: true, message: "生成大纲失败，请重试。" });
    } finally {
      setIsPlanning(false);
    }
  };

  const executeBeat = async (beatId: string) => {
    const ai = getAiClient();
    if (!ai) return;

    const beatIndex = activeChapter.beats.findIndex(b => b.id === beatId);
    if (beatIndex === -1) return;

    const beat = activeChapter.beats[beatIndex];
    setIsDrafting(true);

    const updatedBeats = [...activeChapter.beats];
    updatedBeats[beatIndex].status = 'drafting';
    updateChapter({ beats: updatedBeats });

    try {
      // Build previous context
      const currentIndex = chapters.findIndex(c => c.id === activeChapter.id);
      const previousChapters = chapters.slice(0, currentIndex);
      const previousContext = previousChapters.map(c => `【${c.title}】摘要/结尾: ${c.content.slice(-800)}`).join('\n');
      const currentChapterContext = activeChapter.content.slice(-1500);

      const prompt = `你是一个顶级小说家。请根据以下设定、前文上下文和当前场景节拍，撰写一段引人入胜的小说正文。
      
      世界规则：${worldState.rules.join(' | ')}
      角色状态：${JSON.stringify(worldState.characters)}
      文风基调：${worldState.styleProfile || '无特殊要求'}
      未回收的伏笔：${(worldState.threads || []).filter(t => t.status === 'open').map(t => t.title + ': ' + t.description).join(' | ') || '无'}
      
      前情提要：
      ${previousContext || '无'}
      
      本章意图：${activeChapter.intent}
      本章已有内容：
      ${currentChapterContext || '无'}
      
      当前需要撰写的节拍：${beat.description}
      
      要求：
      1. 必须使用中文输出。
      2. 严格遵循设定的【文风基调】，消除 AI 味。
      3. 贯彻 "Show, Don't Tell" (展示，而不是告知) 原则，增加画面感和感官细节。
      4. 承接上文语气，自然过渡，不要重复上文已经写过的内容。
      5. 如果当前节拍涉及到【未回收的伏笔】，请自然地将其融入正文中。
      6. 直接输出小说正文，不要包含任何多余的解释或标题。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });

      const generatedText = response.text || '';
      
      updatedBeats[beatIndex].status = 'completed';
      updateChapter({ 
        beats: updatedBeats,
        content: activeChapter.content + (activeChapter.content ? '\n\n' : '') + generatedText
      });
      
      // Auto-switch to reader tab to see the new content
      setActiveTab('reader');
      
    } catch (error) {
      console.error(error);
      setAlertDialog({ isOpen: true, message: "撰写节拍失败，请重试。" });
      updatedBeats[beatIndex].status = 'pending';
      updateChapter({ beats: updatedBeats });
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50 shrink-0">
        <h2 className="text-lg font-bold text-slate-800 truncate">{activeChapter.title}</h2>
        <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('reader')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'reader' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <BookOpen className="w-4 h-4" />
            正文阅读
          </button>
          <button
            onClick={() => setActiveTab('writer')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'writer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <PenTool className="w-4 h-4" />
            大纲与节拍
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          {activeTab === 'reader' ? (
            <div className="space-y-6">
              <div className="flex justify-end mb-4">
                {isEditingContent ? (
                  <button onClick={handleSaveContent} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                    <Save className="w-4 h-4" /> 保存正文
                  </button>
                ) : (
                  <button onClick={() => setIsEditingContent(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                    <Edit3 className="w-4 h-4" /> 编辑正文
                  </button>
                )}
              </div>

              {isEditingContent ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-[60vh] p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-serif text-lg leading-relaxed"
                  placeholder="在此输入正文..."
                />
              ) : (
                <div className="prose prose-lg prose-slate max-w-none font-serif leading-loose">
                  {activeChapter.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeChapter.content}</ReactMarkdown>
                  ) : (
                    <div className="text-slate-400 italic text-center py-20">
                      正文为空。你可以直接编辑，或者切换到“大纲与节拍”让 AI 为你撰写。
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Intent Section */}
              <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    本章大纲 (Intent)
                  </h3>
                  <button
                    onClick={planBeats}
                    disabled={isPlanning}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {isPlanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isPlanning ? 'AI 构思中...' : 'AI 构思大纲与节拍'}
                  </button>
                </div>
                
                {activeChapter.intent ? (
                  <textarea
                    value={activeChapter.intent}
                    onChange={(e) => updateChapter({ intent: e.target.value })}
                    className="w-full p-3 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-700 text-sm"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-indigo-400 italic">点击右上角按钮，让 AI 为你构思本章大纲和场景节拍。</p>
                )}
              </div>

              {/* Beats Section */}
              {activeChapter.beats.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">场景节拍 (Beats)</h3>
                  <div className="space-y-3">
                    {activeChapter.beats.map((beat, index) => (
                      <div key={beat.id} className={`p-4 rounded-xl border transition-all ${beat.status === 'completed' ? 'bg-green-50 border-green-200' : beat.status === 'drafting' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'}`}>
                        <div className="flex items-start gap-4">
                          <div className="mt-1">
                            {beat.status === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : beat.status === 'drafting' ? (
                              <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1">
                            <textarea
                              value={beat.description}
                              onChange={(e) => {
                                const newBeats = [...activeChapter.beats];
                                newBeats[index].description = e.target.value;
                                updateChapter({ beats: newBeats });
                              }}
                              className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-700 resize-none"
                              rows={2}
                            />
                          </div>
                          <button
                            onClick={() => executeBeat(beat.id)}
                            disabled={isDrafting || beat.status === 'completed'}
                            className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              beat.status === 'completed' 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            }`}
                          >
                            {beat.status === 'drafting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            {beat.status === 'completed' ? '已撰写' : 'AI 撰写'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Rabbit Hole Floating Button */}
      {selection && !polishResult && (
        <div 
          className="fixed z-40 transform -translate-x-1/2 -translate-y-full pb-2 flex gap-1 bg-white p-1.5 rounded-xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
          style={{ left: selection.x, top: selection.y }}
        >
          <button onMouseDown={(e) => e.preventDefault()} onClick={digRabbitHole} className="px-3 py-1.5 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-1.5 transition-colors">
            {isDigging ? <Loader2 className="w-4 h-4 text-purple-500 animate-spin" /> : <Search className="w-4 h-4 text-purple-500" />}
            {isDigging ? '挖掘中...' : '解释'}
          </button>
          <div className="w-px bg-slate-200 mx-1 my-1"></div>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => handlePolish('expand')} className="px-3 py-1.5 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-1.5 transition-colors">
            {isPolishing ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> : <Maximize2 className="w-4 h-4 text-blue-500" />}
            扩写细节
          </button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => handlePolish('rewrite')} className="px-3 py-1.5 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-1.5 transition-colors">
            {isPolishing ? <Loader2 className="w-4 h-4 text-amber-500 animate-spin" /> : <PenTool className="w-4 h-4 text-amber-500" />}
            深度重写
          </button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => handlePolish('shorten')} className="px-3 py-1.5 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-1.5 transition-colors">
            {isPolishing ? <Loader2 className="w-4 h-4 text-green-500 animate-spin" /> : <Minimize2 className="w-4 h-4 text-green-500" />}
            精简
          </button>
        </div>
      )}

      {/* Polish Result Modal */}
      {polishResult && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
              <Sparkles className="w-5 h-5 text-indigo-500"/> AI 润色建议
            </h3>
            <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">原文本</div>
                <div className="text-sm text-slate-600 whitespace-pre-wrap">{polishResult.original}</div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                <div className="text-xs font-bold text-indigo-400 uppercase mb-2">润色后</div>
                <div className="text-sm text-indigo-900 whitespace-pre-wrap">{polishResult.polished}</div>
              </div>
            </div>
            <div className="flex justify-end gap-3 shrink-0">
              <button onClick={() => setPolishResult(null)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2">
                <X className="w-4 h-4"/> 放弃
              </button>
              <button onClick={applyPolish} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2">
                <Check className="w-4 h-4"/> 应用修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
