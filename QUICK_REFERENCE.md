# Quick Reference: Key Files & Absolute Paths

## Core Server Files
- `/home/user/Billing-A28/server/_core/index.ts` - Main Express server (66 lines)
- `/home/user/Billing-A28/server/_core/trpc.ts` - tRPC initialization (59 lines)
- `/home/user/Billing-A28/server/_core/context.ts` - tRPC context factory (44 lines)
- `/home/user/Billing-A28/server/_core/oauth.ts` - OAuth callback routes (54 lines)
- `/home/user/Billing-A28/server/_core/env.ts` - Environment variables (11 lines)
- `/home/user/Billing-A28/server/_core/vite.ts` - Vite dev/static serving (68 lines)

## Database Files
- `/home/user/Billing-A28/drizzle/schema.ts` - Database schema (260 lines) ← All 13 tables defined
- `/home/user/Billing-A28/drizzle.config.ts` - Drizzle configuration (15 lines)
- `/home/user/Billing-A28/server/db.ts` - Database operations (1125 lines) ← All DB functions

## API Routes
- `/home/user/Billing-A28/server/routers.ts` - All tRPC routes (1388 lines) ← 8 main routers

## Frontend
- `/home/user/Billing-A28/client/src/main.tsx` - Client entry point (76 lines)
- `/home/user/Billing-A28/client/src/App.tsx` - Router setup (72 lines)
- `/home/user/Billing-A28/client/src/lib/trpc.ts` - Client tRPC config (4 lines)
- `/home/user/Billing-A28/client/index.html` - HTML template (28 lines)

## Configuration
- `/home/user/Billing-A28/vite.config.ts` - Frontend build (44 lines)
- `/home/user/Billing-A28/tsconfig.json` - TypeScript config (23 lines)
- `/home/user/Billing-A28/package.json` - Dependencies & scripts (115 lines)

## Session & Auth
- `/home/user/Billing-A28/server/sessionStorage.ts` - Guest sessions (in-memory)
- `/home/user/Billing-A28/server/_core/cookies.ts` - Cookie configuration (49 lines)
- `/home/user/Billing-A28/server/_core/sdk.ts` - OAuth SDK client (190 lines)

## Utilities
- `/home/user/Billing-A28/shared/types.ts` - Type exports
- `/home/user/Billing-A28/shared/const.ts` - Constants (6 lines)
- `/home/user/Billing-A28/shared/_core/errors.ts` - Error classes (20 lines)

## Total Lines of Code
- Server DB layer: 1,125 lines
- tRPC routes: 1,388 lines
- Database schema: 260 lines
- Other core files: ~600 lines
- **Total backend: ~3,400 lines**

## Number of Client Pages
- **23 page components** in `/home/user/Billing-A28/client/src/pages/`
  - 94 total client source files (TSX/TS)

## Key Metrics
- **Database tables:** 13
- **tRPC routers:** 8 (auth, cptCodes, payers, plans, rates, multipliers, scenarios, admin, valuations, system)
- **API endpoints:** 80+ (queries + mutations)
- **Client routes:** 21+ page routes
- **npm packages:** 90+ (dependencies + devDependencies)

## Build Output Structure
```
dist/
├── public/              # Frontend build output
│   ├── index.html      # Entry HTML
│   ├── assets/         # CSS, JS bundles
│   └── ...
└── index.js            # Bundled Express server
```

## Environment Variables Checklist
Required:
- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] OAUTH_SERVER_URL
- [ ] VITE_APP_ID
- [ ] OWNER_OPEN_ID
- [ ] NODE_ENV=production

Optional:
- [ ] BUILT_IN_FORGE_API_URL
- [ ] BUILT_IN_FORGE_API_KEY
- [ ] VITE_APP_TITLE
- [ ] VITE_APP_LOGO
- [ ] VITE_ANALYTICS_ENDPOINT
- [ ] VITE_ANALYTICS_WEBSITE_ID

## Database Tables Quick Reference
1. `users` - User accounts
2. `cptCodes` - Medical procedure codes
3. `payers` - Insurance providers
4. `plans` - Insurance plans
5. `rates` - Billing rates (9 variants per CPT)
6. `institutions` - Healthcare institutions
7. `sites` - Care delivery locations
8. `providers` - Healthcare providers
9. `scenarios` - Billing scenarios
10. `scenarioDetails` - Procedure mix
11. `valuations` - Provider valuations
12. `valuationActivities` - Activities within valuations
13. `calculationSettings` - Global multipliers

## Current Build Scripts
```bash
npm run dev                    # Dev server with hot reload
npm run build                  # Build for production
npm start                      # Run production build
npm run check                  # Type check
npm run test                   # Run tests
npm run db:push                # Run migrations
```
