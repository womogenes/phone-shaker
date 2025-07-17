<script>
  import * as Dialog from '$lib/components/ui/dialog';
  import { onDestroy, onMount } from 'svelte';

  // Import modular components
  import {
    initAudioFromUserGesture,
    initializeAudioContext,
    playGameEndSound,
    playShakeSound,
  } from '$lib/audio.js';
  import { sendAccelerationHistory } from '$lib/data.js';
  import { createShakeDetector, isValidAcceleration } from '$lib/physics.js';
  import { triggerGameEndFeedback, triggerShakeFeedback } from '$lib/haptic.js';
  import {
    createMotionDetector,
    getPermissionStatus,
    isMotionSupported,
    isPermissionRequired,
    requestMotionPermission,
  } from '$lib/motion.js';
  import { switchToDarkMode, switchToLightMode } from '$lib/theme.js';

  import Button from '@/components/ui/button/button.svelte';

  // Game state (pure Svelte 5 reactive state)
  let gameState = $state('idle'); // 'idle', 'playing', 'finished'
  let shakeCount = $state(0);
  let timeLeft = $state(0);
  let currentScore = $state(0);
  let highScore = $state(0);

  // UI state
  let animationElement = $state();
  let errorMessage = $state('');
  let showErrorModal = $state(false);
  let debugInfo = $state('');
  let motionSupported = $state(false);
  let permissionStatus = $state('');
  let acceleration = $state({ x: 0, y: 0, z: 0 });
  let accelerationHistory = $state([]);
  let startTime = $state(0);

  // Game systems
  let motionDetector = null;
  let shakeDetector = null;
  let timerInterval = null;

  resetGame();

  onMount(() => {
    // Load high score from localStorage
    const savedHighScore = localStorage.getItem('high-score');
    if (savedHighScore) {
      highScore = parseInt(savedHighScore, 10);
    }

    // Initialize shake detector
    shakeDetector = createShakeDetector();

    // Initialize audio system
    initializeAudioContext();

    // Check motion support
    checkMotionSupport();
  });

  onDestroy(() => {
    // Clean up timers
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    if (motionDetector) {
      motionDetector.cleanup();
    }
  });

  async function checkMotionSupport() {
    debugInfo = 'Checking motion support...';

    if (!isMotionSupported()) {
      showError('DeviceMotion not supported on this device/browser');
      return;
    }

    motionSupported = true;
    permissionStatus = await getPermissionStatus();

    if (permissionStatus === 'not-required') {
      debugInfo = 'no permission required, setting up motion detection...';
      setupMotionDetection();
    } else {
      debugInfo = 'permission request required, will be requested when starting game';
    }
  }

  function setupMotionDetection() {
    debugInfo = 'setting up motion detection...';

    motionDetector = createMotionDetector(handleMotion, showError);
    motionDetector.setup();

    debugInfo = 'motion detection ready';
  }

  function handleMotion(accelerationData) {
    if (gameState !== 'playing') return;

    if (!isValidAcceleration(accelerationData)) {
      debugInfo = 'No acceleration data available';
      return;
    }

    const currentTime = window.performance.now() - startTime; // seconds since page load
    acceleration = accelerationData;

    const { x, y, z } = accelerationData;
    accelerationHistory.push([currentTime, x, y, z]);

    // Use the unified shake detector
    const shakeResult = shakeDetector.detectShake(accelerationData, currentTime);

    if (shakeResult) {
      // Shake detected!
      shakeCount++;

      // Trigger all feedback
      triggerShakeFeedback();
      playShakeSound();

      debugInfo = `motion: ${shakeResult.motionMagnitude.toFixed(1)} (total: ${shakeCount}`;
    }
  }

  async function startGame() {
    // Initialize audio from user gesture (iOS requirement)
    await initAudioFromUserGesture();

    // Request motion permission if needed
    if (permissionStatus === 'needs-user-gesture') {
      try {
        debugInfo = 'requesting motion permission...';
        const response = await requestMotionPermission();
        permissionStatus = response;

        if (response === 'granted') {
          setupMotionDetection();
        } else {
          showError(`motion permission denied: ${response}`);
          return;
        }
      } catch (error) {
        showError(`permission request failed: ${error.message}`);
        return;
      }
    }

    // Reset game state
    resetGame();

    // Switch to dark mode
    switchToDarkMode();

    gameState = 'playing';

    // Reset shake detection
    if (shakeDetector) shakeDetector.reset();

    // Start game timer
    startTime = window.performance.now();
    timerInterval = setInterval(() => {
      timeLeft--;
      debugInfo = `game in progress: ${timeLeft}s remaining`;

      if (timeLeft <= 0) endGame();
    }, 1000);
  }

  async function endGame() {
    // Stop timer
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    gameState = 'finished';
    currentScore = shakeCount;

    // Check for new high score
    const isNewHighScore = currentScore > highScore;
    if (isNewHighScore) {
      highScore = currentScore;
      localStorage.setItem('high-score', highScore.toString());
    }

    // Switch back to light mode
    switchToLightMode();

    // Play game end sound and haptic feedback
    playGameEndSound();
    triggerGameEndFeedback();

    // Send data to server for auditing
    await sendAccelerationHistory(accelerationHistory);

    debugInfo = `game ended! score: ${currentScore}${isNewHighScore ? ' (new high score!)' : ''}`;
  }

  function resetGame() {
    // Stop timer if running
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    // Reset all state
    gameState = 'idle';
    shakeCount = 0;
    timeLeft = 2;
    currentScore = 0;
    if (shakeDetector) {
      shakeDetector.reset();
    }
    acceleration = { x: 0, y: 0, z: 0 };

    switchToLightMode();
    debugInfo = 'game reset';
  }

  function showError(message) {
    errorMessage = message;
    showErrorModal = true;
    debugInfo = `Error: ${message}`;
  }

  async function retryPermission() {
    showErrorModal = false;

    if (isPermissionRequired()) {
      try {
        const response = await requestMotionPermission();
        permissionStatus = response;

        if (response === 'granted') {
          setupMotionDetection();
        }
      } catch (error) {
        showError(`Permission request failed: ${error.message}`);
      }
    } else {
      checkMotionSupport();
    }
  }
