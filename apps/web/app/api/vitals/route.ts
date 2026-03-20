// apps/web/app/api/vitals/route.ts
// Thin proxy: Arduino → Next.js → NestJS backend
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function GET() {
  return NextResponse.json(
    { status: 'ok', method: 'POST required', hint: 'Send a POST with X-Device-Key header and JSON body { type, heart_rate, spo2 }' },
    { status: 200 },
  );
}

export async function POST(req: NextRequest) {
  const deviceKey =
    req.headers.get('x-device-key') ??
    req.nextUrl.searchParams.get('key') ??
    '';

  if (!deviceKey) {
    return NextResponse.json({ error: 'Missing device key' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const res = await fetch(`${API_URL}/biometrics/vitals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Key': deviceKey,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: 'Proxy error', detail: (err as Error).message },
      { status: 502 },
    );
  }
}
