"use client";

import React, { useState } from 'react';
import { useAppContext, DEFAULT_WORLD_STATE } from '../context/AppContext';
import { Chapter } from '../types';
import { 
  Sparkles, Globe, Users, Book, MessageSquare, Loader2, Send, Plus, Trash2, 
  Swords, Play, Target, CheckCircle2, Circle, PenTool, BookOpen, 
  Sliders, Zap, Ban, Eye, History, ChevronDown, ChevronUp, Save, FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AICompanion() {
  const { 
    worldState, setWorldState, 
    chapters, setChapters, 
    activeChapterId, setActiveChapterId,
    chatHistory, setChatHistory,
    isGeneratingWorld, setIsGeneratingWorld,
    isExtracting, setIsExtracting,
    getOpenAiClient, callAi, setAlertDialog, setConfirmDialog, setPromptDialog,
    sandboxHistory, setSandboxHistory,
    isSimulating, setIsSimulating,
    apiSettings, getStylePrompt, extractJson
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'forge' | 'world' | 'sandbox' | 'threads' | 'assistant'>('forge');
  const [activeSubTab, setActiveSubTab] = useState<'core' | 'relationships' | 'lore' | 'style' | 'rhythm'>('core');
  const [worldPrompt, setWorldPrompt] = useState('');
  const [numChapters, setNumChapters] = useState(5);
  const [numVolumes, setNumVolumes] = useState(1);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [sandboxCharA, setSandboxCharA] = useState('');
  const [sandboxCharB, setSandboxCharB] = useState('');
  const [sandboxThreadId, setSandboxThreadId] = useState('');
  const [sandboxScenario, setSandboxScenario] = useState('');
  const [sampleText, setSampleText] = useState('');
  const [isAnalyzingSample, setIsAnalyzingSample] = useState(false);
  const [showSampleInput, setShowSampleInput] = useState(false);

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
    setIsGeneratingWorld(true);

    try {
      const prompt = `你是一个顶级小说家和世界观架构师。请根据以下一句话灵感，构建一个详细的世界观，并生成故事大纲。
      
      【严格要求】
      - 必须生成且仅生成 ${numVolumes} 卷 (volumes)。
      - 所有卷中的章节 (chapters) 总数加起来必须严格等于 ${numChapters} 章。
      - 例如，如果分为 2 卷，共 10 章，则每卷可以有 5 章。不要把卷的标题作为章节的标题。

      灵感："${worldPrompt}"
      
      ${getStylePrompt()}
      
      请返回一个严格的 JSON 对象，包含以下字段：
      1. "rules": 字符串数组，核心世界法则。
      2. "ledger": 对象，包含 "time" (时间背景), "resources" (核心资源), "notes" (全局备注)。
      3. "characters": 对象数组，每个角色包含 "id", "name", "role" (protagonist/antagonist/supporting/minor), "description" (背景描述), "state", "knowledge", "location", "inventory"。
      4. "relationships": 对象数组，描述角色间的关系，包含 "id", "sourceId", "targetId", "type" (关系类型), "description" (关系描述), "intensity" (1-10 强度)。
      5. "pastEvents": 字符串数组，过去发生的重大事件。
      6. "volumes": 对象数组，每卷包含 "title" (卷标题，例如"第一卷：觉醒")，以及 "chapters" (该卷下的章节数组，每章包含 "title" (章节标题，例如"第一章：神秘的呼唤"), "intent" (本章意图), "beats" (3-5个场景节拍描述的字符串数组))。
      
      必须使用中文输出，并且严格遵守 JSON 格式。`;

      const responseText = await callAi({
        prompt: prompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            rules: { type: "ARRAY", items: { type: "STRING" } },
            ledger: { type: "OBJECT", properties: { time: { type: "STRING" }, resources: { type: "STRING" }, notes: { type: "STRING" } } },
            characters: { type: "ARRAY", items: { type: "OBJECT", properties: { id: { type: "STRING" }, name: { type: "STRING" }, role: { type: "STRING" }, description: { type: "STRING" }, state: { type: "STRING" }, knowledge: { type: "STRING" }, location: { type: "STRING" }, inventory: { type: "STRING" } } } },
            relationships: { type: "ARRAY", items: { type: "OBJECT", properties: { id: { type: "STRING" }, sourceId: { type: "STRING" }, targetId: { type: "STRING" }, type: { type: "STRING" }, description: { type: "STRING" }, intensity: { type: "NUMBER" } } } },
            pastEvents: { type: "ARRAY", items: { type: "STRING" } },
            volumes: { type: "ARRAY", items: { type: "OBJECT", properties: { title: { type: "STRING" }, chapters: { type: "ARRAY", items: { type: "OBJECT", properties: { title: { type: "STRING" }, intent: { type: "STRING" }, beats: { type: "ARRAY", items: { type: "STRING" } } } } } } } }
          },
          required: ["rules", "ledger", "characters", "relationships", "pastEvents", "volumes"]
        }
      });

      const result = extractJson(responseText || '{}');
      if (result) {
        const allChapters: Chapter[] = [];
      const volumesWithChapters = (result.volumes || []).map((vol: any, vIdx: number) => {
        const volId = `vol-gen-${Date.now()}-${vIdx}`;
        const chapters = (vol.chapters || []).map((ch: any, cIdx: number) => {
          const chId = `ch-gen-${Date.now()}-${vIdx}-${cIdx}`;
          allChapters.push({
            id: chId,
            title: ch.title || `第 ${vIdx + 1} 卷第 ${cIdx + 1} 章`,
            content: '',
            intent: ch.intent || '',
            beats: (ch.beats || []).map((b: string, j: number) => ({
              id: `beat-gen-${Date.now()}-${vIdx}-${cIdx}-${j}`,
              description: b,
              status: 'pending',
              characterIds: []
            })),
            status: 'drafting',
            characterIds: [],
            threadIds: []
          });
          return chId;
        });
        return {
          id: volId,
          title: vol.title || `第 ${vIdx + 1} 卷`,
          chapterIds: chapters
        };
      });

      setWorldState(prev => ({
        ...prev,
        rules: result.rules || [],
        ledger: result.ledger || { time: '', resources: '', notes: '' },
        characters: result.characters || [],
        relationships: result.relationships || [],
        pastEvents: result.pastEvents || [],
        volumes: volumesWithChapters
      }));

      setChapters(allChapters);
      if (allChapters.length > 0) {
        setActiveChapterId(allChapters[0].id);
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
    setIsSimulating(true);
    try {
      const charA = worldState.characters.find(c => c.id === sandboxCharA);
      const charB = worldState.characters.find(c => c.id === sandboxCharB);
      const thread = worldState.threads.find(t => t.id === sandboxThreadId);
      
      // Find relationships between A and B
      const relAB = (worldState.relationships || []).find(r => (r.sourceId === sandboxCharA && r.targetId === sandboxCharB) || (r.sourceId === sandboxCharB && r.targetId === sandboxCharA));

      const prompt = `你是一个专业的小说编剧。请根据以下角色设定、角色关系、冲突场景以及【关联的伏笔】，推演一段这两个角色之间的对话对角戏（至少5-8个回合）。
      
      角色A：${charA?.name} (身份：${charA?.role}, 状态：${charA?.state}, 知识：${charA?.knowledge})
      描述：${charA?.description || '无'}
      角色B：${charB?.name} (身份：${charB?.role}, 状态：${charB?.state}, 知识：${charB?.knowledge})
      描述：${charB?.description || '无'}
      
      角色关系：${relAB ? `${relAB.type} (强度: ${relAB.intensity}/10): ${relAB.description}` : '初次见面或关系疏远'}
      
      关联伏笔：${thread ? `${thread.title}: ${thread.description}` : '无'}
      
      冲突/场景设定：${sandboxScenario}
      
      ${getStylePrompt()}
      
      要求：
      1. 必须使用中文。
      2. 对话要符合人物性格，充满张力，不要说废话。
      3. 包含适当的神态和动作描写。
      4. 返回 JSON 格式，包含一个 "dialogues" 数组，每个元素有 "character" (角色名) 和 "text" (台词及动作描写)。`;
      
      const responseText = await callAi({
        prompt: prompt,
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
      });
      
      const result = extractJson(responseText || '{}');
      if (result && result.dialogues) {
        setSandboxHistory(result.dialogues);
      }
    } catch (error) {
      console.error(error);
      setAlertDialog({ isOpen: true, message: '推演失败，请重试。' });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExportSandboxToChapter = () => {
    if (!activeChapterId) {
      setAlertDialog({ isOpen: true, message: '请先在左侧选择一个章节。' });
      return;
    }
    
    const dialogueText = sandboxHistory.map(msg => `${msg.character}：\n${msg.text}`).join('\n\n');
    
    setChapters(prev => prev.map(ch => {
      if (ch.id === activeChapterId) {
        return {
          ...ch,
          content: ch.content ? `${ch.content}\n\n${dialogueText}` : dialogueText
        };
      }
      return ch;
    }));
    
    setAlertDialog({ isOpen: true, message: '已成功将推演内容插入到当前章节！' });
  };

  const handleExportSandboxToLore = () => {
    setPromptDialog({
      isOpen: true,
      message: '请输入这段推演设定的名称（例如：某次密谈）：',
      value: '',
      onConfirm: (title) => {
        if (!title.trim()) return;
        
        const dialogueText = sandboxHistory.map(msg => `${msg.character}：\n${msg.text}`).join('\n\n');
        
        setWorldState(prev => ({
          ...prev,
          lore: [...(prev.lore || []), {
            id: `lore-${Date.now()}`,
            concept: title,
            explanation: `【推演记录】\n场景：${sandboxScenario}\n\n${dialogueText}`,
            category: 'history'
          }]
        }));
        
        setPromptDialog(prev => ({ ...prev, isOpen: false }));
        setAlertDialog({ isOpen: true, message: '已成功保存到世界法典！' });
      }
    });
  };

  const handleAnalyzeSample = async () => {
    if (!sampleText.trim()) return;
    setIsAnalyzingSample(true);
    try {
      const prompt = `你是一个文学评论家和文风分析专家。请分析以下文本片段，并提取其文风特征。
      
      文本片段："${sampleText}"
      
      请返回一个严格的 JSON 对象，包含以下字段：
      1. "description": 简短的文风描述。
      2. "pacing": 1-5 的数字 (1: 极慢, 5: 极快)。
      3. "diction": "colloquial", "literary", "archaic", "hardcore" 之一。
      4. "sentenceStructure": "short", "mixed", "long" 之一。
      5. "sensoryFocus": 字符串数组，包含 "visual", "auditory", "olfactory", "tactile", "gustatory", "psychological" 中的若干项。
      6. "perspective": "first", "third-limited", "third-omniscient" 之一。
      7. "forbiddenWords": 建议避讳的词汇数组。
      8. "signaturePatterns": 标志性的表达方式或修辞手法数组。
      9. "sampleAnalysis": 对该片段的详细分析总结。`;

      const responseText = await callAi({
        prompt: prompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            description: { type: "STRING" },
            pacing: { type: "NUMBER" },
            diction: { type: "STRING" },
            sentenceStructure: { type: "STRING" },
            sensoryFocus: { type: "ARRAY", items: { type: "STRING" } },
            perspective: { type: "STRING" },
            forbiddenWords: { type: "ARRAY", items: { type: "STRING" } },
            signaturePatterns: { type: "ARRAY", items: { type: "STRING" } },
            sampleAnalysis: { type: "STRING" }
          },
          required: ["description", "pacing", "diction", "sentenceStructure", "sensoryFocus", "perspective", "forbiddenWords", "signaturePatterns", "sampleAnalysis"]
        }
      });

      const result = extractJson(responseText || '{}');
      if (result) {
        setWorldState(prev => ({
        ...prev,
        style: {
          ...prev.style,
          ...result
        }
      }));
      setSampleText('');
      setShowSampleInput(false);
      setAlertDialog({ isOpen: true, message: '文风分析完成！已更新设定。' });
    } catch (error) {
      console.error(error);
      setAlertDialog({ isOpen: true, message: '文风分析失败，请重试。' });
    } finally {
      setIsAnalyzingSample(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg = { id: Date.now().toString(), role: 'user' as const, text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatting(true);

    try {
      const activeVolume = worldState.volumes.find(v => v.chapterIds.includes(activeChapterId || ''));
      const prompt = `你是一个小说创作导师。请根据以下世界观和当前章节内容，回答用户的问题。
      
      世界规则：${worldState.rules.join(' | ')}
      未回收伏笔：${(worldState.threads || []).filter(t => t.status === 'open').map(t => t.title).join(', ')}
      当前章节：${activeChapter?.title || '无'}
      正文内容：${activeChapter?.content.substring(0, 2000) || '无'}
      
      ${getStylePrompt(activeVolume?.id)}
      
      用户问题：${userMsg.text}
      
      请使用中文，以导师的口吻给出专业、有建设性的回答。`;

      const responseText = await callAi({
        prompt: prompt,
      });

      const aiMsg = { id: (Date.now() + 1).toString(), role: 'model' as const, text: responseText || "抱歉，我无法回答这个问题。" };
      setChatHistory(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setAlertDialog({ isOpen: true, message: '发送消息失败，请重试。' });
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="w-full bg-slate-50 border-l border-slate-200 flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white shrink-0 relative">
        {isExtracting && (
          <div className="absolute -top-6 left-0 right-0 h-6 bg-indigo-600 text-white text-[10px] flex items-center justify-center gap-2 animate-pulse z-50">
            <Loader2 className="w-3 h-3 animate-spin" /> 正在从正文自动提取设定 (Auto-Growth)...
          </div>
        )}
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
                          threads: [...(prev.threads || []), { id: `thread-${Date.now()}`, title: val.trim(), description: '待补充详细描述...', status: 'open', characterIds: [], volumeId: undefined }]
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
                    <button onClick={() => {
                      setWorldState(prev => ({ ...prev, threads: (prev.threads || []).filter(t => t.id !== thread.id) }));
                      setChapters(prev => prev.map(ch => ({
                        ...ch,
                        threadIds: (ch.threadIds || []).filter(id => id !== thread.id),
                        beats: (ch.beats || []).map(b => ({
                          ...b,
                          threadId: b.threadId === thread.id ? undefined : b.threadId
                        }))
                      })));
                    }} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"><Trash2 className="w-3.5 h-3.5"/></button>
                    
                    <div className="flex items-start gap-3 pr-6">
                      <button 
                        onClick={() => {
                          setWorldState(prev => ({
                            ...prev,
                            threads: (prev.threads || []).map(t => t.id === thread.id ? { ...t, status: t.status === 'open' ? 'resolved' : 'open' } : t)
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
                              threads: (prev.threads || []).map(t => t.id === thread.id ? { ...t, description: e.target.value } : t)
                            }));
                          }}
                          placeholder="详细描述这个伏笔..."
                          className={`w-full text-xs p-2 rounded border focus:ring-1 outline-none resize-none h-16 ${thread.status === 'resolved' ? 'bg-transparent border-transparent text-slate-400' : 'bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-indigo-400 text-slate-600'}`}
                        />
                        <div className="mt-2">
                          <label className="text-[10px] font-bold text-slate-500 mb-1 block">关联角色：</label>
                          <div className="flex flex-wrap gap-1">
                            {worldState.characters.map(char => (
                              <button
                                key={char.id}
                                onClick={() => {
                                  const newIds = (thread.characterIds || []).includes(char.id)
                                    ? (thread.characterIds || []).filter(id => id !== char.id)
                                    : [...(thread.characterIds || []), char.id];
                                  setWorldState(prev => ({
                                    ...prev,
                                    threads: (prev.threads || []).map(t => t.id === thread.id ? { ...t, characterIds: newIds } : t)
                                  }));
                                }}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                                  (thread.characterIds || []).includes(char.id)
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-100'
                                }`}
                              >
                                {char.name}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="text-[10px] font-bold text-slate-500 mb-1 block">所属卷：</label>
                          <select
                            value={thread.volumeId || ''}
                            onChange={(e) => {
                              const volId = e.target.value || undefined;
                              setWorldState(prev => ({
                                ...prev,
                                threads: (prev.threads || []).map(t => t.id === thread.id ? { ...t, volumeId: volId } : t)
                              }));
                            }}
                            className="w-full text-xs p-1 rounded border border-slate-200 bg-white text-slate-600"
                          >
                            <option value="">全局伏笔</option>
                            {(worldState.volumes || []).map(vol => (
                              <option key={vol.id} value={vol.id}>{vol.title}</option>
                            ))}
                          </select>
                        </div>
                        <div className="mt-2">
                          <label className="text-[10px] font-bold text-slate-500 mb-1 block">关联节拍：</label>
                          <div className="space-y-1">
                            {(() => {
                              const associatedBeats = chapters.flatMap(ch => 
                                ch.beats.filter(b => b.threadId === thread.id).map(b => ({ chapterTitle: ch.title, beat: b }))
                              );
                              if (associatedBeats.length === 0) {
                                return <span className="text-[10px] text-slate-400 italic">暂无关联节拍</span>;
                              }
                              return associatedBeats.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-[10px] bg-slate-50 p-1.5 rounded border border-slate-100">
                                  <span className="font-bold text-indigo-600 shrink-0 truncate max-w-[60px]">{item.chapterTitle}</span>
                                  <span className="text-slate-600 truncate flex-1">{item.beat.description}</span>
                                  <span className={`px-1 rounded-sm shrink-0 ${item.beat.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {item.beat.status === 'completed' ? '已完成' : '待办'}
                                  </span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
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
                    {(worldState.characters || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <span className="text-slate-400 self-center text-sm font-bold">VS</span>
                  <select value={sandboxCharB} onChange={(e) => setSandboxCharB(e.target.value)} className="flex-1 text-sm border border-slate-200 p-2 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none">
                    <option value="">选择角色 B</option>
                    {(worldState.characters || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <select value={sandboxThreadId} onChange={(e) => setSandboxThreadId(e.target.value)} className="w-full text-sm border border-slate-200 p-2 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none">
                  <option value="">关联伏笔 (可选)</option>
                  {(worldState.threads || []).filter(t => t.status === 'open').map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
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
                <>
                  {sandboxHistory.map((msg, idx) => {
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
                  })}
                  <div className="flex gap-2 pt-4 border-t border-slate-100 mt-4">
                    <button
                      onClick={handleExportSandboxToChapter}
                      className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      插入到当前章节
                    </button>
                    <button
                      onClick={handleExportSandboxToLore}
                      className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-xs hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      保存为世界设定
                    </button>
                  </div>
                </>
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
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] text-indigo-200 mb-1">总章节数</label>
                  <input type="number" min="1" max="50" value={numChapters} onChange={(e) => setNumChapters(parseInt(e.target.value))} className="w-full p-2 rounded bg-white/10 border border-white/20 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] text-indigo-200 mb-1">总卷数</label>
                  <input type="number" min="1" max="10" value={numVolumes} onChange={(e) => setNumVolumes(parseInt(e.target.value))} className="w-full p-2 rounded bg-white/10 border border-white/20 text-white text-sm" />
                </div>
              </div>
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
            {/* Sub-menu bar */}
            <div className="flex border-b border-slate-200 mb-4">
              <button onClick={() => setActiveSubTab('core')} className={`py-2 px-4 text-xs font-bold ${activeSubTab === 'core' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>核心设定</button>
              <button onClick={() => setActiveSubTab('relationships')} className={`py-2 px-4 text-xs font-bold ${activeSubTab === 'relationships' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>人际关系</button>
              <button onClick={() => setActiveSubTab('lore')} className={`py-2 px-4 text-xs font-bold ${activeSubTab === 'lore' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>世界法典</button>
              <button onClick={() => setActiveSubTab('style')} className={`py-2 px-4 text-xs font-bold ${activeSubTab === 'style' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>文风与基调</button>
              <button onClick={() => setActiveSubTab('rhythm')} className={`py-2 px-4 text-xs font-bold ${activeSubTab === 'rhythm' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>节奏韵律</button>
            </div>

            {activeSubTab === 'relationships' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-rose-500"/> 人际关系网 (Relationships)
                    </h3>
                    <button 
                      onClick={() => {
                        if (worldState.characters.length < 2) {
                          setAlertDialog({ isOpen: true, message: '至少需要两个角色才能建立关系。' });
                          return;
                        }
                        setWorldState(prev => ({
                          ...prev,
                          relationships: [...(prev.relationships || []), {
                            id: `rel-${Date.now()}`,
                            sourceId: prev.characters[0].id,
                            targetId: prev.characters[1].id,
                            type: '朋友',
                            description: '关系描述...',
                            intensity: 5
                          }]
                        }));
                      }}
                      className="text-rose-600 hover:bg-rose-50 p-1 rounded"
                    >
                      <Plus className="w-4 h-4"/>
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {(worldState.relationships || []).length === 0 ? (
                      <div className="text-center text-slate-400 text-xs italic py-4">
                        暂无关系记录。点击右上角 + 号添加。
                      </div>
                    ) : (
                      (worldState.relationships || []).map(rel => {
                        const source = worldState.characters.find(c => c.id === rel.sourceId);
                        const target = worldState.characters.find(c => c.id === rel.targetId);
                        return (
                          <div key={rel.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 relative group">
                            <button 
                              onClick={() => setWorldState(prev => ({ ...prev, relationships: prev.relationships.filter(r => r.id !== rel.id) }))}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3"/>
                            </button>
                            
                            <div className="flex items-center gap-2 mb-2">
                              <select 
                                value={rel.sourceId}
                                onChange={(e) => setWorldState(prev => ({ ...prev, relationships: prev.relationships.map(r => r.id === rel.id ? { ...r, sourceId: e.target.value } : r) }))}
                                className="text-xs font-bold text-indigo-900 bg-white border border-slate-200 rounded px-1 py-0.5 outline-none"
                              >
                                {worldState.characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                              <span className="text-slate-400 text-[10px]">与</span>
                              <select 
                                value={rel.targetId}
                                onChange={(e) => setWorldState(prev => ({ ...prev, relationships: prev.relationships.map(r => r.id === rel.id ? { ...r, targetId: e.target.value } : r) }))}
                                className="text-xs font-bold text-indigo-900 bg-white border border-slate-200 rounded px-1 py-0.5 outline-none"
                              >
                                {worldState.characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-2">
                              <input 
                                value={rel.type}
                                onChange={(e) => setWorldState(prev => ({ ...prev, relationships: prev.relationships.map(r => r.id === rel.id ? { ...r, type: e.target.value } : r) }))}
                                placeholder="关系类型 (如: 宿敌)"
                                className="flex-1 text-xs p-1 rounded border border-slate-200 bg-white focus:ring-1 focus:ring-rose-400 outline-none"
                              />
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] text-slate-400">强度:</span>
                                <input 
                                  type="number" min="1" max="10"
                                  value={rel.intensity}
                                  onChange={(e) => setWorldState(prev => ({ ...prev, relationships: prev.relationships.map(r => r.id === rel.id ? { ...r, intensity: parseInt(e.target.value) } : r) }))}
                                  className="w-10 text-xs p-1 rounded border border-slate-200 bg-white outline-none"
                                />
                              </div>
                            </div>
                            
                            <textarea 
                              value={rel.description}
                              onChange={(e) => setWorldState(prev => ({ ...prev, relationships: prev.relationships.map(r => r.id === rel.id ? { ...r, description: e.target.value } : r) }))}
                              placeholder="详细描述关系现状..."
                              className="w-full text-[10px] p-1.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-rose-400 outline-none resize-none h-12 text-slate-600"
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'lore' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                      <Book className="w-4 h-4 text-purple-500"/> 世界法典 (Codex)
                    </h3>
                    <button 
                      onClick={() => {
                        setWorldState(prev => ({
                          ...prev,
                          lore: [...(prev.lore || []), {
                            id: `lore-${Date.now()}`,
                            concept: '新条目',
                            explanation: '在此输入详细解释...',
                            category: 'other'
                          }]
                        }));
                      }}
                      className="text-purple-600 hover:bg-purple-50 p-1 rounded"
                    >
                      <Plus className="w-4 h-4"/>
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {(worldState.lore || []).length === 0 ? (
                      <div className="text-center text-slate-400 text-xs italic py-4">
                        暂无条目。可通过“挖掘兔儿洞”或手动添加。
                      </div>
                    ) : (
                      (worldState.lore || []).map(entry => (
                        <div key={entry.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 relative group">
                          <button 
                            onClick={() => setWorldState(prev => ({ ...prev, lore: prev.lore.filter(l => l.id !== entry.id) }))}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3"/>
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <input 
                              value={entry.concept}
                              onChange={(e) => setWorldState(prev => ({ ...prev, lore: prev.lore.map(l => l.id === entry.id ? { ...l, concept: e.target.value } : l) }))}
                              placeholder="名词/概念"
                              className="flex-1 text-xs font-bold text-indigo-900 bg-white border border-slate-200 rounded px-2 py-1 outline-none"
                            />
                            <select 
                              value={entry.category || 'other'}
                              onChange={(e) => setWorldState(prev => ({ ...prev, lore: prev.lore.map(l => l.id === entry.id ? { ...l, category: e.target.value as any } : l) }))}
                              className="text-[10px] bg-white border border-slate-200 rounded px-1 py-0.5 outline-none text-slate-500"
                            >
                              <option value="culture">文化</option>
                              <option value="technology">技术</option>
                              <option value="magic">魔法</option>
                              <option value="history">历史</option>
                              <option value="other">其他</option>
                            </select>
                          </div>
                          
                          <textarea 
                            value={entry.explanation}
                            onChange={(e) => setWorldState(prev => ({ ...prev, lore: prev.lore.map(l => l.id === entry.id ? { ...l, explanation: e.target.value } : l) }))}
                            placeholder="详细解释..."
                            className="w-full text-[10px] p-1.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-purple-400 outline-none resize-none h-20 text-slate-600"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'style' && (
              <div className="space-y-6">
                {/* Style & Tone Section */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                      <PenTool className="w-4 h-4 text-indigo-500"/> 文风与基调 (Style & Tone)
                    </h3>
                    <button 
                      onClick={() => setShowSampleInput(!showSampleInput)}
                      className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md hover:bg-indigo-100 transition-colors flex items-center gap-1"
                    >
                      <History className="w-3 h-3" /> 样本学习
                    </button>
                  </div>

                  {showSampleInput && (
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2">
                      <p className="text-[10px] text-slate-500 mb-2">粘贴一段您喜欢的文字，AI 将自动分析并提取文风参数。</p>
                      <textarea
                        value={sampleText}
                        onChange={(e) => setSampleText(e.target.value)}
                        placeholder="在此输入样本文字..."
                        className="w-full h-24 text-xs p-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none mb-2"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setShowSampleInput(false)} className="text-[10px] text-slate-400 hover:text-slate-600">取消</button>
                        <button 
                          onClick={handleAnalyzeSample}
                          disabled={isAnalyzingSample || !sampleText.trim()}
                          className="text-[10px] bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          {isAnalyzingSample ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          开始分析
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Description */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">核心描述</label>
                      <textarea
                        value={worldState.style?.description || ''}
                        onChange={(e) => setWorldState(prev => ({ ...prev, style: { ...(prev.style || DEFAULT_WORLD_STATE.style!), description: e.target.value } }))}
                        placeholder="例如：古龙风，短句为主，肃杀，留白多..."
                        className="w-full text-xs border border-slate-200 p-2 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none h-16"
                      />
                    </div>

                    {/* Sliders & Selects Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block flex items-center gap-1">
                          <Zap className="w-3 h-3" /> 叙事节奏 ({worldState.style?.pacing || 3})
                        </label>
                        <input 
                          type="range" min="1" max="5" step="1"
                          value={worldState.style?.pacing || 3}
                          onChange={(e) => setWorldState(prev => ({ ...prev, style: { ...(prev.style || DEFAULT_WORLD_STATE.style!), pacing: parseInt(e.target.value) } }))}
                          className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[8px] text-slate-400 mt-1">
                          <span>舒缓</span>
                          <span>紧凑</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">用词风格</label>
                        <select 
                          value={worldState.style?.diction || 'literary'}
                          onChange={(e) => setWorldState(prev => ({ ...prev, style: { ...(prev.style || DEFAULT_WORLD_STATE.style!), diction: e.target.value as any } }))}
                          className="w-full text-xs border border-slate-200 p-1.5 rounded-md outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="colloquial">通俗白话</option>
                          <option value="literary">文学雅致</option>
                          <option value="archaic">古风/半文白</option>
                          <option value="hardcore">冷峻硬核</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">句式偏好</label>
                        <select 
                          value={worldState.style?.sentenceStructure || 'mixed'}
                          onChange={(e) => setWorldState(prev => ({ ...prev, style: { ...(prev.style || DEFAULT_WORLD_STATE.style!), sentenceStructure: e.target.value as any } }))}
                          className="w-full text-xs border border-slate-200 p-1.5 rounded-md outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="short">短句为主</option>
                          <option value="mixed">长短结合</option>
                          <option value="long">长句/西化</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">叙事视角</label>
                        <select 
                          value={worldState.style?.perspective || 'third-limited'}
                          onChange={(e) => setWorldState(prev => ({ ...prev, style: { ...(prev.style || DEFAULT_WORLD_STATE.style!), perspective: e.target.value as any } }))}
                          className="w-full text-xs border border-slate-200 p-1.5 rounded-md outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="first">第一人称</option>
                          <option value="third-limited">第三人称限知</option>
                          <option value="third-omniscient">第三人称全知</option>
                        </select>
                      </div>
                    </div>

                    {/* Sensory Focus */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block flex items-center gap-1">
                        <Eye className="w-3 h-3" /> 感官偏好
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'visual', label: '视觉' },
                          { id: 'auditory', label: '听觉' },
                          { id: 'olfactory', label: '嗅觉' },
                          { id: 'tactile', label: '触觉' },
                          { id: 'psychological', label: '心理' }
                        ].map(sense => (
                          <button
                            key={sense.id}
                            onClick={() => {
                              const current = worldState.style?.sensoryFocus || [];
                              const next = current.includes(sense.id) 
                                ? current.filter(s => s !== sense.id)
                                : [...current, sense.id];
                              setWorldState(prev => ({ ...prev, style: { ...(prev.style || DEFAULT_WORLD_STATE.style!), sensoryFocus: next } }));
                            }}
                            className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                              (worldState.style?.sensoryFocus || []).includes(sense.id)
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
                            }`}
                          >
                            {sense.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Forbidden Words */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Ban className="w-3 h-3" /> 避讳词 (AI 味消除)
                        </label>
                        <button onClick={() => {
                          setPromptDialog({
                            isOpen: true, message: '添加避讳词：', value: '',
                            onConfirm: (val) => {
                              if (val.trim()) setWorldState(prev => ({ ...prev, style: { ...(prev.style || DEFAULT_WORLD_STATE.style!), forbiddenWords: [...(prev.style?.forbiddenWords || []), val.trim()] } }));
                              setPromptDialog(prev => ({ ...prev, isOpen: false }));
                            }
                          });
                        }} className="text-indigo-600 hover:bg-indigo-50 p-0.5 rounded"><Plus className="w-3 h-3"/></button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(worldState.style?.forbiddenWords || []).map((word, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md flex items-center gap-1 group">
                            {word}
                            <button onClick={() => setWorldState(prev => ({ ...prev, style: { ...(prev.style || DEFAULT_WORLD_STATE.style!), forbiddenWords: (prev.style?.forbiddenWords || []).filter((_, idx) => idx !== i) } }))} className="text-slate-400 hover:text-red-500"><Trash2 className="w-2.5 h-2.5"/></button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Signature Patterns */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <PenTool className="w-3 h-3" /> 标志性表达/修辞
                        </label>
                        <button onClick={() => {
                          setPromptDialog({
                            isOpen: true, message: '添加标志性表达/修辞：', value: '',
                            onConfirm: (val) => {
                              if (val.trim()) setWorldState(prev => ({ ...prev, style: { ...(prev.style || DEFAULT_WORLD_STATE.style!), signaturePatterns: [...(prev.style?.signaturePatterns || []), val.trim()] } }));
                              setPromptDialog(prev => ({ ...prev, isOpen: false }));
                            }
                          });
                        }} className="text-indigo-600 hover:bg-indigo-50 p-0.5 rounded"><Plus className="w-3 h-3"/></button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(worldState.style?.signaturePatterns || []).map((pattern, i) => (
                          <span key={i} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md flex items-center gap-1 group border border-indigo-100">
                            {pattern}
                            <button onClick={() => setWorldState(prev => ({ ...prev, style: { ...(prev.style || DEFAULT_WORLD_STATE.style!), signaturePatterns: (prev.style?.signaturePatterns || []).filter((_, idx) => idx !== i) } }))} className="text-indigo-400 hover:text-red-500"><Trash2 className="w-2.5 h-2.5"/></button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Sample Analysis Summary */}
                    {worldState.style?.sampleAnalysis && (
                      <div className="mt-4 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                        <label className="text-[10px] font-bold text-indigo-400 uppercase mb-1 block">样本分析总结</label>
                        <p className="text-[10px] text-indigo-900 leading-relaxed italic">
                          {worldState.style.sampleAnalysis}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'core' && (
              <div className="space-y-6">
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
                    {(worldState.rules || []).map((rule, i) => (
                      <li key={i} className="text-sm text-slate-600 bg-slate-50 p-2 rounded flex justify-between group">
                        <span>{rule}</span>
                        <button onClick={() => setWorldState(prev => ({ ...prev, rules: (prev.rules || []).filter((_, idx) => idx !== i) }))} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Characters */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-indigo-500"/> 角色档案 (Codex)</h3>
                    <button onClick={() => {
                      setPromptDialog({
                        isOpen: true, message: '添加新角色名称：', value: '',
                        onConfirm: (val) => {
                          if (val.trim()) setWorldState(prev => ({ ...prev, characters: [...prev.characters, { id: `char-${Date.now()}`, name: val.trim(), role: 'supporting', state: '正常', knowledge: '无', location: '未知', inventory: '空', description: '' }] }));
                          setPromptDialog(prev => ({ ...prev, isOpen: false }));
                        }
                      });
                    }} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded"><Plus className="w-4 h-4"/></button>
                  </div>
                  <div className="space-y-3">
                    {(worldState.characters || []).map(char => (
                      <div key={char.id} className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 relative group hover:border-indigo-200 transition-colors">
                        <button onClick={() => {
                          setWorldState(prev => ({ 
                            ...prev, 
                            characters: (prev.characters || []).filter(c => c.id !== char.id),
                            relationships: (prev.relationships || []).filter(r => r.sourceId !== char.id && r.targetId !== char.id),
                            threads: (prev.threads || []).map(t => ({
                              ...t,
                              characterIds: (t.characterIds || []).filter(id => id !== char.id)
                            }))
                          }));
                          setChapters(prev => prev.map(ch => ({
                            ...ch,
                            characterIds: (ch.characterIds || []).filter(id => id !== char.id),
                            beats: (ch.beats || []).map(b => ({
                              ...b,
                              characterIds: (b.characterIds || []).filter(id => id !== char.id)
                            }))
                          })));
                        }} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
                        <div className="font-bold text-indigo-900 mb-1 flex items-center gap-2 flex-wrap">
                          {char.name}
                          <select 
                            value={char.role} 
                            onChange={(e) => setWorldState(prev => ({ ...prev, characters: prev.characters.map(c => c.id === char.id ? { ...c, role: e.target.value as any } : c) }))}
                            className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full border-none outline-none cursor-pointer"
                          >
                            <option value="protagonist">主角</option>
                            <option value="antagonist">反派</option>
                            <option value="supporting">配角</option>
                            <option value="minor">龙套</option>
                          </select>
                          {char.state !== '正常' && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-normal">{char.state}</span>}
                        </div>
                        <textarea
                          value={char.description || ''}
                          onChange={(e) => setWorldState(prev => ({ ...prev, characters: prev.characters.map(c => c.id === char.id ? { ...c, description: e.target.value } : c) }))}
                          placeholder="角色背景/外貌描写..."
                          className="w-full text-[10px] p-1.5 mb-2 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-400 outline-none resize-none h-12 text-slate-600"
                        />
                        <div className="grid grid-cols-1 gap-y-1 text-[10px] text-slate-500">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 w-8">位置:</span> 
                            <input value={char.location} onChange={(e) => setWorldState(prev => ({ ...prev, characters: prev.characters.map(c => c.id === char.id ? { ...c, location: e.target.value } : c) }))} className="bg-transparent border-none p-0 focus:ring-0 w-full" />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 w-8">知识:</span> 
                            <input value={char.knowledge} onChange={(e) => setWorldState(prev => ({ ...prev, characters: prev.characters.map(c => c.id === char.id ? { ...c, knowledge: e.target.value } : c) }))} className="bg-transparent border-none p-0 focus:ring-0 w-full" />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 w-8">物品:</span> 
                            <input value={char.inventory} onChange={(e) => setWorldState(prev => ({ ...prev, characters: prev.characters.map(c => c.id === char.id ? { ...c, inventory: e.target.value } : c) }))} className="bg-transparent border-none p-0 focus:ring-0 w-full" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Past Events */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-indigo-500"/> 编年史 (Chronicle)
                    </h3>
                    <button 
                      onClick={() => setWorldState(prev => ({ ...prev, pastEvents: [...(prev.pastEvents || []), '新事件'] }))} 
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                      title="添加事件"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    {(worldState.pastEvents || []).length === 0 ? (
                      <p className="text-xs text-slate-400 italic pl-6">暂无重大事件记录。</p>
                    ) : (
                      (worldState.pastEvents || []).map((event, i) => (
                        <div key={i} className="relative pl-6 text-xs text-slate-600 leading-relaxed group flex items-start gap-2">
                          <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-400 z-10" />
                          <textarea 
                            value={event} 
                            onChange={(e) => {
                              const newEvents = [...(worldState.pastEvents || [])];
                              newEvents[i] = e.target.value;
                              setWorldState(prev => ({ ...prev, pastEvents: newEvents }));
                            }}
                            className="w-full bg-transparent border-none p-0 focus:ring-0 resize-none"
                            rows={2}
                          />
                          <button 
                            onClick={() => {
                              const newEvents = [...(worldState.pastEvents || [])];
                              newEvents.splice(i, 1);
                              setWorldState(prev => ({ ...prev, pastEvents: newEvents }));
                            }} 
                            className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all shrink-0"
                            title="删除事件"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'rhythm' && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm mb-4">
                  <Zap className="w-4 h-4 text-indigo-500"/> 节奏韵律控制 (Rhythm & Cadence)
                </h3>
                <p className="text-xs text-slate-500 mb-4">此功能正在开发中，将用于动态控制 AI 写作的节奏与韵律。</p>
              </div>
            )}
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
