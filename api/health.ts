import { getDb } from "../server/db";

export const config = {
  runtime: 'nodejs20.x',
  maxDuration: 10,
};

export default async function handler(request: Request): Promise<Response> {
  const startTime = Date.now();

  try {
    // Check database connectivity
    const db = await getDb();
    const dbStatus = db ? 'connected' : 'disconnected';

    const healthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      database: dbStatus,
      latency: `${Date.now() - startTime}ms`,
      version: process.env.npm_package_version || '1.0.0',
    };

    return new Response(JSON.stringify(healthResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      latency: `${Date.now() - startTime}ms`,
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
