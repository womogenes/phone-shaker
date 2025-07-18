<script>
  import { onMount } from 'svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import Button from '$lib/components/ui/button/button.svelte';

  import { TrophyIcon, UserIcon, CalendarIcon, Loader2Icon } from '@lucide/svelte';

  // Props
  let { open = $bindable(), currentScore = 0 } = $props();

  // State
  let leaderboard = $state([]);
  let loading = $state(false);
  let error = $state('');
  let playerName = $state('');
  let submitting = $state(false);
  let submitted = $state(false);

  // Fetch leaderboard data
  async function fetchLeaderboard() {
    loading = true;
    error = '';

    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();

      if (data.success) {
        leaderboard = data.topScores;
      } else {
        error = data.error || 'Failed to load leaderboard';
      }
    } catch (err) {
      error = 'network error loading leaderboard';
    } finally {
      loading = false;
    }
  }

  // Submit score to leaderboard
  async function submitScore() {
    if (!playerName.trim() || submitting) return;

    submitting = true;
    error = '';

    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: currentScore,
          playerName: playerName.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        submitted = true;
        await fetchLeaderboard(); // Refresh leaderboard
      } else {
        error = data.error || 'Failed to submit score';
      }
    } catch (err) {
      error = 'Network error submitting score';
    } finally {
      setTimeout(() => (submitting = false), 500);
    }
  }

  // Format date for display
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Get rank emoji
  function getRankEmoji(index) {
    return `${index + 1}`;
  }

  // Reset state when dialog opens
  $effect(() => {
    if (open) {
      submitted = false;
      playerName = '';
      error = '';
      fetchLeaderboard();
    }
  });
</script>

<Dialog.Root {open} onOpenChange={(newOpen) => (open = newOpen)}>
  <Dialog.Content class="flex h-full w-full !max-w-none justify-center border-t border-white">
    <div class="flex h-full w-full max-w-md flex-col overflow-hidden">
      <Dialog.Header class="mb-4 pt-8 flex-shrink-0">
        <Dialog.Title class="flex items-center gap-2">global leaderboard</Dialog.Title>
      </Dialog.Header>

      {#if loading}
        <div class="text-muted-foreground py-8 text-sm">loading leaderboard...</div>
      {:else if error}
        <div class="text-destructive py-4 text-center">{error}</div>
        <div class="flex justify-center">
          <Button variant="outline" onclick={fetchLeaderboard}>Retry</Button>
        </div>
      {:else}
        <div class="flex flex-col overflow-hidden">
          <!-- Score submission section -->
          {#if !submitted && currentScore > 0}
            <div class="mb-4 rounded-lg border p-4 flex-shrink-0">
              <div class="text-muted-foreground mb-3 text-sm">
                you shook <b class="text-foreground">{currentScore}</b> times! submit your score to the
                global leaderboard.
              </div>
              <div class="flex items-center gap-2">
                <input
                  bind:value={playerName}
                  placeholder="Enter your name"
                  maxlength="20"
                  class="border-input bg-background flex-1 grow rounded-md border px-3 py-2 text-sm"
                  disabled={submitting}
                />
                <Button
                  class="h-9.5"
                  onclick={submitScore}
                  disabled={!playerName.trim() || submitting}
                >
                  {#if submitting}
                    <Loader2Icon class="animate-spin" />
                  {:else}
                    <span>submit</span>
                  {/if}
                </Button>
              </div>
            </div>
          {:else if submitted}
            <div class="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 flex-shrink-0">
              <div class="mb-1 font-semibold text-green-800">score submitted</div>
              <div class="text-sm text-green-700">thanks for playing!</div>
            </div>
          {/if}

          <!-- Leaderboard table -->
          <div class="flex-1 space-y-2 overflow-y-auto text-sm">
          {#if leaderboard.length === 0}
            <div class="text-secondary-foreground py-8">no scores yet. be the first to submit!</div>
          {:else}
            {#each leaderboard as entry, index}
              <div class="bg-muted/50 flex items-center justify-between rounded-lg p-3">
                <div class="flex items-center">
                  <div class="text-muted-foreground mr-4 ml-2 text-left text-3xl font-bold">
                    {getRankEmoji(index)}
                  </div>
                  <div>
                    <div class="flex items-center gap-2 font-semibold">
                      <UserIcon class="h-3 w-3" />
                      {entry.player_name}
                    </div>
                    <div class="text-muted-foreground flex items-center gap-2 text-xs">
                      <CalendarIcon class="h-3 w-3" />
                      <span class="mt-[1px]">{formatDate(entry.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-bold">{entry.score}</div>
                  <div class="text-muted-foreground text-xs">shakes</div>
                </div>
              </div>
            {/each}
          {/if}
          </div>
        </div>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
