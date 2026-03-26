"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Chapter, WorldState, ChatMessage, Flashcard, ChapterLore, Beat, SandboxMessage } from '../types';
import { GoogleGenAI } from '@google/genai';

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
  rabbitHole: { term: string; explanation: string } | null;
  setRabbitHole: React.Dispatch<React.SetStateAction<{ term: string; explanation: string } | null>>;
  
  // Helpers
  getAiClient: () => GoogleGenAI | null;
  handleClearData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_WORLD_STATE: WorldState = {
  rules: ['魔法需要消耗精神力', '龙族已经灭绝'],
  characters: [
    { id: 'char-1', name: '艾伦', state: '健康', knowledge: '初级魔法', location: '新手村', inventory: '木剑' }
  ],
  ledger: { time: '纪元100年', resources: '金币: 100', notes: '主角刚刚苏醒' },
  pastEvents: ['大灾变发生'],
  threads: [],
  styleProfile: '沉浸式，画面感强，注重心理描写和环境烘托。'
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
  const [isDrafting, setIsDrafting] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isDigging, setIsDigging] = useState(false);

  // Modals
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: () => {} });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '' });
  const [promptDialog, setPromptDialog] = useState<{ isOpen: boolean; message: string; value: string; onConfirm: (val: string) => void }>({ isOpen: false, message: '', value: '', onConfirm: () => {} });
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [rabbitHole, setRabbitHole] = useState<{ term: string; explanation: string } | null>(null);

  // Load from local storage
  useEffect(() => {
    const loadData = () => {
      const savedChapters = localStorage.getItem('novel_chapters');
      if (savedChapters) setChapters(JSON.parse(savedChapters));
      
      const savedWorld = localStorage.getItem('novel_world');
      if (savedWorld) setWorldState(JSON.parse(savedWorld));
      
      const savedChat = localStorage.getItem('novel_chat');
      if (savedChat) setChatHistory(JSON.parse(savedChat));
      
      const savedCards = localStorage.getItem('novel_flashcards');
      if (savedCards) setFlashcards(JSON.parse(savedCards));
      
      const savedLore = localStorage.getItem('novel_lore');
      if (savedLore) setChapterLore(JSON.parse(savedLore));
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
  }, [chapters, worldState, chatHistory, flashcards, chapterLore]);

  const getAiClient = () => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setAlertDialog({ isOpen: true, message: "未找到 Gemini API Key，请在环境变量中设置。" });
      return null;
    }
    return new GoogleGenAI({ apiKey });
  };

  const handleClearData = () => {
    localStorage.clear();
    setChapters([]);
    setActiveChapterId(null);
    setWorldState(DEFAULT_WORLD_STATE);
    setChatHistory([]);
    setFlashcards([]);
    setChapterLore({});
    setIsClearDataModalOpen(false);
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
      isDrafting, setIsDrafting,
      isPlanning, setIsPlanning,
      isDigging, setIsDigging,
      isPolishing, setIsPolishing,
      isSimulating, setIsSimulating,
      confirmDialog, setConfirmDialog,
      alertDialog, setAlertDialog,
      promptDialog, setPromptDialog,
      isClearDataModalOpen, setIsClearDataModalOpen,
      isCodexOpen, setIsCodexOpen,
      rabbitHole, setRabbitHole,
      getAiClient, handleClearData
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
