- use svelte 5 (see llms-small.txt)
- use anime.js (see anime-js-llms.txt)
- use shadcn svelte
- write good tailwind
- minimal ui: no gradients, no rounded corners, semantic colors only, clean typography
- write modular code

project goals:

- standalone site where users can measure how fast they can shake their phone in 10 seconds
- use web gyroscope api
- should be mobile-friendly
- light mode by default, adhere to tailwind styles
- use anime.js for cool animations (figure out how to install it)
- backend should have an endpoint where users submit their scores to display in a global leaderboard. if you need a database, let's use supabase (ask me to set it up)
- dark mode during gameplay with light mode for menu
- sound effects and haptic feedback for enhanced UX

# SSL Setup for Motion API

The DeviceMotionEvent API requires HTTPS. To set up SSL certificates for local development:

## Quick Setup

```bash
./setup-ssl.sh
```

## Manual Setup

1. **Option 1: mkcert (recommended)**

   ```bash
   # Install mkcert
   sudo pacman -S mkcert  # or brew install mkcert

   # Install local CA and generate certificates
   mkcert -install
   mkcert localhost 127.0.0.1 ::1
   ```

2. **Option 2: OpenSSL**

   ```bash
   # Generate private key
   openssl genrsa -out localhost-key.pem 2048

   # Generate certificate (using provided config)
   openssl req -new -x509 -key localhost-key.pem -out localhost.pem -days 365 -config localhost.conf -extensions v3_req
   ```

## Usage

- Development server runs on `https://localhost:5175/`
- For mobile testing: `https://YOUR_IP:5175/`
- Accept certificate warnings in browser
- Motion API will now work properly

## Motion Permission Requirements

- Some browsers (Safari/WebKit) require motion permission requests from user gestures
- The app will show "Allow Motion & Start" button when permission is needed
- Permission is requested when user clicks the start button
- This is a browser security requirement and cannot be bypassed
- Non-WebKit browsers (Chrome, Firefox) typically don't require permissions

# Color System

This project uses semantic colors defined in `src/app.css` instead of hardcoded Tailwind colors. This provides:

## Semantic Color Tokens

- `background` - Main background color
- `foreground` - Primary text color
- `card` - Card/container background
- `card-foreground` - Card text color
- `primary` - Primary button/accent color
- `primary-foreground` - Primary button text
- `secondary` - Secondary button color
- `secondary-foreground` - Secondary button text
- `muted` - Muted background (subtle containers)
- `muted-foreground` - Muted text (secondary information)
- `border` - Border color
- `input` - Input field background
- `destructive` - Error/danger color

## Usage Guidelines

- **Always use semantic colors**: `bg-primary` not `bg-black`
- **Text hierarchy**: `text-foreground` for primary, `text-muted-foreground` for secondary
- **Consistent theming**: Colors automatically support light/dark mode
- **Hover states**: Use opacity modifiers like `hover:bg-primary/80`

## Benefits

- Automatic dark mode support
- Consistent color palette
- Easy theme customization
- Better accessibility
- Maintainable codebase

# Game Features

## Theme Switching

- **Light Mode**: Default state for menu and results
- **Dark Mode**: Automatically switches during gameplay (10-second timer)
- **Dynamic switching**: `document.documentElement.classList.add/remove('dark')`

## Audio System

- **Web Audio API**: Generates sounds programmatically (no external files needed)
- **Game End Sound**: Pleasant 3-note chord progression (C-E-G)
- **Error Handling**: Graceful degradation if audio unavailable

## Haptic Feedback

- **Shake Detection**: Subtle vibration (50ms) for each shake
- **Game End**: Pattern vibration (100ms, 50ms, 100ms, 50ms, 200ms)
- **Browser Support**: Uses `navigator.vibrate()` where available
- **Graceful Degradation**: No errors if vibration unsupported

## Implementation Details

- All features work without external dependencies
- Proper browser compatibility checks
- No network requests for audio/haptic features
- Lightweight and performant

# Physics-Based Shake Detection

## The Problem with Simple Threshold Detection

Previous approach: `if (acceleration_change > threshold) count++`

- Counted ~60 times per second during motion
- One physical shake = 10+ counted "shakes"
- Not physically meaningful

## Physics-Correct Solution

### What is a "Shake" in Physics?

A shake is a **complete oscillation cycle**:

- **1D Example**: Position 0 → left → 0 → right → 0
- **3D Reality**: Discrete back-and-forth motions in any direction
- **Key Insight**: One shake = high acceleration → low acceleration (complete cycle)

### State Machine Implementation

**States:**

1. `idle` - Waiting for shake to start (low acceleration)
2. `shaking` - High acceleration detected, shake in progress
3. `cooldown` - Brief period to prevent double-counting

**Physics Calculations:**

- **Acceleration Magnitude**: `|a| = √(ax² + ay² + az²)`
- **Shake Start**: Magnitude > 15 (tuned threshold)
- **Shake End**: Magnitude < 8 for sustained period
- **Validation**: Minimum duration (100ms) and cooldown (200ms)

### Key Parameters

