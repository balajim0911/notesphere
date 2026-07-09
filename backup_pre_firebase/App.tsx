
import React from 'react';
import { Board } from './components/Board';
import { Toolbar } from './components/UI/Toolbar';
import { NoteEditor } from './components/UI/NoteEditor';
import { useStore } from './store/useStore';

const NoteSphereIcon = () => (
  <svg viewBox="0 0 100 100" className="w-6 h-6 drop-shadow-2xl overflow-visible">
    <defs>
      <linearGradient id="facetGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.4" />
      </linearGradient>
      <linearGradient id="facetGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.3" />
      </linearGradient>
    </defs>
    
    {/* Isometric Facet - Top (Note Surface) */}
    <path 
      d="M50 20 L80 35 L50 50 L20 35 Z" 
      fill="url(#facetGradient1)" 
      stroke="white" 
      strokeWidth="1.5"
      className="animate-pulse"
    />
    
    {/* Isometric Facet - Right Side */}
    <path 
      d="M50 50 L80 35 L80 65 L50 80 Z" 
      fill="url(#facetGradient2)" 
      stroke="rgba(255,255,255,0.5)" 
      strokeWidth="1"
    />
    
    {/* Isometric Facet - Left Side */}
    <path 
      d="M50 50 L20 35 L20 65 L50 80 Z" 
      fill="rgba(255,255,255,0.2)" 
      stroke="rgba(255,255,255,0.5)" 
      strokeWidth="1"
    />

    {/* Center Core Sparkle */}
    <circle cx="50" cy="50" r="3" fill="white" className="animate-ping">
      <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
    </circle>
  </svg>
);

const App: React.FC = () => {
  const { isDarkMode } = useStore();

  return (
    <div className={`relative w-full h-screen overflow-hidden ${isDarkMode ? 'dark bg-[#020617]' : 'bg-[#f1f5f9]'}`}>
      {/* 3D Background Layer */}
      <Board />

      {/* UI Overlay Layer (Informational) */}
      <div className="fixed inset-0 pointer-events-none z-[100]">
        <div className="p-4 md:p-6">
          {/* Compact Logo Bar - Reduced padding and roundedness */}
          <div className="bg-white/90 dark:bg-slate-900/70 backdrop-blur-3xl pointer-events-auto cursor-default inline-flex items-center gap-3.5 px-4 py-2.5 rounded-[1.75rem] shadow-xl border border-white/60 dark:border-slate-700/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-500/10 dark:hover:border-blue-500/30 group">
            
            {/* Reduced Logo Icon Container */}
            <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 transform rotate-2 border-b-2 border-indigo-900 transition-all duration-500 group-hover:rotate-0 group-hover:scale-105 group-hover:shadow-indigo-500/40">
              <NoteSphereIcon />
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
            
            {/* NoteSphere Text - More compact sizing */}
            <div className="flex flex-col pr-1">
              <h1 className="text-lg md:text-xl font-black text-slate-950 dark:text-white leading-none tracking-tight transition-colors duration-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 drop-shadow-sm">
                NoteSphere <span className="text-blue-700 dark:text-blue-400 font-bold italic transition-all duration-300 group-hover:pl-1 tracking-wider">3D</span>
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>
                <p className="text-slate-600 dark:text-slate-400 text-[8px] font-black uppercase tracking-[0.4em] opacity-90 transition-opacity group-hover:opacity-100 drop-shadow-sm">
                  IDEATION ENGINE
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Instruction Panel */}
        <div className="fixed top-6 right-6 text-right hidden xl:block">
          <div className="glass bg-white/95 dark:bg-slate-900/95 px-4 py-3.5 rounded-2xl shadow-2xl border border-white dark:border-slate-700/80 backdrop-blur-xl transition-all duration-300 hover:translate-x-[-4px]">
            <h3 className="text-[9px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-[0.2em] mb-2 flex items-center justify-end gap-2">
              <span className="w-3 h-[1px] bg-blue-600/30 dark:bg-blue-400/30"></span>
              Navigation
            </h3>
            <div className="space-y-1.5 text-[9px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
              <p className="flex items-center justify-end gap-2 group/item">
                <span className="opacity-50 group-hover/item:opacity-100 transition-opacity">Left Click:</span> 
                <span className="text-blue-700 dark:text-blue-400">Drag Cards</span>
                <span className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></span>
              </p>
              <p className="flex items-center justify-end gap-2 group/item">
                <span className="opacity-50 group-hover/item:opacity-100 transition-opacity">Right Click:</span> 
                <span className="text-slate-700 dark:text-slate-400">Orbit View</span>
                <span className="w-1 h-1 bg-slate-400/60 rounded-full"></span>
              </p>
              <p className="flex items-center justify-end gap-2 group/item">
                <span className="opacity-50 group-hover/item:opacity-100 transition-opacity">Scroll:</span> 
                <span className="text-slate-700 dark:text-slate-400">Zoom Depth</span>
                <span className="w-1 h-1 bg-slate-400/60 rounded-full"></span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive UI components */}
      <div className="fixed inset-0 pointer-events-none z-[110]">
        <div className="pointer-events-auto">
          <Toolbar />
        </div>
        <div className="pointer-events-auto">
          <NoteEditor />
        </div>
      </div>
    </div>
  );
};

export default App;
