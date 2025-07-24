import React from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const RouletteTable: React.FC = () => {
  const woodTexture = useTexture('/textures/wood.jpg');
  
  // Configure texture
  React.useEffect(() => {
    woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
    woodTexture.repeat.set(2, 2);
  }, [woodTexture]);

  return (
    <group position={[0, -0.5, 0]}>
      {/* Main table surface */}
      <mesh receiveShadow>
        <boxGeometry args={[12, 0.1, 8]} />
        <meshPhongMaterial 
          map={woodTexture} 
          color="#8B4513"
        />
      </mesh>
      
      {/* Table legs */}
      {[
        [-5, -1, -3],
        [5, -1, -3],
        [-5, -1, 3],
        [5, -1, 3]
      ].map((position, index) => (
        <mesh key={index} position={position as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 2]} />
          <meshPhongMaterial color="#654321" />
        </mesh>
      ))}
      
      {/* Table rim */}
      <mesh position={[0, 0.1, 0]}>
        <ringGeometry args={[5.8, 6, 64]} />
        <meshPhongMaterial color="#ffd700" />
      </mesh>
      
      {/* Floor */}
      <mesh position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshPhongMaterial color="#2a2a2a" />
      </mesh>
    </group>
  );
};

export default RouletteTable;
