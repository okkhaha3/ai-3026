"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Chapter, WorldState, ChatMessage, Flashcard, ChapterLore, Beat, SandboxMessage, ApiSettings, ApiLog } from '../types';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

interface AppContextType {
  chapters: Chapter[];
  setChapters: React.Dispatch<React.SetStateAction<Chapter[]>>;
  activeChapterId: string | null;
  setActiveChapterId: (id: string | null) => void;
  worldState: WorldState;
  setWorldState: React.Dispatch<React.SetStateAction<WorldState>>;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  sandboxHistory: SandboxMessage[];
  setSandboxHistory: React.Dispatch<React.SetStateAction<SandboxMessage[]>>;
  flashcards: Flashcard[];
  setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>;
  chapterLore: Record<string, ChapterLore>;
  setChapterLore: React.Dispatch<React.SetStateAction<Record<string, ChapterLore>>>;
  
  // UI State
  isGeneratingWorld: boolean;
  setIsGeneratingWorld: (val: boolean) => void;
  isZenMode: boolean;
  setIsZenMode: (val: boolean) => void;
  isLeftSidebarOpen: boolean;
  setIsLeftSidebarOpen: (val: boolean) => void;
  isRightSidebarOpen: boolean;
  setIsRightSidebarOpen: (val: boolean) => void;
  leftSidebarWidth: number;
  setLeftSidebarWidth: (val: number) => void;
  rightSidebarWidth: number;
  setRightSidebarWidth: (val: number) => void;
  isDrafting: boolean;
  setIsDrafting: (val: boolean) => void;
  isPlanning: boolean;
  setIsPlanning: (val: boolean) => void;
  isDigging: boolean;
  setIsDigging: (val: boolean) => void;
  isPolishing: boolean;
  setIsPolishing: (val: boolean) => void;
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;
  isExtracting: boolean;
  setIsExtracting: (val: boolean) => void;
  
