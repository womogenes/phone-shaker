/**
 * Audio management for the phone shaker game
 * Handles sound effects, audio context, and iOS audio requirements
 */

let audioContext = null;
let gameEndSound = null;
let shakeSound = null;

/**
 * Initialize the audio context
 * @returns {AudioContext|null} The audio context or null if not supported
 */
export function initializeAudioContext() {
  if (typeof window !== 'undefined' && 'AudioContext' in window) {
    audioContext = new AudioContext();
    createGameEndSound();
    createShakeSound();
    return audioContext;
  }
  return null;
}

/**
 * Get the current audio context
 * @returns {AudioContext|null}
 */
export function getAudioContext() {
  return audioContext;
}

/**
 * Create the game end sound effect (success melody)
 */
function createGameEndSound() {
  if (!audioContext) return;

  gameEndSound = async () => {
    try {
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio playback error:', error);
    }
  };
}

/**
 * Create the shake sound effect (short metronome click)
 */
function createShakeSound() {
  if (!audioContext) return;

  shakeSound = async () => {
    try {
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Short metronome click: brief, sharp, percussive
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // Clean 1kHz tone
      oscillator.type = 'square'; // Square wave for sharper click

      // Very short, sharp attack and immediate decay
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.005); // Instant attack
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.03); // Quick decay

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.03); // Very short duration
    } catch (error) {
      console.log('Shake sound playback error:', error);
    }
  };
}

/**
 * Play the game end sound
 */
export async function playGameEndSound() {
  if (gameEndSound) {
    try {
      await gameEndSound();
    } catch (error) {
      console.log('Could not play sound:', error);
    }
  }
}

/**
 * Play the shake sound
 */
export async function playShakeSound() {
  if (shakeSound) {
    try {
      await shakeSound();
    } catch (error) {
      console.log('Could not play shake sound:', error);
    }
  }
}

/**
 * Initialize audio context from user gesture (iOS requirement)
 */
export async function initAudioFromUserGesture() {
  if (!audioContext) return;

  try {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Play a silent sound to "unlock" audio on iOS
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.01);

    console.debug('Audio context initialized');
  } catch (error) {
    console.error('Audio initialization error:', error);
  }
}
