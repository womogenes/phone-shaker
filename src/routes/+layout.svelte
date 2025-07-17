<script lang="ts">
  import '../app.css';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
    rel="stylesheet"
  />

  <title>phone shaker 📱🫨</title>
  <meta name="description" content="measure how fast you can shake your phone in 10 seconds. minimal web game using device motion sensors." />
  
  <!-- OpenGraph meta tags -->
  <meta property="og:title" content="phone shaker 📱🫨" />
  <meta property="og:description" content="measure how fast you can shake your phone in 10 seconds. minimal web game using device motion sensors." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://phone-shaker.vercel.app" />
  <meta property="og:site_name" content="phone shaker" />
  
  <!-- Twitter Card meta tags -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="phone shaker 📱🫨" />
  <meta name="twitter:description" content="measure how fast you can shake your phone in 10 seconds. minimal web game using device motion sensors." />
  
  <!-- Additional meta tags -->
  <meta name="author" content="phone shaker" />
  <meta name="keywords" content="shake, phone, mobile, game, motion, sensor, minimal, web, experiment" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://phone-shaker.vercel.app" />
</svelte:head>

{@render children()}
