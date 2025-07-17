/**
 * Simplified   ke detection for the phone shaker game
 * High acceleration = shake detected
 */

// Simplified thresholds
export const SHAKE_THRESHOLD = 30; // Strong acceleration threshold
export const SHAKE_COOLDOWN = 50; // ms between shake detections

/**
 * Create a simplified shake detector
 * @returns {Object} Shake detector with detectShake method and state
 */
export function createShakeDetector() {
  let lastShakeTime = 0;

  return {
    /**
     * Detect shakes using simple magnitude threshold
     * @param {Object} accelerationData - Acceleration data {x, y, z, hasGravity}
     * @param {number} currentTime - Current timestamp
     * @returns {Object|null} Shake result with motion magnitude, or null if no shake
     */
    detectShake(accelerationData, currentTime) {
      const magnitude = calculateAccelerationMagnitude(accelerationData);

      // Remove gravity if present
      const motionMagnitude = accelerationData.hasGravity ? Math.abs(magnitude - 9.8) : magnitude;

      // Check if enough time has passed since last shake
      const enoughTimeSinceLastShake = currentTime - lastShakeTime > SHAKE_COOLDOWN;

      // Detect shake: strong acceleration + cooldown period passed
      if (motionMagnitude > SHAKE_THRESHOLD && enoughTimeSinceLastShake) {
        lastShakeTime = currentTime;
        return {
          motionMagnitude,
          sensorType: accelerationData.hasGravity ? 'motion+gravity' : 'motion-only',
        };
      }

      return null;
    },

    /**
     * Reset the shake detector state
     */
    reset() {
      lastShakeTime = 0;
    },

    /**
     * Get debug information
     * @returns {Object} Debug state
     */
    getDebugInfo() {
      return {
        lastShakeTime,
        timeSinceLastShake: Date.now() - lastShakeTime,
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
