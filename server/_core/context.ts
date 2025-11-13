import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  guestSessionId: string | null;
  isGuest: boolean;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let guestSessionId: string | null = null;
  let isGuest = false;

  // Check for guest session ID in headers
  const guestHeader = opts.req.headers['x-guest-session-id'];
  if (guestHeader && typeof guestHeader === 'string') {
    guestSessionId = guestHeader;
    isGuest = true;
  }

  // Try to authenticate if not a guest
  if (!isGuest) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    guestSessionId,
    isGuest,
  };
}
