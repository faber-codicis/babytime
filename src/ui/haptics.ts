/**
 * Short vibration as confirmation for the main actions (0.12.0), so a tap in the dark is felt without looking.
 * Only Android browsers vibrate; Safari on iPhone has no Vibration API, there it does nothing.
 */
export function haptic(pattern: number | number[] = 20): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
  } catch {
    // Blocked (e.g. no user gesture yet): the action itself has already worked.
  }
}
