// app/api/feedback/route.ts
// Stores feedback in Vercel KV (Redis). Falls back to console.log if KV is not configured.

import { NextRequest, NextResponse } from 'next/server';

const KV_LIST_KEY = 'feedback:entries';

async function getKv() {
  try {
    const { kv } = await import('@vercel/kv');
    return kv;
  } catch {
    return null;
  }
}

export async function GET() {
  const kv = await getKv();
  if (!kv) {
    return NextResponse.json([]);
  }
  try {
    const entries = await kv.lrange(KV_LIST_KEY, 0, 199);
    return NextResponse.json(entries);
  } catch {
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

    const entry = {
      id:      `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      role:    body.role,
      ratings: body.ratings,
      texts:   body.texts,
      at:      new Date().toISOString(),
    };

    const kv = await getKv();
    if (kv) {
      // Prepend so newest is first; keep last 500 entries
      await kv.lpush(KV_LIST_KEY, entry);
      await kv.ltrim(KV_LIST_KEY, 0, 499);
    } else {
      // Fallback: log to Vercel function logs if KV not configured
      console.log('[FEEDBACK]', JSON.stringify(entry));
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}
