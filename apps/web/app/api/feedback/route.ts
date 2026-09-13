// app/api/feedback/route.ts
// Stores feedback in Vercel Postgres (next_dec database).

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id         TEXT PRIMARY KEY,
      role       TEXT NOT NULL,
      ratings    JSONB NOT NULL DEFAULT '{}',
      texts      JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function GET() {
  try {
    await ensureTable();
    const { rows } = await sql`
      SELECT id, role, ratings, texts, created_at AS at
      FROM feedback
      ORDER BY created_at DESC
      LIMIT 200
    `;
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[FEEDBACK GET]', err);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      role: string;
      ratings: Record<string, number>;
      texts: Record<string, string>;
    };

    const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await ensureTable();
    await sql`
      INSERT INTO feedback (id, role, ratings, texts)
      VALUES (
        ${id},
        ${body.role},
        ${JSON.stringify(body.ratings)},
        ${JSON.stringify(body.texts)}
      )
    `;

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[FEEDBACK POST]', err);
    return NextResponse.json({ message: 'Failed to save feedback' }, { status: 500 });
  }
}