- `SHAKE_THRESHOLD = 15` - Minimum acceleration to start shake
- `SHAKE_END_THRESHOLD = 8` - Acceleration below this ends shake
- `MIN_SHAKE_DURATION = 100ms` - Filters out noise/vibrations
- `SHAKE_COOLDOWN = 200ms` - Prevents double-counting rapid motions

### Result

- **Realistic counting**: One physical shake = one counted shake
- **Noise filtering**: Ignores device vibrations and small movements
- **Consistent**: Works across different shaking styles and orientations
- **Physics-accurate**: Based on actual motion physics principles

# Current Architecture

## Core Libraries (`src/lib/`)

### Game Systems

- **`physics.js`** - Simplified shake detection using magnitude threshold
  - `SHAKE_THRESHOLD = 30` - Strong acceleration threshold
  - `SHAKE_COOLDOWN = 50ms` - Minimum time between shake detections
  - `calculateAccelerationMagnitude()` - 3D magnitude calculation
  - `createShakeDetector()` - Simple threshold-based detection
  - `isValidAcceleration()` - Input validation

### Motion & Sensors

- **`motion.js`** - Device motion API wrapper
  - `createMotionDetector()` - Event listener management
  - `isMotionSupported()` - Feature detection
  - `requestMotionPermission()` - iOS permission handling
  - `getPermissionStatus()` - Permission state checking

### Audio System

- **`audio.js`** - Web Audio API sound generation
  - `initializeAudioContext()` - Audio context setup
  - `createGameEndSound()` - Success melody (C-E-G chord)
  - `createShakeSound()` - Bright metal ding sound
  - `initAudioFromUserGesture()` - iOS audio unlock

### UI & Feedback

- **`haptic.js`** - Vibration patterns using anime.js
  - `triggerShakeFeedback()` - 50ms vibration per shake
  - `triggerGameEndFeedback()` - Pattern vibration for game end
  - `triggerPhoneAnimation()` - Visual shake effects
  - `triggerCounterAnimation()` - Counter scaling effects

- **`theme.js`** - Dark/light mode switching
  - `switchToDarkMode()` - Gameplay dark mode
  - `switchToLightMode()` - Menu light mode
  - `setMetaThemeColor()` - Browser theme color sync

### Game Logic

- **`game.js`** - Game state management (currently unused)
  - `createGameManager()` - Centralized game state
  - Timer management, scoring, persistence
  - High score localStorage handling

## Main Application

### Routes

- **`src/routes/+page.svelte`** - Main game interface
  - Svelte 5 `$state` reactive variables
  - Game state: `idle`, `playing`, `finished`
  - Timer countdown, shake counting
  - Motion detection integration
  - Audio/haptic feedback coordination

### Components

- **`src/lib/components/ui/`** - shadcn-svelte components
  - `button/` - Primary action buttons
  - `dialog/` - Error modal system

## Technical Stack

### Core Technologies

- **SvelteKit 2.22** - Full-stack framework
- **Svelte 5** - Component framework with runes
- **TypeScript 5** - Type safety
- **Vite 7** - Build tool

### Styling

- **Tailwind CSS 4** - Utility-first CSS
- **Semantic color system** - Custom CSS variables
- **shadcn-svelte** - Component library

### Dependencies

- **anime.js 4.0.2** - Animation library
- **bits-ui** - Headless components
- **clsx** - Conditional classes
- **tailwind-variants** - Component variants

## Current Implementation Status

### ✅ Completed Features

- Basic shake detection and counting
- Audio feedback system
- Haptic vibration feedback
- Dark/light mode theme switching
- Game timer (10 seconds)
- High score persistence
- Motion permission handling
- SSL setup for HTTPS development

### ❌ Missing Features

- Backend leaderboard system
- Debug visualization graph
- Complete game state management integration
- Supabase database integration

### 🔧 Technical Notes

- Game logic is directly embedded in `+page.svelte`
- `game.js` manager exists but is not integrated
- Motion detection uses simple threshold approach
- No external API endpoints currently implemented

# Development Commands

## Local Development

```bash
# Start development server with SSL
pnpm dev  # Runs on https://localhost:5175

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm check

# Format code
pnpm format
```

## SSL Certificate Setup

```bash
# Quick setup (recommended)
./setup-ssl.sh

# Manual setup with mkcert
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

# File Structure

```
src/
├── lib/
│   ├── audio.js           # Web Audio API sounds
│   ├── game.js            # Game state management
│   ├── haptic.js          # Vibration & animations
│   ├── motion.js          # Device motion detection
│   ├── physics.js         # Shake detection logic
│   ├── theme.js           # Dark/light mode
│   └── components/ui/     # shadcn-svelte components
├── routes/
│   ├── +layout.svelte     # App layout
│   ├── +page.js           # Page data loading
│   └── +page.svelte       # Main game interface
├── app.css               # Global styles & variables
├── app.html              # HTML template
└── tweakcn.css           # Component style overrides
```

# Important Instructions

- Use Svelte 5 syntax with runes (`$state`, `$derived`, `$effect`)
- Follow semantic color system (use CSS variables, not hardcoded colors)
- Keep UI minimal: no gradients, rounded corners, semantic colors only
- Write modular, reusable code
- All motion detection requires HTTPS
- Test on mobile devices for motion events
- Use anime.js for animations
- Maintain clean typography and consistent spacing
