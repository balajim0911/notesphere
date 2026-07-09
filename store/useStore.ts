
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Note, WorkspaceState, FilterStatus, SortType, UserProfile, SyncStatusType } from '../types';
import { INITIAL_NOTES, COLORS } from '../constants';

// Debounce timers map to handle high-frequency Firestore writes (e.g., typing content updates)
const debounceTimers: { [noteId: string]: NodeJS.Timeout } = {};

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
      user: null,
      syncStatus: 'offline',
      cameraCenter: [0, 0],

      setUser: (user) => set({ user }),
      setSyncStatus: (syncStatus) => set({ syncStatus }),
      setCameraCenter: (cameraCenter) => set({ cameraCenter }),
      setNotesSilently: (notes) => set((state) => {
        const maxZ = notes.reduce((max, n) => Math.max(max, n.zIndex || 0), 0);
        return { 
          notes,
          maxZIndex: Math.max(state.maxZIndex, maxZ)
        };
      }),

      setIsGenerating: (val) => set({ isGenerating: val }),

      bringToFront: (id) => set((state) => {
        const note = state.notes.find(n => n.id === id);
        if (!note) return state;
        
        // If it's already the absolute topmost note and we have multiple notes, no-op
        if (note.zIndex === state.maxZIndex && state.notes.length > 1) {
          return state;
        }

        const newMaxZ = state.maxZIndex + 1;
        let updatedNotes = state.notes.map((n) => 
          n.id === id ? { ...n, zIndex: newMaxZ } : n
        );

        let finalMaxZ = newMaxZ;

        // Compress Z-indices if they exceed 100 to prevent unbounded Z coordinates
        if (newMaxZ > 100) {
          const sorted = [...updatedNotes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
          sorted.forEach((n, idx) => {
            n.zIndex = idx;
            if (state.user) {
              setDoc(doc(db, 'notes', `${state.user.uid}_${n.id}`), { zIndex: idx, userId: state.user.uid }, { merge: true })
                .catch((err) => console.error("Error compressing zIndex:", err));
            }
          });
          updatedNotes = sorted;
          finalMaxZ = sorted.length;
        } else {
          if (state.user) {
            setDoc(doc(db, 'notes', `${state.user.uid}_${id}`), { zIndex: newMaxZ, userId: state.user.uid }, { merge: true })
              .catch((err) => console.error("Error in bringToFront Firestore update:", err));
          }
        }
        
        return {
          maxZIndex: finalMaxZ,
          notes: updatedNotes,
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

        if (state.user) {
          const noteForDb = { ...newNote, userId: state.user.uid };
          setDoc(doc(db, 'notes', `${state.user.uid}_${newId}`), noteForDb).catch((err) => console.error("Error in addNote Firestore create:", err));
        }
        
        return {
          notes: [...state.notes, newNote],
          selectedNoteId: newId,
          activeNoteId: newId,
          searchQuery: '',
          filterStatus: 'all',
          maxZIndex: newMaxZ,
        };
      }),

      updateNote: (id, updates) => set((state) => {
        // Validation safeguard for position coordinates to prevent NaN issues
        if (updates.position) {
          const [x, y, z] = updates.position;
          if (!Number.isFinite(x) || !Number.isFinite(y) || (z !== undefined && !Number.isFinite(z))) {
            console.error("Intercepted invalid position update:", updates.position);
            const existingNote = state.notes.find(n => n.id === id);
            if (existingNote) {
              updates.position = existingNote.position;
            } else {
              delete updates.position;
            }
          }
        }

        const now = Date.now();

        const updatedNotes = state.notes.map((n) => 
          n.id === id ? { ...n, ...updates, lastModified: now } : n
        );

        if (state.user) {
          const updatedFields = { ...updates, lastModified: now };
          
          if (debounceTimers[id]) {
            clearTimeout(debounceTimers[id]);
          }

          // Only debounce high-frequency text inputs (content updates).
          // Everything else (dragging, favorite, pin, category, color, material) is saved immediately.
          const isHighFrequency = updates.content !== undefined;

          if (!isHighFrequency) {
            setDoc(doc(db, 'notes', `${state.user.uid}_${id}`), { ...updatedFields, userId: state.user.uid }, { merge: true })
              .catch((err) => console.error("Error in updateNote Firestore direct update:", err));
          } else {
            // Debounce high-frequency updates (e.g. typing note content) to prevent Firestore write spam
            debounceTimers[id] = setTimeout(() => {
              const currentUser = useStore.getState().user;
              if (currentUser) {
                setDoc(doc(db, 'notes', `${currentUser.uid}_${id}`), { ...updatedFields, userId: currentUser.uid }, { merge: true })
                  .catch((err) => console.error("Error in updateNote Firestore debounced update:", err));
              }
              delete debounceTimers[id];
            }, 800);
          }
        }

        return { notes: updatedNotes };
      }),

      deleteNote: (id) => set((state) => {
        if (state.user) {
          deleteDoc(doc(db, 'notes', `${state.user.uid}_${id}`)).catch((err) => console.error("Error in deleteNote Firestore delete:", err));
        }

        return {
          notes: state.notes.filter((n) => n.id !== id),
          selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
          activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
        };
      }),

      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterCategory: (category) => set({ filterCategory: category }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setSortBy: (sort) => set({ sortBy: sort }),

      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      setSelectedNoteId: (id) => {
        const prevId = get().selectedNoteId;
        if (prevId && prevId !== id) {
          // Flush any pending debounced content update for the previous note immediately!
          if (debounceTimers[prevId]) {
            clearTimeout(debounceTimers[prevId]);
            const prevNote = get().notes.find(n => n.id === prevId);
            const currentUser = get().user;
            if (prevNote && currentUser) {
              setDoc(doc(db, 'notes', `${currentUser.uid}_${prevId}`), { ...prevNote, userId: currentUser.uid }, { merge: true })
                .catch((err) => console.error("Error in flushing updateNote Firestore write:", err));
            }
            delete debounceTimers[prevId];
          }
        }

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
