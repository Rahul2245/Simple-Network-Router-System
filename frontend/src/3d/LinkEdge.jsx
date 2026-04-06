import React, { useMemo, useState } from 'react';
import { Line, Billboard, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

const LinkEdge = ({ id, source, target, cost, delay, metric, status, viewMode, isSelected, onClick }) =>  {
  const [hovered, setHover] = useState(false);

  // Flatten Y if 2D mode
  const p1 = new THREE.Vector3(
    source.position?.x || 0,
    viewMode === '2D' ? 0 : source.position?.y || 0,
    source.position?.z || 0
  );
  
  const p2 = new THREE.Vector3(
    target.position?.x || 0,
    viewMode === '2D' ? 0 : target.position?.y || 0,
    target.position?.z || 0
  );

  const points = [p1, p2];
  const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

  const color = status === 'down' ? '#e74c3c' : (hovered ? '#ffffff' : '#4a5568');
  const dashed = status === 'down';

  return (
    <group 
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
      onPointerOut={() => setHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick({ id, source: source.id, target: target.id, cost, status });
      }}
    >
      {/* Invisible thicker line for easier hovering/clicking */}
      <Line
         points={points}
         color="black"
         lineWidth={20}
         transparent
         opacity={0} 
      />
      
      {/* Visible line */}
      <Line
        points={points}
        color={isSelected ? '#f39c12' : color}
        lineWidth={isSelected ? 4 : (status === 'down' ? 1 : (hovered ? 3 : 2))}
        dashed={dashed}
        dashSize={0.5}
        gapSize={0.2}
        transparent
        opacity={status === 'down' ? 0.3 : 0.8}
      />

      {/* Cost Label */}
      {status !== 'down' && (
        <Billboard follow={true} position={midPoint}>
           {/* Adding a subtle background would exist using Html, but Text is lighter */}
          <Text
            fontSize={0.5}
            color={hovered ? '#00ffa3' : '#a0aec0'}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.04}
            outlineColor="#05080c"
          >
            {metric === 'delay' ? `${delay} ms` : cost}
          </Text>
        </Billboard>
      )}

      {/* "Fail" indicator if hovered over active link, or "Heal" if down */}
      {hovered && (
         <Html position={midPoint}>
            <div className={`mt-4 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest pointer-events-none transform -translate-x-1/2 ${status === 'down' ? 'bg-statusGreen text-white' : 'bg-statusRed text-white'}`}>
              {status === 'down' ? 'Bring Up' : 'Bring Down'}
            </div>
         </Html>
      )}
    </group>
  );
};

export default LinkEdge;
