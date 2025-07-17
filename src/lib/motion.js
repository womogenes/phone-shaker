/**
 * Device motion detection and permission management
 * Handles cross-platform motion API access and permission requests
 */

/**
 * Check if device motion is supported
 * @returns {boolean} True if DeviceMotionEvent is supported
 */
export function isMotionSupported() {
  return typeof DeviceMotionEvent !== 'undefined';
}

/**
 * Check if motion permission is required (iOS Safari)
 * @returns {boolean} True if permission request is required
 */
export function isPermissionRequired() {
  return typeof DeviceMotionEvent !== 'undefined' && 
         typeof DeviceMotionEvent.requestPermission === 'function';
}

/**
 * Request motion permission from the user
 * @returns {Promise<string>} Permission status ('granted', 'denied', or 'default')
 */
export async function requestMotionPermission() {
  if (!isPermissionRequired()) {
    return 'granted'; // No permission needed on this platform
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
export function getPermissionStatus() {
  if (!isMotionSupported()) {
    return 'not-supported';
  }
  
  if (isPermissionRequired()) {
    return 'needs-user-gesture';
  }
  
  return 'not-required';
}

/**
 * Create a motion detector that manages event listeners and testing
 * @param {Function} onMotion - Callback function for motion events
 * @param {Function} onError - Callback function for errors
 * @returns {Object} Motion detector with setup and cleanup methods
 */
export function createMotionDetector(onMotion, onError) {
  let isSetup = false;
  let motionHandler = null;
  let testHandler = null;
  let testTimeout = null;

  return {
    /**
     * Set up motion detection with testing
     */
    setup() {
      if (isSetup) return;

      let testCount = 0;
      
      // Test handler to verify motion events work
      testHandler = (event) => {
        testCount++;
        
        if (testCount >= 3) {
          // Motion events are working, switch to real handler
          window.removeEventListener('devicemotion', testHandler);
          
          motionHandler = onMotion;
          window.addEventListener('devicemotion', motionHandler);
          
          isSetup = true;
          
          if (testTimeout) {
            clearTimeout(testTimeout);
            testTimeout = null;
          }
        }
      };

      window.addEventListener('devicemotion', testHandler);

      // If no motion events after 5 seconds, show error
      testTimeout = setTimeout(() => {
        if (testCount === 0) {
          this.cleanup();
          onError('No motion events received. Motion sensors may not be available.');
        }
      }, 5000);
    },

    /**
     * Clean up motion detection
     */
    cleanup() {
      if (testHandler) {
        window.removeEventListener('devicemotion', testHandler);
        testHandler = null;
      }
      
      if (motionHandler) {
        window.removeEventListener('devicemotion', motionHandler);
        motionHandler = null;
      }
      
      if (testTimeout) {
        clearTimeout(testTimeout);
        testTimeout = null;
      }
      
      isSetup = false;
    },

    /**
     * Check if motion detection is set up
     * @returns {boolean}
     */
    isSetup() {
      return isSetup;
    }
  };
}

/**
 * Extract acceleration data from a motion event
 * @param {DeviceMotionEvent} event - Motion event
 * @returns {Object|null} Acceleration object with x, y, z properties or null if unavailable
 */
export function extractAcceleration(event) {
  const acc = event.accelerationIncludingGravity;
  
  if (!acc) {
    return null;
  }
  
  return {
    x: acc.x || 0,
    y: acc.y || 0,
    z: acc.z || 0
  };
}