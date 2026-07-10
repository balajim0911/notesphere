
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
  
  const { mouse, raycaster, camera, controls } = useThree() as any;
  useCursor(hovered || dragging);

  const layerZ = (note.zIndex || 0) * 0.12;

  const plane = useMemo(() => new THREE.Plane(), []);
  const dragNormal = useRef(new THREE.Vector3(0, 0, 1));
  const intersectionPoint = useMemo(() => new THREE.Vector3(), []);

  // Focus Logic: Is this specific note the 'active' one? Is ANY note active?
  const isActive = activeNoteId === note.id;
  const isAnyNoteActive = activeNoteId !== null;
  // A note is 'dimmed' if something else is active and this isn't hovered or active
  const isDimmed = isAnyNoteActive && !isActive && !hovered;

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
        if (Number.isFinite(targetPos.x) && Number.isFinite(targetPos.y) && Number.isFinite(targetPos.z)) {
          // Gently float the note along the screen view vector so it hover/floats closer to camera
          const liftedTarget = targetPos.clone().addScaledVector(dragNormal.current, 1.2);
          
          meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, liftedTarget.x, 0.45);
          meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, liftedTarget.y, 0.45);
          meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, liftedTarget.z, 0.3);
          
          const dx = liftedTarget.x - meshRef.current.position.x;
          if (Number.isFinite(dx)) {
            meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, dx * 0.35, 0.12);
          }
        }
      }
    } else {
      const targetZ = (hovered || isActive) ? layerZ + 0.3 : layerZ;
      const targetX = (Array.isArray(note.position) && Number.isFinite(note.position[0])) ? note.position[0] : 0;
      const targetY = (Array.isArray(note.position) && Number.isFinite(note.position[1])) ? note.position[1] : 0;
      
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX + sway, 0.1);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY + float, 0.1);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.15);
      
      const targetRotZ = (Array.isArray(note.rotation) && Number.isFinite(note.rotation[2])) ? note.rotation[2] : 0;
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRotZ, 0.1);
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    const isRightOrMiddleClick = e.button === 1 || e.button === 2;
    
    if (!isRightOrMiddleClick && meshRef.current) {
      if (controls) {
        controls.enabled = false;
      }
      bringToFront(note.id);
      setActiveNoteId(note.id);
      setDragging(true);
      setIsDraggingNote(true);
      
      // Calculate camera normal direction to orient the drag plane parallel to the screen view
      camera.getWorldDirection(dragNormal.current);
      dragNormal.current.negate(); // Make it point towards the camera
      
      // Set the plane passing through the note's current 3D position, facing the camera
      plane.setFromNormalAndCoplanarPoint(dragNormal.current, meshRef.current.position);

      raycaster.setFromCamera(mouse, camera);
      if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
        dragOffset.current.copy(meshRef.current.position).sub(intersectionPoint);
      } else {
        const fallbackPoint = e.point || new THREE.Vector3();
        dragOffset.current.copy(meshRef.current.position).sub(fallbackPoint);
      }
      
      const domTarget = e.nativeEvent?.target;
      if (domTarget && typeof domTarget.setPointerCapture === 'function') {
        domTarget.setPointerCapture(e.pointerId);
      }
    }
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    if (controls) {
      controls.enabled = true;
    }
    if (dragging && meshRef.current) {
      setDragging(false);
      setIsDraggingNote(false);
      
      const domTarget = e.nativeEvent?.target;
      if (domTarget && typeof domTarget.releasePointerCapture === 'function') {
        domTarget.releasePointerCapture(e.pointerId);
      }
      
      // Project final position back onto the Z=0 flat board plane
      const boardPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const landingPoint = new THREE.Vector3();
      raycaster.setFromCamera(mouse, camera);
      
      if (raycaster.ray.intersectPlane(boardPlane, landingPoint)) {
        if (Number.isFinite(landingPoint.x) && Number.isFinite(landingPoint.y)) {
          updateNote(note.id, { position: [landingPoint.x, landingPoint.y, 0] });
        } else {
          const posX = meshRef.current.position.x;
          const posY = meshRef.current.position.y;
          if (Number.isFinite(posX) && Number.isFinite(posY)) {
            updateNote(note.id, { position: [posX, posY, 0] });
          }
        }
      } else {
        const posX = meshRef.current.position.x;
        const posY = meshRef.current.position.y;
        if (Number.isFinite(posX) && Number.isFinite(posY)) {
          updateNote(note.id, { position: [posX, posY, 0] });
        }
      }
    } else {
      setDragging(false);
      setIsDraggingNote(false);
    }
  };

  // Dynamic contrast text color selection for pristine readability on all backgrounds (including translucent crystal glass)
  const getNoteContrastColor = (hexColor: string) => {
    if (!isDarkMode) {
      return '#000000';
    }
    try {
      const cleanHex = hexColor.replace('#', '');
      const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
      const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
      const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
      // Relative luminance formula
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.62 ? '#020617' : '#ffffff';
    } catch {
      return isDarkMode ? '#ffffff' : '#000000';
    }
  };

  const textColor = getNoteContrastColor(note.color);
  const textOpacity = isDimmed ? 0.15 : 1.0;

  // Adaptive outline to ensure crisp text visibility regardless of dynamic lighting
  const outlineColor = textColor === '#ffffff' ? '#000000' : '#ffffff';
  const outlineWidth = note.textureType === 'glass' ? 0.016 : 0.008;

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
        outlineWidth={outlineWidth}
        outlineColor={outlineColor}
        outlineOpacity={isDimmed ? 0.2 : (note.textureType === 'glass' ? 0.95 : 0.6)}
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
