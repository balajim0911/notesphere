
export const COLORS = [
  { name: 'Crystal Blue', value: '#60a5fa' },   // Vibrant but clear blue
  { name: 'Rose Quartz', value: '#fb7185' },    // Warm translucent pink
  { name: 'Emerald Glass', value: '#34d399' },  // Fresh clear green
  { name: 'Amber Glow', value: '#fbbf24' },     // Sunny translucent yellow
  { name: 'Violet Gem', value: '#a78bfa' },     // Soft royal purple
  { name: 'Teal Lagoon', value: '#2dd4bf' },    // Deep sea clear blue
  { name: 'Orange Topaz', value: '#fb923c' },   // Bright warm orange
  { name: 'Sky Tint', value: '#38bdf8' },       // Clean airy blue
  { name: 'Lime Zest', value: '#a3e635' },      // Neon-adjacent clear green
  { name: 'Indigo Ice', value: '#818cf8' },     // Professional soft indigo
  { name: 'Coral Glass', value: '#f87171' },    // Soft red-tinted glass
  { name: 'Pure Frost', value: '#f1f5f9' },     // Neutral white glass
];

export const CATEGORIES = ['Work', 'Personal', 'Ideas', 'Urgent', 'Archive'];

export const TEXTURES = [
  { id: 'plain', name: 'Plain' },
  { id: 'grid', name: 'Blueprint' },
  { id: 'lined', name: 'Journal' },
  { id: 'grainy', name: 'Fiber' },
  { id: 'glass', name: 'Crystal' },
] as const;

export const FONTS = [
  { id: 'sans', name: 'Modern', class: 'font-sans' },
  { id: 'handwriting', name: 'Chalk', class: 'font-handwriting' },
  { id: 'mono', name: 'Code', class: 'font-mono' },
] as const;

export const INITIAL_NOTES: any[] = [
  {
    id: '1',
    content: 'Welcome to NoteSphere 3D!\n\nDouble click any note to edit.\nDrag to move around.',
    color: '#60a5fa',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 1,
    category: 'General',
    tags: ['welcome'],
    isPinned: false,
    isFavorite: true,
    lastModified: Date.now(),
    textureType: 'glass',
    fontStyle: 'sans'
  },
  {
    id: '2',
    content: 'Try searching notes or adding new ones from the toolbar below.',
    color: '#a78bfa',
    position: [2.5, 0.5, -1],
    rotation: [0, -0.2, 0],
    scale: 1,
    category: 'General',
    tags: ['tips'],
    isPinned: false,
    isFavorite: false,
    lastModified: Date.now(),
    textureType: 'grid',
    fontStyle: 'mono'
  }
];
