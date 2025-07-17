/**
 * Theme management for the phone shaker game
 * Handles dark/light mode switching during gameplay
 */

/**
 * Switch to dark mode (used during gameplay)
 */
export function switchToDarkMode() {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
    setMetaThemeColor();
  }
}

/**
 * Switch to light mode (used for menu/idle state)
 */
export function switchToLightMode() {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('dark');
    setMetaThemeColor();
  }
}

/**
 * Check if currently in dark mode
 * @returns {boolean} True if in dark mode
 */
export function isDarkMode() {
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark');
  }
  return false;
}

/**
 * Toggle between dark and light mode
 * @returns {boolean} True if now in dark mode
 */
export function setMetaThemeColor() {
  const bgColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--background')
    .trim();
  document.querySelector('meta[name="theme-color"]').content = bgColor;
}