</script>

<div class="flex h-full items-center justify-center">
  <div class="mx-auto w-full max-w-md px-6 pt-10 pb-4">
    <div class="mb-8">
      <h1 class="text-foreground mb-4 text-5xl leading-11 font-black tracking-tight">
        how fast can you shake your phone?
      </h1>
    </div>

    <div class="mb-8">
      <div class="mb-6 flex items-center justify-between">
        <div class="text-muted-foreground text-sm">
          high score: <span class="text-foreground font-mono">{highScore}</span>
        </div>
        <div class="text-muted-foreground text-sm">
          time: <span class="text-foreground font-mono">{timeLeft}s</span>
        </div>
      </div>

      <div class="flex flex-col items-center">
        <div class="text-foreground mb-0 font-mono text-8xl font-black">
          {shakeCount}
        </div>
        <div class="text-muted-foreground text-sm">shakes</div>
      </div>
    </div>

    <div class="mb-4 flex h-[84px] flex-col space-y-2">
      {#if gameState === 'idle'}
        <Button onclick={startGame} size="xl">START</Button>
        {#if permissionStatus === 'needs-user-gesture'}
          <p class="text-muted-foreground text-xs">tap the button to enable motion sensors</p>
        {/if}
      {:else if gameState === 'playing'}
        <div class="flex h-14 flex-col items-center">
          <div class="font-semibold">shake it like it's hot</div>
          <div class="text-muted-foreground text-sm">keep shaking your phone</div>
        </div>
      {:else if gameState === 'finished'}
        <div>
          <div class="text-sm"><b>game over</b> (you shook {currentScore} times)</div>
          {#if currentScore > highScore}
            <div class="text-foreground font-semibold">new high score!</div>
          {/if}
        </div>
        <Button onclick={resetGame} size="xl">PLAY AGAIN</Button>
      {/if}
    </div>

    <div class="text-muted-foreground mt-8 text-xs tabular-nums">
      <!-- Debug info -->
      <div class="text-muted-foreground mt-4 flex flex-col gap-1 text-xs">
        <p>debug: {debugInfo}</p>
        <p>motion: {motionSupported ? 'supported' : 'not supported'}</p>
        <p>permission: {permissionStatus}</p>
      </div>
    </div>
  </div>
</div>

<!-- Error Modal -->
<Dialog.Root bind:open={showErrorModal}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>motion detection error</Dialog.Title>
      <Dialog.Description>
        {errorMessage}
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer class="flex flex-col gap-2 sm:flex-row sm:justify-end sm:space-x-2">
      <button
        onclick={retryPermission}
        class="bg-primary text-primary-foreground hover:bg-primary/80 px-4 py-2 transition-colors"
      >
        RETRY
      </button>
      <Dialog.Close asChild let:builder>
        <button
          use:builder.action
          {...builder}
          class="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 transition-colors"
        >
          CLOSE
        </button>
      </Dialog.Close>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
