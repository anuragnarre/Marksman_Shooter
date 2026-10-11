// app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';

const memoryFeedback: any[] = [];

export async function GET() {
  return NextResponse.json(memoryFeedback);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      role: string;
      ratings: Record<string, number>;
      texts: Record<string, string>;
    };

    const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const entry = {
      id,
      role: body.role,
      ratings: body.ratings || {},
      texts: body.texts || {},
      created_at: new Date().toISOString(),
    };
    memoryFeedback.unshift(entry);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
