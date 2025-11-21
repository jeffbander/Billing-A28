# Vercel Serverless Deployment Guide

## Current Architecture Analysis

Your application is currently built as a traditional monolith:
1. Express server bundles the entire app
2. Vite builds frontend to `dist/public/`
3. esbuild bundles server to `dist/index.js`
4. Single entry point serves both API and static files

## Challenges for Vercel Serverless

### Issue 1: Port Detection
Your server auto-discovers ports 3000-3020. Vercel Functions don't expose ports.

**Current Code (server/_core/index.ts):**
```typescript
const preferredPort = parseInt(process.env.PORT || "3000");
const port = await findAvailablePort(preferredPort);
server.listen(port, () => { ... });
```

**Vercel Functions:** No `listen()` - they export a handler function instead.

### Issue 2: Static File Serving
Your server serves static files from `dist/public/`. Vercel can handle this better with:
- Edge functions for dynamic routing
- Static file serving via CDN

**Current pattern:**
```typescript
if (process.env.NODE_ENV === "development") {
  await setupVite(app, server);
} else {
  serveStatic(app);  // Express.static
}
```

**Vercel Pattern:** Deploy frontend separately, API runs as serverless function.

### Issue 3: Vite Dev Server
Your production build still includes Vite dev server setup. This adds ~5MB to bundle.

### Issue 4: Database Connections
MySQL connections from Vercel Functions need pooling. Each function invocation should reuse connections.

**Current Issue:** Each Express app instance creates new DB connection via `getDb()`.

## Migration Strategy: Three Options

### Option A: Traditional Node.js Hosting (Easiest)
Deploy to Vercel as Node.js application (doesn't use serverless).

**Changes needed:** Minimal
- Add `vercel.json`
- Set environment variables in Vercel UI
- Done!

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

**Pros:** 
- Minimal code changes
- Keeps current Express structure
- Full control over ports

**Cons:**
- Uses reserved instances (costs more)
- Not true serverless

### Option B: Serverless with Manual Conversion (Medium Effort)
Create Vercel Functions for API, separate frontend deployment.

**Steps:**
1. Keep Express as-is but export handler for Vercel
2. Move static files to `public/` directory
3. Create `api/` directory with catch-all route

**New structure:**
```
api/
├── trpc/[...].ts        # tRPC handler
└── oauth/
    └── callback.ts      # OAuth callback

public/                  # Frontend dist files
├── index.html
├── assets/
└── ...

vercel.json             # Config
```

**Implementation:**
```typescript
// api/trpc/[...].ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from '../../server/routers';
import { createContext } from '../../server/_core/context';

const app = express();
app.use(express.json());
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;
```

**Pros:**
- True serverless
- Lower costs
- Better scaling

**Cons:**
- Moderate refactoring
- Cold start times

### Option C: Full Serverless Refactor (Hard)
Break apart Express and use Vercel's native patterns.

- No Express at all
- Each endpoint is separate function
- No session storage in-memory
- Use external session store (Redis)

**Not recommended** for your scale/timeline.

## Recommended: Option A (Traditional Node.js)

### Steps:

1. **Create `vercel.json`:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install --frozen-lockfile",
  "devCommand": "npm run dev",
  "env": {
    "NODE_ENV": "production"
  }
}
```

2. **Update `package.json` build:**
```json
{
  "build": "vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
}
```

3. **Ensure entry point works:**
- `dist/index.js` is the Vercel entry point
- Current code works as-is!

4. **Environment Variables in Vercel Dashboard:**
```
DATABASE_URL=mysql://user:pass@host/db
JWT_SECRET=your-secret-key
OAUTH_SERVER_URL=https://oauth.provider.com
VITE_APP_ID=your-app-id
OWNER_OPEN_ID=your-owner-id
NODE_ENV=production
```

5. **Deploy:**
```bash
npm install -g vercel
vercel login
vercel --prod
```

## Database Connection Pooling (Important!)

Your current connection pattern creates new connection per request:
```typescript
let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      _db = null;
    }
  }
  return _db;
}
```

**For Vercel + Traditional Node, this is fine** - same process per instance.

But if using serverless later, you'd need:
```typescript
import { createPool } from 'mysql2/promise';

const pool = createPool({
  connectionLimit: 5,  // Lower for serverless
  uri: process.env.DATABASE_URL,
});

// Reuse pool across invocations
```

## Expected File Changes

**Files that need NO changes:**
- `/server/_core/index.ts` - Works as-is
- `/server/routers.ts` - No changes
- `/server/db.ts` - Works with connection reuse
- All client code - No changes

**Files that need update:**
- `vercel.json` - Create new file
- `.gitignore` - Already has dist/

**No code refactoring required!**

## Deployment Checklist

- [ ] Create `vercel.json`
- [ ] Verify build works locally: `npm run build`
- [ ] Test production locally: `NODE_ENV=production npm start`
- [ ] Add all env vars in Vercel dashboard
- [ ] Test OAuth URLs work from Vercel domain
- [ ] Test database connections from Vercel region
- [ ] Monitor initial deployment for errors
- [ ] Test all major features after deploy

## Database Region Considerations

**Current:** Local or single host

**Vercel:** Runs in US/EU/APAC regions

**Solution:** Use DBaaS with global regions:
- PlanetScale (MySQL-compatible)
- Supabase (PostgreSQL)
- Railway (MySQL)

These provide:
- Connection pooling
- Regional redundancy
- Automatic backups
- Pay-per-use pricing

## Cost Estimates

**Option A (Traditional Node):**
- Reserved Instance: $7-40/month depending on size
- Database: $10-100+/month
- Static files: Free (served from instance)
- Total: $17-140/month

**Option B (Serverless with separate frontend):**
- Functions: $0.50 per 1M requests + compute time
- Database: $10-100+/month
- Frontend CDN: Free (Vercel CDN included)
- Total: $10-150/month (depends on usage)

For healthcare billing app with moderate traffic, **Option A is more predictable**.

## Security Considerations

When deploying:
1. Database password in CONNECTION_STRING only
2. JWT_SECRET: Use 32+ char random string
3. CORS: Client-side fetch already sets `credentials: include`
4. Cookie: HttpOnly set automatically by Express
5. HTTPS: Vercel enforces for all domains

## Monitoring & Debugging

**After deployment:**

1. Check logs:
```bash
vercel logs -f          # Follow logs
```

2. Monitor database:
- Connection count
- Query performance
- Long-running transactions

3. Test critical paths:
- OAuth login
- Rate calculation
- Database queries

## Timeline

- **Option A setup:** 30 minutes
- **Testing:** 1-2 hours
- **Deployment:** 10 minutes
- **Total:** 2-3 hours

## Post-Deployment

1. Monitor for 24 hours
2. Test from different regions
3. Monitor database connection pool
4. Set up error tracking (Sentry, etc.)
5. Monitor costs

---

**Next Step:** Create `vercel.json` and test local build, then deploy to Vercel!
