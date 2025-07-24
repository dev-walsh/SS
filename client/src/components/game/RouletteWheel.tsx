import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useRoulette } from '../../lib/stores/useRoulette';
import { useAudio } from '../../lib/stores/useAudio';

const RouletteWheel: React.FC = () => {
  const wheelRef = useRef<THREE.Group>(null);
  const ballRef = useRef<THREE.Mesh>(null);
  const { scene } = useThree();
  
  const { 
    isSpinning, 
    winningNumber, 
    gamePhase, 
    spinWheel, 
    ballPosition,
    setBallPosition 
  } = useRoulette();
  
  const { playHit } = useAudio();
  
  // Load textures
  const woodTexture = useTexture('/textures/wood.jpg');
  
  // Wheel state
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballAngle, setBallAngle] = useState(0);
  const [ballRadius, setBallRadius] = useState(4);
  const [spinVelocity, setSpinVelocity] = useState(0);
  const [ballVelocity, setBallVelocity] = useState(0);

  // Roulette numbers in European wheel order
  const rouletteNumbers = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
    24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
  ];

  // Colors for numbers
  const getNumberColor = (num: number) => {
    if (num === 0) return '#00aa00';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(num) ? '#cc0000' : '#000000';
  };

  // Create wheel geometry
  const createWheel = () => {
    const wheelGroup = new THREE.Group();
    
    // Main wheel base
    const wheelGeometry = new THREE.CylinderGeometry(5, 5, 0.3, 64);
    const wheelMaterial = new THREE.MeshPhongMaterial({ 
      map: woodTexture,
      color: '#8B4513'
    });
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.receiveShadow = true;
    wheel.castShadow = true;
    wheelGroup.add(wheel);

    // Create number pockets
    rouletteNumbers.forEach((number, index) => {
      const angle = (index / rouletteNumbers.length) * Math.PI * 2;
      
      // Pocket geometry
      const pocketGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8);
      const pocketMaterial = new THREE.MeshPhongMaterial({ 
        color: getNumberColor(number),
        transparent: true,
        opacity: 0.9
      });
      const pocket = new THREE.Mesh(pocketGeometry, pocketMaterial);
      
      const radius = 4;
      pocket.position.x = Math.cos(angle) * radius;
      pocket.position.z = Math.sin(angle) * radius;
      pocket.position.y = 0.2;
      
      wheelGroup.add(pocket);
      
      // Number text (simplified as small spheres for now)
      const numberGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      const numberMaterial = new THREE.MeshPhongMaterial({ 
        color: number === 0 ? '#ffffff' : (getNumberColor(number) === '#cc0000' ? '#ffffff' : '#ffffff')
      });
      const numberMesh = new THREE.Mesh(numberGeometry, numberMaterial);
      numberMesh.position.copy(pocket.position);
      numberMesh.position.y += 0.15;
      wheelGroup.add(numberMesh);
    });

    // Outer rim
    const rimGeometry = new THREE.TorusGeometry(5.2, 0.2, 8, 64);
    const rimMaterial = new THREE.MeshPhongMaterial({ color: '#ffd700' });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotateX(Math.PI / 2);
    rim.castShadow = true;
    wheelGroup.add(rim);

    return wheelGroup;
  };

  // Create ball
  const createBall = () => {
    const ballGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const ballMaterial = new THREE.MeshPhongMaterial({ 
      color: '#ffffff',
      shininess: 100
    });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.castShadow = true;
    return ball;
  };

  // Initialize wheel and ball
  useEffect(() => {
    if (wheelRef.current) {
      // Clear existing children
      wheelRef.current.clear();
      
      // Add wheel
      const wheel = createWheel();
      wheelRef.current.add(wheel);
      
      // Add ball
      const ball = createBall();
      ballRef.current = ball;
      wheelRef.current.add(ball);
    }
  }, [woodTexture]);

  // Handle spinning
  useEffect(() => {
    if (isSpinning && spinVelocity === 0) {
      // Start spin
      const newSpinVelocity = 0.3 + Math.random() * 0.2; // Random spin speed
      const newBallVelocity = -0.5 - Math.random() * 0.3; // Ball spins opposite direction
      
      setSpinVelocity(newSpinVelocity);
      setBallVelocity(newBallVelocity);
      setBallRadius(4.8); // Ball starts on outer edge
    }
  }, [isSpinning]);

  // Animation loop
  useFrame((state, delta) => {
    if (!wheelRef.current || !ballRef.current) return;

    if (isSpinning) {
      // Update wheel rotation
      setWheelRotation(prev => prev + spinVelocity * delta * 60);
      
      // Update ball
      setBallAngle(prev => prev + ballVelocity * delta * 60);
      
      // Gradually slow down
      setSpinVelocity(prev => Math.max(0, prev - delta * 0.5));
      setBallVelocity(prev => prev * 0.995);
      
      // Ball gradually moves inward
      setBallRadius(prev => Math.max(1.5, prev - delta * 2));
      
      // Check if spin should stop
      if (spinVelocity < 0.01 && Math.abs(ballVelocity) < 0.01) {
        // Calculate winning number
        const normalizedAngle = ((wheelRotation + ballAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const segmentSize = (Math.PI * 2) / rouletteNumbers.length;
        const segmentIndex = Math.floor(normalizedAngle / segmentSize);
        const winning = rouletteNumbers[segmentIndex];
        
        // Stop spinning and set winner
        setSpinVelocity(0);
        setBallVelocity(0);
        
        // Play sound
        playHit();
        
        // Update game state
        useRoulette.getState().setWinningNumber(winning);
        useRoulette.getState().endSpin();
      }
    }

    // Update visual positions
    if (wheelRef.current.children.length > 0) {
      wheelRef.current.children[0].rotation.y = wheelRotation;
    }
    
    if (ballRef.current) {
      ballRef.current.position.x = Math.cos(ballAngle) * ballRadius;
      ballRef.current.position.z = Math.sin(ballAngle) * ballRadius;
      ballRef.current.position.y = 0.5;
      
      // Update store with ball position
      setBallPosition({
        x: ballRef.current.position.x,
        y: ballRef.current.position.y,
        z: ballRef.current.position.z
      });
    }
  });

  return (
    <group ref={wheelRef} position={[0, 0, 0]}>
      {/* Wheel and ball are created in useEffect */}
    </group>
  );
};

export default RouletteWheel;
