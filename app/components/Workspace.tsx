"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Chapter, Beat } from '../types';
import { Loader2, Play, CheckCircle2, Circle, Edit3, Save, Sparkles, BookOpen, PenTool, Search, Maximize2, Minimize2, Check, X, Volume2, VolumeX, Pause, Settings, ChevronUp, ChevronDown, Zap, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Workspace() {
  const { chapters, setChapters, activeChapterId, callAi, setAlertDialog, worldState, setWorldState, setRabbitHole, isDigging, setIsDigging, isPolishing, setIsPolishing, isZenMode, setIsZenMode, isExtracting, setIsExtracting, apiSettings, getStylePrompt, extractJson } = useAppContext();
  const chaptersRef = useRef(chapters);
  useEffect(() => {
    chaptersRef.current = chapters;
  }, [chapters]);
  const activeChapter = chapters.find(ch => ch.id === activeChapterId);
  const activeVolume = worldState.volumes.find(v => v.chapterIds.includes(activeChapterId || ''));
  const [activeTab, setActiveTab] = useState<'reader' | 'writer'>('reader');
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [syncSuggestions, setSyncSuggestions] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [polishResult, setPolishResult] = useState<{ original: string, polished: string } | null>(null);

  // Auto-Read State
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1); // 1-10
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [showReadSettings, setShowReadSettings] = useState(false);
  const [isCompletingChapter, setIsCompletingChapter] = useState(false);
  const [genSettings, setGenSettings] = useState({
    mode: 'single' as 'single' | 'batch' | 'multi-in-one',
    targetWords: 500,
    batchCount: 3, // Number of beats to generate in one call when in 'multi-in-one' mode
    sensoryFocus: [] as string[],
    pacing: 'balanced' as 'slow' | 'balanced' | 'fast',
    includeDialogue: true,
    includeInternalMonologue: true
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Zen Mode shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsZenMode(!isZenMode);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode, setIsZenMode]);

  // Auto-Scrolling Logic
  useEffect(() => {
    if (isAutoScrolling && scrollContainerRef.current) {
      const scroll = () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop += scrollSpeed;
          // Stop if reached bottom
          if (scrollContainerRef.current.scrollTop + scrollContainerRef.current.clientHeight >= scrollContainerRef.current.scrollHeight) {
            setIsAutoScrolling(false);
          }
        }
      };
      scrollIntervalRef.current = setInterval(scroll, 50);
    } else {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    }
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [isAutoScrolling, scrollSpeed]);

  // TTS Logic
  const handleTts = useCallback(() => {
    if (!activeChapter?.content) return;

    if (isTtsPlaying) {
      window.speechSynthesis.cancel();
      setIsTtsPlaying(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(activeChapter.content.replace(/[#*`]/g, ''));
      utterance.lang = 'zh-CN';
      utterance.rate = 1.0;
      utterance.onend = () => setIsTtsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsTtsPlaying(true);
    }
  }, [activeChapter?.content, isTtsPlaying]);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

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
    setIsPolishing(true);
    try {
      let instruction = '';
      if (type === 'expand') instruction = '请扩写这段文字，增加丰富的感官细节（视觉、听觉、触觉等），贯彻 "Show, Don\'t Tell" 原则，增强画面感。';
      if (type === 'rewrite') instruction = '请重写这段文字，使其更具文学性，修辞更优美，人物情感更饱满，消除AI味。';
      if (type === 'shorten') instruction = '请缩写这段文字，保留核心信息，使其更加精炼、紧凑、有力。';
      
      const prompt = `你是一个顶级的文学编辑。${instruction}
      
      ${getStylePrompt()}
      
      原文本：
      "${selection.text}"
      
      请直接输出修改后的文本，不要包含任何解释、引号或标题。`;
      
      const responseText = await callAi({
        prompt: prompt,
      });
      setPolishResult({ original: selection.text, polished: responseText.trim() || '' });
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

    setIsDigging(true);
    try {
      const prompt = `你是一个知识渊博的向导。请解释以下名词或概念："${term}"。
      请保持简洁、有趣且易于理解。使用 Markdown 格式。
      
      当前章节上下文：
      ${activeChapter?.content.substring(0, 3000)}`;

      const responseText = await callAi({
        prompt: prompt,
      });

      setRabbitHole({ term, explanation: responseText || "无法生成解释。" });
    } catch (error) {
      console.error(error);
      setAlertDialog({ isOpen: true, message: "生成解释失败，请重试。" });
    } finally {
      setIsDigging(false);
      setSelection(null);
    }
  };

  useEffect(() => {
    if (activeChapter) {
      setEditedContent(activeChapter.content);
    }
  }, [activeChapterId]); // Only reset when switching chapters

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
    // Trigger background extraction and summarization
    if (activeChapter) {
      extractKnowledge(editedContent);
      summarizeChapter(activeChapter.id, editedContent);
    }
  };

  const extractKnowledge = async (content: string) => {
    if (!content || content.length < 100) return;
    setIsExtracting(true);
    try {
      const prompt = `你是一个顶级文学编辑和世界观架构师。请从以下小说正文中提取并更新世界观设定。
      
      当前正文：
      ${content}
      
      当前世界观：
      ${JSON.stringify(worldState)}
      
      请识别并返回一个 JSON 对象，包含：
      1. "newCharacters": 数组，包含新出现的角色或已有角色的状态更新（id, name, state, knowledge, location, inventory）。
      2. "newRules": 数组，包含新发现的世界规则。
      3. "newThreads": 数组，包含新出现的伏笔或已有伏笔的状态更新（id, title, description, status）。特别注意：如果本章内容解决了某个已有伏笔，请将其 status 设置为 "resolved"。
      4. "pastEvents": 字符串数组，包含本章发生的重大事件。
      
      要求：
      1. 必须使用中文输出。
      2. 如果是已有角色/伏笔，请保持 ID 一致。如果是新角色/伏笔，请生成唯一 ID。
      3. 仅提取真正重要的信息。
      4. 严格遵守 JSON 格式。`;

      const responseText = await callAi({
        prompt: prompt,
        responseMimeType: "application/json",
      });

      const result = extractJson(responseText || '{}');
      
      setWorldState(prev => {
        const updatedCharacters = [...prev.characters];
        (result.newCharacters || []).forEach((nc: any) => {
          const idx = updatedCharacters.findIndex(c => c.id === nc.id || (nc.name && c.name === nc.name));
          if (idx !== -1) updatedCharacters[idx] = { ...updatedCharacters[idx], ...nc };
          else if (nc.name) updatedCharacters.push({ id: `char-${Date.now()}-${Math.random()}`, ...nc });
        });

        const updatedThreads = [...(prev.threads || [])];
        (result.newThreads || []).forEach((nt: any) => {
          const idx = updatedThreads.findIndex(t => t.id === nt.id || (nt.title && t.title === nt.title));
          if (idx !== -1) updatedThreads[idx] = { ...updatedThreads[idx], ...nt };
          else if (nt.title) updatedThreads.push({ id: `thread-${Date.now()}-${Math.random()}`, ...nt });
        });

        return {
          ...prev,
          rules: Array.from(new Set([...prev.rules, ...(result.newRules || [])])),
          characters: updatedCharacters,
          threads: updatedThreads,
          pastEvents: Array.from(new Set([...prev.pastEvents, ...(result.pastEvents || [])])).slice(-20)
        };
      });
    } catch (error) {
      console.error("Knowledge extraction failed:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const summarizeChapter = async (chapterId: string, content: string) => {
    if (!content || content.length < 100) return;
    try {
      const prompt = `请为以下小说章节写一个简洁的摘要（约 100-200 字），重点描述核心剧情进展、角色变化和新出现的伏笔。
      
      章节内容：
      ${content}
      
      请直接输出摘要文本。`;

      const responseText = await callAi({
        prompt: prompt,
      });

      setChapters(prev => prev.map(ch => ch.id === chapterId ? { ...ch, summary: responseText.trim() } : ch));
    } catch (error: any) {
      if (error?.message?.includes('429') || error?.status === 429) {
        console.error("Summarization failed due to rate limit (429).");
      } else {
        console.error("Summarization failed:", error);
      }
    }
  };

  const retrieveRelevantContext = async (beatDescription: string) => {
    const allSummaries = chapters.map(c => `【${c.title}】: ${c.summary || c.content.slice(0, 200)}`).join('\n');
    
    const prompt = `你是一个文学档案管理员。请根据当前要写的场景节拍，从以下章节摘要中检索出最相关的背景信息、伏笔或角色经历。
    
    当前节拍：${beatDescription}
    
    所有章节摘要：
    ${allSummaries}
    
    请提取出与当前节拍最相关的 3-5 条关键信息，用于辅助写作。直接输出提取的信息，不要包含解释。`;

    try {
      const responseText = await callAi({
        prompt: prompt,
      });
      return responseText || "";
    } catch (e) {
      return "";
    }
  };

  const planBeats = async () => {
    setIsPlanning(true);
    updateChapter({ status: 'planning' });

    try {
      const activeCharacters = worldState.characters.filter(c => (activeChapter.characterIds || []).includes(c.id)).map(c => ({
        name: c.name,
        role: c.role,
        description: c.description,
        state: c.state,
        knowledge: c.knowledge
      }));
      const activeRelationships = (worldState.relationships || []).filter(r => 
        (activeChapter.characterIds || []).includes(r.sourceId) && (activeChapter.characterIds || []).includes(r.targetId)
      ).map(r => ({
        source: worldState.characters.find(c => c.id === r.sourceId)?.name,
        target: worldState.characters.find(c => c.id === r.targetId)?.name,
        type: r.type,
        description: r.description,
        intensity: r.intensity
      }));
      const activeThreads = (worldState.threads || []).filter(t => 
        ((activeChapter.threadIds || []).includes(t.id)) && 
        (!t.volumeId || t.volumeId === activeVolume?.id)
      ).map(t => ({
        ...t,
        involvedCharacters: worldState.characters.filter(c => (t.characterIds || []).includes(c.id)).map(c => c.name)
      }));
      const activeLore = (worldState.lore || []).map(l => `${l.concept}: ${l.explanation}`).join(' | ');
      const prompt = `你是一个顶级小说家和故事架构师。请根据以下世界观设定、当前章节涉及角色、角色关系、关联伏笔（及其涉及角色）和前文内容，为当前章节构思一个精彩的大纲和 3-5 个场景节拍（细纲）。
      
      世界规则：${worldState.rules.join(' | ')}
      世界法典：${activeLore || '无'}
      涉及角色：${JSON.stringify(activeCharacters)}
      角色关系：${JSON.stringify(activeRelationships)}
      关联伏笔：${JSON.stringify(activeThreads)}
      过去事件：${worldState.pastEvents.slice(-5).join(' | ')}
      ${getStylePrompt()}
      未回收的伏笔：${(worldState.threads || []).filter(t => t.status === 'open' && (!t.volumeId || t.volumeId === activeVolume?.id)).map(t => t.title + ': ' + t.description).join(' | ') || '无'}
      
      当前章节标题：${activeChapter.title}
      当前章节意图：${activeChapter.intent}
      
      请返回一个 JSON 对象，包含：
      1. "intent": 字符串，本章的宏观意图或核心冲突。
      2. "beats": 字符串数组，描述本章的 3-5 个具体场景节拍。
      
      要求：
      1. 必须使用中文输出，并且严格遵守 JSON 格式。
      2. 构思时，请尽量贴合【文风基调】。
      3. 视剧情发展情况，考虑是否在节拍中推进或回收【关联伏笔】。`;

      const responseText = await callAi({
        prompt: prompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            intent: { type: "STRING" },
            beats: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["intent", "beats"]
        }
      });

      const result = extractJson(responseText || '{}');
      if (result && result.beats && Array.isArray(result.beats)) {
        const newBeats: Beat[] = result.beats.map((desc: string, i: number) => ({
          id: `beat-${Date.now()}-${i}`,
          description: desc,
          status: 'pending',
          characterIds: [],
          threadId: undefined
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

  const suggestPlot = async () => {
    setIsPlanning(true);
    try {
      const openThreads = (worldState.threads || []).filter(t => t.status === 'open');
      const activeCharacters = worldState.characters.filter(c => (activeChapter.characterIds || []).includes(c.id)).map(c => ({
        name: c.name,
        role: c.role,
        description: c.description
      }));
      const activeRelationships = (worldState.relationships || []).filter(r => 
        (activeChapter.characterIds || []).includes(r.sourceId) && (activeChapter.characterIds || []).includes(r.targetId)
      ).map(r => ({
        source: worldState.characters.find(c => c.id === r.sourceId)?.name,
        target: worldState.characters.find(c => c.id === r.targetId)?.name,
        type: r.type,
        description: r.description,
        intensity: r.intensity
      }));
      const activeLore = (worldState.lore || []).map(l => `${l.concept}: ${l.explanation}`).join(' | ');

      const prompt = `你是一个顶级小说家和故事架构师。请根据以下世界观设定、当前章节涉及角色、角色关系、以及所有【未回收的伏笔】，为当前章节建议 1-2 个新的场景节拍，旨在推进或回收这些伏笔。
      
      世界规则：${worldState.rules.join(' | ')}
      世界法典：${activeLore || '无'}
      涉及角色：${JSON.stringify(activeCharacters)}
      角色关系：${JSON.stringify(activeRelationships)}
      未回收的伏笔：${openThreads.map(t => t.title + ': ' + t.description).join(' | ')}
      
      当前章节标题：${activeChapter.title}
      当前章节意图：${activeChapter.intent}
      当前已有节拍：${activeChapter.beats.map(b => b.description).join(' | ')}
      
      请返回一个 JSON 对象，包含：
      1. "suggestedBeats": 数组，每个元素包含 "description" (节拍描述) 和 "threadId" (关联的伏笔 ID，如果有)。
      
      要求：
      1. 必须使用中文输出，并且严格遵守 JSON 格式。
      2. 建议的节拍应具有戏剧张力，且逻辑自洽。`;

      const responseText = await callAi({
        prompt: prompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            suggestedBeats: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  description: { type: "STRING" },
                  threadId: { type: "STRING" }
                },
                required: ["description"]
              }
            }
          },
          required: ["suggestedBeats"]
        }
      });

      const result = extractJson(responseText || '{}');
      if (result && result.suggestedBeats && Array.isArray(result.suggestedBeats)) {
        const newBeats: Beat[] = result.suggestedBeats.map((s: any, i: number) => ({
          id: `beat-suggest-${Date.now()}-${i}`,
          description: s.description,
          status: 'pending',
          characterIds: [],
          threadId: s.threadId
        }));
        updateChapter({ beats: [...activeChapter.beats, ...newBeats] });
        setAlertDialog({ isOpen: true, message: `AI 建议了 ${newBeats.length} 个新节拍，已添加到列表中。` });
      }
    } catch (error) {
      console.error(error);
      setAlertDialog({ isOpen: true, message: "获取剧情建议失败，请重试。" });
    } finally {
      setIsPlanning(false);
    }
  };

  const analyzeWorldStateSync = async (prose: string, beat: Beat) => {
    setIsSyncing(true);
    try {
      const beatCharacters = worldState.characters.filter(c => (beat.characterIds || []).includes(c.id));
      const beatRelationships = (worldState.relationships || []).filter(r => 
        (beat.characterIds || []).includes(r.sourceId) && (beat.characterIds || []).includes(r.targetId)
      );

      const prompt = `你是一个顶级文学编辑和世界观架构师。请分析以下新撰写的小说正文，并根据情节发展，建议对涉及角色和关系的【状态同步】。
      
      ### 涉及角色当前状态：
      ${JSON.stringify(beatCharacters)}
      
      ### 涉及角色当前关系：
      ${JSON.stringify(beatRelationships.map(r => ({
        source: worldState.characters.find(c => c.id === r.sourceId)?.name,
        target: worldState.characters.find(c => c.id === r.targetId)?.name,
        type: r.type,
        intensity: r.intensity
      })))}
      
      ### 新撰写的正文：
      ${prose}
      
      ---
      请根据正文内容，判断角色是否获得了新知识、改变了位置、更新了状态（如受伤、疲惫、情绪变化）、获得了新物品，或者角色间的关系是否发生了质变或强度增减。
      
      请返回一个 JSON 数组，每个对象包含：
      1. "type": "character" 或 "relationship"
      2. "id": 对应的角色 ID 或关系 ID
      3. "field": 要更新的字段（character: state, knowledge, location, inventory; relationship: type, intensity, description）
      4. "newValue": 新的值
      5. "reason": 简短的理由
      
      如果没有显著变化，请返回空数组 []。`;

      const responseText = await callAi({
        customModel: "gemini-3-flash-preview",
        prompt: prompt,
        responseMimeType: "application/json"
      });

      const suggestions = extractJson(responseText || '[]');
      if (suggestions && suggestions.length > 0) {
        setSyncSuggestions(suggestions);
      }
    } catch (error) {
      console.error("World state sync analysis failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const applySyncSuggestions = () => {
    let newWorldState = { ...worldState };
    
    syncSuggestions.forEach(s => {
      if (s.type === 'character') {
        newWorldState.characters = newWorldState.characters.map(c => 
          c.id === s.id ? { ...c, [s.field]: s.newValue } : c
        );
      } else if (s.type === 'relationship') {
        newWorldState.relationships = newWorldState.relationships.map(r => 
          r.id === s.id ? { ...r, [s.field]: s.newValue } : r
        );
      }
    });
    
    setWorldState(newWorldState);
    setSyncSuggestions([]);
    setAlertDialog({ isOpen: true, message: `已同步 ${syncSuggestions.length} 项世界状态变更。` });
  };

  const completeChapter = async () => {
    if (!activeChapter || !activeChapter.content) {
      setAlertDialog({ isOpen: true, message: '章节内容为空，无法完成。' });
      return;
    }

    setIsCompletingChapter(true);
    try {
      const prompt = `你是一个专业的文学编辑。请阅读以下小说章节内容，并提取出 1-3 句最核心的事件摘要（约 50-100 字），这将作为“过去事件 (Past Events)”被记录在世界状态中，供后续章节参考。
      
      章节内容：
      ${activeChapter.content.slice(0, 3000)}... (截取部分)
      
      请直接返回摘要文本，不要包含任何其他解释或格式。`;

      const summaryText = await callAi({
        customModel: "gemini-3-flash-preview",
        prompt: prompt,
      });

      if (summaryText) {
        const newSummary = `【${activeChapter.title}】${summaryText.trim()}`;
        
        // Update chapter status and summary
        updateChapter({ 
          status: 'completed',
          summary: newSummary
        });

        // Update or append to worldState.pastEvents
        setWorldState(prev => {
          const pastEvents = prev.pastEvents || [];
          const existingIndex = pastEvents.findIndex(e => e.startsWith(`【${activeChapter.title}】`));
          
          if (existingIndex >= 0) {
            const newPastEvents = [...pastEvents];
            newPastEvents[existingIndex] = newSummary;
            return { ...prev, pastEvents: newPastEvents };
          } else {
            return { ...prev, pastEvents: [...pastEvents, newSummary] };
          }
        });

        setAlertDialog({ isOpen: true, message: '章节已完成！摘要已同步至世界状态的“过去事件”中。' });
      }
    } catch (error) {
      console.error("Failed to complete chapter:", error);
      setAlertDialog({ isOpen: true, message: '生成章节摘要失败，请重试。' });
    } finally {
      setIsCompletingChapter(false);
    }
  };

  const executeBeat = async (beatId: string, isBatch = false) => {
    const beatIndex = activeChapter.beats.findIndex(b => b.id === beatId);
    if (beatIndex === -1) return;

    const beat = activeChapter.beats[beatIndex];
    if (!isBatch) setIsDrafting(true);

    const updatedBeats = [...activeChapter.beats];
    updatedBeats[beatIndex].status = 'drafting';
    updateChapter({ beats: updatedBeats });

    try {
      // 1. RAG Retrieval
      const relevantContext = await retrieveRelevantContext(beat.description);

      // 2. Memory Tree Context Assembly
      const currentChapters = chaptersRef.current;
      const currentActiveChapter = currentChapters.find(c => c.id === activeChapter.id);
      if (!currentActiveChapter) return;

      const currentIndex = currentChapters.findIndex(c => c.id === activeChapter.id);
      const previousChapters = currentChapters.slice(0, currentIndex);
      
      // Level 1: Global Settings
      const activeCharacters = worldState.characters.filter(c => (activeChapter.characterIds || []).includes(c.id)).map(c => ({
        name: c.name,
        role: c.role,
        description: c.description,
        state: c.state,
        knowledge: c.knowledge
      }));
      const activeRelationships = (worldState.relationships || []).filter(r => 
        (activeChapter.characterIds || []).includes(r.sourceId) && (activeChapter.characterIds || []).includes(r.targetId)
      ).map(r => ({
        source: worldState.characters.find(c => c.id === r.sourceId)?.name,
        target: worldState.characters.find(c => c.id === r.targetId)?.name,
        type: r.type,
        description: r.description,
        intensity: r.intensity
      }));
      const activeThreads = (worldState.threads || []).filter(t => 
        ((activeChapter.threadIds || []).includes(t.id)) && 
        (!t.volumeId || t.volumeId === activeVolume?.id)
      ).map(t => ({
        ...t,
        involvedCharacters: worldState.characters.filter(c => (t.characterIds || []).includes(c.id)).map(c => c.name)
      }));
      const activeLore = (worldState.lore || []).map(l => `${l.concept}: ${l.explanation}`).join(' | ');
      const globalSettings = `世界规则：${(worldState.rules || []).join(' | ')}\n世界法典：${activeLore || '无'}\n涉及角色：${JSON.stringify(activeCharacters)}\n角色关系：${JSON.stringify(activeRelationships)}\n关联伏笔（及其涉及角色）：${JSON.stringify(activeThreads)}\n未回收伏笔：${(worldState.threads || []).filter(t => t.status === 'open' && (!t.volumeId || t.volumeId === activeVolume?.id)).map(t => t.title).join(', ')}`;
      
      // Level 2: Volume Summaries (older chapters)
      const volumeSummaries = previousChapters.slice(0, -5).map(c => `【${c.title}】摘要: ${c.summary || c.content.slice(0, 300)}`).join('\n');
      
      // Level 3: Recent 5 Chapters Summaries
      const recentSummaries = previousChapters.slice(-5).map(c => `【${c.title}】摘要: ${c.summary || c.content.slice(0, 500)}`).join('\n');
      
      // Level 4: Current Chapter Full Text
      const currentChapterFullText = currentActiveChapter.content;
      
      const beatCharacters = worldState.characters.filter(c => (beat.characterIds || []).includes(c.id));
      const beatThread = (worldState.threads || []).find(t => t.id === beat.threadId);

      const prompt = `你是一个顶级小说家。请根据以下“多层级记忆树”上下文、检索到的相关信息、当前场景节拍及其涉及角色，撰写一段引人入胜的小说正文。
      
      ### 第一层：全局设定 (Global Settings)
      ${globalSettings}
      
      ### 第二层：卷宗摘要 (Volume Summaries)
      ${volumeSummaries || '无'}
      
      ### 第三层：最近 5 章摘要 (Recent Summaries)
      ${recentSummaries || '无'}
      
      ### 第四层：当前章全文 (Current Chapter)
      ${currentChapterFullText || '（本章刚开始）'}
      
      ### 检索到的相关背景/伏笔 (Retrieved Context)
      ${relevantContext || '无'}
      
      ---
      当前需要撰写的场景节拍：${beat.description}
      本节拍涉及角色：${JSON.stringify(beatCharacters)}
      本节拍关联伏笔：${beatThread ? `${beatThread.title}: ${beatThread.description}` : '无'}
      本章意图：${activeChapter.intent}
      ${getStylePrompt()}
      
      ### 写作要求 (Writing Requirements)
      1. 目标字数：约 ${genSettings.targetWords} 字。
      2. 叙述节奏：${genSettings.pacing === 'slow' ? '节奏缓慢，注重心理描写和环境渲染' : genSettings.pacing === 'fast' ? '节奏明快，注重动作和对话，推动剧情' : '节奏适中，平衡描写与叙事'}。
      3. 感官聚焦：${genSettings.sensoryFocus.length > 0 ? `重点突出以下感官细节：${genSettings.sensoryFocus.join(', ')}` : '自然平衡各种感官描写'}。
      4. 对话：${genSettings.includeDialogue ? '包含生动的人物对话' : '尽量减少对话，侧重叙述'}。
      5. 心理：${genSettings.includeInternalMonologue ? '包含细腻的人物内心独白' : '侧重外部表现'}。
      6. 必须使用中文输出。
      7. 严格遵循设定的【文风基调】，消除 AI 味。
      8. 贯彻 "Show, Don't Tell" 原则，增加画面感和感官细节。
      9. 承接上文语气，自然过渡，不要重复上文已经写过的内容。
      10. 直接输出小说正文，不要包含任何多余的解释或标题。`;

      const responseText = await callAi({
        prompt: prompt,
      });

      const generatedText = responseText || '';
      
      // Update chapters state
      setChapters(prev => prev.map(ch => {
        if (ch.id === activeChapter.id) {
          const newContent = ch.content + (ch.content ? '\n\n' : '') + generatedText;
          const newBeats = [...ch.beats];
          const bIdx = newBeats.findIndex(b => b.id === beatId);
          if (bIdx !== -1) newBeats[bIdx].status = 'completed';
          
          return { ...ch, content: newContent, beats: newBeats };
        }
        return ch;
      }));

      // Trigger side effects AFTER state update (outside of the updater function)
      const currentChapters = chaptersRef.current;
      const updatedChapter = currentChapters.find(c => c.id === activeChapter.id);
      if (updatedChapter) {
        const newContent = updatedChapter.content + (updatedChapter.content ? '\n\n' : '') + generatedText;
        extractKnowledge(newContent);
        summarizeChapter(activeChapter.id, newContent);
        analyzeWorldStateSync(generatedText, beat);
      }
      
    } catch (error) {
      console.error(error);
      setAlertDialog({ isOpen: true, message: `撰写节拍 "${beat.description.slice(0, 20)}..." 失败，请重试。` });
      const finalBeats = [...activeChapter.beats];
      const bIdx = finalBeats.findIndex(b => b.id === beatId);
      if (bIdx !== -1) finalBeats[bIdx].status = 'pending';
      updateChapter({ beats: finalBeats });
    } finally {
      if (!isBatch) setIsDrafting(false);
    }
  };

  const executeBatchBeats = async () => {
    const pendingBeats = activeChapter.beats.filter(b => b.status === 'pending');
    if (pendingBeats.length === 0) return;

    setIsDrafting(true);
    try {
      for (const beat of pendingBeats) {
        await executeBeat(beat.id, true);
      }
      setActiveTab('reader');
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
      <div 
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto p-4 sm:p-8 bg-white transition-all duration-500 ${isZenMode ? 'px-12 sm:px-24' : ''}`}
      >
        <div className="max-w-3xl mx-auto">
          {activeTab === 'reader' ? (
            <div className="space-y-6">
              {/* Auto-Read Controls */}
              <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl p-3 mb-8 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                    className={`p-2 rounded-lg transition-colors ${isAutoScrolling ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-600'}`}
                    title={isAutoScrolling ? "停止自动滚动" : "开始自动滚动"}
                  >
                    {isAutoScrolling ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={handleTts}
                    className={`p-2 rounded-lg transition-colors ${isTtsPlaying ? 'bg-rose-100 text-rose-600' : 'hover:bg-slate-100 text-slate-600'}`}
                    title={isTtsPlaying ? "停止朗读" : "开始朗读"}
                  >
                    {isTtsPlaying ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <div className="h-6 w-px bg-slate-200 mx-1" />
                  <div className="flex items-center gap-2 px-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">速度</span>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      step="1"
                      value={scrollSpeed}
                      onChange={(e) => setScrollSpeed(parseInt(e.target.value))}
                      className="w-16 sm:w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="text-xs font-mono text-indigo-600 w-4">{scrollSpeed}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsZenMode(!isZenMode)}
                    className={`p-2 rounded-lg transition-colors ${isZenMode ? 'bg-amber-100 text-amber-600' : 'hover:bg-slate-100 text-slate-600'}`}
                    title={isZenMode ? "退出沉浸模式" : "进入沉浸模式 (Ctrl+Z)"}
                  >
                    {isZenMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                  {isEditingContent ? (
                    <button onClick={handleSaveContent} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium">
                      <Save className="w-3.5 h-3.5" /> 保存
                    </button>
                  ) : (
                    <button onClick={() => setIsEditingContent(true)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-xs font-medium">
                      <Edit3 className="w-3.5 h-3.5" /> 编辑
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-8">
                <h2 className={`font-bold text-slate-900 font-serif transition-all duration-500 ${isZenMode ? 'text-4xl mb-12 text-center' : 'text-3xl mb-4'}`}>{activeChapter.title}</h2>
              </div>

              {isEditingContent ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-[60vh] p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-serif text-lg leading-relaxed"
                  placeholder="在此输入正文..."
                />
              ) : (
                <div className={`prose prose-slate max-w-none font-serif leading-loose transition-all duration-500 ${isZenMode ? 'prose-xl text-slate-800' : 'prose-lg'}`}>
                  {activeChapter.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeChapter.content}</ReactMarkdown>
                  ) : (
                    <div className="text-slate-400 italic text-center py-20">
                      正文为空。你可以直接编辑，或者切换到“大纲与节拍”让 AI 为你撰写。
                    </div>
                  )}
                </div>
              )}
              
              {/* Progress Indicator */}
              <div className="mt-20 pt-8 border-t border-slate-100 flex items-center justify-between text-slate-400 text-sm italic">
                <div className="flex items-center gap-4">
                  <span>本章结束</span>
                  {activeChapter.status !== 'completed' && activeChapter.content && (
                    <button 
                      onClick={completeChapter}
                      disabled={isCompletingChapter}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium transition-colors not-italic"
                    >
                      {isCompletingChapter ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {isCompletingChapter ? '生成摘要中...' : '完成本章并同步至世界状态'}
                    </button>
                  )}
                  {activeChapter.status === 'completed' && (
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-green-600 font-medium not-italic" title={activeChapter.summary}>
                        <CheckCircle2 className="w-4 h-4" /> 已完成
                      </span>
                      <button 
                        onClick={completeChapter} 
                        disabled={isCompletingChapter}
                        className="text-xs text-slate-400 hover:text-indigo-500 underline not-italic"
                      >
                        {isCompletingChapter ? '同步中...' : '重新同步'}
                      </button>
                    </div>
                  )}
                </div>
                <span>{activeChapter.content?.length || 0} 字</span>
              </div>
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
                  <button
                    onClick={suggestPlot}
                    disabled={isPlanning || activeChapter.beats.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {isPlanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {isPlanning ? '建议中...' : '剧情建议'}
                  </button>
                </div>
                
                <div className="mb-4">
                  <label className="text-xs font-bold text-indigo-800 mb-2 block">本章涉及角色：</label>
                  <div className="flex flex-wrap gap-2">
                    {worldState.characters.map(char => (
                      <button
                        key={char.id}
                        onClick={() => {
                          const newIds = (activeChapter.characterIds || []).includes(char.id)
                            ? (activeChapter.characterIds || []).filter(id => id !== char.id)
                            : [...(activeChapter.characterIds || []), char.id];
                          updateChapter({ characterIds: newIds });
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          (activeChapter.characterIds || []).includes(char.id)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-100'
                        }`}
                      >
                        {char.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold text-indigo-800 mb-2 block">本章关联伏笔：</label>
                  <div className="flex flex-wrap gap-2">
                    {(worldState.threads || []).map(thread => (
                      <button
                        key={thread.id}
                        onClick={() => {
                          const newIds = (activeChapter.threadIds || []).includes(thread.id)
                            ? (activeChapter.threadIds || []).filter(id => id !== thread.id)
                            : [...(activeChapter.threadIds || []), thread.id];
                          updateChapter({ threadIds: newIds });
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          (activeChapter.threadIds || []).includes(thread.id)
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        {thread.title}
                      </button>
                    ))}
                  </div>
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

              {/* Generation Workshop Settings */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-slate-400" />
                    创作工坊设置 (Generation Settings)
                  </h3>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setGenSettings(prev => ({ ...prev, mode: 'single' }))}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${genSettings.mode === 'single' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      单步生成
                    </button>
                    <button 
                      onClick={() => setGenSettings(prev => ({ ...prev, mode: 'batch' }))}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${genSettings.mode === 'batch' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      批量连写
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-2 block flex justify-between">
                        目标字数 (单次生成)
                        <span className="text-indigo-600">{genSettings.targetWords} 字</span>
                      </label>
                      <input 
                        type="range" 
                        min="100" 
                        max="2000" 
                        step="100"
                        value={genSettings.targetWords}
                        onChange={(e) => setGenSettings(prev => ({ ...prev, targetWords: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-2 block">叙事节奏 (Pacing)</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['slow', 'balanced', 'fast'].map(p => (
                          <button
                            key={p}
                            onClick={() => setGenSettings(prev => ({ ...prev, pacing: p as any }))}
                            className={`py-2 rounded-lg text-xs font-medium border transition-all ${genSettings.pacing === p ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                          >
                            {p === 'slow' ? '舒缓' : p === 'fast' ? '紧凑' : '均衡'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-2 block">感官聚焦 (Sensory Focus)</label>
                      <div className="flex flex-wrap gap-2">
                        {['视觉', '听觉', '嗅觉', '触觉', '心理', '动作'].map(s => (
                          <button
                            key={s}
                            onClick={() => {
                              const newFocus = genSettings.sensoryFocus.includes(s)
                                ? genSettings.sensoryFocus.filter(f => f !== s)
                                : [...genSettings.sensoryFocus, s];
                              setGenSettings(prev => ({ ...prev, sensoryFocus: newFocus }));
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${genSettings.sensoryFocus.includes(s) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div 
                          onClick={() => setGenSettings(prev => ({ ...prev, includeDialogue: !prev.includeDialogue }))}
                          className={`w-10 h-5 rounded-full transition-all relative ${genSettings.includeDialogue ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                          <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all ${genSettings.includeDialogue ? 'translate-x-5' : ''}`} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">包含对话</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div 
                          onClick={() => setGenSettings(prev => ({ ...prev, includeInternalMonologue: !prev.includeInternalMonologue }))}
                          className={`w-10 h-5 rounded-full transition-all relative ${genSettings.includeInternalMonologue ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                          <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all ${genSettings.includeInternalMonologue ? 'translate-x-5' : ''}`} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">包含心理</span>
                      </label>
                    </div>
                  </div>
                </div>

                {genSettings.mode === 'batch' && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <button
                      onClick={executeBatchBeats}
                      disabled={isDrafting || activeChapter.beats.filter(b => b.status === 'pending').length === 0}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                      {isDrafting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                      {isDrafting ? '正在批量连写中...' : `一键连写剩余 ${activeChapter.beats.filter(b => b.status === 'pending').length} 个节拍`}
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-2 italic">
                      批量模式将按顺序自动撰写所有待处理的节拍，并实时同步上下文。
                    </p>
                  </div>
                )}
              </div>

          {/* World State Sync Suggestions */}
          {syncSuggestions.length > 0 && (
            <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-indigo-900 flex items-center gap-2 text-sm">
                  <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin-slow"/> 世界状态同步建议
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSyncSuggestions([])}
                    className="text-[10px] text-slate-400 hover:text-slate-600 px-2 py-1"
                  >
                    忽略全部
                  </button>
                  <button 
                    onClick={applySyncSuggestions}
                    className="text-[10px] bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3 h-3" /> 全部应用
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {syncSuggestions.map((s, i) => {
                  const targetName = s.type === 'character' 
                    ? worldState.characters.find(c => c.id === s.id)?.name 
                    : `${worldState.characters.find(c => c.id === worldState.relationships.find(r => r.id === s.id)?.sourceId)?.name} & ${worldState.characters.find(c => c.id === worldState.relationships.find(r => r.id === s.id)?.targetId)?.name}`;
                  
                  return (
                    <div key={i} className="bg-white p-2 rounded border border-indigo-100 text-[10px] flex items-start gap-2">
                      <div className="mt-0.5">
                        {s.type === 'character' ? <Users className="w-3 h-3 text-indigo-400"/> : <Zap className="w-3 h-3 text-rose-400"/>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="font-bold text-slate-700">{targetName}</span>
                          <span className="text-slate-400">»</span>
                          <span className="text-indigo-600 font-medium">{s.field}</span>
                        </div>
                        <div className="text-slate-600 mb-1">
                          新值: <span className="bg-indigo-50 px-1 rounded text-indigo-700">{s.newValue}</span>
                        </div>
                        <div className="text-slate-400 italic">理由: {s.reason}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                            <div className="mt-2">
                              <label className="text-[10px] font-bold text-slate-500 mb-1 block">本节拍涉及角色：</label>
                              <div className="flex flex-wrap gap-1">
                                {worldState.characters.map(char => (
                                  <button
                                    key={char.id}
                                    onClick={() => {
                                      const newBeats = [...activeChapter.beats];
                                      const charIds = newBeats[index].characterIds || [];
                                      newBeats[index].characterIds = charIds.includes(char.id)
                                        ? charIds.filter(id => id !== char.id)
                                        : [...charIds, char.id];
                                      updateChapter({ beats: newBeats });
                                    }}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                                      (beat.characterIds || []).includes(char.id)
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
                              <label className="text-[10px] font-bold text-slate-500 mb-1 block">本节拍关联伏笔：</label>
                              <select
                                value={beat.threadId || ''}
                                onChange={(e) => {
                                  const newBeats = [...activeChapter.beats];
                                  newBeats[index].threadId = e.target.value || undefined;
                                  updateChapter({ beats: newBeats });
                                }}
                                className="w-full text-xs p-1 rounded border border-slate-200 bg-white text-slate-600"
                              >
                                <option value="">无</option>
                                {(worldState.threads || []).filter(t => 
                                  (activeChapter.threadIds || []).includes(t.id) && 
                                  (!t.volumeId || t.volumeId === activeVolume?.id)
                                ).map(thread => (
                                  <option key={thread.id} value={thread.id}>{thread.title}</option>
                                ))}
                              </select>
                            </div>
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
                  
                  {/* Complete Chapter Button (Writer Tab) */}
                  {activeChapter.status !== 'completed' && activeChapter.content && (
                    <div className="mt-8 flex justify-center">
                      <button
                        onClick={completeChapter}
                        disabled={isCompletingChapter || activeChapter.beats.some(b => b.status !== 'completed')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${
                          activeChapter.beats.some(b => b.status !== 'completed')
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-md hover:scale-105'
                        }`}
                      >
                        {isCompletingChapter ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        {isCompletingChapter ? '正在生成摘要并同步...' : '完成本章并同步至世界状态'}
                      </button>
                    </div>
                  )}
                  {activeChapter.status === 'completed' && (
                    <div className="mt-8 flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-green-50 text-green-600 border border-green-200">
                        <CheckCircle2 className="w-5 h-5" />
                        本章已完成，摘要已同步
                      </div>
                      <button 
                        onClick={completeChapter} 
                        disabled={isCompletingChapter}
                        className="text-sm text-slate-400 hover:text-indigo-500 underline"
                      >
                        {isCompletingChapter ? '正在重新生成并同步...' : '内容有修改？重新同步摘要'}
                      </button>
                    </div>
                  )}
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
