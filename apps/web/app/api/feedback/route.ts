// app/api/feedback/route.ts
// Feedback is logged to Vercel function logs (no database yet).
// View submissions: Vercel Dashboard → Functions → /api/feedback → Logs

import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([]);
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

    console.log('[FEEDBACK]', JSON.stringify(entry));

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}
