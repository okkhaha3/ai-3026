"use client";

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Sparkles, Globe, Users, Book, MessageSquare, Loader2, Send, Plus, Trash2, Swords, Play, Target, CheckCircle2, Circle, PenTool } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AICompanion() {
  const { 
    worldState, setWorldState, 
    chapters, setChapters, 
    activeChapterId, setActiveChapterId,
    chatHistory, setChatHistory,
    isGeneratingWorld, setIsGeneratingWorld,
    getAiClient, setAlertDialog, setConfirmDialog, setPromptDialog,
    sandboxHistory, setSandboxHistory,
    isSimulating, setIsSimulating
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'forge' | 'world' | 'sandbox' | 'threads' | 'assistant'>('forge');
  const [worldPrompt, setWorldPrompt] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [sandboxCharA, setSandboxCharA] = useState('');
  const [sandboxCharB, setSandboxCharB] = useState('');
  const [sandboxScenario, setSandboxScenario] = useState('');

  const activeChapter = chapters.find(ch => ch.id === activeChapterId);

  const handleGenerateWorld = () => {
    if (!worldPrompt.trim()) return;

    if (chapters.length > 0 || worldState.characters.length > 1) {
      setConfirmDialog({
        isOpen: true,
        message: '当前已有章节或设定，重新生成将覆盖现有数据。确定要继续吗？',
        onConfirm: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          executeGenerateWorld();
        }
      });
    } else {
      executeGenerateWorld();
    }
  };

  const executeGenerateWorld = async () => {
    const ai = getAiClient();
    if (!ai) return;

    setIsGeneratingWorld(true);

    try {
      const prompt = `你是一个顶级小说家和世界观架构师。请根据以下一句话灵感，构建一个详细的世界观，并生成 3-5 章的故事大纲（包含每章的细纲节拍）。
      
      灵感："${worldPrompt}"
      
      请返回一个严格的 JSON 对象，包含以下字段：
      1. "rules": 字符串数组，核心世界法则。
      2. "ledger": 对象，包含 "time" (时间背景), "resources" (核心资源), "notes" (全局备注)。
      3. "characters": 对象数组，每个角色包含 "id", "name", "state", "knowledge", "location", "inventory"。
      4. "pastEvents": 字符串数组，过去发生的重大事件。
      5. "chapters": 对象数组，每章包含 "title" (标题), "intent" (本章意图), "beats" (3-5个场景节拍描述的字符串数组)。
      
      必须使用中文输出，并且严格遵守 JSON 格式。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              rules: { type: "ARRAY", items: { type: "STRING" } },
              ledger: { type: "OBJECT", properties: { time: { type: "STRING" }, resources: { type: "STRING" }, notes: { type: "STRING" } } },
              characters: { type: "ARRAY", items: { type: "OBJECT", properties: { id: { type: "STRING" }, name: { type: "STRING" }, state: { type: "STRING" }, knowledge: { type: "STRING" }, location: { type: "STRING" }, inventory: { type: "STRING" } } } },
              pastEvents: { type: "ARRAY", items: { type: "STRING" } },
              chapters: { type: "ARRAY", items: { type: "OBJECT", properties: { title: { type: "STRING" }, intent: { type: "STRING" }, beats: { type: "ARRAY", items: { type: "STRING" } } } } }
            },
            required: ["rules", "ledger", "characters", "pastEvents", "chapters"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      setWorldState(prev => ({
        ...prev,
        rules: result.rules || [],
        ledger: result.ledger || { time: '', resources: '', notes: '' },
        characters: result.characters || [],
        pastEvents: result.pastEvents || []
      }));

      if (result.chapters && Array.isArray(result.chapters)) {
        const newChapters = result.chapters.map((ch: any, i: number) => ({
          id: `ch-gen-${Date.now()}-${i}`,
          title: ch.title || `第 ${i + 1} 章`,
          content: '',
          intent: ch.intent || '',
          beats: (ch.beats || []).map((b: string, j: number) => ({
            id: `beat-gen-${Date.now()}-${i}-${j}`,
            description: b,
            status: 'pending'
          })),
          status: 'drafting'
        }));
        setChapters(newChapters);
        if (newChapters.length > 0) {
          setActiveChapterId(newChapters[0].id);
        }
      }
      
      setWorldPrompt('');
      setActiveTab('world');
      
    } catch (error) {
      console.error(error);
      setAlertDialog({ isOpen: true, message: '生成世界观失败，请检查 API Key 或重试。' });
    } finally {
      setIsGeneratingWorld(false);
    }
  };

  const runSandbox = async () => {
    if (!sandboxCharA || !sandboxCharB || !sandboxScenario.trim()) return;
    const ai = getAiClient();
    if (!ai) return;
    setIsSimulating(true);
    try {
      const charA = worldState.characters.find(c => c.id === sandboxCharA);
      const charB = worldState.characters.find(c => c.id === sandboxCharB);
      
      const prompt = `你是一个专业的小说编剧。请根据以下角色设定和冲突场景，推演一段这两个角色之间的对话对角戏（至少5-8个回合）。
      
      角色A：${charA?.name} (状态：${charA?.state}, 知识：${charA?.knowledge})
      角色B：${charB?.name} (状态：${charB?.state}, 知识：${charB?.knowledge})
      
      冲突/场景设定：${sandboxScenario}
      
      要求：
      1. 必须使用中文。
      2. 对话要符合人物性格，充满张力，不要说废话。
      3. 包含适当的神态和动作描写。
      4. 返回 JSON 格式，包含一个 "dialogues" 数组，每个元素有 "character" (角色名) 和 "text" (台词及动作描写)。`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              dialogues: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    character: { type: 'STRING' },
                    text: { type: 'STRING' }
                  }
                }
              }
            }
          }
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      if (result.dialogues) {
        setSandboxHistory(result.dialogues);
      }
    } catch (error) {
      console.error(error);
      setAlertDialog({ isOpen: true, message: '推演失败，请重试。' });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const ai = getAiClient();
    if (!ai) return;

    const userMsg = { id: Date.now().toString(), role: 'user' as const, text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatting(true);

    try {
      const prompt = `你是一个小说创作导师。请根据以下世界观和当前章节内容，回答用户的问题。
      
      世界规则：${worldState.rules.join(' | ')}
      当前章节：${activeChapter?.title || '无'}
      正文内容：${activeChapter?.content.substring(0, 2000) || '无'}
      
      用户问题：${userMsg.text}
      
      请使用中文，以导师的口吻给出专业、有建设性的回答。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const aiMsg = { id: (Date.now() + 1).toString(), role: 'model' as const, text: response.text || "抱歉，我无法回答这个问题。" };
      setChatHistory(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setAlertDialog({ isOpen: true, message: '发送消息失败，请重试。' });
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="w-80 bg-slate-50 border-l border-slate-200 flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white shrink-0">
        <button onClick={() => setActiveTab('forge')} className={`flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors ${activeTab === 'forge' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 创世
        </button>
        <button onClick={() => setActiveTab('world')} className={`flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors ${activeTab === 'world' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
          <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 设定
        </button>
        <button onClick={() => setActiveTab('sandbox')} className={`flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors ${activeTab === 'sandbox' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
          <Swords className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 推演
        </button>
        <button onClick={() => setActiveTab('threads')} className={`flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors ${activeTab === 'threads' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
          <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 伏笔
        </button>
        <button onClick={() => setActiveTab('assistant')} className={`flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors ${activeTab === 'assistant' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 导师
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'threads' && (
          <div className="flex flex-col h-full space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-amber-500"/> 伏笔追踪器
                </h3>
                <button onClick={() => {
                  setPromptDialog({
                    isOpen: true, message: '埋下新伏笔 (标题)：', value: '',
                    onConfirm: (val) => {
                      if (val.trim()) {
                        setWorldState(prev => ({
                          ...prev,
                          threads: [...(prev.threads || []), { id: `thread-${Date.now()}`, title: val.trim(), description: '待补充详细描述...', status: 'open' }]
                        }));
                      }
                      setPromptDialog(prev => ({ ...prev, isOpen: false }));
                    }
                  });
                }} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded"><Plus className="w-4 h-4"/></button>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                记录未解之谜和重要线索。AI 在构思大纲和撰写正文时，会自动考虑如何推进或回收这些伏笔。
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {(worldState.threads || []).length === 0 ? (
                <div className="text-center text-slate-400 text-sm italic mt-10">
                  暂无伏笔。点击右上角 + 号埋下第一个伏笔。
                </div>
              ) : (
                (worldState.threads || []).map(thread => (
                  <div key={thread.id} className={`bg-white rounded-xl border p-4 shadow-sm relative group transition-colors ${thread.status === 'resolved' ? 'border-green-200 bg-green-50/30' : 'border-slate-200'}`}>
                    <button onClick={() => setWorldState(prev => ({ ...prev, threads: prev.threads.filter(t => t.id !== thread.id) }))} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"><Trash2 className="w-3.5 h-3.5"/></button>
                    
                    <div className="flex items-start gap-3 pr-6">
                      <button 
                        onClick={() => {
                          setWorldState(prev => ({
                            ...prev,
                            threads: prev.threads.map(t => t.id === thread.id ? { ...t, status: t.status === 'open' ? 'resolved' : 'open' } : t)
                          }));
                        }}
                        className="mt-0.5 shrink-0"
                      >
                        {thread.status === 'resolved' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-400 transition-colors" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-sm mb-1 ${thread.status === 'resolved' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                          {thread.title}
                        </div>
                        <textarea
                          value={thread.description}
                          onChange={(e) => {
                            setWorldState(prev => ({
                              ...prev,
                              threads: prev.threads.map(t => t.id === thread.id ? { ...t, description: e.target.value } : t)
                            }));
                          }}
                          placeholder="详细描述这个伏笔..."
                          className={`w-full text-xs p-2 rounded border focus:ring-1 outline-none resize-none h-16 ${thread.status === 'resolved' ? 'bg-transparent border-transparent text-slate-400' : 'bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-indigo-400 text-slate-600'}`}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'sandbox' && (
          <div className="flex flex-col h-full space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm mb-3">
                <Swords className="w-4 h-4 text-rose-500"/> 角色对戏沙盒
              </h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <select value={sandboxCharA} onChange={(e) => setSandboxCharA(e.target.value)} className="flex-1 text-sm border border-slate-200 p-2 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none">
                    <option value="">选择角色 A</option>
                    {worldState.characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <span className="text-slate-400 self-center text-sm font-bold">VS</span>
                  <select value={sandboxCharB} onChange={(e) => setSandboxCharB(e.target.value)} className="flex-1 text-sm border border-slate-200 p-2 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none">
                    <option value="">选择角色 B</option>
                    {worldState.characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <textarea
                  value={sandboxScenario}
                  onChange={(e) => setSandboxScenario(e.target.value)}
                  placeholder="设定冲突或场景（例如：A想隐瞒真相，B步步紧逼...）"
                  className="w-full text-sm border border-slate-200 p-2 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none h-20 outline-none"
                />
                <button
                  onClick={runSandbox}
                  disabled={isSimulating || !sandboxCharA || !sandboxCharB || !sandboxScenario.trim()}
                  className="w-full py-2 bg-rose-50 text-rose-600 rounded-lg font-bold text-sm hover:bg-rose-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSimulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {isSimulating ? '推演中...' : '开始推演'}
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
              {sandboxHistory.length === 0 ? (
                <div className="text-center text-slate-400 text-sm italic mt-10">
                  设定角色和冲突，让 AI 为你推演剧情走向。
                </div>
              ) : (
                sandboxHistory.map((msg, idx) => {
                  const charA = worldState.characters.find(c => c.id === sandboxCharA);
                  const isCharA = msg.character === charA?.name;
                  return (
                    <div key={idx} className={`flex flex-col ${isCharA ? 'items-start' : 'items-end'}`}>
                      <span className="text-xs font-bold text-slate-400 mb-1 px-1">{msg.character}</span>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${isCharA ? 'bg-rose-50 text-rose-900 rounded-tl-none' : 'bg-slate-100 text-slate-800 rounded-tr-none'}`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'forge' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-200" />
                一键创世引擎
              </h3>
              <p className="text-indigo-100 text-sm mb-4 leading-relaxed">
                输入一句话灵感，AI 将为你构建完整的世界观法则、角色档案，并自动生成 3-5 章的详细节拍大纲。
              </p>
              <textarea
                value={worldPrompt}
                onChange={(e) => setWorldPrompt(e.target.value)}
                placeholder="例如：在一个赛博朋克与修仙结合的世界里，一个底层黑客意外获得了一本上古剑谱..."
                className="w-full h-32 p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-indigo-200/60 focus:ring-2 focus:ring-white/50 focus:border-transparent resize-none text-sm mb-4"
              />
              <button
                onClick={handleGenerateWorld}
                disabled={isGeneratingWorld || !worldPrompt.trim()}
                className="w-full py-2.5 bg-white text-indigo-600 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {isGeneratingWorld ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                {isGeneratingWorld ? '正在创世...' : '生成世界与大纲'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'world' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm mb-3">
                <PenTool className="w-4 h-4 text-indigo-500"/> 文风与基调 (Style Profile)
              </h3>
              <textarea
                value={worldState.styleProfile || ''}
                onChange={(e) => setWorldState(prev => ({ ...prev, styleProfile: e.target.value }))}
                placeholder="例如：古龙风，短句为主，肃杀，留白多；或者：细节繁复，注重心理描写，克苏鲁风格..."
                className="w-full text-sm border border-slate-200 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none h-24 outline-none text-slate-700"
              />
              <p className="text-xs text-slate-500 mt-2">
                AI 在撰写正文时，会严格遵循此处的文风设定，消除“AI 味”。
              </p>
            </div>

            {/* Rules */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><Book className="w-4 h-4 text-indigo-500"/> 世界法则</h3>
                <button onClick={() => {
                  setPromptDialog({
                    isOpen: true, message: '添加新法则：', value: '',
                    onConfirm: (val) => {
                      if (val.trim()) setWorldState(prev => ({ ...prev, rules: [...prev.rules, val.trim()] }));
                      setPromptDialog(prev => ({ ...prev, isOpen: false }));
                    }
                  });
                }} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded"><Plus className="w-4 h-4"/></button>
              </div>
              <ul className="space-y-2">
                {worldState.rules.map((rule, i) => (
                  <li key={i} className="text-sm text-slate-600 bg-slate-50 p-2 rounded flex justify-between group">
                    <span>{rule}</span>
                    <button onClick={() => setWorldState(prev => ({ ...prev, rules: prev.rules.filter((_, idx) => idx !== i) }))} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Characters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-indigo-500"/> 角色档案</h3>
                <button onClick={() => {
                  setPromptDialog({
                    isOpen: true, message: '添加新角色名称：', value: '',
                    onConfirm: (val) => {
                      if (val.trim()) setWorldState(prev => ({ ...prev, characters: [...prev.characters, { id: `char-${Date.now()}`, name: val.trim(), state: '正常', knowledge: '无', location: '未知', inventory: '空' }] }));
                      setPromptDialog(prev => ({ ...prev, isOpen: false }));
                    }
                  });
                }} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded"><Plus className="w-4 h-4"/></button>
              </div>
              <div className="space-y-3">
                {worldState.characters.map(char => (
                  <div key={char.id} className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 relative group">
                    <button onClick={() => setWorldState(prev => ({ ...prev, characters: prev.characters.filter(c => c.id !== char.id) }))} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
                    <div className="font-bold text-indigo-900 mb-1">{char.name}</div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-500">
                      <div><span className="text-slate-400">状态:</span> {char.state}</div>
                      <div><span className="text-slate-400">位置:</span> {char.location}</div>
                      <div className="col-span-2"><span className="text-slate-400">物品:</span> {char.inventory}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assistant' && (
          <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3 bg-indigo-50 border-b border-indigo-100">
              <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" /> AI 创作导师
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.length === 0 ? (
                <div className="text-center text-slate-400 text-sm italic mt-10">
                  有什么写作上的问题？随时问我。
                </div>
              ) : (
                chatHistory.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isChatting && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-500 p-3 rounded-2xl rounded-tl-none text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> 正在思考...
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-slate-100 bg-slate-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="向导师提问..."
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isChatting || !chatInput.trim()}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
