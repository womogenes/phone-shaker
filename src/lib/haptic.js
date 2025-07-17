/**
 * Haptic feedback and animations for the phone shaker game
 * Handles vibration patterns and visual feedback
 */

import { animate } from 'animejs';
import { hapticEnabled } from './settings.js';
import { get } from 'svelte/store';

/**
 * Trigger haptic feedback (vibration)
 * @param {number} intensity - Feedback intensity (0.5 for shake, 1 for game end)
 */
export function triggerHapticFeedback(intensity = 1) {
  if (get(hapticEnabled) && typeof navigator !== 'undefined' && navigator.vibrate) {
    if (intensity === 1) {
      // Game end vibration pattern
      navigator.vibrate([100, 50, 100, 50, 200]);
    } else {
      // Subtle vibration for shakes
      navigator.vibrate(50);
    }
  }
}

/**
 * Trigger shake animation on phone element
 * @param {HTMLElement} phoneElement - The phone element to animate
 */
export function triggerPhoneAnimation(phoneElement) {
  if (phoneElement) {
    animate(phoneElement, {
      scale: [1, 1.1, 1],
      rotate: [0, 5, -5, 0],
      duration: 200,
      easing: 'easeOutElastic(1, .5)',
    });
  }
}

/**
 * Trigger animation on counter element
 * @param {HTMLElement} animationElement - The element to animate
 */
export function triggerCounterAnimation(animationElement) {
  if (animationElement) {
    animate(animationElement, {
      scale: [1, 1.3, 1],
      opacity: [0.5, 1, 0.5],
      duration: 300,
      easing: 'easeOutQuad',
    });
  }
}

/**
 * Trigger combined shake feedback (animation + haptic)
 * @param {HTMLElement} phoneElement - The phone element to animate
 * @param {HTMLElement} animationElement - The counter element to animate
 */
export function triggerShakeFeedback() {
  triggerHapticFeedback(0.5);
}

/**
 * Trigger game end feedback
 */
export function triggerGameEndFeedback() {
  triggerHapticFeedback(1);
}
