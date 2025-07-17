/**
 * Game state management and logic for the phone shaker game
 * Handles game lifecycle, scoring, and persistence
 */

const HIGH_SCORE_KEY = 'phoneShaker-highScore';

/**
 * Create a new game manager instance
 * @returns {Object} Game manager with state and methods
 */
export function createGameManager() {
  let gameState = 'idle'; // 'idle', 'playing', 'finished'
  let shakeCount = 0;
  let timeLeft = 10;
  let currentScore = 0;
  let highScore = 0;
  let timerInterval = null;

  // Load high score from localStorage (browser only)
  if (typeof window !== 'undefined' && window.localStorage) {
    const savedHighScore = localStorage.getItem(HIGH_SCORE_KEY);
    if (savedHighScore) {
      highScore = parseInt(savedHighScore, 10);
    }
  }

  return {
    /**
     * Get current game state
     * @returns {Object} Current game state
     */
    getState() {
      return {
        gameState,
        shakeCount,
        timeLeft,
        currentScore,
        highScore
      };
    },

    /**
     * Get current shake count
     * @returns {number}
     */
    getShakeCount() {
      return shakeCount;
    },

    /**
     * Increment shake count
     * @returns {number} New shake count
     */
    incrementShakeCount() {
      shakeCount++;
      return shakeCount;
    },

    /**
     * Get current game state
     * @returns {string}
     */
    getGameState() {
      return gameState;
    },

    /**
     * Get time remaining
     * @returns {number}
     */
    getTimeLeft() {
      return timeLeft;
    },

    /**
     * Get high score
     * @returns {number}
     */
    getHighScore() {
      return highScore;
    },

    /**
     * Get current score
     * @returns {number}
     */
    getCurrentScore() {
      return currentScore;
    },

    /**
     * Start a new game
     * @param {Function} onTick - Callback for timer ticks
     * @param {Function} onGameEnd - Callback when game ends
     */
    startGame(onTick, onGameEnd) {
      gameState = 'playing';
      shakeCount = 0;
      timeLeft = 10;
      currentScore = 0;

      timerInterval = setInterval(() => {
        timeLeft--;
        
        if (onTick) {
          onTick(timeLeft);
        }
        
        if (timeLeft <= 0) {
          this.endGame(onGameEnd);
        }
      }, 1000);
    },

    /**
     * End the current game
     * @param {Function} onGameEnd - Callback when game ends
     */
    endGame(onGameEnd) {
      gameState = 'finished';
      currentScore = shakeCount;
      
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }

      // Check for new high score
      const isNewHighScore = currentScore > highScore;
      if (isNewHighScore) {
        highScore = currentScore;
        // Save to localStorage (browser only)
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(HIGH_SCORE_KEY, highScore.toString());
        }
      }

      if (onGameEnd) {
        onGameEnd({
          score: currentScore,
          highScore,
          isNewHighScore
        });
      }
    },

    /**
     * Reset game to idle state
     */
    resetGame() {
      gameState = 'idle';
      shakeCount = 0;
      timeLeft = 10;
      currentScore = 0;
      
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    },

    /**
     * Check if game is currently playing
     * @returns {boolean}
     */
    isPlaying() {
      return gameState === 'playing';
    },

    /**
     * Check if game is finished
     * @returns {boolean}
     */
    isFinished() {
      return gameState === 'finished';
    },

    /**
     * Check if game is idle
     * @returns {boolean}
     */
    isIdle() {
      return gameState === 'idle';
    },

    /**
     * Clean up any active timers
     */
    cleanup() {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }
  };
}