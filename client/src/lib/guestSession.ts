/**
 * Guest session management
 * Uses sessionStorage so data clears when browser/tab closes
 */

const GUEST_SESSION_KEY = 'guest_session_id';
const GUEST_MODE_KEY = 'is_guest_mode';

export function generateGuestSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function startGuestSession(): string {
  const sessionId = generateGuestSessionId();
  sessionStorage.setItem(GUEST_SESSION_KEY, sessionId);
  sessionStorage.setItem(GUEST_MODE_KEY, 'true');
  return sessionId;
}

export function getGuestSessionId(): string | null {
  return sessionStorage.getItem(GUEST_SESSION_KEY);
}

export function isGuestMode(): boolean {
  return sessionStorage.getItem(GUEST_MODE_KEY) === 'true';
}

export function endGuestSession(): void {
  sessionStorage.removeItem(GUEST_SESSION_KEY);
  sessionStorage.removeItem(GUEST_MODE_KEY);
}