  // Modals
  confirmDialog: { isOpen: boolean; message: string; onConfirm: () => void };
  setConfirmDialog: React.Dispatch<React.SetStateAction<{ isOpen: boolean; message: string; onConfirm: () => void }>>;
  alertDialog: { isOpen: boolean; message: string };
  setAlertDialog: React.Dispatch<React.SetStateAction<{ isOpen: boolean; message: string }>>;
  promptDialog: { isOpen: boolean; message: string; value: string; onConfirm: (val: string) => void };
  setPromptDialog: React.Dispatch<React.SetStateAction<{ isOpen: boolean; message: string; value: string; onConfirm: (val: string) => void }>>;
  isClearDataModalOpen: boolean;
  setIsClearDataModalOpen: (val: boolean) => void;
  isCodexOpen: boolean;
  setIsCodexOpen: (val: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (val: boolean) => void;
  apiSettings: ApiSettings;
  setApiSettings: React.Dispatch<React.SetStateAction<ApiSettings>>;
  apiLogs: ApiLog[];
  setApiLogs: React.Dispatch<React.SetStateAction<ApiLog[]>>;
  isConsoleOpen: boolean;
  setIsConsoleOpen: (val: boolean) => void;
  clearApiLogs: () => void;
  rabbitHole: { term: string; explanation: string } | null;
  setRabbitHole: React.Dispatch<React.SetStateAction<{ term: string; explanation: string } | null>>;
  
  // Helpers
  getAiClient: (customSettings?: ApiSettings) => GoogleGenAI | null;
  getOpenAiClient: (customSettings?: ApiSettings) => OpenAI | null;
  callAi: (params: {
    prompt: string;
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: any;
    customModel?: string;
  }) => Promise<string>;
  callAiWithRetry: <T>(apiCall: () => Promise<T>, maxRetries?: number, initialDelay?: number) => Promise<T>;
  testApiConnection: (settings: ApiSettings) => Promise<{ success: boolean; message: string }>;
  fetchModels: (settings: ApiSettings) => Promise<string[]>;
  handleClearData: () => void;
  getStylePrompt: (volumeId?: string) => string;
  extractJson: (text: string) => any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const DEFAULT_WORLD_STATE: WorldState = {
  rules: ['魔法需要消耗精神力', '龙族已经灭绝'],
  characters: [
    { id: 'char-1', name: '艾伦', role: 'protagonist', state: '健康', knowledge: '初级魔法', location: '新手村', inventory: '木剑', description: '故事的主角，一名渴望成为魔法师的少年。' }
  ],
  relationships: [],
  lore: [],
  ledger: { time: '纪元100年', resources: '金币: 100', notes: '主角刚刚苏醒' },
  pastEvents: ['大灾变发生'],
  threads: [],
  style: {
    description: '沉浸式，画面感强，注重心理描写和环境烘托。',
    pacing: 3,
    diction: 'literary',
    sentenceStructure: 'mixed',
    sensoryFocus: ['visual', 'psychological'],
    perspective: 'third-limited',
    forbiddenWords: ['然而', '总之', '不禁', '仿佛'],
    signaturePatterns: [],
    sampleAnalysis: ''
  },
  volumes: []
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [worldState, setWorldState] = useState<WorldState>(DEFAULT_WORLD_STATE);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [sandboxHistory, setSandboxHistory] = useState<SandboxMessage[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [chapterLore, setChapterLore] = useState<Record<string, ChapterLore>>({});

  // UI State
  const [isGeneratingWorld, setIsGeneratingWorld] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(256); // 64 * 4 = 256px
  const [rightSidebarWidth, setRightSidebarWidth] = useState(384); // 96 * 4 = 384px
  const [isDrafting, setIsDrafting] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isDigging, setIsDigging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // Modals
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: () => {} });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '' });
  const [promptDialog, setPromptDialog] = useState<{ isOpen: boolean; message: string; value: string; onConfirm: (val: string) => void }>({ isOpen: false, message: '', value: '', onConfirm: () => {} });
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    provider: 'gemini',
    apiKey: '',
    baseUrl: '',
    model: 'gemini-3-flash-preview'
  });
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [rabbitHole, setRabbitHole] = useState<{ term: string; explanation: string } | null>(null);

  // Load from local storage
  useEffect(() => {
    const loadData = () => {
      const savedChapters = localStorage.getItem('novel_chapters');
      if (savedChapters) setChapters(JSON.parse(savedChapters));
      
      const savedWorld = localStorage.getItem('novel_world');
      if (savedWorld) {
        try {
          const parsedWorld = JSON.parse(savedWorld);
          setWorldState({
            ...DEFAULT_WORLD_STATE,
            ...parsedWorld,
            style: {
              ...DEFAULT_WORLD_STATE.style,
              ...(parsedWorld.style || {})
            }
          });
        } catch (e) {
          console.error("Failed to parse saved world state:", e);
        }
      }
      
      const savedChat = localStorage.getItem('novel_chat');
      if (savedChat) setChatHistory(JSON.parse(savedChat));
      
      const savedCards = localStorage.getItem('novel_flashcards');
      if (savedCards) setFlashcards(JSON.parse(savedCards));
      
      const savedLore = localStorage.getItem('novel_lore');
      if (savedLore) setChapterLore(JSON.parse(savedLore));

      const savedSettings = localStorage.getItem('novel_api_settings');
      if (savedSettings) setApiSettings(JSON.parse(savedSettings));
    };
    loadData();
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('novel_chapters', JSON.stringify(chapters));
    localStorage.setItem('novel_world', JSON.stringify(worldState));
    localStorage.setItem('novel_chat', JSON.stringify(chatHistory));
    localStorage.setItem('novel_flashcards', JSON.stringify(flashcards));
    localStorage.setItem('novel_lore', JSON.stringify(chapterLore));
    localStorage.setItem('novel_api_settings', JSON.stringify(apiSettings));
  }, [chapters, worldState, chatHistory, flashcards, chapterLore, apiSettings]);

  const getAiClient = (customSettings?: ApiSettings) => {
    const settings = customSettings || apiSettings;
    if (settings.provider !== 'gemini') return null;

    const apiKey = settings.apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      if (!customSettings) {
        setAlertDialog({ isOpen: true, message: "未找到 Gemini API Key，请在设置中配置您的 API Key。" });
        setIsSettingsOpen(true);
      }
      return null;
    }
    
    const config: any = { apiKey };
    if (settings.baseUrl) {
      config.baseUrl = settings.baseUrl;
    }
    
    return new GoogleGenAI(config);
  };

  const getOpenAiClient = (customSettings?: ApiSettings) => {
    const settings = customSettings || apiSettings;
    if (settings.provider !== 'openai') return null;

    const apiKey = settings.apiKey;
    if (!apiKey) {
      if (!customSettings) {
        setAlertDialog({ isOpen: true, message: "未找到 API Key，请在设置中配置您的 API Key。" });
        setIsSettingsOpen(true);
      }
      return null;
    }

    return new OpenAI({
      apiKey,
      baseURL: settings.baseUrl || undefined,
      dangerouslyAllowBrowser: true
    });
  };

  const callAi = async (params: {
    prompt: string;
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: any;
    customModel?: string;
  }): Promise<string> => {
    const model = params.customModel || apiSettings.model;
    const startTime = Date.now();
    const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const executeCall = async () => {
      if (apiSettings.provider === 'gemini') {
        const ai = getAiClient();
        if (!ai) throw new Error("AI client not initialized");
        
        const response = await ai.models.generateContent({
          model: model,
          contents: params.prompt,
          config: {
            systemInstruction: params.systemInstruction,
            responseMimeType: params.responseMimeType as any,
            responseSchema: params.responseSchema,
          }
        });
        return response.text || "";
      } else {
        const openai = getOpenAiClient();
        if (!openai) throw new Error("OpenAI client not initialized");

        const messages: any[] = [];
        if (params.systemInstruction) {
          messages.push({ role: 'system', content: params.systemInstruction });
        }
        
        let finalPrompt = params.prompt;
        if (params.responseSchema && params.responseMimeType === 'application/json') {
          finalPrompt += `\n\n请严格按照以下 JSON 格式返回结果：\n${JSON.stringify(params.responseSchema, null, 2)}`;
        }
        
        messages.push({ role: 'user', content: finalPrompt });

        const response = await openai.chat.completions.create({
          model: model,
          messages,
          response_format: params.responseMimeType === 'application/json' ? { type: 'json_object' } : undefined,
        });

        return response.choices[0].message.content || "";
      }
    };

    try {
      const result = await callAiWithRetry(executeCall);
      const duration = Date.now() - startTime;
      
      const newLog: ApiLog = {
        id: logId,
        timestamp: new Date().toISOString(),
        provider: apiSettings.provider,
        model: model,
        request: {
          prompt: params.prompt,
          systemInstruction: params.systemInstruction,
          responseMimeType: params.responseMimeType,
          responseSchema: params.responseSchema,
        },
        response: result,
        status: 'success',
        duration: duration
      };
      
      setApiLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const newLog: ApiLog = {
        id: logId,
        timestamp: new Date().toISOString(),
        provider: apiSettings.provider,
        model: model,
        request: {
          prompt: params.prompt,
          systemInstruction: params.systemInstruction,
          responseMimeType: params.responseMimeType,
          responseSchema: params.responseSchema,
        },
        response: "",
        status: 'error',
        error: error.message || String(error),
        duration: duration
      };
      setApiLogs(prev => [newLog, ...prev].slice(0, 50));
      throw error;
    }
  };

  const testApiConnection = async (settings: ApiSettings): Promise<{ success: boolean; message: string }> => {
    if (settings.provider === 'gemini') {
      const ai = getAiClient(settings);
      if (!ai) return { success: false, message: "API Key 不能为空" };
      
      try {
        const response = await ai.models.generateContent({
          model: settings.model,
          contents: "Hi",
        });
        if (response.text) {
          return { success: true, message: "连接成功！" };
        }
        return { success: false, message: "连接失败：未收到响应" };
      } catch (error: any) {
        console.error("API Test failed:", error);
        return { success: false, message: `连接失败: ${error.message || '未知错误'}` };
      }
    } else {
      const openai = getOpenAiClient(settings);
      if (!openai) return { success: false, message: "API Key 不能为空" };

      try {
        const response = await openai.chat.completions.create({
          model: settings.model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5
        });
        if (response.choices[0].message.content) {
          return { success: true, message: "连接成功！" };
        }
        return { success: false, message: "连接失败：未收到响应" };
      } catch (error: any) {
        console.error("API Test failed:", error);
        return { success: false, message: `连接失败: ${error.message || '未知错误'}` };
      }
    }
  };

  const fetchModels = async (settings: ApiSettings): Promise<string[]> => {
    if (settings.provider === 'gemini') {
      const ai = getAiClient(settings);
      if (!ai) return [];
      try {
        const response = await ai.models.list();
        // The response is a Pager that can be iterated or converted to an array
        const models = [];
        for await (const model of response) {
          models.push(model);
        }
        return models
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name.replace('models/', ''));
      } catch (error) {
        console.error("Failed to fetch Gemini models:", error);
        return [];
      }
    } else {
      const openai = getOpenAiClient(settings);
      if (!openai) return [];
      try {
        const response = await openai.models.list();
        return response.data.map(m => m.id);
      } catch (error) {
        console.error("Failed to fetch OpenAI models:", error);
        return [];
      }
    }
  };

  const callAiWithRetry = async <T extends unknown>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 2000
  ): Promise<T> => {
    let retries = 0;
    while (true) {
      try {
        return await apiCall();
      } catch (error: any) {
        const errorMsg = typeof error === 'string' ? error : (error?.message || '');
        const isRateLimit = errorMsg.includes('429') || 
                           errorMsg.includes('RESOURCE_EXHAUSTED') || 
                           error?.status === 429 || 
                           error?.code === 429 ||
                           error?.response?.status === 429;
        
        if (isRateLimit && retries < maxRetries) {
          const delay = initialDelay * Math.pow(2, retries);
          console.warn(`API Rate Limit hit. Retrying in ${delay}ms... (Attempt ${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
        } else if (isRateLimit) {
          throw new Error("API 额度已耗尽或请求过于频繁，请稍后再试。");
        } else {
          throw error;
        }
      }
    }
  };

  const handleClearData = () => {
    localStorage.clear();
    setChapters([]);
    setActiveChapterId(null);
    setWorldState(DEFAULT_WORLD_STATE);
    setChatHistory([]);
    setFlashcards([]);
    setChapterLore({});
    setApiLogs([]);
    setIsClearDataModalOpen(false);
  };

  const clearApiLogs = () => setApiLogs([]);

  const getStylePrompt = (volumeId?: string) => {
    let style = worldState.style;
    if (volumeId) {
      const volume = worldState.volumes.find(v => v.id === volumeId);
      if (volume && volume.styleProfile) {
        style = volume.styleProfile;
      }
    }
    if (!style) return "【文风与基调设定】\n- 核心描述：无";
    
    const pacingMap = ['极慢', '舒缓', '中等', '紧凑', '极快'];
    const dictionMap = { colloquial: '通俗白话', literary: '文学雅致', archaic: '古风/半文白', hardcore: '冷峻硬核' };
    const structureMap = { short: '短句为主', mixed: '长短结合', long: '长句/西化' };
    const sensoryMap = { visual: '视觉', auditory: '听觉', olfactory: '嗅觉', tactile: '触觉', gustatory: '味觉', psychological: '心理' };
    const perspectiveMap = { first: '第一人称', 'third-limited': '第三人称限知', 'third-omniscient': '第三人称全知' };

    return `
【文风与基调设定】${volumeId ? ' (当前卷专属)' : ''}
- 核心描述：${style.description || '无'}
- 叙事节奏：${pacingMap[style.pacing - 1] || '中等'}
- 用词风格：${dictionMap[style.diction] || '文学雅致'}
- 句式偏好：${structureMap[style.sentenceStructure] || '长短结合'}
- 叙事视角：${perspectiveMap[style.perspective] || '第三人称限知'}
- 感官偏好：${(style.sensoryFocus || []).map(s => sensoryMap[s as keyof typeof sensoryMap]).join('、') || '无'}
- 避讳词（严禁出现）：${(style.forbiddenWords || []).join('、') || '无'}
- 标志性表达/修辞：${(style.signaturePatterns || []).join('、') || '无'}
${style.sampleAnalysis ? `- 样本分析参考：${style.sampleAnalysis}` : ''}
    `.trim();
  };

  const extractJson = (text: string) => {
    if (!text) return null;
    try {
      // Try direct parse first
      return JSON.parse(text);
    } catch (e) {
      // Try to extract from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          return JSON.parse(jsonMatch[1].trim());
        } catch (innerError) {
          console.error("Failed to parse extracted JSON:", innerError);
        }
      }
      
      // Try to find the first { and last }
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          return JSON.parse(text.substring(firstBrace, lastBrace + 1));
        } catch (innerError) {
          console.error("Failed to parse JSON from braces:", innerError);
        }
      }

      // Try to find the first [ and last ]
      const firstBracket = text.indexOf('[');
      const lastBracket = text.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        try {
          return JSON.parse(text.substring(firstBracket, lastBracket + 1));
        } catch (innerError) {
          console.error("Failed to parse JSON from brackets:", innerError);
        }
      }

      console.error("Could not extract valid JSON from text:", text);
      return null;
    }
  };

  return (
    <AppContext.Provider value={{
      chapters, setChapters,
      activeChapterId, setActiveChapterId,
      worldState, setWorldState,
      chatHistory, setChatHistory,
      sandboxHistory, setSandboxHistory,
      flashcards, setFlashcards,
      chapterLore, setChapterLore,
      isGeneratingWorld, setIsGeneratingWorld,
      isZenMode, setIsZenMode,
      isLeftSidebarOpen, setIsLeftSidebarOpen,
      isRightSidebarOpen, setIsRightSidebarOpen,
      leftSidebarWidth, setLeftSidebarWidth,
      rightSidebarWidth, setRightSidebarWidth,
      isDrafting, setIsDrafting,
      isPlanning, setIsPlanning,
      isDigging, setIsDigging,
      isPolishing, setIsPolishing,
      isSimulating, setIsSimulating,
      isExtracting, setIsExtracting,
      confirmDialog, setConfirmDialog,
      alertDialog, setAlertDialog,
      promptDialog, setPromptDialog,
      isClearDataModalOpen, setIsClearDataModalOpen,
      isCodexOpen, setIsCodexOpen,
      isSettingsOpen, setIsSettingsOpen,
      isConsoleOpen, setIsConsoleOpen,
      apiSettings, setApiSettings,
      apiLogs, setApiLogs,
      clearApiLogs,
      rabbitHole, setRabbitHole,
      getAiClient, getOpenAiClient, callAi, callAiWithRetry, testApiConnection, fetchModels, handleClearData,
      getStylePrompt,
      extractJson
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
