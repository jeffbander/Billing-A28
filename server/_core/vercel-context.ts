import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME } from "@shared/const";

export type VercelTrpcContext = {
  req: Request;
  user: User | null;
  guestSessionId: string | null;
  isGuest: boolean;
};

/**
 * Create tRPC context for Vercel serverless functions
 * Adapts from Express to Fetch API Request
 */
export async function createVercelContext(
  req: Request
): Promise<VercelTrpcContext> {
  let user: User | null = null;
  let guestSessionId: string | null = null;
  let isGuest = false;

  // Check for guest session ID in headers
  const guestHeader = req.headers.get('x-guest-session-id');
  if (guestHeader && typeof guestHeader === 'string') {
    guestSessionId = guestHeader;
    isGuest = true;
  }

  // Try to authenticate if not a guest
  if (!isGuest) {
    try {
      user = await authenticateVercelRequest(req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req,
    user,
    guestSessionId,
    isGuest,
  };
}

/**
 * Authenticate request using cookies from Fetch API Request
 */
async function authenticateVercelRequest(req: Request): Promise<User> {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
  const sessionCookie = cookies.get(COOKIE_NAME);

  // Reuse SDK's session verification and authentication logic
  const session = await sdk.verifySession(sessionCookie);

  if (!session) {
    throw new Error("Invalid session cookie");
  }

  // Import db dynamically to avoid circular dependencies
  const db = await import("../db");
  const sessionUserId = session.openId;
  const signedInAt = new Date();
  let user = await db.getUserByOpenId(sessionUserId);

  // If user not in DB, sync from OAuth server automatically
  if (!user) {
    try {
      const userInfo = await sdk.getUserInfoWithJwt(sessionCookie ?? "");
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: signedInAt,
      });
      user = await db.getUserByOpenId(userInfo.openId);
    } catch (error) {
      console.error("[Auth] Failed to sync user from OAuth:", error);
      throw new Error("Failed to sync user info");
    }
  }

  if (!user) {
    throw new Error("User not found");
  }

  await db.upsertUser({
    openId: user.openId,
    lastSignedIn: signedInAt,
  });

  return user;
}

function parseCookies(cookieHeader: string | null): Map<string, string> {
  if (!cookieHeader) {
    return new Map<string, string>();
  }

  const parsed = parseCookieHeader(cookieHeader);
  return new Map(Object.entries(parsed));
}
