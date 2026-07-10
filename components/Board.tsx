
import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
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
  const isDarkMode = useStore((state) => state.isDarkMode);
  if (!isDarkMode) return null;
  return (
    <Group>
      <Sparkles count={400} scale={50} size={1.2} speed={0.3} opacity={0.15} color="#ffffff" />
      <Sparkles count={150} scale={40} size={3} speed={0.15} opacity={0.08} color="#818cf8" />
      <Stars radius={150} depth={60} count={7000} factor={4} saturation={0} fade speed={0.8} />
    </Group>
  );
};

const CameraTracker = () => {
  const { camera } = useThree();
  const setCameraCenter = useStore((state) => state.setCameraCenter);

  useFrame(() => {
    // Project camera optical center vector onto the Z=0 plane
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    if (Math.abs(dir.z) > 0.001) {
      const t = -camera.position.z / dir.z;
      const x = camera.position.x + dir.x * t;
      const y = camera.position.y + dir.y * t;
      if (Number.isFinite(x) && Number.isFinite(y)) {
        setCameraCenter([x, y]);
      }
    }
  });

  return null;
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
    setActiveNoteId,
    selectedNoteId
  } = useStore();

  const [initialCameraZ, setInitialCameraZ] = useState(15);

  useEffect(() => {
    const handleResize = () => {
      setInitialCameraZ(window.innerWidth < 768 ? 22 : 15);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredNotes = useMemo(() => {
    return notes
      .filter(n => {
        const matchesSearch = !searchQuery || (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase()));
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

  const bgColor = isDarkMode ? '#020617' : '#ffffff';

  return (
    <div className="absolute inset-0 z-0 touch-none">
      {/* Cinematic Vignette Overlay */}
      <div className={`absolute inset-0 pointer-events-none z-10 ${isDarkMode ? 'shadow-[inset_0_0_250px_rgba(0,0,0,0.5)]' : ''}`} />
      
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        camera={{ position: [0, 0, initialCameraZ], fov: 35 }}
        onPointerMissed={() => setActiveNoteId(null)}
      >
        <Color attach="background" args={[bgColor]} />
        {isDarkMode && <FogExp2 attach="fog" args={[bgColor, 0.012]} />}
        <CameraTracker />
        
        <Suspense fallback={null}>
          <AmbientLight intensity={isDarkMode ? 0.35 : 1.4} />
          <PointLight position={[10, 10, 10]} intensity={isDarkMode ? 2.5 : 1.2} castShadow />
          <PointLight position={[-15, -15, 8]} intensity={isDarkMode ? 1.5 : 0.6} color={isDarkMode ? '#818cf8' : '#e2e8f0'} />
          
          <AtmosphericParticles />
          
          <Grid
            renderOrder={-1}
            position={[0, -12, 0]}
            args={[100, 100]}
            sectionSize={10}
            sectionThickness={1.2}
            sectionColor={isDarkMode ? '#1e293b' : '#e2e8f0'}
            cellSize={2}
            cellThickness={0.6}
            cellColor={isDarkMode ? '#0f172a' : '#f8fafc'}
            infiniteGrid
          />

          <Group>
            {filteredNotes.map((note) => (
              <StickyNote key={note.id} note={note} />
            ))}
          </Group>

          <ContactShadows position={[0, -11.9, 0]} opacity={0.3} scale={60} blur={3} far={20} />
          <Environment preset={isDarkMode ? "night" : "studio"} />
        </Suspense>

        <OrbitControls 
          enabled={!isDraggingNote && selectedNoteId === null} 
          enablePan={selectedNoteId === null} 
          enableZoom={selectedNoteId === null} 
          minDistance={6} 
          maxDistance={45} 
          dampingFactor={0.05}
          rotateSpeed={0.8}
          maxAzimuthAngle={Math.PI / 2.5}
          minAzimuthAngle={-Math.PI / 2.5}
          maxPolarAngle={Math.PI / 2 + 0.4}
          minPolarAngle={Math.PI / 2 - 0.4}
        />
      </Canvas>
    </div>
  );
};
