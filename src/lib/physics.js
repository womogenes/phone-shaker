/*
  Shake is detected as a peak higher than low threshold
  Peak means low -> high -> low
*/

export const SHAKE_LOW_THRESH = 15;

/**
 * Create a simplified shake detector
 * @returns {Object} Shake detector with detectShake method and state
 */
export function createShakeDetector() {
  let magHistory = [];

  return {
    /**
     * Detect shakes using simple magnitude threshold
     * @param {Object} accelerationData - Acceleration data {x, y, z}
     * @param {number} currentTime - Current timestamp
     * @returns {Object|null} Shake result with motion magnitude, or null if no shake
     */
    detectShake(accelerationData, currentTime) {
      const magnitude = calculateAccelerationMagnitude(accelerationData);

      let shakeResult = null;

      magHistory.push(magnitude);
      let n = magHistory.length;
      if (
        n >= 3 &&
        magHistory[n - 1] > magHistory[n - 2] &&
        magHistory[n - 3] > magHistory[n - 2] &&
        magnitude >= SHAKE_LOW_THRESH
      ) {
        shakeResult = { magnitude };
      }

      return shakeResult;
    },

    // Reset: no cross high
    reset() {
      magHistory = [];
    },

    /**
     * Get debug information
     * @returns {Object} Debug state
     */
    getDebugInfo() {
      return {
        crossedHighThresh,
      };
    },
  };
}

/**
 * Calculate acceleration magnitude from x, y, z components
 * Physics: |a| = sqrt(ax² + ay² + az²)
 * @param {Object} acceleration - Acceleration object with x, y, z properties
 * @returns {number} Acceleration magnitude
 */
export function calculateAccelerationMagnitude(acceleration) {
  return Math.sqrt(
    acceleration.x * acceleration.x +
      acceleration.y * acceleration.y +
      acceleration.z * acceleration.z,
  );
}

/**
 * Validate acceleration data
 * @param {Object} acceleration - Acceleration object
 * @returns {boolean} True if acceleration data is valid
 */
export function isValidAcceleration(acceleration) {
  return (
    acceleration &&
    typeof acceleration.x === 'number' &&
    typeof acceleration.y === 'number' &&
    typeof acceleration.z === 'number' &&
    !isNaN(acceleration.x) &&
    !isNaN(acceleration.y) &&
    !isNaN(acceleration.z)
  );
}
