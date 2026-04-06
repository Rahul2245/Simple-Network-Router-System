import React, { useState, useEffect } from 'react';
import { Sphere, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

const RouterNode = ({ node, onClick, viewMode, isSource, isDest, isCurrent, isDropped, isFirstLink, activePacketStatus }) => {
  const [hovered, setHover] = useState(false);
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (activePacketStatus === 'routing') {
      const idx = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 300);
      return () => clearInterval(idx);
    }
  }, [activePacketStatus]);

  // If in 2D mode, flatten Y to 0
  const pos = [
    node.position?.x || 0,
    viewMode === '2D' ? 0 : node.position?.y || 0,
    node.position?.z || 0
  ];

  let baseColor = "#00ffa3"; // normal green
  if (isCurrent) baseColor = "#f1c40f"; // active/evaluating yellow
  else if (isSource) baseColor = "#3b82f6"; // blue
  else if (isDest) baseColor = "#a855f7"; // purple
  else if (isDropped) baseColor = "#e74c3c"; // red

  let emissiveColor = isCurrent ? "#f1c40f" : isSource ? "#1e3a8a" : isDest ? "#581c87" : isDropped ? "#7f1d1d" : "#004020";

  return (
    <group 
      position={pos} 
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onClick && onClick(e); }} 
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); }} 
      onPointerOut={(e) => { e.stopPropagation(); setHover(false); }}
    >
      
      {/* Outer Glow / Halo */}
      <Sphere args={[0.9, 32, 32]} scale={hovered || isCurrent ? 1.2 : 1}>
        <meshBasicMaterial 
           color={hovered || isCurrent ? baseColor : baseColor} 
           transparent 
           opacity={hovered || isCurrent ? 0.4 : 0.15} 
           side={THREE.BackSide} 
        />
      </Sphere>

      {/* Core Router */}
      <Sphere args={[0.5, 32, 32]}>
        <meshStandardMaterial 
          color={hovered ? baseColor : "#111822"} 
          emissive={hovered || isCurrent ? baseColor : emissiveColor}
          emissiveIntensity={hovered || isCurrent ? 0.8 : 0.6}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
      
      {/* Dynamic Network Pulse (Simulated) */}
      <Sphere args={[0.55, 16, 16]}>
        <meshBasicMaterial color={baseColor} wireframe transparent opacity={0.3} />
      </Sphere>

      {/* Label */}
      <Billboard follow={true} position={[0, 1.2, 0]}>
        <Text
          fontSize={0.4}
          color={hovered || isCurrent ? "#ffffff" : baseColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000000"
        >
          {node.label || node.id}
        </Text>
      </Billboard>

      {/* Decision Status Label */}
      {isCurrent && activePacketStatus === 'routing' && (
        <Billboard follow={true} position={[0, 2.0, 0]}>
          <Text
            fontSize={0.3}
            color="#f1c40f"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {`Evaluating table${dots}`}
          </Text>
        </Billboard>
      )}

      {/* First Link Node Feedback */}
      {isFirstLink && (
        <Billboard follow={true} position={[0, 2.0, 0]}>
          <Text
            fontSize={0.3}
            color="#00ffa3"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            Link Source...
          </Text>
        </Billboard>
      )}

    </group>
  );
};

export default RouterNode;
