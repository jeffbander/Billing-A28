/**
 * Session-based storage for user and guest temporary data
 * Data is stored in-memory and cleared after 24 hours or on session end
 */

import { Rate, Scenario, ScenarioDetail } from "../drizzle/schema";

// Extended rate type that matches getRatesWithDetails return type
export type ExtendedRate = {
  id: number;
  cptCodeId: number;
  cptCode: string | null;
  cptDescription: string | null;
  payerType: "Medicare" | "Commercial" | "Medicaid";
  siteType: "FPA" | "Article28";
  component: "Professional" | "Technical" | "Global";
  rate: number;
  verified: boolean;
  notes: string | null;
};

// Session scenario type (compatible with database scenario structure)
export type SessionScenario = {
  id: number;
  providerName: string;
  totalPatients: number | null;
  medicarePercent: number;
  commercialPercent: number;
  medicaidPercent: number;
  siteType: "FPA" | "Article28" | null;
  fpaTotal: number | null;
  article28Total: number | null;
  createdAt: Date;
  procedures: Array<{
    cptCodeId: number;
    quantity: number;
  }>;
  // For compatibility with database scenario structure
  details?: Array<{
    id?: number;
    cptCodeId: number;
    cptCode?: string | null;
    cptDescription?: string | null;
    quantity: number;
  }>;
};

interface SessionData {
  rates: Map<number, ExtendedRate>; // rateId -> modified rate
  scenarios: Map<number, SessionScenario>; // scenarioId -> scenario
  nextScenarioId: number; // Auto-increment for scenario IDs
  lastAccess: Date;
}

// In-memory storage for session data
// Key: sessionId (for users: userId, for guests: guestSessionId)
const sessionStore = new Map<string, SessionData>();

// TTL: 24 hours
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Cleanup expired sessions
 */
function cleanupExpiredSessions() {
  const now = new Date();
  const keysToDelete: string[] = [];
  sessionStore.forEach((data, sessionId) => {
    if (now.getTime() - data.lastAccess.getTime() > SESSION_TTL_MS) {
      keysToDelete.push(sessionId);
    }
  });
  keysToDelete.forEach(key => sessionStore.delete(key));
}

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

/**
 * Get or create session data
 */
export function getSessionData(sessionId: string): SessionData {
  let data = sessionStore.get(sessionId);
  if (!data) {
    data = {
      rates: new Map(),
      scenarios: new Map(),
      nextScenarioId: 1,
      lastAccess: new Date(),
    };
    sessionStore.set(sessionId, data);
  } else {
    data.lastAccess = new Date();
  }
  return data;
}

/**
 * Update a rate in session storage
 */
export function updateSessionRate(sessionId: string, rateId: number, rate: ExtendedRate): void {
  const data = getSessionData(sessionId);
  data.rates.set(rateId, rate);
}

/**
 * Get a rate from session storage (returns undefined if not modified in session)
 */
export function getSessionRate(sessionId: string, rateId: number): ExtendedRate | undefined {
  const data = sessionStore.get(sessionId);
  return data?.rates.get(rateId);
}

/**
 * Get all modified rates for a session
 */
export function getAllSessionRates(sessionId: string): ExtendedRate[] {
  const data = sessionStore.get(sessionId);
  return data ? Array.from(data.rates.values()) : [];
}

/**
 * Clear session data
 */
export function clearSession(sessionId: string): void {
  sessionStore.delete(sessionId);
}

/**
 * Get session ID for a user or guest
 */
export function getSessionId(userId?: number, guestSessionId?: string): string | null {
  if (userId) return `user-${userId}`;
  if (guestSessionId) return `guest-${guestSessionId}`;
  return null;
}

// ===== Scenario Session Storage =====

/**
 * Create a scenario in session storage
 */
export function createSessionScenario(
  sessionId: string,
  scenarioData: Omit<SessionScenario, 'id' | 'createdAt'>
): number {
  const data = getSessionData(sessionId);
  const id = data.nextScenarioId++;
  const scenario: SessionScenario = {
    ...scenarioData,
    id,
    createdAt: new Date(),
  };
  data.scenarios.set(id, scenario);
  return id;
}

/**
 * Get all scenarios for a session
 */
export function getAllSessionScenarios(sessionId: string): SessionScenario[] {
  const data = sessionStore.get(sessionId);
  return data ? Array.from(data.scenarios.values()) : [];
}

/**
 * Get a scenario by ID from session storage
 */
export function getSessionScenario(sessionId: string, scenarioId: number): SessionScenario | undefined {
  const data = sessionStore.get(sessionId);
  return data?.scenarios.get(scenarioId);
}

/**
 * Delete a scenario from session storage
 */
export function deleteSessionScenario(sessionId: string, scenarioId: number): void {
  const data = sessionStore.get(sessionId);
  if (data) {
    data.scenarios.delete(scenarioId);
  }
}
