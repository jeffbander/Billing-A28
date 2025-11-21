export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO = "/mount-sinai-logo.png";

// Auth is now handled by Clerk - no need for custom OAuth URLs
// Login page is at /auth and uses Clerk's SignIn component
