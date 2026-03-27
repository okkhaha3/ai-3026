export interface Beat {
  id: string;
  description: string;
  status: 'pending' | 'drafting' | 'completed';
}

export interface SandboxMessage {
  character: string;
  text: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  intent: string;
  summary?: string;
  beats: Beat[];
  status: 'reading' | 'planning' | 'drafting' | 'completed';
}

export interface Character {
  id: string;
  name: string;
  state: string;
  knowledge: string;
  location: string;
  inventory: string;
}

export interface PlotThread {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'resolved';
}

export interface StyleProfile {
  description: string;
  pacing: number; // 1-5 (1: Slow, 5: Fast)
  diction: 'colloquial' | 'literary' | 'archaic' | 'hardcore';
  sentenceStructure: 'short' | 'mixed' | 'long';
  sensoryFocus: string[]; // ['visual', 'auditory', 'olfactory', 'tactile', 'gustatory', 'psychological']
  perspective: 'first' | 'third-limited' | 'third-omniscient';
  forbiddenWords: string[];
  signaturePatterns: string[];
  sampleAnalysis?: string;
}

export interface WorldState {
  rules: string[];
  characters: Character[];
  ledger: {
    time: string;
    resources: string;
    notes: string;
  };
  pastEvents: string[];
  threads: PlotThread[];
  style: StyleProfile;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface LoreEntry {
  concept: string;
  explanation: string;
}

export interface ChapterLore {
  lore: LoreEntry[];
}

export interface ApiSettings {
  provider: 'gemini' | 'openai';
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ApiLog {
  id: string;
  timestamp: string;
  provider: 'gemini' | 'openai';
  model: string;
  request: {
    prompt: string;
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: any;
  };
  response: string;
  status: 'success' | 'error';
  error?: string;
  duration: number; // ms
}
