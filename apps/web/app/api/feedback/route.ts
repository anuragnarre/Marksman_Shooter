// app/api/feedback/route.ts
// Stores feedback in Vercel KV when configured, otherwise logs to function logs.

import { NextRequest, NextResponse } from 'next/server';

const KV_LIST_KEY = 'feedback:entries';
const KV_ENABLED  = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

export async function GET() {
  if (!KV_ENABLED) {
    return NextResponse.json([]);
  }
  try {
    const { kv } = await import('@vercel/kv');
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

    if (KV_ENABLED) {
      const { kv } = await import('@vercel/kv');
      await kv.lpush(KV_LIST_KEY, entry);
      await kv.ltrim(KV_LIST_KEY, 0, 499);
    } else {
      console.log('[FEEDBACK]', JSON.stringify(entry));
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}
