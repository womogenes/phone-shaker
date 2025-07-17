<script>
  import * as Dialog from '$lib/components/ui/dialog';
  import Button, { buttonVariants } from '@/components/ui/button/button.svelte';
  import Switch from '@/components/ui/switch/switch.svelte';

  import { InfoIcon, SettingsIcon } from '@lucide/svelte';

  let { open } = $props();
</script>

<Dialog.Root {open}>
  <Dialog.Trigger class={buttonVariants({ size: 'icon', variant: 'ghost' })}>
    <SettingsIcon />
  </Dialog.Trigger>
  <Dialog.Content class="">
    <Dialog.Header>
      <Dialog.Title class="mb-4">settings</Dialog.Title>

      <div class="text-muted-foreground flex flex-col gap-2 text-sm">
        <div class="flex justify-between">
          <span>sound</span>
          <Switch />
        </div>
        <div class="flex justify-between">
          <span>haptics</span>
          <Switch />
        </div>
      </div>

      <Dialog.Footer>
        <Dialog.Close class={buttonVariants()}>close</Dialog.Close>
      </Dialog.Footer>
    </Dialog.Header>
  </Dialog.Content>
</Dialog.Root>
