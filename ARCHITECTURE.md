# Healthcare Billing Application - Codebase Architecture Analysis

## Project Overview
Provider Reimbursement Tool - A full-stack TypeScript/React application for healthcare provider revenue attribution, scenario calculations, and valuations management.

**Project Root:** `/home/user/Billing-A28`

## 1. Directory Structure

```
/home/user/Billing-A28/
├── client/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── main.tsx          # Entry point with tRPC client setup
│   │   ├── App.tsx           # Router configuration
│   │   ├── pages/            # 23 page components
│   │   ├── components/       # UI components (Radix UI + shadcn/ui)
│   │   ├── contexts/         # React contexts (Theme, etc.)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility libraries (trpc.ts, guestSession.ts)
│   │   └── _core/            # Core functionality (useAuth.ts)
│   ├── public/               # Static assets
│   └── index.html            # HTML template
├── server/                    # Backend (Express + tRPC)
│   ├── _core/
│   │   ├── index.ts          # Main Express server entry point
│   │   ├── trpc.ts           # tRPC initialization & middleware
│   │   ├── context.ts        # tRPC context factory
│   │   ├── oauth.ts          # OAuth callback routes
│   │   ├── vite.ts           # Vite dev & static serving
│   │   ├── sdk.ts            # OAuth SDK client
│   │   ├── cookies.ts        # Session cookie configuration
│   │   ├── env.ts            # Environment variable exports
│   │   ├── systemRouter.ts   # Health & owner notification endpoints
│   │   ├── notification.ts   # Email notifications
│   │   ├── llm.ts            # LLM integrations
│   │   ├── voiceTranscription.ts
│   │   ├── map.ts            # Geolocation/map utilities
│   │   └── types/            # TypeScript type definitions
│   ├── db.ts                 # Database operations (1125 lines)
│   ├── routers.ts            # All tRPC routes (1388 lines)
│   ├── sessionStorage.ts     # In-memory guest session storage
│   ├── storage.ts            # File storage utilities
│   └── tests/                # Server tests
├── drizzle/                   # Database migrations
│   ├── schema.ts             # Complete database schema
│   ├── relations.ts          # Table relationships
│   ├── migrations/           # Migration files
│   └── meta/                 # Migration metadata
├── shared/                    # Shared code
│   ├── types.ts              # Type exports
│   ├── const.ts              # Constants
│   └── _core/errors.ts       # Error classes
├── scripts/                   # Utility scripts
├── patches/                   # Dependency patches
├── package.json              # Dependencies & scripts
├── vite.config.ts            # Frontend build config
├── drizzle.config.ts         # Database config
├── tsconfig.json             # TypeScript config
└── vitest.config.ts          # Test configuration
```

## 2. Express Server Setup (`/home/user/Billing-A28/server/_core/index.ts`)

**Key Features:**
- Loads environment variables via `dotenv`
- Creates Express app with HTTP server
- Configures JSON/URL-encoded body parser (50MB limit)
- Registers OAuth callback routes (`/api/oauth/callback`)
- Mounts tRPC middleware at `/api/trpc`
- Serves static files or Vite dev server based on NODE_ENV
- Auto-discovers available port (3000 default, fallback to 3000-3020)

**Development Mode:**
- Uses Vite dev server for hot module reloading
- Serves client with middleware mode
- Auto-transforms index.html and serves via catch-all route

**Production Mode:**
- Serves pre-built static files from `dist/public`
- Falls back to index.html for SPA routing

## 3. tRPC Configuration

### Core Files:
- **`/server/_core/trpc.ts`** - Router initialization with SuperJSON transformer
- **`/server/_core/context.ts`** - Context factory with auth & guest session
- **`/server/routers.ts`** - All route definitions (1388 lines)
- **`/client/src/lib/trpc.ts`** - Client-side tRPC setup

### Authentication & Middleware:
```
publicProcedure         - No auth required
protectedProcedure      - Authenticated user required
guestOrAuthProcedure    - Guests OR authenticated users allowed
adminProcedure          - Admin role required
```

### Context Type:
```typescript
type TrpcContext = {
  req: Express.Request;
  res: Express.Response;
  user: User | null;          // From JWT/OAuth
  guestSessionId: string | null;
  isGuest: boolean;
};
```

## 4. API Routes (tRPC Routers)

