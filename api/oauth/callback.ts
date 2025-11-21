import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import * as db from "../../server/db";
import { sdk } from "../../server/_core/sdk";

export const config = {
  runtime: 'nodejs20.x',
  maxDuration: 30,
};

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return new Response(
      JSON.stringify({ error: "code and state are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

    if (!userInfo.openId) {
      return new Response(
        JSON.stringify({ error: "openId missing from user info" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await db.upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
      expiresInMs: ONE_YEAR_MS,
    });

    // Determine if we're in production for secure cookies
    const isProduction = process.env.NODE_ENV === "production";
    const host = request.headers.get("host") || "";
    const isSecure = isProduction || host.includes("vercel.app");

    // Build cookie options
    const cookieOptions = [
      `${COOKIE_NAME}=${sessionToken}`,
      `Max-Age=${Math.floor(ONE_YEAR_MS / 1000)}`,
      `Path=/`,
      `HttpOnly`,
      `SameSite=Lax`,
    ];

    if (isSecure) {
      cookieOptions.push("Secure");
    }

    // Redirect to home page with session cookie
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
        "Set-Cookie": cookieOptions.join("; "),
      },
    });
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    return new Response(
      JSON.stringify({ error: "OAuth callback failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
