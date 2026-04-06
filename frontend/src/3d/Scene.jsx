import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, MapControls, Stars, Plane, Line } from '@react-three/drei';
import * as THREE from 'three';
import RouterNode from './RouterNode';
import LinkEdge from './LinkEdge';
import PacketAnimator from './PacketAnimator';
import ActivePacketAnimator from './ActivePacketAnimator';
import AlgorithmAnimator from './AlgorithmAnimator';

const CameraController = ({ viewMode }) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef();  


  

  useEffect(() => {
    if (viewMode === '2D') {
      camera.position.set(0, 20, 0);
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) {
         controlsRef.current.enableRotate = false;
         controlsRef.current.enablePolarAngle = false;
         controlsRef.current.enableAzimuthAngle = false;
      }
    } else {
      camera.position.set(0, 15, 20);
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) {
         controlsRef.current.enableRotate = true;
         controlsRef.current.maxPolarAngle = Math.PI / 2;
      }
    }
  }, [viewMode, camera]);

  return viewMode === '2D' ? (
    <MapControls ref={controlsRef} args={[camera, gl.domElement]} enableDamping dampingFactor={0.05} />
  ) : (
    <OrbitControls ref={controlsRef} args={[camera, gl.domElement]} enableDamping dampingFactor={0.05} />
  );
};

const Scene = ({ 
  graph, onSelectNode, onSelectLink, selectedLink, viewMode, metric, onAction, 
  interactionMode, sourceNode, destNode, setSourceNode, setDestNode, 
  activePacket, decisionData, algorithmAnimation, onAnimationComplete 
}) => {
  const nodes = graph.nodes || [];
  const links = graph.links || [];

  // Used for ADD_LINK mode
  const [firstLinkNode, setFirstLinkNode] = useState(null);
  const [mousePos, setMousePos] = useState(null);

  const handlePlaneMove = (e) => {
    if (interactionMode === 'ADD_LINK' && firstLinkNode) {
      setMousePos([e.point.x, viewMode === '2D' ? 0 : e.point.y, e.point.z]);
    }
  };

  const handlePlanePointerDown = (e) => {
    if (interactionMode === 'ADD_NODE') {
      const id = `R${Date.now().toString().slice(-4)}`;
      const yOffset = viewMode === '3D' ? (Math.random() * 6 - 3) : 0;
      onAction('add_node', {
        id, label: id, position: { x: e.point.x, y: yOffset, z: e.point.z }
      });
    } else {
      onSelectNode(null);
      if (onSelectLink) onSelectLink(null);
      setFirstLinkNode(null);
    }
  };

  const handleNodeClick = (node) => {
    if (interactionMode === 'VIEW') {
      onSelectNode(node);
    } else if (interactionMode === 'SELECT_ROUTE'){
      if (!sourceNode) {
        setSourceNode(node);
      } else if (!destNode && node.id !== sourceNode.id) {
        setDestNode(node);
      } else {
        // Reset if clicking again
        setSourceNode(node);
        setDestNode(null);
      }
    } else if (interactionMode === 'ADD_LINK') {
      if (!firstLinkNode) {
        setFirstLinkNode(node);
      } else {
        if (firstLinkNode.id !== node.id) {
          // Send link action (cost = physical distance for now, clamped)
          const dx = node.position.x - firstLinkNode.position.x;
          const dy = (node.position.y || 0) - (firstLinkNode.position.y || 0);
          const dz = node.position.z - firstLinkNode.position.z;
          const dist = Math.max(1, Math.round(Math.sqrt(dx*dx + dy*dy + dz*dz) / 2));
          onAction('add_link', { source: firstLinkNode.id, target: node.id, cost: dist });
        }
        setFirstLinkNode(null);
      }
    }
  };

  return (
    <div className="w-full h-full relative cursor-crosshair">
      <Canvas camera={{ position: [0, 15, 20], fov: 45 }} gl={{ antialias: true }}>
        <color attach="background" args={['#05080c']} />
        
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ffa3" />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#2ecc71" />
        
        {viewMode === '3D' && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
        {viewMode === '2D' && (
           <gridHelper args={[100, 100, '#161b22', '#0d1117']} position={[0, -0.5, 0]} />
        )}

        <CameraController viewMode={viewMode} />

        {/* Interaction Plane */}
        <Plane 
          args={[100, 100]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.1, 0]} 
          onPointerDown={handlePlanePointerDown}
          onPointerMove={handlePlaneMove}
          visible={false}
        />

        {/* Dynamic Link Preview */}
        {interactionMode === 'ADD_LINK' && firstLinkNode && mousePos && (
           <Line
             points={[
               [firstLinkNode.position.x, viewMode === '2D' ? 0 : firstLinkNode.position.y, firstLinkNode.position.z],
               mousePos
             ]}
             color="#f39c12"
             lineWidth={2}
             dashed
             dashSize={0.5}
             gapSize={0.2}
           />
        )}

        {/* Render Links */}
        {links.map(link => {
          const sNode = nodes.find(n => n.id === link.source);
          const tNode = nodes.find(n => n.id === link.target);
          if (!sNode || !tNode) return null;

          return (
             <React.Fragment key={link.id}>
               <LinkEdge 
                 id={link.id}
                 source={sNode} 
                 target={tNode} 
                 cost={link.cost} 
                 delay={link.delay}
                 metric={metric} 
                 status={link.status}
                 viewMode={viewMode}
                 isSelected={selectedLink?.id === link.id}
                 onClick={onSelectLink}
               />
             </React.Fragment>
          );
        })}

        {/* Render Nodes */}
        {nodes.map(node => {
          const isSource = sourceNode?.id === node.id;
          const isDest = destNode?.id === node.id;
          const isCurrent = activePacket && activePacket.currentNode === node.id;
          const isDropped = activePacket && activePacket.status === 'dropped' && activePacket.currentNode === node.id;
          const isFirstLink = firstLinkNode?.id === node.id;
          
          return (
            <RouterNode 
               key={node.id} 
               node={node} 
               onClick={() => handleNodeClick(node)} 
               viewMode={viewMode}
               isSource={isSource}
               isDest={isDest}
               isCurrent={isCurrent}
               isDropped={isDropped}
               isFirstLink={isFirstLink}
               activePacketStatus={isCurrent ? activePacket.status : null}
            />
          );
        })}

        {/* Render Active Packet Animation when in transit */}
        {activePacket && activePacket.status === 'transit' && (
           (() => {
             const prevNodeId = activePacket.path[activePacket.path.length - 2];
             const currNodeId = activePacket.currentNode;
             const sNode = nodes.find(n => n.id === prevNodeId);
             const tNode = nodes.find(n => n.id === currNodeId);
             
             if (sNode && tNode) {
               return (
                 <ActivePacketAnimator 
                   key={`${activePacket.id}_${prevNodeId}_${currNodeId}`}
                   source={sNode} 
                   target={tNode} 
                   viewMode={viewMode} 
                   onComplete={() => onAction('packet_animation_complete', { packetId: activePacket.id })}
                 />
               );
             }
             return null;
           })()
        )}

        {/* Global Algorithm Animation Visualizations (DV / LS) */}
        {algorithmAnimation && (
          <AlgorithmAnimator 
             animation={algorithmAnimation} 
             nodes={nodes} 
             viewMode={viewMode}
             onComplete={onAnimationComplete}
          />
        )}

      </Canvas>
    </div>
  );
};

export default Scene;
