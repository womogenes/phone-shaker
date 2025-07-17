/*
  Shake is detected as crossing high threshold then dipping
  below low threshold (hysteresis)
*/

export const SHAKE_HIGH_THRESH = 40;
export const SHAKE_LOW_THRESH = 35;

/**
 * Create a simplified shake detector
 * @returns {Object} Shake detector with detectShake method and state
 */
export function createShakeDetector() {
  let crossedHighThresh = false;

  return {
    /**
     * Detect shakes using simple magnitude threshold
     * @param {Object} accelerationData - Acceleration data {x, y, z}
     * @param {number} currentTime - Current timestamp
     * @returns {Object|null} Shake result with motion magnitude, or null if no shake
     */
    detectShake(accelerationData, currentTime) {
      const magnitude = calculateAccelerationMagnitude(accelerationData);

      // Downward pass: crossed low threshold, count shake
      if (magnitude <= SHAKE_LOW_THRESH && crossedHighThresh) {
        crossedHighThresh = false;
        return { motionMagnitude };
      }

      // Upward pass: crossed high threshold
      if (magnitude >= SHAKE_HIGH_THRESH) {
        crossedHighThresh = true;
      }

      return null;
    },

    // Reset: no cross high
    reset() {
      crossedHighThresh = false;
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
