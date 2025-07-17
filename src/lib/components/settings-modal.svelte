<script>
  import * as Dialog from '$lib/components/ui/dialog';
  import Button, { buttonVariants } from '@/components/ui/button/button.svelte';
  import Switch from '@/components/ui/switch/switch.svelte';

  import { soundEnabled, hapticEnabled } from '$lib/settings.js';
  import { cn } from '$lib/utils.js';

  import { InfoIcon, SettingsIcon, Volume2, VolumeX, Vibrate, VibrateOff } from '@lucide/svelte';

  let { open = $bindable() } = $props();

  // Local state for switches that syncs with stores
  let soundToggle = $state($soundEnabled);
  let hapticToggle = $state($hapticEnabled);

  // Update stores when local state changes
  $effect(() => {
    soundEnabled.set(soundToggle);
  });

  $effect(() => {
    hapticEnabled.set(hapticToggle);
  });

  // Update local state when stores change
  $effect(() => {
    soundToggle = $soundEnabled;
  });

  $effect(() => {
    hapticToggle = $hapticEnabled;
  });
</script>

<Dialog.Root {open}>
  <Dialog.Trigger
    class={cn(buttonVariants({ size: 'xs', variant: 'ghost' }), 'relative -top-2 -right-2 p-2')}
  >
    <SettingsIcon />
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title class="mb-4">settings</Dialog.Title>

      <div class="text-muted-foreground flex flex-col gap-4 text-sm">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            {#if $soundEnabled}
              <Volume2 size={16} />
            {:else}
              <VolumeX size={16} />
            {/if}
            <span>sound</span>
          </div>
          <Switch bind:checked={soundToggle} />
        </div>
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            {#if $hapticEnabled}
              <Vibrate size={16} />
            {:else}
              <VibrateOff size={16} />
            {/if}
            <span>haptics</span>
          </div>
          <Switch bind:checked={hapticToggle} />
        </div>
        <Button
          variant="outline"
          onclick={() => {
            localStorage.clear();
            window.location.reload();
          }}>reset data & reload</Button
        >
      </div>

      <Dialog.Footer class="flex self-end">
        <Dialog.Close class={buttonVariants()} onclick={() => (open = false)}>close</Dialog.Close>
      </Dialog.Footer>
    </Dialog.Header>
  </Dialog.Content>
</Dialog.Root>
