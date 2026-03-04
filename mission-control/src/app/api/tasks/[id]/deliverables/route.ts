/**
 * Task Deliverables API
 * Endpoints for managing task deliverables (files, URLs, artifacts)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { broadcast } from '@/lib/events';
import { CreateDeliverableSchema } from '@/lib/validation';
import { existsSync } from 'fs';
import path from 'path';
import type { TaskDeliverable } from '@/lib/types';

/**
 * GET /api/tasks/[id]/deliverables
 * Retrieve all deliverables for a task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const db = await getDb();

    const result = await db.execute({
      sql: `
        SELECT *
        FROM task_deliverables
        WHERE task_id = ?
        ORDER BY created_at DESC
      `,
      args: [taskId],
    });
    const deliverables = result.rows as unknown as TaskDeliverable[];

    return NextResponse.json(deliverables);
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliverables' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks/[id]/deliverables
 * Add a new deliverable to a task
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();

    // Validate input with Zod
    const validation = CreateDeliverableSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { deliverable_type, title, path, description } = validation.data;

    // Validate file existence for file deliverables
    let fileExists = true;
    let normalizedPath = path;
    if (deliverable_type === 'file' && path) {
      // Expand tilde
      normalizedPath = path.replace(/^~/, process.env.HOME || '');
      fileExists = existsSync(normalizedPath);
      if (!fileExists) {
        console.warn(`[DELIVERABLE] Warning: File does not exist: ${normalizedPath}`);
      }
    }

    const db = await getDb();
    const id = crypto.randomUUID();

    // Insert deliverable
    await db.execute({
      sql: `
        INSERT INTO task_deliverables (id, task_id, deliverable_type, title, path, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        taskId,
        deliverable_type,
        title,
        path || null,
        description || null,
      ],
    });

    // Get the created deliverable
    const deliverableResult = await db.execute({
      sql: `
        SELECT *
        FROM task_deliverables
        WHERE id = ?
      `,
      args: [id],
    });
    const deliverable = deliverableResult.rows[0] as unknown as TaskDeliverable;

    // Broadcast to SSE clients
    broadcast({
      type: 'deliverable_added',
      payload: deliverable,
    });

    // Return with warning if file doesn't exist
    if (deliverable_type === 'file' && !fileExists) {
      return NextResponse.json(
        {
          ...deliverable,
          warning: `File does not exist at path: ${normalizedPath}. Please create the file.`
        },
        { status: 201 }
      );
    }

    return NextResponse.json(deliverable, { status: 201 });
  } catch (error) {
    console.error('Error creating deliverable:', error);
    return NextResponse.json(
      { error: 'Failed to create deliverable' },
      { status: 500 }
    );
  }
}
