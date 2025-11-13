/**
 * In-memory storage for guest user data
 * Data is stored temporarily and cleared when server restarts
 */

import { InsertScenario } from "../drizzle/schema";

interface GuestScenario {
  id: number;
  guestSessionId: string;
  providerName: string;
  totalPatients: number;
  medicarePercent: number;
  commercialPercent: number;
  medicaidPercent: number;
  siteType: "FPA" | "Article28";
  fpaTotal: number | null;
  article28Total: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface GuestData {
  scenarios: Map<number, GuestScenario>;
  scenarioIdCounter: number;
}

// In-memory storage for all guest sessions
const guestStorage = new Map<string, GuestData>();

/**
 * Initialize storage for a new guest session
 */
export function initGuestSession(guestSessionId: string): void {
  if (!guestStorage.has(guestSessionId)) {
    guestStorage.set(guestSessionId, {
      scenarios: new Map(),
      scenarioIdCounter: 1,
    });
  }
}

/**
 * Get guest session data
 */
function getGuestData(guestSessionId: string): GuestData {
  initGuestSession(guestSessionId);
  return guestStorage.get(guestSessionId)!;
}

/**
 * Create a scenario for a guest user
 */
export function createGuestScenario(
  guestSessionId: string,
  scenario: {
    providerName: string;
    totalPatients: number;
    medicarePercent: number;
    commercialPercent: number;
    medicaidPercent: number;
    siteType: "FPA" | "Article28";
    fpaTotal: number | null;
    article28Total: number | null;
  }
): GuestScenario {
  const data = getGuestData(guestSessionId);
  const id = data.scenarioIdCounter++;
  const now = new Date();
  
  const guestScenario: GuestScenario = {
    ...scenario,
    id,
    guestSessionId,
    createdAt: now,
    updatedAt: now,
  };
  
  data.scenarios.set(id, guestScenario);
  return guestScenario;
}

/**
 * Get all scenarios for a guest user
 */
export function getGuestScenarios(guestSessionId: string): GuestScenario[] {
  const data = getGuestData(guestSessionId);
  return Array.from(data.scenarios.values());
}

/**
 * Get a specific scenario for a guest user
 */
export function getGuestScenario(
  guestSessionId: string,
  scenarioId: number
): GuestScenario | undefined {
  const data = getGuestData(guestSessionId);
  return data.scenarios.get(scenarioId);
}

/**
 * Delete a scenario for a guest user
 */
export function deleteGuestScenario(
  guestSessionId: string,
  scenarioId: number
): boolean {
  const data = getGuestData(guestSessionId);
  return data.scenarios.delete(scenarioId);
}

/**
 * Clear all data for a guest session
 */
export function clearGuestSession(guestSessionId: string): void {
  guestStorage.delete(guestSessionId);
}

/**
 * Clean up old guest sessions (optional - can be called periodically)
 * This is a simple implementation that clears all sessions
 * In production, you might want to track last access time
 */
export function cleanupOldGuestSessions(): void {
  // For now, we'll keep sessions until server restart
  // You could implement TTL-based cleanup here
}
