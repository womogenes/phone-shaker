<script>
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
  import { cn } from '@/utils';

  // Shadcn components
  import * as Dialog from '$lib/components/ui/dialog';
  import Button, { buttonVariants } from '@/components/ui/button/button.svelte';

  // Icons
  import { InfoIcon, TrophyIcon, SettingsIcon } from '@lucide/svelte';
  import SettingsModal from '$lib/components/settings-modal.svelte';
  import InfoModal from '$lib/components/info-modal.svelte';
  import LeaderboardModal from '$lib/components/leaderboard-modal.svelte';

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
  let showSettingsModal = $state(false);
  let showLeaderboardModal = $state(false);

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
      showError('DeviceMotion not supported on this device');
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
    // Request motion permission if needed

    try {
      const response = await DeviceMotionEvent?.requestPermission?.();
      if (permissionStatus === 'needs-user-gesture') {
        debugInfo = 'requesting motion permission...';
        permissionStatus = response;

        if (response === 'granted') {
          setupMotionDetection();
        } else {
          showError(`motion permission denied: ${response}`);
          return;
        }
      }
    } catch (error) {
      alert(`error: ${error}`);
      showError(`permission request failed: ${error.message}`);
      return;
    }

    // Initialize audio from user gesture (iOS requirement)
    await initAudioFromUserGesture();

    // Ensure motion detection is set up
    if (!motionDetector) {
      showError('Motion detection not properly initialized');
      return;
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
    timeLeft = 10;
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
    debugInfo = `error: ${message}`;
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

<div class="flex h-full flex-col items-center justify-center">
  <!-- Full width top bar -->
  <div class="flex w-full justify-center border-b">
    <!-- Just the buttons -->
    <div class="flex w-full max-w-md items-center justify-between px-4">
      <Button
        onclick={() => (showLeaderboardModal = true)}
        size="icon"
        variant="ghost"
        aria-label="View leaderboard"
      >
        <TrophyIcon class="size-5" />
      </Button>
      <Button
        onclick={() => (showSettingsModal = true)}
        size="icon"
        variant="ghost"
        aria-label="Settings"
      >
        <SettingsIcon class="size-5" />
      </Button>
    </div>
  </div>

  <div class="mx-auto flex h-full w-full max-w-md flex-col justify-center px-6">
    <div class="mb-6">
      <h1 class="text-foreground mb-4 text-5xl leading-11 font-black tracking-tight">
        how fast can you shake?
      </h1>
      <p class="text-muted-foreground text-sm">find out today using our silly little app!</p>
    </div>

    <div class="mb-8">
      <div class="text-muted-foreground mb-6 flex items-start justify-between text-sm">
        <div>high score: <span class="text-foreground">{highScore}</span></div>
        <div>time: <span class="text-foreground">{timeLeft}s</span></div>
      </div>

      <div class="flex flex-col items-center">
        <div class="text-foreground mb-0 text-8xl font-black">
          {shakeCount}
        </div>
        <div class="text-muted-foreground text-sm">shakes</div>
      </div>
    </div>

    <div class="mb-4 flex h-[84px] flex-col space-y-2">
      {#if gameState === 'idle'}
        <Button onclick={startGame} size="xl">START</Button>
      {:else if gameState === 'playing'}
        <div class="flex flex-col items-center">
          <div class="font-semibold">shake it like it's hot</div>
          <div class="text-muted-foreground text-sm">keep shaking your phone</div>
        </div>
      {:else if gameState === 'finished'}
        <div class="text-sm"><b>game over</b> (you shook {currentScore} times)</div>
        {#if currentScore >= highScore}
          <div class="mb-1 text-sm font-semibold">new high score!</div>
        {/if}
        <Button
          class="w-full"
          size="xl"
          onclick={() => (showLeaderboardModal = true)}
          variant="outline"
        >
          <TrophyIcon class="mr-2 h-4 w-4" />
          VIEW LEADERBOARD
        </Button>
        <Button onclick={resetGame} size="xl">PLAY AGAIN</Button>
      {/if}
    </div>

    <!-- <div class="text-muted-foreground text-xs">
      <div>debug: {debugInfo}</div>
    </div> -->
  </div>

  <div class="text-muted-foreground mt-8 w-full max-w-md px-6 py-5 text-sm tabular-nums">
    <div class="flex justify-between gap-2">
      <InfoModal />
      <p><a class="underline" href="https://github.com/womogenes/phone-shaker">source</a></p>
    </div>
  </div>
</div>

<Dialog.Root open={showErrorModal} onOpenChange={(open) => (showErrorModal = open)}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title class="mb-4">device motion API unsupported</Dialog.Title>

      <div class="text-secondary-foreground mb-4 flex flex-col gap-2 text-sm">
        <p>your device may not support the motion APIs required to run this experiment.</p>
        <p>try opening this site on a mobile device or closing and reopening your browser app.</p>
      </div>

      <Dialog.Footer class="flex w-full flex-row gap-4">
        <Button class="grow" variant="outline" onclick={retryPermission}>retry</Button>
        <Button class={cn('grow', buttonVariants())} onclick={() => (showErrorModal = false)}>
          close
        </Button>
      </Dialog.Footer>
    </Dialog.Header>
  </Dialog.Content>
</Dialog.Root>

<!-- Settings Modal -->
<SettingsModal bind:open={showSettingsModal} />

<!-- Leaderboard Modal -->
<LeaderboardModal bind:open={showLeaderboardModal} {currentScore} />
