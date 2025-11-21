export const ENV = {
  // Clerk Authentication
  clerkPublishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY ?? "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",

  // Database
  databaseUrl: process.env.DATABASE_URL ?? "",

  // Legacy (kept for reference, can be removed after migration)
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",

  // Environment
  isProduction: process.env.NODE_ENV === "production",

  // Optional services
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