### Router Structure: `appRouter` with sub-routers:

#### **auth** - Authentication
- `me` - Get current user
- `logout` - Clear session cookie

#### **cptCodes** - Medical Procedure Codes
- `list`, `getById`, `create` (admin), `update` (admin), `delete` (admin)

#### **payers** - Insurance Payers
- `list`, `getById`, `create`, `update`, `delete` (admin only)

#### **plans** - Insurance Plans
- `list`, `listByPayer`, `create`, `update`, `delete` (admin)

#### **rates** - Billing Rates
- `list`, `listWithDetails`, `getById`, `getByCptCode`
- `create`, `update` (admin), `delete` (admin)
- `bulkImport` - Batch import rates from CSV
- **Note:** Rates stored as cents (integer) to avoid decimals

#### **multipliers** - Payer Multipliers
- `list`, `getById`, `create`, `update`, `delete` (admin)
- Stores: professionalMultiplier, technicalMultiplier, globalMultiplier

#### **scenarios** - Reimbursement Scenarios
- `list`, `getById`, `getWithDetails`
- `create`, `calculate` - Complex revenue calculation
- `delete`
- Supports: Guest storage, user session storage, admin database storage

#### **admin** - Administrative Functions
- `listUsers`, `setRole` - User management
- `getCalculationSettings`, `updateCalculationSettings`
- Institution CRUD: `listInstitutions`, `createInstitution`, etc.
- Provider CRUD: `listProviders`, `createProvider`, etc.
- Site CRUD: `listSites`, `createSite`, etc.
- Test scenario generation

#### **valuations** - Provider Valuations
- `list`, `getById`, `getWithDetails`
- `create`, `update`, `delete`
- `calculate` - Calculate earned vs attributed revenue
- `bulkEdit` - Batch update valuations
- Complex revenue attribution with provider types (Type1/Type2/Type3)

#### **system** - System Operations
- `health` - Health check endpoint
- `notifyOwner` - Send admin notifications

## 5. Database Setup (Drizzle ORM)

### Configuration: `/home/user/Billing-A28/drizzle.config.ts`
```typescript
dialect: "mysql"
connectionString: from DATABASE_URL env var
```

### Key Database Tables:

#### **Users** (`users`)
- id (PK), openId (unique), name, email, loginMethod, role, createdAt, updatedAt, lastSignedIn

#### **Medical Data**
- `cptCodes` - Procedure codes with RVU values
- `rates` - 3-dimensional: CPT × Component (Prof/Tech/Global) × SiteType × PayerType
  - Stored as cents (integer)

#### **Organizations**
- `institutions` - Healthcare institutions (with shortName, active flag)
- `sites` - Care delivery locations (Article28 or FPA site types)
- `providers` - Healthcare providers (Type1/Type2/Type3)
- `payers` - Insurance payers (Medicare/Medicaid/Commercial)
- `plans` - Specific insurance plans per payer

#### **Billing Data**
- `scenarios` - User-created billing scenarios
- `scenarioDetails` - CPT codes within scenarios
- `scenarioProviderActivities` - Provider activity tracking
- `payerMultipliers` - Rate multipliers by payer

#### **Valuation Data**
- `valuations` - Provider valuations (links provider + institution/site)
- `valuationActivities` - CPT activities within valuations
- `calculationSettings` - Global multipliers (commercialTechnical=1.5x, medicaidTechnical=0.8x)

### Database Functions: `/server/db.ts` (1125 lines)
- User operations: `upsertUser`, `getUserByOpenId`, `updateUserRole`
- CPT operations: `getAllCptCodes`, `createCptCode`, `updateCptCode`
- Rate operations: `getAllRates`, `createRate`, `updateRate`, `getRatesWithDetails`
- Scenario operations: `createScenario`, `getScenarioWithDetails`, `getScenarioById`
- Valuation operations: Complete CRUD suite
- Institution/Provider/Site operations: Full management
- Calculation: `getCalculationSettings`, `upsertCalculationSettings`

## 6. Frontend Vite Configuration (`/home/user/Billing-A28/vite.config.ts`)

**Build Output:**
- Root: `client/` directory
- Public dir: `client/public/`
- Build output: `dist/public/`

