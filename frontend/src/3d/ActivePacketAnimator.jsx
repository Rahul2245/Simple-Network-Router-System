import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Trail } from '@react-three/drei';
import * as THREE from 'three';

const ActivePacketAnimator = ({ source, target, viewMode, onComplete }) => {
  const packetRef = useRef();
  const [finished, setFinished] = useState(false);
  
  // Animation state
  const progress = useRef(0);
  const speed = 1.5; // units per second approx

  const startPos = useMemo(() => new THREE.Vector3(
    source.position?.x || 0,
    viewMode === '2D' ? 0 : source.position?.y || 0,
    source.position?.z || 0
  ), [source, viewMode]);

  const endPos = useMemo(() => new THREE.Vector3(
    target.position?.x || 0,
    viewMode === '2D' ? 0 : target.position?.y || 0,
    target.position?.z || 0
  ), [target, viewMode]);

  const distance = startPos.distanceTo(endPos);
  const duration = distance / speed; // time to reach target

  useFrame((state, delta) => {
    if (finished || !packetRef.current) return;
    
    progress.current += delta / duration;
    
    if (progress.current >= 1) {
      progress.current = 1;
      setFinished(true);
      if (onComplete) onComplete();
    }
    
    // Interpolate position
    packetRef.current.position.lerpVectors(startPos, endPos, progress.current);
  });

  if (finished) return null;

  return (
    <Trail
      width={0.8}
      color="#f1c40f"
      length={10}
      decay={1}
      local={false}
      stride={0}
      interval={1}
    >
      <Sphere ref={packetRef} args={[0.3, 16, 16]} position={startPos}>
        <meshBasicMaterial color="#f1c40f" />
      </Sphere>
    </Trail>
  );
};

export default ActivePacketAnimator;
