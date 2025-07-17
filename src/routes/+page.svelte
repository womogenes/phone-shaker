<script>
  import { onMount, onDestroy } from 'svelte';
  import * as Dialog from '$lib/components/ui/dialog';

  // Import modular components
  import {
    initializeAudioContext,
    playGameEndSound,
    playShakeSound,
    initAudioFromUserGesture,
  } from '$lib/audio.js';

  import {
    calculateAccelerationMagnitude,
    isValidAcceleration,
  } from '$lib/physics.js';

  import {
    isMotionSupported,
    isPermissionRequired,
    requestMotionPermission,
    getPermissionStatus,
    createMotionDetector,
    extractAcceleration,
  } from '$lib/motion.js';
  import { switchToDarkMode, switchToLightMode } from '$lib/theme.js';
  import { triggerShakeFeedback, triggerGameEndFeedback } from '$lib/haptic.js';

  // Game state (pure Svelte 5 reactive state)
  let gameState = $state('idle'); // 'idle', 'playing', 'finished'
  let shakeCount = $state(0);
  let timeLeft = $state(10);
  let currentScore = $state(0);
  let highScore = $state(0);
  
  // Shake detection state
  let shakeState = $state('idle'); // 'idle', 'shaking', 'cooldown'
  let lastShakeTime = $state(0);
  let shakeStartTime = $state(0);
  
  // UI state
  let phoneElement = $state();
  let animationElement = $state();
  let errorMessage = $state('');
  let showErrorModal = $state(false);
  let debugInfo = $state('');
  let motionSupported = $state(false);
  let permissionStatus = $state('');
  let acceleration = $state({ x: 0, y: 0, z: 0 });
  
  // Game systems
  let motionDetector = null;
  let timerInterval = null;

  onMount(() => {
    // Load high score from localStorage
    const savedHighScore = localStorage.getItem('phoneShaker-highScore');
    if (savedHighScore) {
      highScore = parseInt(savedHighScore, 10);
    }
    
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

  function checkMotionSupport() {
    debugInfo = 'Checking motion support...';

    if (!isMotionSupported()) {
      showError('DeviceMotionEvent is not supported on this device/browser');
      return;
    }

    motionSupported = true;
    debugInfo = 'DeviceMotionEvent supported';
    permissionStatus = getPermissionStatus();

    if (permissionStatus === 'not-required') {
      debugInfo = 'No permission required, setting up motion detection...';
      setupMotionDetection();
    } else {
      debugInfo = 'Permission request required, will be requested when starting game';
    }
  }

  function setupMotionDetection() {
    debugInfo = 'Setting up motion detection...';

    motionDetector = createMotionDetector(handleMotion, showError);
    motionDetector.setup();
  }

  function handleMotion(event) {
    if (gameState !== 'playing') return;

    const accelerationData = extractAcceleration(event);

    if (!isValidAcceleration(accelerationData)) {
      debugInfo = 'No acceleration data available';
      return;
    }

    const currentTime = Date.now();
    acceleration = accelerationData;

    // Calculate acceleration magnitude: |a| = √(ax² + ay² + az²)
    const magnitude = calculateAccelerationMagnitude(accelerationData);

    // Physics-based shake detection state machine
    const SHAKE_THRESHOLD = 15;
    const SHAKE_END_THRESHOLD = 8;
    const MIN_SHAKE_DURATION = 100;
    const SHAKE_COOLDOWN = 200;

    if (shakeState === 'idle' && magnitude > SHAKE_THRESHOLD) {
      shakeState = 'shaking';
      shakeStartTime = currentTime;
    } else if (shakeState === 'shaking' && magnitude < SHAKE_END_THRESHOLD) {
      const shakeDuration = currentTime - shakeStartTime;
      if (shakeDuration >= MIN_SHAKE_DURATION) {
        // Valid shake detected
        shakeCount++;
        shakeState = 'cooldown';
        lastShakeTime = currentTime;

        // Trigger all feedback
        triggerShakeFeedback(phoneElement, animationElement);
        playShakeSound();

        debugInfo = `Shake detected! Total: ${shakeCount}`;
      } else {
        shakeState = 'idle';
      }
    } else if (shakeState === 'cooldown' && currentTime - lastShakeTime > SHAKE_COOLDOWN) {
      shakeState = 'idle';
    }
  }

  async function startGame() {
    // Initialize audio from user gesture (iOS requirement)
    await initAudioFromUserGesture();

    // Request motion permission if needed
    if (permissionStatus === 'needs-user-gesture') {
      try {
        debugInfo = 'Requesting motion permission...';
        const response = await requestMotionPermission();
        permissionStatus = response;

        if (response === 'granted') {
          setupMotionDetection();
        } else {
          showError(`Motion permission denied: ${response}`);
          return;
        }
      } catch (error) {
        showError(`Permission request failed: ${error.message}`);
        return;
      }
    }

    // Switch to dark mode
    switchToDarkMode();

    // Reset game state
    gameState = 'playing';
    shakeCount = 0;
    timeLeft = 10;
    currentScore = 0;
    
    // Reset shake detection
    shakeState = 'idle';
    lastShakeTime = 0;
    shakeStartTime = 0;

    // Start game timer
    timerInterval = setInterval(() => {
      timeLeft--;
      debugInfo = `Game in progress: ${timeLeft}s remaining`;
      
      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }

  function endGame() {
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
      localStorage.setItem('phoneShaker-highScore', highScore.toString());
    }

    // Switch back to light mode
    switchToLightMode();

    // Play game end sound and haptic feedback
    playGameEndSound();
    triggerGameEndFeedback();

    debugInfo = `Game ended! Score: ${currentScore}${isNewHighScore ? ' (New High Score!)' : ''}`;
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
    timeLeft = 10;
    currentScore = 0;
    shakeState = 'idle';
    lastShakeTime = 0;
    shakeStartTime = 0;
    acceleration = { x: 0, y: 0, z: 0 };
    
    switchToLightMode();
    debugInfo = 'Game reset';
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

<div class="flex items-center justify-center">
  <div class="mx-auto w-full max-w-lg px-6 pt-12 pb-4 text-center">
    <div class="mb-8">
      <h1 class="text-foreground mb-2 text-3xl font-bold">Phone Shaker</h1>
      <p class="text-muted-foreground">Shake your phone as fast as you can in 10 seconds</p>
    </div>

    <div class="mb-8">
      <div class="mb-6 flex items-center justify-between">
        <div class="text-muted-foreground text-sm">
          High Score: <span class="text-foreground font-mono">{highScore}</span>
        </div>
        <div class="text-muted-foreground text-sm">
          Time: <span class="text-foreground font-mono">{timeLeft}s</span>
        </div>
      </div>

      <div
        bind:this={phoneElement}
        class="border-border bg-muted relative mx-auto mb-6 flex h-24 w-24 items-center justify-center border"
      >
        <div bind:this={animationElement} class="text-4xl">📱</div>
      </div>

      <div class="text-foreground mb-2 font-mono text-5xl font-bold">
        {shakeCount}
      </div>
      <div class="text-muted-foreground text-sm">shakes</div>
    </div>

    <div class="space-y-4">
      {#if gameState === 'idle'}
        <button
          onclick={startGame}
          class="bg-primary text-primary-foreground hover:bg-primary/80 w-full px-6 py-3 font-semibold transition-colors duration-200"
        >
          {#if permissionStatus === 'needs-user-gesture'}
            Allow Motion & Start
          {:else}
            Start Shaking
          {/if}
        </button>
        {#if permissionStatus === 'needs-user-gesture'}
          <p class="text-muted-foreground mt-2 text-xs">Tap the button to enable motion sensors</p>
        {/if}
      {:else if gameState === 'playing'}
        <div class="border-border bg-muted text-foreground border px-6 py-3">
          <div class="font-semibold">Game in Progress</div>
          <div class="text-muted-foreground text-sm">Keep shaking your phone</div>
        </div>
      {:else if gameState === 'finished'}
        <div class="border-border bg-muted text-foreground mb-4 border px-6 py-3">
          <div class="font-semibold">Game Over</div>
          <div class="text-muted-foreground text-sm">You shook {currentScore} times</div>
          {#if currentScore === highScore}
            <div class="text-foreground text-sm font-semibold">New High Score!</div>
          {/if}
        </div>
        <button
          onclick={resetGame}
          class="bg-primary text-primary-foreground hover:bg-primary/80 w-full px-6 py-3 font-semibold transition-colors duration-200"
        >
          Play Again
        </button>
      {/if}
    </div>

    <div class="text-muted-foreground mt-8 text-xs">
      <!-- Debug info -->
      <div class="text-muted-foreground mt-4 flex flex-col gap-1 text-xs">
        <p>Debug: {debugInfo}</p>
        <p>Motion: {motionSupported ? 'Supported' : 'Not supported'}</p>
        <p>Permission: {permissionStatus}</p>
        {#if gameState === 'playing'}
          <p>Shake State: {shakeState}</p>
          <p>
            Acceleration: {calculateAccelerationMagnitude(acceleration).toFixed(1)}
          </p>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Error Modal -->
<Dialog.Root bind:open={showErrorModal}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Motion Detection Error</Dialog.Title>
      <Dialog.Description>
        {errorMessage}
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer class="flex flex-col gap-2 sm:flex-row sm:justify-end sm:space-x-2">
      <button
        onclick={retryPermission}
        class="bg-primary text-primary-foreground hover:bg-primary/80 px-4 py-2 transition-colors"
      >
        Retry
      </button>
      <Dialog.Close asChild let:builder>
        <button
          use:builder.action
          {...builder}
          class="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 transition-colors"
        >
          Close
        </button>
      </Dialog.Close>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
