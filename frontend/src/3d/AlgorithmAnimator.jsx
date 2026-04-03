import React, { useState, useEffect } from 'react';
import { Sphere, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// DV: send multiple tiny packets across links simultaneously
const DVAnimation = ({ edges, nodes, viewMode }) => {
  const [progress, setProgress] = useState(0);

  useFrame((state, delta) => {
    setProgress(p => Math.min(1, p + delta * 1.5));
  });

  return (
    <group>
      {edges.map((edge, i) => {
        const sNode = nodes.find(n => n.id === edge.source);
        const tNode = nodes.find(n => n.id === edge.target);
        if (!sNode || !tNode) return null;

        const start = new THREE.Vector3(sNode.position.x, viewMode === '2D' ? 0 : sNode.position.y, sNode.position.z);
        const end = new THREE.Vector3(tNode.position.x, viewMode === '2D' ? 0 : tNode.position.y, tNode.position.z);
        
        const currentPos = new THREE.Vector3().lerpVectors(start, end, progress);
        
        return (
          <Sphere key={i} args={[0.2, 16, 16]} position={currentPos}>
             <meshStandardMaterial color="#f39c12" emissive="#f39c12" emissiveIntensity={1} />
          </Sphere>
        );
      })}
    </group>
  );
};

// LS: Send circular ripple from active nodes
const LSAnimation = ({ activeNodes, nodes, viewMode }) => {
  const [radius, setRadius] = useState(0.1);
  const [opacity, setOpacity] = useState(0.8);

  useFrame((state, delta) => {
    setRadius(r => r + delta * 8); // expand fast
    setOpacity(o => Math.max(0, o - delta * 0.8)); // fade out
  });

  return (
    <group>
      {activeNodes.map((nId, i) => {
        const nNode = nodes.find(n => n.id === nId);
        if (!nNode) return null;
        const pos = new THREE.Vector3(nNode.position.x, viewMode === '2D' ? 0 : nNode.position.y, nNode.position.z);

        return (
          <Sphere key={i} args={[radius, 32, 32]} position={pos}>
            <meshBasicMaterial 
              color="#00ffa3" 
              wireframe 
              transparent 
              opacity={opacity}
              side={THREE.DoubleSide} 
            />
          </Sphere>
        );
      })}
    </group>
  );
};

const AlgorithmAnimator = ({ animation, nodes, viewMode, onComplete }) => {
  useEffect(() => {
    // Both animations run for exactly 1.2s then unmount
    const timer = setTimeout(() => {
      onComplete();
    }, 1200);
    return () => clearTimeout(timer);
  }, [animation]);

  if (!animation || !nodes) return null;

  if (animation.type === 'DV_EXCHANGE') {
    return <DVAnimation edges={animation.edges} nodes={nodes} viewMode={viewMode} />;
  }
  
  if (animation.type === 'LS_FLOODING') {
    return <LSAnimation activeNodes={animation.nodes} nodes={nodes} viewMode={viewMode} />;
  }

  return null;
};

export default AlgorithmAnimator;
