import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/workspaces/[id] - Get a single workspace
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const db = await getDb();

    // Try to find by ID or slug
    const result = await db.execute({
      sql: 'SELECT * FROM workspaces WHERE id = ? OR slug = ?',
      args: [id, id],
    });
    const workspace = result.rows[0];

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    return NextResponse.json(workspace);
  } catch (error) {
    console.error('Failed to fetch workspace:', error);
    return NextResponse.json({ error: 'Failed to fetch workspace' }, { status: 500 });
  }
}

// PATCH /api/workspaces/[id] - Update a workspace
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { name, description, icon } = body;

    const db = await getDb();

    // Check workspace exists
    const existingResult = await db.execute({
      sql: 'SELECT * FROM workspaces WHERE id = ?',
      args: [id],
    });
    if (!existingResult.rows[0]) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      values.push(icon);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    await db.execute({
      sql: `UPDATE workspaces SET ${updates.join(', ')} WHERE id = ?`,
      args: values,
    });

    const workspaceResult = await db.execute({
      sql: 'SELECT * FROM workspaces WHERE id = ?',
      args: [id],
    });
    return NextResponse.json(workspaceResult.rows[0]);
  } catch (error) {
    console.error('Failed to update workspace:', error);
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 });
  }
}

// DELETE /api/workspaces/[id] - Delete a workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const db = await getDb();

    // Don't allow deleting the default workspace
    if (id === 'default') {
      return NextResponse.json({ error: 'Cannot delete the default workspace' }, { status: 400 });
    }

    // Check workspace exists
    const existingResult = await db.execute({
      sql: 'SELECT * FROM workspaces WHERE id = ?',
      args: [id],
    });
    if (!existingResult.rows[0]) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check if workspace has tasks or agents
    const taskCountResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM tasks WHERE workspace_id = ?',
      args: [id],
    });
    const taskCount = taskCountResult.rows[0] as unknown as { count: number };

    const agentCountResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM agents WHERE workspace_id = ?',
      args: [id],
    });
    const agentCount = agentCountResult.rows[0] as unknown as { count: number };

    if (taskCount.count > 0 || agentCount.count > 0) {
      return NextResponse.json({
        error: 'Cannot delete workspace with existing tasks or agents',
        taskCount: taskCount.count,
        agentCount: agentCount.count
      }, { status: 400 });
    }

    await db.execute({
      sql: 'DELETE FROM workspaces WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete workspace:', error);
    return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 });
  }
}
