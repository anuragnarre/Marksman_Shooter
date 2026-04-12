// app/api/feedback/route.ts
// Receives role-aware feedback submissions, persists them to data/feedback.json,
// and exposes a GET endpoint for the admin feedback viewer.

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FEEDBACK_FILE = path.join(process.cwd(), 'data', 'feedback.json');

interface FeedbackEntry {
  id: string;
  role: string;
  ratings: Record<string, number>;
  texts: Record<string, string>;
  at: string;
}

function readAll(): FeedbackEntry[] {
  try {
    if (!fs.existsSync(FEEDBACK_FILE)) return [];
    const raw = fs.readFileSync(FEEDBACK_FILE, 'utf-8');
    return JSON.parse(raw) as FeedbackEntry[];
  } catch {
    return [];
  }
}

function writeAll(entries: FeedbackEntry[]) {
  const dir = path.dirname(FEEDBACK_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

export async function GET() {
  const entries = readAll();
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      role: string;
      ratings: Record<string, number>;
      texts: Record<string, string>;
    };

    const entry: FeedbackEntry = {
      id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      role:    body.role,
      ratings: body.ratings,
      texts:   body.texts,
      at:      new Date().toISOString(),
    };

    const all = readAll();
    all.push(entry);
    writeAll(all);

    console.log('[feedback] saved', { id: entry.id, role: entry.role });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}
