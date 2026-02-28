/**
 * Albert Exec Proxy API
 * 
 * Proxies commands to Albert on Jeff Bander's Mac Mini via ngrok.
 * This allows the Mission Control dashboard to send commands to Albert
 * without exposing the ngrok URL/API key to the client.
 */

import { NextRequest, NextResponse } from 'next/server';

const ALBERT_EXEC_URL = process.env.ALBERT_EXEC_URL || 'https://0edd74ebfbf5.ngrok.app/exec';
const ALBERT_API_KEY = process.env.ALBERT_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, cwd } = body;

    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }

    if (!ALBERT_API_KEY) {
      return NextResponse.json(
        { error: 'Albert API key not configured. Set ALBERT_API_KEY in .env.local' },
        { status: 500 }
      );
    }

    const response = await fetch(ALBERT_EXEC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ALBERT_API_KEY,
      },
      body: JSON.stringify({
        command,
        cwd: cwd || '/Users/jeffbot/clawd/repos/bot-channel',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Albert exec failed: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Albert Exec] Error:', error);
    return NextResponse.json(
      { error: `Failed to reach Albert: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 502 }
    );
  }
}

export async function GET() {
  // Health check - verify Albert is reachable
  try {
    if (!ALBERT_API_KEY) {
      return NextResponse.json({
        status: 'unconfigured',
        message: 'Albert API key not set',
        url: ALBERT_EXEC_URL,
      });
    }

    const response = await fetch(ALBERT_EXEC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ALBERT_API_KEY,
      },
      body: JSON.stringify({
        command: 'echo "Albert is alive"',
        cwd: '/tmp',
      }),
    });

    if (response.ok) {
      return NextResponse.json({
        status: 'online',
        message: 'Albert is reachable on Mac Mini',
        url: ALBERT_EXEC_URL,
      });
    } else {
      return NextResponse.json({
        status: 'error',
        message: `Albert returned ${response.status}`,
        url: ALBERT_EXEC_URL,
      });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'offline',
      message: `Cannot reach Albert: ${error instanceof Error ? error.message : 'Unknown error'}`,
      url: ALBERT_EXEC_URL,
    });
  }
}
