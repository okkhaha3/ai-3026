# Product Roadmap: AI-Powered Active Learning Platform

This document outlines the strategic vision and development roadmap for the AI reading and learning application. It transitions the product from a Minimum Viable Product (MVP) to a comprehensive, multimodal, and ecosystem-integrated learning hub.

## Phase 1: MVP (Current State) ✅
The foundational framework is established, proving the core loop of active learning.
*   **Markdown Import & Parsing:** Basic support for loading `.md` files and splitting them into readable chapters.
*   **Three-Pillar UI:** Left (TOC), Center (Reading), Right (AI Panel).
*   **AI Tutor Mode:** Context-aware chapter summarization and Q&A.
*   **Feynman Simulator (V1):** Text-based explanation with AI evaluation and automatic "Mastered" status updating.
*   **Rabbit Hole (V1):** "Explain" button on text selection for contextual definitions.
*   **Memory Flashcards (V1):** On-demand generation of Q&A flashcards for the current chapter.

---

## Phase 2: Core Engine Upgrades (The Original Vision) 🚧
Transforming the static AI interactions into a dynamic, globally aware learning engine.

*   **Dynamic Learning Engine (Adaptive UI):**
    *   AI pre-reads the book (TOC/Intro) to determine its genre (e.g., Programming, Philosophy, Practical Skill).
    *   Right panel UI morphs accordingly (e.g., Code Sandbox for IT, Socratic Prompts for Philosophy, Action Checklists for Skills).
*   **Global Search & Cross-Chapter Chat (RAG):**
    *   Implement Retrieval-Augmented Generation (RAG) with vector embeddings.
    *   Allow users to ask global questions (e.g., "Summarize all sleep tips in this book") with citations and jump-links to specific chapters.
*   **Deep Knowledge Graph (Rabbit Hole V2):**
    *   Track concepts across the entire book.
    *   Show a concept's "past and future" (where it was first defined, how it connects to the current chapter).
*   **True Spaced Repetition System (SRS):**
    *   Transition from "on-demand chapter cards" to a global, cross-book review queue.
    *   Implement Anki-style memory curve algorithms (e.g., FSRS) for daily reviews.

---

## Phase 3: Multimodal & Reading Experience 🌟
Making the app feel like a polished, native reading experience that caters to different learning styles.

*   **Voice-Interactive Feynman Simulator:**
    *   Integrate Web Speech API or Whisper API.
    *   Allow users to *speak* their explanations instead of typing, lowering the friction of active recall.
*   **AI Podcast / Audio Companion (TTS):**
    *   Text-to-Speech integration for commuting/eyes-free learning.
    *   AI pauses to ask questions or provide background context dynamically.
*   **Omni-Format Support:**
    *   Support for PDF, EPUB, and direct URL web-clipping.
*   **Rich Academic Rendering:**
    *   LaTeX math formulas (KaTeX/MathJax).
    *   Code block syntax highlighting (Prism.js/Highlight.js).
    *   Mermaid.js flowchart rendering.
*   **Immersive UI/UX:**
    *   Dark Mode, Sepia Mode, and customizable typography (font size, line height).
    *   Fully responsive mobile/tablet drawer layouts.

---

## Phase 4: Data Sovereignty & Ecosystem 🔗
Ensuring users own their data and can integrate it into their existing PKM (Personal Knowledge Management) workflows.

*   **Local-First Architecture:**
    *   Implement IndexedDB (via Dexie.js or similar) to persist books, chat history, and flashcards locally.
    *   "Refresh without data loss" and offline-capable reading.
*   **Seamless Export:**
    *   Export highlights, summaries, and Feynman logs to Markdown (for Obsidian/Notion).
    *   Export Flashcards to `.apkg` format for native Anki import.

---

## Phase 5: Gamification & Analytics 🎮
Keeping users motivated through data visualization and personalized AI personas.

*   **Learning Flow Dashboard:**
    *   GitHub-style contribution heatmaps for daily reading/review streaks.
    *   Metrics on "Feynman Pass Rate" and "Deep Work Minutes".
*   **Customizable AI Personas:**
    *   Allow users to adjust the AI's strictness and tone.
    *   Options ranging from "Encouraging Cheerleader" to "Strict Socratic Professor" or "Devil's Advocate".

---

## Phase 6: The World Forge (AI Deconstruction & Co-Creation) 🌌
*The ultimate paradigm shift: From passive reading and active learning to infinite world-building and co-creation. Solving the LLM context-window limit through dynamic Knowledge Graphs.*

*   **AI Book Deconstruction (The Lore Extractor):**
    *   **Deep Parsing:** Import a 3-million-word novel. The AI doesn't just summarize; it builds a relational database.
    *   **Entity Extraction:** Automatically identify and catalog Characters, Locations, Items, Factions, and Magic/Tech Systems.
    *   **Dynamic Knowledge Graph:** Generate visual relationship webs (e.g., "Character A is secretly the father of Character B, affiliated with Faction C").
    *   **Timeline Generation:** Map out the chronological events, main plots, and subplots.
*   **Lore-Aware AI Generation (The Co-Author):**
    *   **RAG-Backed Writing:** When generating new chapters, the AI queries the "Lore Extractor" database. It never forgets a character's eye color, a sword's name, or a location's geography.
    *   **Contextual Consistency:** Solves the "long-form memory loss" of LLMs. The AI writes strictly within the bounds of the extracted "World Bible".
*   **The 1+1>2 Synergy Loop:**
    *   **Write -> Extract -> Write:** As the human author writes Chapter 10, the AI extracts the new lore in the background, updating the World Bible to perfectly support the generation of Chapter 11.
    *   **Fan-Fiction / Alternate Universe Engine:** Import an existing classic (e.g., *Dune*), extract its universe rules, and generate a perfectly lore-accurate spin-off.
    *   **Interactive Consumption:** Readers of the generated novel can use the existing "Rabbit Hole" feature to click on any character/item and instantly view its extracted lore, stats, and relationship graph without leaving the page.
