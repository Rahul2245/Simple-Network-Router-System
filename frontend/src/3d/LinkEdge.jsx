import React, { useMemo, useState } from 'react';
import { Line, Billboard, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

const LinkEdge = ({
  id,
  source,
  target,
  cost,
  delay,
  metric,
  status,
  viewMode,
  isSelected,
  onClick
}) => {
  const [hovered, setHover] = useState(false);

  // Positions
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

  const points = useMemo(() => [p1, p2], [p1, p2]);

  const midPoint = useMemo(
    () => new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5),
    [p1, p2]
  );

  // 🔥 Offset label upward to avoid overlap
  const labelPosition = useMemo(
    () => midPoint.clone().add(new THREE.Vector3(0, 0.6, 0)),
    [midPoint]
  );

  const color =
    status === 'down' ? '#e74c3c' : hovered ? '#ffffff' : '#4a5568';

  const dashed = status === 'down';

  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick({
          id,
          source: source.id,
          target: target.id,
          cost,
          delay,
          status
        });
      }}
    >
      {/* Invisible thick line for interaction */}
      <Line
        points={points}
        color="black"
        lineWidth={20}
        transparent
        opacity={0}
      />

      {/* Visible link */}
      <Line
        points={points}
        color={isSelected ? '#f39c12' : color}
        lineWidth={isSelected ? 4 : status === 'down' ? 1 : hovered ? 3 : 2}
        dashed={dashed}
        dashSize={0.5}
        gapSize={0.2}
        transparent
        opacity={status === 'down' ? 0.3 : 0.8}
      />

      {/* 🔥 Label (FIXED) */}
      {status !== 'down' && (
        <Billboard
          position={labelPosition}
          follow
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          <Text
            fontSize={0.5}
            color={hovered ? '#00ffa3' : '#a0aec0'}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.04}
            outlineColor="#05080c"
            depthTest={false}   
            depthWrite={false}
            renderOrder={999}   
          >
            {metric === 'delay' ? `${delay} ms` : cost}
          </Text>
        </Billboard>
      )}

      {/* Hover action label */}
      {hovered && (
        <Html position={labelPosition}>
          <div
            className={`mt-4 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest pointer-events-none transform -translate-x-1/2 ${
              status === 'down'
                ? 'bg-statusGreen text-white'
                : 'bg-statusRed text-white'
            }`}
          >
            {status === 'down' ? 'Bring Up' : 'Bring Down'}
          </div>
        </Html>
      )}
    </group>
  );
};

export default LinkEdge;



