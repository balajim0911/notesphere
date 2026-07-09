
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Note, WorkspaceState, FilterStatus, SortType } from '../types';
import { INITIAL_NOTES, COLORS } from '../constants';

interface AIState {
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
}

export const useStore = create<WorkspaceState & AIState>()(
  persist(
    (set, get) => ({
      notes: INITIAL_NOTES.map((n, i) => ({ ...n, zIndex: i })),
      searchQuery: '',
      filterCategory: null,
      filterStatus: 'all',
      sortBy: 'recent',
      isDarkMode: false,
      selectedNoteId: null,
      activeNoteId: null,
      isDraggingNote: false,
      maxZIndex: INITIAL_NOTES.length,
      isGenerating: false,

      setIsGenerating: (val) => set({ isGenerating: val }),

      bringToFront: (id) => set((state) => {
        const note = state.notes.find(n => n.id === id);
        if (!note) return state;
        
        const newMaxZ = state.maxZIndex + 1;
        return {
          maxZIndex: newMaxZ,
          notes: state.notes.map((n) => 
            n.id === id ? { ...n, zIndex: newMaxZ } : n
          ),
        };
      }),

      addNote: (noteData) => set((state) => {
        const newId = Math.random().toString(36).substring(2, 11);
        const newMaxZ = state.maxZIndex + 1;
        const newNote: Note = {
          id: newId,
          content: '',
          color: COLORS[Math.floor(Math.random() * COLORS.length)].value,
          position: [0, 0, 0],
          rotation: [0, 0, (Math.random() - 0.5) * 0.1],
          scale: 0.1,
          category: 'Ideas',
          tags: [],
          isPinned: false,
          isFavorite: false,
          lastModified: Date.now(),
          zIndex: newMaxZ,
          textureType: 'glass',
          fontStyle: 'sans',
          ...noteData,
        };
        
        return {
          notes: [...state.notes, newNote],
          selectedNoteId: newId,
          activeNoteId: newId,
          searchQuery: '',
          maxZIndex: newMaxZ,
        };
      }),

      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map((n) => 
          n.id === id ? { ...n, ...updates, lastModified: Date.now() } : n
        ),
      })),

      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
        activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
      })),

      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterCategory: (category) => set({ filterCategory: category }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setSortBy: (sort) => set({ sortBy: sort }),

      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      setSelectedNoteId: (id) => {
        if (id) get().bringToFront(id);
        set({ selectedNoteId: id, activeNoteId: id });
      },

      setActiveNoteId: (id) => {
        if (id) get().bringToFront(id);
        set({ activeNoteId: id });
      },

      setIsDraggingNote: (isDragging) => set({ isDraggingNote: isDragging }),
    }),
    {
      name: 'notesphere-storage',
      partialize: (state: any) => ({ 
        notes: state.notes, 
        isDarkMode: state.isDarkMode,
        maxZIndex: state.maxZIndex,
        sortBy: state.sortBy
      }),
    }
  )
);
