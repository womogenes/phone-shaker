/**
 * Physics-based shake detection for the phone shaker game
 * Implements peak detection to accurately count directional changes
 */

// Tuned thresholds for optimal shake detection
export const MOTION_THRESHOLD = 2.0; // Minimum motion to count as shake
export const PEAK_COOLDOWN = 100; // ms between peaks

/**
 * Create a peak-detection shake detector
 * @returns {Object} Shake detector with detectShake method and state
 */
export function createShakeDetector() {
  let lastAccelMagnitude = 0;
  let recentPeaks = [];

  return {
    /**
     * Detect shakes using peak detection algorithm
     * @param {Object} accelerationData - Acceleration data {x, y, z, isLinear}
     * @param {number} currentTime - Current timestamp
     * @returns {Object|null} Shake result with motion magnitude, or null if no shake
     */
    detectShake(accelerationData, currentTime) {
      const magnitude = calculateAccelerationMagnitude(accelerationData);
      
      // Calculate motion magnitude (remove gravity if needed)
      const motionMagnitude = accelerationData.hasGravity 
        ? Math.abs(magnitude - 9.8) // Remove gravity
        : magnitude; // Already gravity-free

      // Clean up old peaks (remove peaks older than 1 second)
      recentPeaks = recentPeaks.filter(time => currentTime - time < 1000);

      // Detect peaks: current motion is high AND previous was low
      const isMotionSpike = motionMagnitude > MOTION_THRESHOLD && lastAccelMagnitude <= MOTION_THRESHOLD;
      const enoughTimeSinceLastPeak = recentPeaks.length === 0 || 
        currentTime - recentPeaks[recentPeaks.length - 1] > PEAK_COOLDOWN;

      let shakeDetected = false;
      if (isMotionSpike && enoughTimeSinceLastPeak) {
        recentPeaks.push(currentTime);
        shakeDetected = true;
      }

      lastAccelMagnitude = motionMagnitude;

      return shakeDetected ? {
        motionMagnitude,
        sensorType: accelerationData.hasGravity ? 'motion+gravity' : 'motion-only'
      } : null;
    },

    /**
     * Reset the shake detector state
     */
    reset() {
      lastAccelMagnitude = 0;
      recentPeaks = [];
    },

    /**
     * Get debug information
     * @returns {Object} Debug state
     */
    getDebugInfo() {
      return {
        lastMagnitude: lastAccelMagnitude,
        recentPeaksCount: recentPeaks.length
      };
    }
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
