<script>
  import * as Dialog from '$lib/components/ui/dialog';
  import Button, { buttonVariants } from '@/components/ui/button/button.svelte';

  import { cn } from '$lib/utils.js';

  let { open = $bindable() } = $props();
</script>

<Dialog.Root {open}>
  <Dialog.Trigger class="underline">how to play</Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title class="mb-4">how to play</Dialog.Title>

      <div class="text-secondary-foreground mb-4 flex flex-col gap-4 text-sm">
        <p>click start and shake your phone as fast as you can in ten seconds.</p>
        <p>coming soon: global leaderboard</p>
      </div>

      <Dialog.Footer class="flex items-end">
        <Dialog.Close class={buttonVariants()}>close</Dialog.Close>
      </Dialog.Footer>
    </Dialog.Header>
  </Dialog.Content>
</Dialog.Root>
