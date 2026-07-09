
import React, { useState, useEffect, useRef } from 'react';
import { Heart, Pin, Check, Trash2, Box, Type as TypeIcon, Info, Sparkles, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { COLORS, CATEGORIES, FONTS, TEXTURES } from '../../constants';
import { GoogleGenAI } from "@google/genai";

export const NoteEditor: React.FC = () => {
  const { selectedNoteId, setSelectedNoteId, notes, updateNote, deleteNote, isDarkMode } = useStore();
  const note = notes.find(n => n.id === selectedNoteId);

  const [localContent, setLocalContent] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Responsive state & stepper for mobile devices
  const [isMobile, setIsMobile] = useState(false);
  const [mobileStep, setMobileStep] = useState<'text' | 'design'>('text');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (note) {
      setLocalContent(note.content);
      // Reset step to text when opening a note or creating a new empty note
      setMobileStep('text');
    }
  }, [note?.id]);

  if (!selectedNoteId || !note) return null;

  const handleClose = () => setSelectedNoteId(null);
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
    updateNote(note.id, { content: e.target.value });
  };

  const handleAIRefine = async () => {
    if (!localContent.trim()) return;
    setIsRefining(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API key is missing. Please configure GEMINI_API_KEY in settings.");
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Clean up, structure, and professionalize the following note content. If it is a list, make it clear bullet points. If it is a thought, make it more articulate. Keep it concise but insightful. Content: "${localContent}"`,
      });
      
      const refinedText = response.text || localContent;
      setLocalContent(refinedText);
      updateNote(note.id, { content: refinedText });
    } catch (err) {
      console.error("AI Refine failed", err);
    } finally {
      setIsRefining(false);
    }
  };

  const charCount = localContent.length;
  const isOverPreviewLimit = charCount > 140;

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col justify-end p-2 sm:p-4 pointer-events-auto">
        <div 
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-500"
          onClick={handleClose}
        />
        
        <div className={`relative w-full glass rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden animate-in slide-in-from-bottom-12 duration-500 flex flex-col h-[85vh] border border-white/20`}>
          
          {/* Mobile Header with Step Counter */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 dark:bg-slate-900/40 backdrop-blur-md">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500">
                {mobileStep === 'text' ? 'Step 1 of 2' : 'Step 2 of 2'}
              </span>
              <h3 className={`text-sm font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                {mobileStep === 'text' ? 'Write Note Content' : 'Customize Design'}
              </h3>
            </div>
            
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Stepper Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col">
            {mobileStep === 'text' ? (
              <div className="flex-1 flex flex-col justify-between h-full">
                <textarea
                  ref={textareaRef}
                  autoFocus
                  value={localContent}
                  onChange={handleContentChange}
                  placeholder="Type your ideas here..."
                  className={`
                    w-full flex-1 bg-transparent border-none outline-none text-2xl font-extrabold resize-none placeholder:text-slate-500/30 leading-snug custom-scrollbar min-h-[50vh]
                    ${note.fontStyle === 'handwriting' ? 'font-handwriting' : 'font-sans'}
                    ${isDarkMode ? 'text-white' : 'text-slate-900'}
                  `}
                />
                
                <div className="flex items-center justify-between mt-4">
                  <div className={`
                    flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] transition-all shadow-md border
                    ${isOverPreviewLimit 
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' 
                      : isDarkMode ? 'bg-slate-800/80 text-slate-400 border-slate-700' : 'bg-white/80 text-slate-500 border-slate-200'}
                  `}>
                    <div className={`w-1 h-1 rounded-full ${isOverPreviewLimit ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                    <span>{charCount} Chars</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {/* Color Options */}
                <section className="bg-white/5 dark:bg-slate-800/30 p-4 rounded-2xl border border-white/5 shadow-inner">
                  <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-800'}`}>Color Palette</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {COLORS.map(c => (
                      <button 
                        key={c.value} 
                        onClick={() => updateNote(note.id, { color: c.value })} 
                        className={`aspect-square rounded-xl transition-all border-2 ${note.color === c.value ? 'border-indigo-600 scale-110 shadow-md' : 'border-black/5 hover:border-black/20'}`} 
                        style={{ backgroundColor: c.value }} 
                      />
                    ))}
                  </div>
                </section>

                <div className="grid grid-cols-2 gap-4">
                  {/* Material */}
                  <section className="bg-white/5 dark:bg-slate-800/30 p-4 rounded-2xl border border-white/5 shadow-inner">
                    <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-800'}`}>Material</h4>
                    <div className="space-y-1.5">
                      {TEXTURES.map(tex => (
                        <button 
                          key={tex.id} 
                          onClick={() => updateNote(note.id, { textureType: tex.id as any })} 
                          className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border ${note.textureType === tex.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : isDarkMode ? 'bg-slate-800 text-slate-300 border-white/5 hover:bg-slate-700' : 'bg-white text-slate-800 border-slate-300'}`}
                        >
                          <Box className="w-3 h-3" />
                          {tex.name}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Fonts */}
                  <section className="bg-white/5 dark:bg-slate-800/30 p-4 rounded-2xl border border-white/5 shadow-inner">
                    <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-800'}`}>Typography</h4>
                    <div className="space-y-1.5">
                      {FONTS.map(font => (
                        <button 
                          key={font.id} 
                          onClick={() => updateNote(note.id, { fontStyle: font.id as any })} 
                          className={`w-full py-2 rounded-lg text-[10px] font-black text-center transition-all border flex items-center justify-center gap-1.5 ${note.fontStyle === font.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : isDarkMode ? 'bg-slate-800 text-slate-300 border-white/5 hover:bg-slate-700' : 'bg-white text-slate-800 border-slate-300'} ${font.class}`}
                        >
                          <TypeIcon className="w-3 h-3" />
                          {font.name}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Category selection */}
                <section className="bg-white/5 dark:bg-slate-800/30 p-4 rounded-2xl border border-white/5 shadow-inner">
                  <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-800'}`}>Category</h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => updateNote(note.id, { category: cat })} 
                        className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-center transition-all border ${note.category === cat ? 'bg-indigo-600 text-white border-indigo-400' : isDarkMode ? 'text-slate-400 border-transparent hover:bg-white/5' : 'text-slate-700 border-slate-300 bg-white/50'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </section>
                
                {/* Discard / Delete */}
                <div className="pt-4 border-t border-white/10">
                  <button 
                    onClick={() => confirm("Discard this sphere?") && deleteNote(note.id)} 
                    className="w-full flex items-center justify-center gap-2 py-3 text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-rose-200/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 
                    Delete Sphere
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Footer Step Controls */}
          <div className="p-4 border-t border-white/10 bg-white/5 dark:bg-slate-900/60 flex items-center justify-between gap-3">
            {mobileStep === 'text' ? (
              <>
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateNote(note.id, { isFavorite: !note.isFavorite })}
                    className={`p-3 rounded-xl transition-all border-2 ${
                      note.isFavorite 
                        ? 'bg-rose-500 border-rose-400 text-white' 
                        : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${note.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button 
                    onClick={() => updateNote(note.id, { isPinned: !note.isPinned })}
                    className={`p-3 rounded-xl transition-all border-2 ${
                      note.isPinned 
                        ? 'bg-indigo-600 border-indigo-500 text-white' 
                        : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    <Pin className={`w-5 h-5 ${note.isPinned ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button 
                    onClick={handleAIRefine}
                    disabled={isRefining}
                    className={`flex items-center gap-1.5 px-3 rounded-xl transition-all border-2 font-black uppercase text-[8px] tracking-widest ${
                      isDarkMode ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    } disabled:opacity-50`}
                  >
                    {isRefining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Refine</span>
                  </button>
                </div>

                <button
                  onClick={() => setMobileStep('design')}
                  className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-lg"
                >
                  <span>Style Note</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setMobileStep('text')}
                  className="flex-1 h-12 bg-white/10 dark:bg-slate-800 hover:bg-white/15 text-slate-800 dark:text-white rounded-xl flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider active:scale-95 transition-all border border-white/10"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Edit Content</span>
                </button>

                <button
                  onClick={handleClose}
                  className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-lg"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Done</span>
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    );
  }

  // Original side-by-side design for tablet / laptop views
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 lg:p-12 pointer-events-auto">
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl animate-in fade-in duration-700"
        onClick={handleClose}
      />
      
      <div className={`relative w-full max-w-5xl glass rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 flex flex-col lg:flex-row h-full max-h-[85vh] border border-white/40`}>
        
        <div className="flex-1 p-8 lg:p-12 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex gap-4">
              <button 
                onClick={() => updateNote(note.id, { isFavorite: !note.isFavorite })}
                className={`p-4 rounded-2xl transition-all shadow-lg border-2 ${
                  note.isFavorite 
                    ? 'bg-rose-500 border-rose-400 text-white scale-110 shadow-rose-500/30' 
                    : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400'
                }`}
                title="Favorite"
              >
                <Heart className={`w-6 h-6 ${note.isFavorite ? 'fill-current' : 'stroke-[2.5px]'}`} />
              </button>
              <button 
                onClick={() => updateNote(note.id, { isPinned: !note.isPinned })}
                className={`p-4 rounded-2xl transition-all shadow-lg border-2 ${
                  note.isPinned 
                    ? 'bg-indigo-600 border-indigo-500 text-white scale-110 shadow-indigo-600/30' 
                    : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400'
                }`}
                title="Pin to top"
              >
                <Pin className={`w-6 h-6 ${note.isPinned ? 'fill-current' : 'stroke-[2.5px]'}`} />
              </button>

              <button 
                onClick={handleAIRefine}
                disabled={isRefining}
                className={`flex items-center gap-2 px-6 py-4 rounded-2xl transition-all shadow-lg border-2 font-black uppercase text-[10px] tracking-widest ${
                  isDarkMode ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/40' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300'
                } disabled:opacity-50`}
              >
                {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isRefining ? 'Refining...' : 'AI Refine'}
              </button>
            </div>

            <button 
              onClick={handleClose}
              className="p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 transition-all shadow-xl hover:scale-110 active:scale-95"
            >
              <Check className="w-7 h-7 stroke-[3]" />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            autoFocus
            value={localContent}
            onChange={handleContentChange}
            placeholder="Type your detailed notes here..."
            className={`
              w-full flex-1 bg-transparent border-none outline-none text-3xl lg:text-5xl font-extrabold resize-none placeholder:text-slate-500/30 leading-tight custom-scrollbar
              ${note.fontStyle === 'handwriting' ? 'font-handwriting' : 'font-sans'}
              ${isDarkMode ? 'text-white' : 'text-slate-900'}
            `}
          />

          <div className="mt-6 flex items-center justify-end">
            <div className={`
              flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] transition-all shadow-lg border
              ${isOverPreviewLimit 
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 backdrop-blur-md' 
                : isDarkMode ? 'bg-slate-800/80 text-slate-400 border-slate-700 backdrop-blur-md' : 'bg-white/80 text-slate-500 border-slate-200 backdrop-blur-md'}
            `}>
              <div className={`w-1.5 h-1.5 rounded-full ${isOverPreviewLimit ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
              <span>{charCount} Chars</span>
            </div>
          </div>
        </div>

        <div className={`w-full lg:w-80 p-8 border-l border-white/20 overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-slate-900/60' : 'bg-slate-200/80 shadow-inner'}`}>
          <div className="space-y-8">
            <section>
              <h4 className={`text-[12px] font-black uppercase tracking-[0.2em] mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-800'}`}>Color Palette</h4>
              <div className="grid grid-cols-4 gap-2.5">
                {COLORS.map(c => (
                  <button key={c.value} onClick={() => updateNote(note.id, { color: c.value })} className={`aspect-square rounded-xl transition-all border-2 ${note.color === c.value ? 'border-indigo-600 scale-110 shadow-md' : 'border-black/5 hover:border-black/20'}`} style={{ backgroundColor: c.value }} />
                ))}
              </div>
            </section>

            <section>
              <h4 className={`text-[12px] font-black uppercase tracking-[0.2em] mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-800'}`}>Material Type</h4>
              <div className="grid grid-cols-2 gap-2">
                {TEXTURES.map(tex => (
                  <button key={tex.id} onClick={() => updateNote(note.id, { textureType: tex.id as any })} className={`px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${note.textureType === tex.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : isDarkMode ? 'bg-slate-800 text-slate-300 border-white/5 hover:bg-slate-700' : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'}`}><Box className="w-4 h-4" />{tex.name}</button>
                ))}
              </div>
            </section>

            <section>
              <h4 className={`text-[12px] font-black uppercase tracking-[0.2em] mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-800'}`}>Typography</h4>
              <div className="space-y-2">
                {FONTS.map(font => (
                  <button key={font.id} onClick={() => updateNote(note.id, { fontStyle: font.id as any })} className={`w-full px-4 py-3 rounded-xl text-sm font-black text-left transition-all border flex items-center gap-3 ${note.fontStyle === font.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : isDarkMode ? 'bg-slate-800 text-slate-300 border-white/5 hover:bg-slate-700' : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'} ${font.class}`}><TypeIcon className="w-4 h-4" />{font.name}</button>
                ))}
              </div>
            </section>

            <section>
              <h4 className={`text-[12px] font-black uppercase tracking-[0.2em] mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-800'}`}>Category</h4>
              <div className="grid grid-cols-1 gap-1.5">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => { updateNote(note.id, { category: cat }); }} className={`w-full px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-left transition-all border ${note.category === cat ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm' : isDarkMode ? 'text-slate-400 border-transparent hover:bg-white/5' : 'text-slate-700 border-slate-300 bg-white/50 hover:bg-white'}`}>{cat}</button>
                ))}
              </div>
            </section>

            <div className="pt-8 mt-8 border-t border-slate-400 dark:border-white/10">
              <button onClick={() => confirm("Discard this sphere?") && deleteNote(note.id)} className="w-full flex items-center justify-center gap-2 py-3.5 text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest border border-rose-200 dark:border-transparent hover:border-rose-500/20"><Trash2 className="w-4 h-4" /> Delete Sphere</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

