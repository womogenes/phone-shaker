/**
 * Simple device motion detection
 */

import { mobileCheck } from '$lib/utils.js';

/**
 * Check if device motion is supported
 * @returns {boolean} True if DeviceMotionEvent is supported
 */
export function isMotionSupported() {
  if (!mobileCheck()) return false;
  return typeof DeviceMotionEvent !== 'undefined';
}

/**
 * Check if motion permission is required (iOS Safari)
 * @returns {boolean} True if permission request is required
 */
export function isPermissionRequired() {
  return (
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof DeviceMotionEvent.requestPermission === 'function'
  );
}

/**
 * Request motion permission from the user
 * @returns {Promise<string>} Permission status ('granted', 'denied', or 'default')
 */
export async function requestMotionPermission() {
  if (!isPermissionRequired()) {
    return 'granted';
  }

  try {
    const response = await DeviceMotionEvent.requestPermission();
    return response;
  } catch (error) {
    console.error('Permission request failed:', error);
    throw error;
  }
}

/**
 * Get the current permission status
 * @returns {string} Permission status description
 */
export async function getPermissionStatus() {
  if (!isMotionSupported()) {
    return 'not-supported';
  }

  if (isPermissionRequired() && !requestMotionPermission()) {
    return 'needs-user-gesture';
  }

  return 'not-required';
}

/**
 * Create a simple motion detector
 * @param {Function} onMotion - Callback function for motion events
 * @param {Function} onError - Callback function for errors
 * @returns {Object} Motion detector with setup and cleanup methods
 */
export function createMotionDetector(onMotion, onError) {
  let motionHandler = null;

  return {
    setup() {
      if (motionHandler) return;

      motionHandler = (event) => {
        // Use acceleration (without gravity) if available, fallback to accelerationIncludingGravity
        const acc = event.acceleration || event.accelerationIncludingGravity;

        if (acc && acc.x !== null && acc.y !== null && acc.z !== null) {
          onMotion({
            x: acc.x || 0,
            y: acc.y || 0,
            z: acc.z || 0,
            hasGravity: !event.acceleration, // true if using accelerationIncludingGravity
          });
        }
      };

      window.addEventListener('devicemotion', motionHandler);
    },

    cleanup() {
      if (motionHandler) {
        window.removeEventListener('devicemotion', motionHandler);
        motionHandler = null;
      }
    },
  };
}
