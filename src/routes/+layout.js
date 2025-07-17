import posthog from 'posthog-js';
import { browser } from '$app/environment';
import { onMount } from 'svelte';

export const load = async () => {
  if (browser) {
    posthog.init('phc_BCfDbuqdulrLbaxN2223qILX5deNwzWt7vjlkhtf5c', {
      api_host: 'https://us.i.posthog.com',
      defaults: '2025-05-24',
      person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
    });
  }

  return;
};
