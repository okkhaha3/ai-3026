"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Workspace from './components/Workspace';
import AICompanion from './components/AICompanion';
import Modals from './components/Modals';
import { ChevronLeft, ChevronRight, PanelLeft, PanelRight } from 'lucide-react';

function AppContent() {
  const { 
    isZenMode, 
    isLeftSidebarOpen, setIsLeftSidebarOpen,
    isRightSidebarOpen, setIsRightSidebarOpen,
    leftSidebarWidth, setLeftSidebarWidth,
    rightSidebarWidth, setRightSidebarWidth
  } = useAppContext();

  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const startResizingLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingLeft(true);
  }, []);

  const startResizingRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRight(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizingLeft(false);
    setIsResizingRight(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizingLeft) {
      const newWidth = e.clientX;
      if (newWidth > 150 && newWidth < 500) {
        setLeftSidebarWidth(newWidth);
      }
    } else if (isResizingRight) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 200 && newWidth < 600) {
        setRightSidebarWidth(newWidth);
      }
    }
  }, [isResizingLeft, isResizingRight, setLeftSidebarWidth, setRightSidebarWidth]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden relative">
      {/* Left Sidebar */}
      {!isZenMode && (
        <div 
          style={{ width: isLeftSidebarOpen ? leftSidebarWidth : 0 }}
          className={`relative flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden border-r border-slate-200`}
        >
          <div className="w-full h-full min-w-[200px]">
            <Sidebar />
          </div>
          {/* Resize Handle */}
          {isLeftSidebarOpen && (
            <div 
              onMouseDown={startResizingLeft}
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-indigo-500/30 transition-colors z-10"
            />
          )}
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Toggle Buttons (Floating) */}
        {!isZenMode && (
          <>
            <button
              onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
              className={`absolute top-4 left-4 z-20 p-2 bg-white/80 backdrop-blur shadow-sm border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 transition-all hover:scale-110 ${!isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-2 opacity-0 hover:opacity-100'}`}
              title={isLeftSidebarOpen ? "收起左边栏" : "展开左边栏"}
            >
              {isLeftSidebarOpen ? <PanelLeft className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              className={`absolute top-4 right-4 z-20 p-2 bg-white/80 backdrop-blur shadow-sm border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 transition-all hover:scale-110 ${!isRightSidebarOpen ? 'translate-x-0' : 'translate-x-2 opacity-0 hover:opacity-100'}`}
              title={isRightSidebarOpen ? "收起右边栏" : "展开右边栏"}
            >
              {isRightSidebarOpen ? <PanelRight className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
            </button>
          </>
        )}
        <Workspace />
      </div>

      {/* Right Sidebar */}
      {!isZenMode && (
        <div 
          style={{ width: isRightSidebarOpen ? rightSidebarWidth : 0 }}
          className={`relative flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden border-l border-slate-200`}
        >
          {/* Resize Handle */}
          {isRightSidebarOpen && (
            <div 
              onMouseDown={startResizingRight}
              className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-indigo-500/30 transition-colors z-10"
            />
          )}
          <div className="w-full h-full min-w-[300px]">
            <AICompanion />
          </div>
        </div>
      )}

      <Modals />
    </div>
  );
}

export default function ReadingApp() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
