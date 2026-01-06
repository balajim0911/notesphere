
export interface Note {
  id: string;
  content: string;
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  category: string;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  lastModified: number;
  zIndex: number;
  textureType: 'plain' | 'grid' | 'lined' | 'grainy' | 'glass';
  fontStyle: 'sans' | 'handwriting' | 'mono';
}

export type FilterStatus = 'all' | 'favorites' | 'pinned';
export type SortType = 'recent' | 'pinned' | 'favorites' | 'az';

export interface WorkspaceState {
  notes: Note[];
  searchQuery: string;
  filterCategory: string | null;
  filterStatus: FilterStatus;
  sortBy: SortType;
  isDarkMode: boolean;
  selectedNoteId: string | null;
  activeNoteId: string | null;
  isDraggingNote: boolean;
  maxZIndex: number;
  addNote: (note: Partial<Note>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setFilterCategory: (category: string | null) => void;
  setFilterStatus: (status: FilterStatus) => void;
  setSortBy: (sort: SortType) => void;
  toggleDarkMode: () => void;
  setSelectedNoteId: (id: string | null) => void;
  setActiveNoteId: (id: string | null) => void;
  setIsDraggingNote: (isDragging: boolean) => void;
  bringToFront: (id: string) => void;
}
