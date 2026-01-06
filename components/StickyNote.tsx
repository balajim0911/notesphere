
import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, RoundedBox, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { Note } from '../types';
import { useStore } from '../store/useStore';

const Group = 'group' as any;
const MeshBasicMaterial = 'meshBasicMaterial' as any;
const MeshPhysicalMaterial = 'meshPhysicalMaterial' as any;

// Procedural texture generator for variety functionality
const generateTexture = (type: string, color: string) => {
  if (type === 'plain' || type === 'glass') return null;
  
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 256);

  if (type === 'grid') {
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 256; i += 32) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
    }
  } else if (type === 'lined') {
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1.5;
    for (let i = 40; i <= 256; i += 32) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
    }
  } else if (type === 'grainy') {
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const opacity = Math.random() * 0.12;
      ctx.fillStyle = `rgba(0,0,0,${opacity})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

interface StickyNoteProps {
  note: Note;
}

export const StickyNote: React.FC<StickyNoteProps> = ({ note }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef(new THREE.Vector3());
  
  const { 
    setSelectedNoteId, 
    updateNote, 
    activeNoteId, 
    setActiveNoteId, 
    setIsDraggingNote,
    bringToFront,
    isDarkMode
  } = useStore();
  
  const { mouse, raycaster, camera } = useThree();
  useCursor(hovered || dragging);

  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const intersectionPoint = new THREE.Vector3();

  // Focus Logic: Is this specific note the 'active' one? Is ANY note active?
  const isActive = activeNoteId === note.id;
  const isAnyNoteActive = activeNoteId !== null;
  // A note is 'dimmed' if something else is active and this isn't hovered or active
  const isDimmed = isAnyNoteActive && !isActive && !hovered;
  
  const layerZ = (note.zIndex || 0) * 0.45;

  const texture = useMemo(() => generateTexture(note.textureType, note.color), [note.textureType, note.color]);

  // Truncate content for the 3D preview
  const displayContent = useMemo(() => {
    const content = note.content;
    if (!content || content.trim() === '') return 'Click to write...';
    
    // Limits for the 3D card preview
    const charLimit = 220; 
    let truncated = content.length > charLimit ? content.substring(0, charLimit) + '...' : content;
    
    // Hard line count limit for the 3D space
    const lines = truncated.split('\n');
    if (lines.length > 8) {
      truncated = lines.slice(0, 8).join('\n') + '...';
    }
    
    return truncated;
  }, [note.content]);

  // Dynamic Font Size logic
  const fontSize = useMemo(() => {
    const len = displayContent.length;
    if (len < 25) return 0.22; // Very short notes get big impact text
    if (len < 60) return 0.18; // Medium headlines
    if (len < 120) return 0.15; // Standard text
    return 0.13; // Long-form detail
  }, [displayContent]);

  const materialProps = useMemo(() => {
    const baseColor = new THREE.Color(note.color);
    const targetOpacity = isDimmed ? 0.35 : 1.0;
    
    if (note.textureType === 'glass') {
      return {
        color: baseColor,
        transmission: isDimmed ? 0.3 : (isDarkMode ? 0.95 : 0.85),
        thickness: 0.5,
        roughness: isDimmed ? 0.95 : 0.08, 
        metalness: 0.15,
        ior: 1.5,
        reflectivity: 1.0,
        clearcoat: isDimmed ? 0 : 1.0,
        attenuationDistance: 0.6,
        attenuationColor: baseColor,
        emissive: baseColor,
        emissiveIntensity: hovered || isActive ? 0.35 : (isDimmed ? 0.02 : 0.12),
        transparent: true,
        opacity: targetOpacity,
      };
    }

    return {
      color: baseColor,
      map: texture,
      roughness: isDimmed ? 1.0 : (note.textureType === 'grainy' ? 1.0 : 0.8), 
      metalness: 0.05,
      reflectivity: isDimmed ? 0 : 0.25,
      clearcoat: isDimmed ? 0 : 0.1,
      emissive: baseColor,
      emissiveIntensity: hovered || isActive ? 0.2 : (isDimmed ? 0.02 : 0.08),
      transparent: true,
      opacity: targetOpacity,
    };
  }, [note.color, note.textureType, hovered, isActive, isDimmed, texture, isDarkMode]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    
    const float = Math.sin(t * 0.4 + note.id.length) * 0.06;
    const sway = Math.cos(t * 0.3 + note.id.length) * 0.04;

    if (dragging) {
      raycaster.setFromCamera(mouse, camera);
      if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
        const targetPos = intersectionPoint.clone().add(dragOffset.current);
        meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetPos.x, 0.4);
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetPos.y, 0.4);
        meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, layerZ + 2.5, 0.2);
        meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, (targetPos.x - meshRef.current.position.x) * 0.3, 0.1);
      }
    } else {
      const targetZ = (hovered || isActive) ? layerZ + 0.6 : layerZ;
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, note.position[0] + sway, 0.1);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, note.position[1] + float, 0.1);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.15);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, note.rotation[2], 0.1);
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (e.button === 0 && meshRef.current) {
      bringToFront(note.id);
      setActiveNoteId(note.id);
      setDragging(true);
      setIsDraggingNote(true);
      raycaster.setFromCamera(mouse, camera);
      if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
        dragOffset.current.copy(meshRef.current.position).sub(intersectionPoint);
      }
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    if (dragging && meshRef.current) {
      setDragging(false);
      setIsDraggingNote(false);
      e.target.releasePointerCapture(e.pointerId);
      updateNote(note.id, { position: [meshRef.current.position.x, meshRef.current.position.y, 0] });
    } else {
      setDragging(false);
      setIsDraggingNote(false);
    }
  };

  const textColor = isDarkMode ? "#ffffff" : "#0f172a";
  const textOpacity = isDimmed ? 0.15 : 1.0;

  return (
    <Group 
      ref={meshRef} 
      position={[note.position[0], note.position[1], layerZ]} 
      rotation={note.rotation}
      scale={dragging ? 1.08 : hovered || isActive ? 1.05 : 1}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onDoubleClick={(e: any) => {
        e.stopPropagation();
        setSelectedNoteId(note.id);
      }}
    >
      {(isActive) && (
        <RoundedBox args={[2.4, 2.4, 0.01]} radius={0.15} smoothness={4}>
          <MeshBasicMaterial color={note.color} transparent opacity={0.3} />
        </RoundedBox>
      )}

      <RoundedBox args={[2.2, 2.2, 0.1]} radius={0.12} smoothness={12} castShadow>
        <MeshPhysicalMaterial {...materialProps} />
      </RoundedBox>

      {/* Main Content Text */}
      <Text
        position={[0, 0, 0.11]} 
        fontSize={fontSize}
        color={textColor}
        maxWidth={1.85}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        lineHeight={1.2}
        fontWeight="800"
        overflowWrap="break-word"
        // Improved clipping: 
        // X: [-0.95, 0.95] (approx 1.9 width)
        // Y: [-0.7, 0.8] (Bottom cut slightly higher for the category footer)
        clipRect={[-0.95, -0.7, 0.95, 0.8]} 
        fillOpacity={textOpacity}
        font={note.fontStyle === 'handwriting' ? 'https://fonts.gstatic.com/s/shadowsintolight/v15/mjt7m614_P6tAzMvPiFzL2726nS2pw.woff' : undefined}
      >
        {displayContent}
      </Text>

      {/* Category Label - Styled as Stationery Metadata */}
      {note.category && (
        <Group position={[0, -0.85, 0.11]}>
          {/* Subtle Divider Line */}
          <mesh position={[0, 0.1, 0]}>
            <planeGeometry args={[1.7, 0.01]} />
            <meshBasicMaterial color={textColor} transparent opacity={isDimmed ? 0.05 : 0.2} />
          </mesh>
          
          <Text
            position={[0, -0.05, 0]}
            fontSize={0.1}
            color={textColor}
            fontWeight="900"
            anchorX="center"
            anchorY="middle"
            fillOpacity={isDimmed ? 0.1 : 0.6}
            letterSpacing={0.2}
          >
            {note.category.toUpperCase()}
          </Text>
        </Group>
      )}

      {/* Badge Icons - Hidden when dimmed to reduce noise */}
      <Group position={[0.85, 0.9, 0.12]} visible={!isDimmed}>
        {note.isPinned && <Text fontSize={0.2} outlineWidth={0.01} outlineColor="white">📌</Text>}
        {note.isFavorite && <Text fontSize={0.2} position={note.isPinned ? [-0.28, 0, 0] : [0, 0, 0]} outlineWidth={0.01} outlineColor="white">⭐</Text>}
      </Group>
    </Group>
  );
};
