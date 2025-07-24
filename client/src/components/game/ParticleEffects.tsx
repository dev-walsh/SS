import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRoulette } from '../../lib/stores/useRoulette';

const ParticleEffects: React.FC = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const { gamePhase, ballPosition, winningNumber } = useRoulette();
  
  const particleCount = 200;
  
  // Create particle system
  const { positions, velocities, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random positions around the wheel
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 3;
      
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = Math.random() * 2;
      positions[i3 + 2] = Math.sin(angle) * radius;
      
      // Random velocities
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = Math.random() * 0.01;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
      
      // Golden color particles
      colors[i3] = 1; // R
      colors[i3 + 1] = 0.8; // G
      colors[i3 + 2] = 0; // B
    }
    
    return { positions, velocities, colors };
  }, []);
  
  // Winning celebration particles
  const { winPositions, winVelocities, winColors } = useMemo(() => {
    const winPositions = new Float32Array(particleCount * 3);
    const winVelocities = new Float32Array(particleCount * 3);
    const winColors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Start from ball position if available
      winPositions[i3] = ballPosition?.x || 0;
      winPositions[i3 + 1] = (ballPosition?.y || 0) + Math.random() * 2;
      winPositions[i3 + 2] = ballPosition?.z || 0;
      
      // Explosive velocities
      winVelocities[i3] = (Math.random() - 0.5) * 0.1;
      winVelocities[i3 + 1] = Math.random() * 0.15;
      winVelocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
      
      // Multi-colored celebration
      if (i % 3 === 0) {
        winColors[i3] = 1; winColors[i3 + 1] = 0; winColors[i3 + 2] = 0; // Red
      } else if (i % 3 === 1) {
        winColors[i3] = 0; winColors[i3 + 1] = 1; winColors[i3 + 2] = 0; // Green
      } else {
        winColors[i3] = 0; winColors[i3 + 1] = 0; winColors[i3 + 2] = 1; // Blue
      }
    }
    
    return { winPositions, winVelocities, winColors };
  }, [ballPosition]);
  
  useFrame((state, delta) => {
    if (!particlesRef.current) return;
    
    const geometry = particlesRef.current.geometry;
    const positionAttribute = geometry.getAttribute('position');
    const positions = positionAttribute.array as Float32Array;
    
    // Update particle positions based on game phase
    if (gamePhase === 'spinning') {
      // Subtle ambient particles during spinning
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        positions[i3] += velocities[i3];
        positions[i3 + 1] += velocities[i3 + 1];
        positions[i3 + 2] += velocities[i3 + 2];
        
        // Reset particles that go too far
        if (Math.abs(positions[i3]) > 8 || Math.abs(positions[i3 + 2]) > 8) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 2 + Math.random() * 3;
          positions[i3] = Math.cos(angle) * radius;
          positions[i3 + 1] = Math.random() * 2;
          positions[i3 + 2] = Math.sin(angle) * radius;
        }
      }
    } else if (gamePhase === 'result' && winningNumber !== null) {
      // Celebration particles
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        positions[i3] += winVelocities[i3];
        positions[i3 + 1] += winVelocities[i3 + 1];
        positions[i3 + 2] += winVelocities[i3 + 2];
        
        // Apply gravity to Y
        winVelocities[i3 + 1] -= delta * 0.02;
        
        // Reset if too low
        if (positions[i3 + 1] < -2) {
          positions[i3] = (ballPosition?.x || 0) + (Math.random() - 0.5) * 2;
          positions[i3 + 1] = (ballPosition?.y || 0) + Math.random() * 2;
          positions[i3 + 2] = (ballPosition?.z || 0) + (Math.random() - 0.5) * 2;
          winVelocities[i3 + 1] = Math.random() * 0.15;
        }
      }
    }
    
    positionAttribute.needsUpdate = true;
  });
  
  const currentColors = gamePhase === 'result' ? winColors : colors;
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={gamePhase === 'result' ? winPositions : positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={currentColors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        transparent
        opacity={0.8}
        vertexColors
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};

export default ParticleEffects;
