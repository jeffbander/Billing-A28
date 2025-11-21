import { getAuth, createClerkClient } from "@clerk/express";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

// Create Clerk client for server-side API calls
const clerk = createClerkClient({ secretKey: ENV.clerkSecretKey });

export type ClerkSessionInfo = {
  userId: string;
  sessionId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

/**
 * Get full user info from Clerk
 */
export async function getClerkUser(userId: string) {
  return clerk.users.getUser(userId);
}

/**
 * Sync Clerk user to our database
 * Returns the local database user
 */
export async function syncClerkUserToDatabase(clerkUserId: string): Promise<User | null> {
  try {
    const clerkUser = await clerk.users.getUser(clerkUserId);

    if (!clerkUser) {
      console.warn("[Clerk] User not found:", clerkUserId);
      return null;
    }

    // Extract user info from Clerk
    const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? null;
    const name = [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(" ") || clerkUser.username || email?.split("@")[0] || "User";

    // Determine login method from Clerk's external accounts or identifier
    let loginMethod = "clerk";
    if (clerkUser.externalAccounts?.length) {
      const provider = clerkUser.externalAccounts[0].provider;
      if (provider === "oauth_google") loginMethod = "google";
      else if (provider === "oauth_apple") loginMethod = "apple";
      else if (provider === "oauth_microsoft") loginMethod = "microsoft";
      else if (provider === "oauth_github") loginMethod = "github";
      else loginMethod = provider || "oauth";
    } else if (email) {
      loginMethod = "email";
    }

    // Upsert user to our database
    await db.upsertUser({
      openId: clerkUserId, // Use Clerk user ID as openId
      name,
      email,
      loginMethod,
      lastSignedIn: new Date(),
    });

    // Fetch and return the user from our database
    const user = await db.getUserByOpenId(clerkUserId);
    return user ?? null;
  } catch (error) {
    console.error("[Clerk] Failed to sync user:", error);
    return null;
  }
}

/**
 * Authenticate request using Clerk and return local database user
 */
export async function authenticateClerkRequest(req: Request): Promise<User | null> {
  const auth = getAuth(req);

  // Check for userId - this will exist for session-based auth
  const userId = 'userId' in auth ? (auth as { userId: string | null }).userId : null;

  if (!userId) {
    return null;
  }

  // Get or create user in our database
  const existingUser = await db.getUserByOpenId(userId);

  if (!existingUser) {
    // First time login - sync from Clerk
    const syncedUser = await syncClerkUserToDatabase(userId);
    return syncedUser;
  }

  // Update last signed in
  await db.upsertUser({
    openId: userId,
    lastSignedIn: new Date(),
  });

  return existingUser;
}
