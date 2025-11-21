# Vercel Deployment Guide

This guide covers deploying the Provider Reimbursement Tool to Vercel with serverless architecture.

## Architecture Overview

### Before (Express Server)
```
┌─────────────────────────────────────────────────┐
│ Express Server (Long-running)                   │
│  ├── tRPC API (/api/trpc)                       │
│  ├── OAuth callback (/api/oauth/callback)       │
│  └── Static file serving                        │
└─────────────────────────────────────────────────┘
```

### After (Vercel Serverless)
```
┌─────────────────────────────────────────────────┐
│ Vercel Edge Network (CDN)                       │
│  └── Static assets (React app)                  │
├─────────────────────────────────────────────────┤
│ Serverless Functions                            │
│  ├── /api/trpc/[trpc].ts (tRPC handler)         │
│  ├── /api/oauth/callback.ts (OAuth)             │
│  ├── /api/auth/logout.ts (Session logout)       │
│  └── /api/health.ts (Health check)              │
└─────────────────────────────────────────────────┘
```

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MySQL Database**: External MySQL database accessible from the internet
   - Recommended: PlanetScale, Railway, or AWS RDS
3. **OAuth Configuration**: OAuth server URL and credentials

## Environment Variables

Configure these in your Vercel project settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | Secret for signing JWT tokens | `your-secure-random-string-at-least-32-chars` |
| `VITE_APP_ID` | Application ID for OAuth | `your-app-id` |
| `OAUTH_SERVER_URL` | OAuth server endpoint | `https://oauth.example.com` |
| `OWNER_OPEN_ID` | Admin user's OpenID | `admin-open-id` |
| `NODE_ENV` | Environment mode | `production` |

### Setting Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add each variable above
4. For sensitive values, use Vercel Secrets:
   ```bash
   vercel secrets add database_url "mysql://..."
   vercel secrets add jwt_secret "your-secret"
   ```

## Deployment Steps

### Option A: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd /path/to/project
   vercel deploy --prod
   ```

### Option B: Deploy via GitHub Integration

1. Push code to GitHub repository
2. Connect repository in Vercel Dashboard
3. Configure build settings:
   - **Build Command**: `npm run build:vercel`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

4. Deploy automatically on push

### Option C: Manual Deployment

1. **Build locally**:
   ```bash
   npm run build:vercel
   ```

2. **Deploy build output**:
   ```bash
   vercel deploy --prod
   ```

## Database Configuration

### Connection Pooling for Serverless

The application is configured with serverless-optimized connection pooling:

```typescript
// server/db.ts
mysql.createPool({
  connectionLimit: 5,      // Small pool for serverless
  maxIdle: 5,              // Max idle connections
  idleTimeout: 30000,      // 30 second idle timeout
  enableKeepAlive: true,   // Keep connections alive
});
```

### Recommended Database Providers

| Provider | Pros | Cons |
|----------|------|------|
| **PlanetScale** | Serverless-native, auto-scaling | MySQL compatible only |
| **Railway** | Easy setup, good free tier | Limited regions |
| **AWS RDS** | Full-featured, reliable | Requires VPC config |
| **Supabase** | PostgreSQL with MySQL support | May need schema changes |

### PlanetScale Setup (Recommended)

1. Create account at [planetscale.com](https://planetscale.com)
2. Create a new database
3. Get connection string from **Connect** > **Connect with** > **Node.js**
4. Use the connection string as `DATABASE_URL`

**Note**: PlanetScale connection strings use `?ssl={"rejectUnauthorized":true}`. The app handles SSL automatically.

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/trpc/*` | GET/POST | tRPC API endpoints |
| `/api/oauth/callback` | GET | OAuth callback handler |
| `/api/auth/logout` | POST | Clear session cookie |
| `/api/health` | GET | Health check endpoint |

## Client Configuration

For Vercel deployment, update the tRPC client base URL if needed:

```typescript
// client/src/lib/trpc.ts
export const trpc = createTRPCReact<AppRouter>();

// The base URL is automatically detected from window.location
```

## Limitations & Considerations

### Serverless Cold Starts
- First request after inactivity may take 1-3 seconds
- Database connections are pooled but may need re-establishment
- Consider using Vercel's Edge Functions for latency-critical endpoints

### Function Timeout
- Default: 10 seconds (Hobby), 60 seconds (Pro)
- Current config: 30 seconds max
- Long-running operations may need chunking

### Memory Limits
- Hobby: 1024 MB
- Pro: 3008 MB
- Complex calculations should be optimized

### Session Storage
- In-memory session storage is not persistent across function invocations
- Guest sessions may be lost on cold starts
- Consider using external session store (Redis) for production

### File Uploads
- Max request body: 4.5 MB (free), 50 MB (pro)
- For larger files, use direct S3 uploads

## Monitoring & Debugging

### Health Check
```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "latency": "50ms"
}
```

### Vercel Logs
1. Go to Vercel Dashboard
2. Select your project
3. Navigate to **Deployments** > select deployment > **Functions**
4. View real-time logs

### Error Tracking
Consider integrating:
- Sentry for error tracking
- Vercel Analytics for performance metrics

## Cost Estimation

### Vercel Hobby (Free)
- 100 GB bandwidth
- 100,000 serverless function invocations
- Suitable for development/testing

### Vercel Pro ($20/month)
- 1 TB bandwidth
- 1,000,000 serverless function invocations
- Custom domains
- Advanced analytics

### Database Costs
- PlanetScale: Free tier (1 billion row reads/month)
- Railway: $5/month for hobby
- AWS RDS: ~$15/month for t3.micro

## Troubleshooting

### Common Issues

**1. Database Connection Errors**
- Verify DATABASE_URL format
- Check database allows connections from Vercel IPs
- Ensure SSL is properly configured

**2. OAuth Callback Failures**
- Verify OAUTH_SERVER_URL is correct
- Check redirect URI is whitelisted
- Ensure cookies are being set correctly

**3. tRPC 404 Errors**
- Verify vercel.json rewrites are correct
- Check API function is exported as default
- Ensure function runtime is compatible

**4. Cold Start Timeouts**
- Increase function maxDuration in vercel.json
- Optimize database connection initialization
- Consider Edge Functions for critical paths

### Debug Mode

Enable debug logging by setting:
```
VERCEL_DEBUG=1
```

## Migration Checklist

- [ ] Set up external MySQL database
- [ ] Configure all environment variables in Vercel
- [ ] Test OAuth flow in production
- [ ] Verify database connectivity
- [ ] Test all tRPC endpoints
- [ ] Check guest session handling
- [ ] Monitor cold start performance
- [ ] Set up error tracking
- [ ] Configure custom domain (optional)
- [ ] Enable SSL/HTTPS (automatic with Vercel)

## Rollback Procedure

If deployment fails:
1. Go to Vercel Dashboard > Deployments
2. Find the last working deployment
3. Click **...** > **Promote to Production**

## Support

- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- tRPC Documentation: [trpc.io/docs](https://trpc.io/docs)
- Drizzle ORM: [orm.drizzle.team](https://orm.drizzle.team)
