/**
 * Triggers a short haptic feedback (vibration) if supported by the browser.
 * This function gracefully handles environments without navigator.vibrate.
 *
 * @param duration Duration of the vibration in milliseconds. Defaults to 50ms (subtle).
 */
export function triggerHapticFeedback(duration: number = 50) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(duration);
  }
}
