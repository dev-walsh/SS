import React, { useEffect } from 'react';
import { useAudio } from '../../lib/stores/useAudio';
import { useRoulette } from '../../lib/stores/useRoulette';

const SoundManager: React.FC = () => {
  const { 
    setBackgroundMusic, 
    setHitSound, 
    setSuccessSound,
    isMuted 
  } = useAudio();
  
  const { gamePhase, winningNumber } = useRoulette();

  useEffect(() => {
    // Load audio files
    const backgroundMusic = new Audio('/sounds/background.mp3');
    const hitSound = new Audio('/sounds/hit.mp3');
    const successSound = new Audio('/sounds/success.mp3');

    // Configure background music
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.3;

    // Configure sound effects
    hitSound.volume = 0.5;
    successSound.volume = 0.7;

    // Set in store
    setBackgroundMusic(backgroundMusic);
    setHitSound(hitSound);
    setSuccessSound(successSound);

    // Cleanup
    return () => {
      backgroundMusic.pause();
      hitSound.pause();
      successSound.pause();
    };
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  // Handle background music based on game phase
  useEffect(() => {
    const backgroundMusic = useAudio.getState().backgroundMusic;
    
    if (backgroundMusic) {
      if (!isMuted && gamePhase !== 'waiting') {
        backgroundMusic.play().catch(error => {
          console.log("Background music play prevented:", error);
        });
      } else {
        backgroundMusic.pause();
      }
    }
  }, [gamePhase, isMuted]);

  // Play success sound when winning
  useEffect(() => {
    if (gamePhase === 'result' && winningNumber !== null) {
      const { playSuccess } = useAudio.getState();
      setTimeout(() => {
        playSuccess();
      }, 500); // Delay for effect
    }
  }, [gamePhase, winningNumber]);

  return null; // This component doesn't render anything
};

export default SoundManager;