**Vite Plugins:**
- `@vitejs/plugin-react` - React Fast Refresh
- `@tailwindcss/vite` - Tailwind CSS integration
- `@builder.io/vite-plugin-jsx-loc` - JSX location tracking
- `vite-plugin-manus-runtime` - Custom runtime plugin

**Path Aliases:**
```
@ → client/src
@shared → shared
@assets → attached_assets
```

**Environment File:** Uses root directory for `.env` files

## 7. Package.json Scripts & Dependencies

### Build Scripts:
```
dev:      NODE_ENV=development tsx watch server/_core/index.ts
build:    vite build && esbuild server/_core/index.ts (bundles to dist/)
start:    NODE_ENV=production node dist/index.js
check:    tsc --noEmit
test:     vitest run
db:push:  drizzle-kit generate && drizzle-kit migrate
```

### Key Dependencies (v11.6.0):
- **@trpc/client**, **@trpc/server** - RPC framework
- **@trpc/react-query** - React hooks for tRPC
- **@tanstack/react-query** - Data fetching/caching
- **express** ^4.21.2 - HTTP server
- **drizzle-orm** ^0.44.5 - Database ORM
- **mysql2** ^3.15.0 - MySQL driver
- **react** ^19.1.1 - UI framework
- **tailwindcss** ^4.1.14 - Styling
- **@radix-ui/** - Headless UI components (13 packages)
- **react-hook-form** - Form handling
- **zod** - Schema validation
- **jose** - JWT signing
- **openai** - LLM integration
- **superjson** - JSON serialization with type preservation

### Dev Dependencies:
- **vite** ^7.1.7 - Frontend bundler
- **typescript** 5.9.3
- **esbuild** ^0.25.0 - Server bundler
- **tsx** ^4.20.6 - TypeScript executor
- **vitest** ^2.1.4 - Test framework
- **drizzle-kit** ^0.31.4 - Migration tool

## 8. Environment Variables

### Configuration File: `/server/_core/env.ts`
```typescript
export const ENV = {
  appId: process.env.VITE_APP_ID,
  cookieSecret: process.env.JWT_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  oAuthServerUrl: process.env.OAUTH_SERVER_URL,
  ownerOpenId: process.env.OWNER_OPEN_ID,
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL,
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY,
};
```

### Required Environment Variables:
- **DATABASE_URL** - MySQL connection string
- **JWT_SECRET** - Cookie signing secret
- **OAUTH_SERVER_URL** - OAuth provider base URL
- **VITE_APP_ID** - Application identifier
- **OWNER_OPEN_ID** - Bootstrap admin user ID
- **NODE_ENV** - "development" or "production"
- **PORT** - Server port (default: 3000)

### Optional Environment Variables:
- **BUILT_IN_FORGE_API_URL** - Forge API endpoint
- **BUILT_IN_FORGE_API_KEY** - Forge API key
- **VITE_APP_TITLE** - App title in index.html
- **VITE_APP_LOGO** - App icon URL
- **VITE_ANALYTICS_ENDPOINT** - Umami analytics URL
- **VITE_ANALYTICS_WEBSITE_ID** - Analytics site ID

### Cookie Configuration:
- **Name:** `app_session_id`
- **Duration:** 1 year (if user stays logged in)
- **HttpOnly:** true
- **SameSite:** none (for cross-domain requests)
- **Secure:** true (HTTPS only in production, auto-detected via x-forwarded-proto)
- **Path:** /

## 9. Client Pages (Frontend Routes)

**23 Page Components in `/client/src/pages/`:**

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Home.tsx | Landing page |
| `/auth` | AuthPage.tsx | OAuth login |
| `/guest` | GuestRedirect.tsx | Guest mode entry |
| `/dashboard` | Dashboard.tsx | User dashboard |
| `/rates` | RatesManagement.tsx | View/edit billing rates |
| `/payers` | PayersManagement.tsx | Insurance payer config |
| `/scenarios` | ScenarioBuilder.tsx | Create billing scenarios |
| `/scenarios/:id` | ScenarioResults.tsx | View scenario results |
| `/valuations` | ValuationList.tsx | List provider valuations |
| `/valuations/new` | ValuationBuilder.tsx | Create valuation |
| `/valuations/:id` | ValuationResults.tsx | View valuation results |
| `/valuations/:id/edit` | EditValuation.tsx | Edit valuation |
| `/valuations/bulk-edit` | BulkEditValuations.tsx | Batch edit valuations |
| `/valuations/compare` | ValuationComparison.tsx | Compare multiple valuations |
| `/valuations/analytics` | ValuationAnalytics.tsx | Analytics dashboard |
| `/admin` | AdminPanel.tsx | Admin control panel |
| `/admin/institutions` | ManageInstitutions.tsx | Institution CRUD |
| `/admin/sites` | ManageSites.tsx | Site CRUD |
| `/admin/providers` | ManageProviders.tsx | Provider CRUD |
| `/admin/test-scenarios` | TestScenarios.tsx | Test data generator |
| `/404` | NotFound.tsx | 404 page |

## 10. Key Architecture Patterns

### Authentication Flow:
1. User clicks login → redirected to `/auth`
2. OAuth redirect → `/api/oauth/callback` with code & state
3. Server exchanges code for token
4. User data stored in DB via `upsertUser`
5. Session JWT cookie set
6. Redirect to home page

### Guest Session System:
- Guests get temporary session ID (no login required)
- Session data stored in-memory in `sessionStorage.ts`
- Sent via `x-guest-session-id` header
- Rates & scenarios isolated per guest session
- No database persistence

### Calculation Engine:
- Scenarios store: procedures, payer mix (Medicare/Commercial/Medicaid %)
- Rate lookup: CPT × Component × SiteType × PayerType
- Calculation: quantity × weighted_average_rate (by payer mix)
- Results: FPA Global vs Article28 (Prof + Tech split)

### File Structure Patterns:
- `_core` folders: Core infrastructure/utilities
- `contexts` & `hooks`: React state management
- `pages` vs `components`: Page containers vs reusable components
- Type exports via `shared/types.ts` for consistency

## 11. Important Implementation Details

### Rate Storage:
- Rates stored as **cents** (integers, e.g., 14400 cents = $144.00)
- All display & calculations must divide by 100

### Data Storage Modes:
1. **Database (Admin)** - Persisted for admin users
2. **Session (User)** - In-memory for non-admin users
3. **Session (Guest)** - In-memory for unauthenticated users

### Provider Types:
- **Type1** - Bills own institution, earned revenue to their institution
- **Type2** - Bills different institution, earned revenue to home institution
- **Type3** - Ordering-only provider, no earned revenue

### Revenue Attribution:
- **Earned Revenue** - Actual RVUs/dollars to institution based on provider type
- **Attributed Revenue** - Tracking for ordering physician, separate calculation

### Build Artifacts:
- Frontend: `dist/public/` (static HTML/CSS/JS)
- Server: `dist/index.js` (bundled Express server)
- Both served from single `dist/` directory for Vercel deployment

## 12. Performance & Security Considerations

**Performance:**
- Vite for fast dev server rebuild
- esbuild for server bundling
- SuperJSON for efficient data serialization
- React Query for client-side caching
- Rate limiting on file uploads (50MB max)

**Security:**
- JWT-based session tokens (via jose library)
- HttpOnly cookies prevent XSS token access
- Admin role validation on all mutations
- Environment variables for secrets
- Type safety via Zod validation
- CORS-aware cookie handling (SameSite=none for cross-domain)

## 13. Deployment Architecture for Vercel

### Current Build Process:
```
npm run build
  ├─ vite build (client → dist/public/)
  └─ esbuild server (server → dist/index.js)
```

### Required Changes for Vercel Serverless:
1. Convert Express server to Vercel Functions
2. Database connection pooling for serverless
3. Remove port detection logic
4. Environment variables via Vercel UI
5. Build output configuration

## File Summary

| File | Lines | Purpose |
|------|-------|---------|
| `/server/db.ts` | 1125 | Database operations |
| `/server/routers.ts` | 1388 | tRPC route definitions |
| `/drizzle/schema.ts` | 260 | Database schema |
| `/server/_core/index.ts` | 66 | Express server entry |
| `/server/_core/trpc.ts` | 59 | tRPC setup |
| `/client/src/main.tsx` | 76 | Client entry |
| `/vite.config.ts` | 44 | Frontend build config |
| `/package.json` | 115 | Dependencies |

---

**Key Takeaway for Vercel Deployment:**
This is a classic Express + React monorepo with tRPC API. The server and client are built separately but served from the same Express instance. For Vercel, you'll need to convert to serverless functions while maintaining the database connection strategy.
