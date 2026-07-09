
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Moon, Sun, Filter, ChevronDown, Trash2, SortAsc, Sparkles, X, Wand2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { COLORS, CATEGORIES } from '../../constants';
import { SortType, Note } from '../../types';
import { GoogleGenAI, Type } from "@google/genai";

export const Toolbar: React.FC = () => {
  const { 
    addNote, 
    searchQuery, 
    setSearchQuery, 
    filterCategory,
    setFilterCategory,
    sortBy,
    setSortBy,
    isDarkMode, 
    toggleDarkMode,
    activeNoteId,
    deleteNote,
    isGenerating,
    setIsGenerating
  } = useStore();

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSortOpen && sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
      if (isCategoryOpen && categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortOpen, isCategoryOpen]);

  const handleCreate = () => {
    addNote({ 
      content: '',
      color: COLORS[Math.floor(Math.random() * COLORS.length)].value,
      textureType: 'glass',
      position: [(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4, 0]
    });
  };

  const handleAIBrainstorm = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 3 creative, short, and distinct sticky note ideas about this topic: "${aiPrompt}". Return a JSON array of objects with keys "content", "category", and "color" (use valid hex codes like #60a5fa, #fb7185, #34d399, #fbbf24, #a78bfa). Keep content under 15 words per note.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                content: { type: Type.STRING },
                category: { type: Type.STRING },
                color: { type: Type.STRING }
              },
              required: ["content", "category", "color"]
            }
          }
        }
      });

      const ideas = JSON.parse(response.text);
      ideas.forEach((idea: any, index: number) => {
        addNote({
          content: idea.content,
          category: idea.category,
          color: idea.color,
          position: [(Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6, 0],
          textureType: 'glass'
        });
      });
      
      setIsAIOpen(false);
      setAiPrompt('');
    } catch (err) {
      console.error("AI Generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const sortOptions: { label: string; value: SortType }[] = [
    { label: 'Recently Modified', value: 'recent' },
    { label: 'Pinned First', value: 'pinned' },
    { label: 'Favorites First', value: 'favorites' },
    { label: 'A-Z Order', value: 'az' },
  ];

  return (
    <>
      {/* AI Modal */}
      {isAIOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 pointer-events-auto">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => !isGenerating && setIsAIOpen(false)} />
          <div className="relative w-full max-w-lg glass-premium rounded-[2rem] p-8 shadow-2xl border border-white/40 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">AI Brainstorm</h2>
              </div>
              <button onClick={() => setIsAIOpen(false)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-400"><X /></button>
            </div>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">What topic should Gemini generate notes for?</p>
            
            <div className="relative mb-6">
              <input 
                autoFocus
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAIBrainstorm()}
                placeholder="e.g. Next-gen workspace ideas..."
                className="w-full h-14 pl-6 pr-6 bg-white/50 dark:bg-slate-800/50 rounded-2xl text-lg font-bold border-2 border-transparent focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-400 dark:text-white"
                disabled={isGenerating}
              />
            </div>

            <button
              onClick={handleAIBrainstorm}
              disabled={isGenerating || !aiPrompt.trim()}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] group overflow-hidden"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating...</span>
                </div>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span>Ignite Ideas</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[110] flex flex-col items-center gap-4 w-full px-6 max-w-5xl pointer-events-auto">
        <div className="glass-premium px-3 py-2.5 rounded-full flex items-center gap-2 shadow-2xl border-white/50 dark:border-slate-700/50 backdrop-blur-3xl">
          
          <div className="relative group">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-black dark:text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="h-10 pl-10 pr-4 bg-white/50 dark:bg-slate-800/40 rounded-full text-sm font-bold border-none focus:ring-2 focus:ring-indigo-500/50 transition-all w-32 md:w-56 placeholder:text-slate-700 dark:text-slate-400 text-black dark:text-white"
            />
          </div>

          <div className="w-[1px] h-6 bg-slate-300 dark:bg-slate-700/50 mx-1" />

          {/* AI Brainstorm Button */}
          <button
            onClick={() => setIsAIOpen(true)}
            className="h-10 px-3.5 rounded-full flex items-center gap-2 hover:bg-indigo-600/10 transition-all group relative"
          >
            <Sparkles className="w-4 h-4 text-black dark:text-indigo-500 group-hover:text-indigo-700 group-hover:scale-125 transition-all" />
            <span className="text-[10px] font-black uppercase tracking-wider hidden md:block text-black dark:text-white group-hover:text-indigo-700 transition-colors">Magic</span>
          </button>

          <div className="w-[1px] h-6 bg-slate-300 dark:bg-slate-700/50 mx-1" />

          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => { setIsSortOpen(!isSortOpen); setIsCategoryOpen(false); }}
              className={`h-10 px-3.5 rounded-full flex items-center gap-2 transition-all group ${sortBy !== 'recent' ? 'bg-indigo-600/10' : 'hover:bg-white/40 dark:hover:bg-slate-700/40'}`}
            >
              <SortAsc className={`w-4 h-4 transition-colors ${sortBy !== 'recent' ? 'text-indigo-600' : 'text-black dark:text-slate-300 group-hover:text-indigo-700'}`} />
              <span className={`text-[10px] font-black uppercase tracking-wider hidden md:block transition-colors ${
                sortBy !== 'recent' ? 'text-indigo-600' : 'text-black dark:text-white group-hover:text-indigo-700'
              }`}>Sort</span>
            </button>
            {isSortOpen && (
              <div className="absolute bottom-full mb-3 left-0 w-52 glass rounded-2xl p-2 shadow-2xl border-white/50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {sortOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setIsSortOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all ${
                      sortBy === opt.value ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-indigo-50/80 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={categoryMenuRef}>
            <button
              onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsSortOpen(false); }}
              className={`h-10 px-3.5 rounded-full flex items-center gap-2 transition-all group ${filterCategory ? 'bg-indigo-600/10' : 'hover:bg-white/40 dark:hover:bg-slate-700/40'}`}
            >
              <Filter className={`w-4 h-4 transition-colors ${filterCategory ? 'text-indigo-600' : 'text-black dark:text-slate-300 group-hover:text-indigo-700'}`} />
              <span className={`text-[10px] font-black uppercase tracking-wider hidden md:block transition-colors ${
                filterCategory ? 'text-indigo-600' : 'text-black dark:text-white group-hover:text-indigo-700'
              }`}>{filterCategory || 'Filter'}</span>
              <ChevronDown className={`w-3 h-3 transition-colors ${filterCategory ? 'text-indigo-600' : 'text-black dark:text-slate-400 group-hover:text-indigo-700'}`} />
            </button>
            {isCategoryOpen && (
              <div className="absolute bottom-full mb-3 left-0 w-48 glass rounded-2xl p-2 shadow-2xl border-white/50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <button onClick={() => { setFilterCategory(null); setIsCategoryOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-indigo-50/80 dark:hover:bg-slate-800/80 transition-all">All Spheres</button>
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => { setFilterCategory(cat); setIsCategoryOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all ${filterCategory === cat ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-indigo-50/80 dark:hover:bg-slate-800/80'}`}>{cat}</button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleCreate}
            className="h-10 pl-4 pr-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center gap-2.5 transition-all shadow-lg active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">New</span>
          </button>

          <div className="w-[1px] h-6 bg-slate-300 dark:bg-slate-700/50 mx-1" />

          <button onClick={toggleDarkMode} className="p-2.5 rounded-full hover:bg-white/50 dark:hover:bg-slate-700/50 transition-all text-slate-500">
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {activeNoteId && (
            <button onClick={() => deleteNote(activeNoteId)} className="p-2.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-all animate-in zoom-in">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};
