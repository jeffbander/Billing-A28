/**
 * Albert Status API
 * 
 * Returns the current status of Albert (the OpenClaw bot on Jeff's Mac Mini).
 * Checks both the ngrok exec endpoint and the OpenClaw gateway connection.
 */

import { NextResponse } from 'next/server';

const ALBERT_EXEC_URL = process.env.ALBERT_EXEC_URL || 'https://0edd74ebfbf5.ngrok.app/exec';
const ALBERT_API_KEY = process.env.ALBERT_API_KEY || '';

export async function GET() {
  const status: {
    albert: {
      reachable: boolean;
      url: string;
      lastCheck: string;
      error?: string;
    };
    gateway: {
      configured: boolean;
      url: string;
    };
    config: {
      hasApiKey: boolean;
      hasGatewayToken: boolean;
    };
  } = {
    albert: {
      reachable: false,
      url: ALBERT_EXEC_URL,
      lastCheck: new Date().toISOString(),
    },
    gateway: {
      configured: !!process.env.OPENCLAW_GATEWAY_URL,
      url: process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:18789',
    },
    config: {
      hasApiKey: !!ALBERT_API_KEY,
      hasGatewayToken: !!process.env.OPENCLAW_GATEWAY_TOKEN,
    },
  };

  // Check Albert's ngrok endpoint
  if (ALBERT_API_KEY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(ALBERT_EXEC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': ALBERT_API_KEY,
        },
        body: JSON.stringify({
          command: 'echo "heartbeat"',
          cwd: '/tmp',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      status.albert.reachable = response.ok;
    } catch (error) {
      status.albert.reachable = false;
      status.albert.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  return NextResponse.json(status);
}
