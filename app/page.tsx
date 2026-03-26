"use client";

import React from 'react';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Workspace from './components/Workspace';
import AICompanion from './components/AICompanion';
import Modals from './components/Modals';

export default function ReadingApp() {
  return (
    <AppProvider>
      <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
        <Sidebar />
        <Workspace />
        <AICompanion />
        <Modals />
      </div>
    </AppProvider>
  );
}
