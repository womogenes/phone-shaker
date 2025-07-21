# how fast can you shake your phone?

an app to test how fast you can shake your phone using web device motion apis.

## Key Architecture

### Tech Stack
- **SvelteKit 2.22** with **Svelte 5** (runes: `$state`, `$effect`, `$bindable`)
- **Tailwind CSS 4** with semantic color system
- **shadcn-svelte** components
- **anime.js 4.0.2** for animations
- **Supabase** backend with PostHog analytics

### Modular Library Design (`src/lib/`)
- `physics.js` - Peak detection shake algorithm using magnitude thresholds
- `motion.js` - DeviceMotion API wrapper with iOS permissions
- `audio.js` - Web Audio API programmatic sound generation
- `haptic.js` - Vibration patterns via anime.js
- `theme.js` - Dynamic dark/light mode (dark during gameplay)
- `settings.js` - Persisted stores with localStorage

### UI/UX Style
- **Minimal design**: no gradients, no rounded corners, semantic colors only
- **Clean typography** with proper hierarchies  
- **Mobile-first** responsive
- **Semantic color system** using CSS variables for automatic theming
- **Component variants** via tailwind-variants

### Core Features
- **Physics-based shake detection** - peak detection algorithm
- **Cross-platform motion** - handles iOS permissions, Android differences
- **Dynamic theming** - light for menu, dark for gameplay
- **Audio feedback** - programmatic C-E-G chord progressions
- **Haptic patterns** - vibration feedback per shake
- **Server validation** - replays physics on backend to verify scores
- **Data obfuscation** - light encoding to prevent casual tampering

### Backend Security
- Server-side score verification using same physics engine
- Timestamp ordering validation
- Data rate limiting (max 60Hz * game duration)
- IP tracking for analytics
- Input sanitization for leaderboard names

### Architecture Strengths
- Clean separation of concerns
- Modern Svelte 5 reactive patterns
- Cross-platform compatibility
- Performance optimized
- Security conscious
- Maintainable modular code
