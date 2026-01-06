
import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Grid, Stars, Sparkles } from '@react-three/drei';
import { useStore } from '../store/useStore';
import { StickyNote } from './StickyNote';
import * as THREE from 'three';

const Group = 'group' as any;
const AmbientLight = 'ambientLight' as any;
const PointLight = 'pointLight' as any;
const Color = 'color' as any;
const FogExp2 = 'fogExp2' as any;

const AtmosphericParticles = () => {
  return (
    <Group>
      <Sparkles count={400} scale={50} size={1.2} speed={0.3} opacity={0.15} color="#ffffff" />
      <Sparkles count={150} scale={40} size={3} speed={0.15} opacity={0.08} color="#818cf8" />
      <Stars radius={150} depth={60} count={7000} factor={4} saturation={0} fade speed={0.8} />
    </Group>
  );
};

export const Board: React.FC = () => {
  const { 
    notes, 
    searchQuery, 
    filterCategory, 
    filterStatus, 
    sortBy,
    isDarkMode, 
    isDraggingNote, 
    setActiveNoteId 
  } = useStore();

  const filteredNotes = useMemo(() => {
    return notes
      .filter(n => {
        const matchesSearch = !searchQuery || n.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !filterCategory || n.category === filterCategory;
        const matchesStatus = filterStatus === 'all' || 
                              (filterStatus === 'pinned' && n.isPinned) || 
                              (filterStatus === 'favorites' && n.isFavorite);
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'pinned') {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        } else if (sortBy === 'favorites') {
          if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        } else if (sortBy === 'az') {
          return (a.content || '').localeCompare(b.content || '');
        }
        return b.lastModified - a.lastModified;
      });
  }, [notes, searchQuery, filterCategory, filterStatus, sortBy]);

  const bgColor = isDarkMode ? '#020617' : '#f8fafc';

  return (
    <div className="absolute inset-0 z-0">
      {/* Cinematic Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_200px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_0_250px_rgba(0,0,0,0.5)]" />
      
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        camera={{ position: [0, 0, 15], fov: 35 }}
        onPointerMissed={() => setActiveNoteId(null)}
      >
        <Color attach="background" args={[bgColor]} />
        <FogExp2 attach="fog" args={[bgColor, 0.012]} />
        
        <Suspense fallback={null}>
          <AmbientLight intensity={isDarkMode ? 0.35 : 1.4} />
          <PointLight position={[10, 10, 10]} intensity={isDarkMode ? 2.5 : 1.2} castShadow />
          <PointLight position={[-15, -15, 8]} intensity={isDarkMode ? 1.5 : 0.6} color="#818cf8" />
          
          <AtmosphericParticles />
          
          <Grid
            renderOrder={-1}
            position={[0, -12, 0]}
            args={[100, 100]}
            sectionSize={10}
            sectionThickness={1.2}
            sectionColor={isDarkMode ? '#1e293b' : '#cbd5e1'}
            cellSize={2}
            cellThickness={0.6}
            cellColor={isDarkMode ? '#0f172a' : '#f1f5f9'}
            infiniteGrid
          />

          <Group>
            {filteredNotes.map((note) => (
              <StickyNote key={note.id} note={note} />
            ))}
          </Group>

          <ContactShadows position={[0, -11.9, 0]} opacity={0.3} scale={60} blur={3} far={20} />
          <Environment preset={isDarkMode ? "night" : "apartment"} />
        </Suspense>

        <OrbitControls 
          enabled={!isDraggingNote} 
          enablePan={true} 
          enableZoom={true} 
          minDistance={6} 
          maxDistance={45} 
          dampingFactor={0.05}
          rotateSpeed={0.8}
        />
      </Canvas>
    </div>
  );
};
