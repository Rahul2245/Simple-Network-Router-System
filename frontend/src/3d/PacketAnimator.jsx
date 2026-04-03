import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

const PacketAnimator = ({ source, target, viewMode }) => {
  const packetRef = useRef();

  const p1 = useMemo(() => new THREE.Vector3(
    source.position?.x || 0,
    viewMode === '2D' ? 0 : source.position?.y || 0,
    source.position?.z || 0
  ), [source, viewMode]);
  
  const p2 = useMemo(() => new THREE.Vector3(
    target.position?.x || 0,
    viewMode === '2D' ? 0 : target.position?.y || 0,
    target.position?.z || 0
  ), [target, viewMode]);

  // Individual packet speed and offset so they don't all sync exactly
  const speed = useMemo(() => 0.5 + Math.random() * 0.5, []);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    if (packetRef.current) {
      const time = clock.getElapsedTime();
      // Calculate interpolation factor (0 to 1) using a sine wave
      const t = (Math.sin(time * speed + offset) + 1) / 2;
      packetRef.current.position.lerpVectors(p1, p2, t);
    }
  });

  return (
    <Sphere ref={packetRef} args={[0.15, 8, 8]}>
      <meshBasicMaterial color="#00ffa3" />
    </Sphere>
  );
};

export default PacketAnimator;
