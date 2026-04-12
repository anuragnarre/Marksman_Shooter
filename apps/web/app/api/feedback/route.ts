// app/api/feedback/route.ts
// Receives role-aware feedback submissions and logs them to Vercel function logs.
// (Vercel serverless filesystem is read-only, so file persistence is not possible.)

import { NextRequest, NextResponse } from 'next/server';

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

    // Logs are visible in Vercel dashboard → Functions → /api/feedback → Logs
    console.log('[FEEDBACK]', JSON.stringify(entry));

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}
