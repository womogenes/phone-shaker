/**
 * Centralized settings management for the phone shaker game
 * Uses Svelte stores with localStorage persistence
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Initialize settings from localStorage or defaults
function createPersistedStore(key, defaultValue) {
  const initial = browser
    ? JSON.parse(localStorage.getItem(key) ?? JSON.stringify(defaultValue))
    : defaultValue;

  const store = writable(initial);

  // Subscribe to changes and persist to localStorage
  if (browser) {
    store.subscribe((value) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  }

  return store;
}

// Create reactive settings stores
export const soundEnabled = createPersistedStore('phone-shaker-sound', true);
export const hapticEnabled = createPersistedStore('phone-shaker-haptics', true);

// Utility functions for external modules that prefer function calls
export function setSoundEnabled(enabled) {
  soundEnabled.set(enabled);
}

export function getSoundEnabled() {
  let value;
  soundEnabled.subscribe((v) => (value = v))();
  return value;
}

export function setHapticEnabled(enabled) {
  hapticEnabled.set(enabled);
}

export function getHapticEnabled() {
  let value;
  hapticEnabled.subscribe((v) => (value = v))();
  return value;
}

// For easy access to all settings
export function getSettings() {
  return {
    soundEnabled: getSoundEnabled(),
    hapticEnabled: getHapticEnabled(),
  };
}
