import React from 'react';
import { X, Sparkles, LayoutGrid, CloudLightning, BadgeInfo } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 pointer-events-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-lg glass-premium rounded-[2rem] p-8 shadow-2xl border border-white/40 animate-in zoom-in-95 duration-300 text-slate-900 dark:text-white">
        
        {/* Close Button */}
        <button 
          id="close-about-btn"
          type="button"
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <BadgeInfo className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
              About NoteSphere 3D
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mt-1">
              v1.2.0 • Ideation Engine
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-xs leading-relaxed text-slate-800 dark:text-slate-300">
          <p className="font-medium">
            Welcome to <span className="font-extrabold text-indigo-600 dark:text-indigo-400">NoteSphere 3D</span>, a futuristic, interactive spatial workspace designed to redefine how you organize ideas, structure workflows, and spark creativity in three dimensions.
          </p>

          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Core Spatial Capabilities
            </h3>
            
            <div className="grid gap-3.5">
              <div className="flex gap-3">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-950 dark:text-white">Interactive 3D Workspace</h4>
                  <p className="text-slate-700 dark:text-slate-400 mt-0.5">Arrange and group transparent glass sticky notes in space. Right-click and drag to orbit, left-click to move, or scroll to adjust focus depth.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-950 dark:text-white">Gemini AI Brainstorming</h4>
                  <p className="text-slate-700 dark:text-slate-400 mt-0.5">Stuck on an idea? Use the built-in Gemini assistant to automatically ignite and populate new thoughts directly on your canvas.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CloudLightning className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-950 dark:text-white">Seamless Cloud Sync</h4>
                  <p className="text-slate-700 dark:text-slate-400 mt-0.5">Securely sign in using your Google account to instantly sync your workspace across devices and protect against data loss.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
              Tips & Tricks
            </h3>
            <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-400 font-medium">
              <li>Click a sticky note once to view its editor and select colors, spheres, tags, or to pin/favorite it.</li>
              <li>Press the <span className="font-bold text-slate-900 dark:text-white">Magic</span> button on the bottom bar to prompt Gemini for fresh inspiration.</li>
              <li>Use categories/spheres to categorize thoughts and instantly filter your view to focus on what matters.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400">
          <span>Crafted for Perfect Productivity</span>
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer font-black uppercase tracking-wider"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
