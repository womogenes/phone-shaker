/**
 * Audio management for the phone shaker game
 * Handles sound effects, audio context, and iOS audio requirements
 */

import { soundEnabled } from './settings.js';
import { get } from 'svelte/store';

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

      // Set up oscillator
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // Higher pitch for click
      oscillator.type = 'square'; // Sharp, digital edge

      const now = audioContext.currentTime;

      // Click envelope: very short attack and faster decay
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.6, now + 0.001); // Instant attack
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.02); // Faster decay

      oscillator.start(now);
      oscillator.stop(now + 0.025); // Total duration just 25ms
    } catch (error) {
      console.log('Shake sound playback error:', error);
    }
  };
}

/**
 * Play the game end sound
 */
export async function playGameEndSound() {
  if (gameEndSound && get(soundEnabled)) {
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
  if (shakeSound && get(soundEnabled)) {
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
