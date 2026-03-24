// NextAuth has been removed. Auth is handled directly by the NestJS backend.
// This file is kept to avoid Next.js build warnings about missing route handlers.
import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ error: 'Not used' }, { status: 404 });
}

export function POST() {
  return NextResponse.json({ error: 'Not used' }, { status: 404 });
}
