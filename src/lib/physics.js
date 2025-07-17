/**
 * Physics-based shake detection for the phone shaker game
 * Implements a state machine approach to accurately detect physical shaking motions
 */

// Tuned thresholds based on real device testing
export const SHAKE_THRESHOLD = 15; // Minimum acceleration to start a shake
export const SHAKE_END_THRESHOLD = 8; // Acceleration below this ends the shake
export const MIN_SHAKE_DURATION = 10; // Minimum shake duration (ms)
export const SHAKE_COOLDOWN = 10; // Minimum time between shakes (ms)
export const HISTORY_SIZE = 10; // Number of acceleration samples to keep

/**
 * Create a new shake detector instance
 * @returns {Object} Shake detector with state and methods
 */
export function createShakeDetector() {
  let state = 'idle'; // 'idle', 'shaking', 'cooldown'
  let startTime = 0;
  let lastShakeTime = 0;
  let accelerationHistory = [];

  return {
    /**
     * Get current shake detection state
     * @returns {string} Current state
     */
    getState() {
      return state;
    },

    /**
     * Get acceleration history
     * @returns {Array<number>} Array of recent acceleration magnitudes
     */
    getHistory() {
      return [...accelerationHistory];
    },

    /**
     * Reset the shake detector to initial state
     */
    reset() {
      state = 'idle';
      startTime = 0;
      lastShakeTime = 0;
      accelerationHistory = [];
    },

    /**
     * Process acceleration data and detect shakes
     * @param {number} magnitude - Acceleration magnitude
     * @param {number} currentTime - Current timestamp
     * @returns {boolean} True if a shake was detected
     */
    detectShake(magnitude, currentTime) {
      // Add to history for trend analysis
      accelerationHistory.push(magnitude);
      if (accelerationHistory.length > HISTORY_SIZE) {
        accelerationHistory.shift();
      }

      // Physics-based shake detection state machine
      switch (state) {
        case 'idle':
          // Look for start of shake: high acceleration
          if (magnitude > SHAKE_THRESHOLD) {
            // Ensure minimum time since last shake (prevent double-counting)
            if (currentTime - lastShakeTime > SHAKE_COOLDOWN) {
              state = 'shaking';
              startTime = currentTime;
            }
          }
          return false;

        case 'shaking':
          // Look for end of shake: sustained low acceleration
          if (magnitude < SHAKE_END_THRESHOLD) {
            const shakeDuration = currentTime - startTime;

            // Ensure shake lasted minimum duration (filter out noise)
            if (shakeDuration > MIN_SHAKE_DURATION) {
              // Valid shake detected!
              lastShakeTime = currentTime;
              state = 'cooldown';
              return true;
            } else {
              // Too short, probably noise
              state = 'idle';
            }
          }
          // Stay in shaking state while acceleration remains high
          return false;

        case 'cooldown':
          // Brief cooldown to prevent immediate re-triggering
          if (currentTime - lastShakeTime > SHAKE_COOLDOWN / 2) {
            state = 'idle';
          }
          return false;

        default:
          return false;
      }
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
    acceleration.z * acceleration.z
  );
}

/**
 * Validate acceleration data
 * @param {Object} acceleration - Acceleration object
 * @returns {boolean} True if acceleration data is valid
 */
export function isValidAcceleration(acceleration) {
  return acceleration &&
    typeof acceleration.x === 'number' &&
    typeof acceleration.y === 'number' &&
    typeof acceleration.z === 'number' &&
    !isNaN(acceleration.x) &&
    !isNaN(acceleration.y) &&
    !isNaN(acceleration.z);
}