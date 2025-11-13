/**
 * Guest Session Management
 * Handles temporary guest sessions that don't persist after browser close
 */

const GUEST_SESSION_KEY = 'guest_session_id';
const GUEST_MODE_KEY = 'is_guest_mode';

/**
 * Generate a unique guest session ID
 */
export function generateGuestSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Check if current session is in guest mode
 */
export function isGuestMode(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(GUEST_MODE_KEY) === 'true';
}

/**
 * Get current guest session ID
 */
export function getGuestSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(GUEST_SESSION_KEY);
}

/**
 * Start a new guest session
 */
export function startGuestSession(): string {
  const sessionId = generateGuestSessionId();
  sessionStorage.setItem(GUEST_SESSION_KEY, sessionId);
  sessionStorage.setItem(GUEST_MODE_KEY, 'true');
  return sessionId;
}

/**
 * End guest session and clear all data
 */
export function endGuestSession(): void {
  sessionStorage.removeItem(GUEST_SESSION_KEY);
  sessionStorage.removeItem(GUEST_MODE_KEY);
}

/**
 * Setup beforeunload warning for guest users
 */
export function setupGuestExitWarning(): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isGuestMode()) {
      e.preventDefault();
      e.returnValue = 'Your guest session data will be lost. Are you sure you want to leave?';
      return e.returnValue;
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}
