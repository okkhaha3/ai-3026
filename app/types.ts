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
  styleProfile: string;
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
