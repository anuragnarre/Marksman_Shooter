// apps/web/app/api/vitals/route.ts
// Thin proxy: Arduino → Next.js → NestJS backend
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function GET() {
  return NextResponse.json(
    { status: 'ok', method: 'POST required', hint: 'Send a POST with JSON body { heartRate, spo2 }' },
    { status: 200 },
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Device key from header, query param, or body.deviceId (legacy Arduino format)
    const deviceKey =
      req.headers.get('x-device-key') ??
      req.nextUrl.searchParams.get('key') ??
      body.deviceId ??
      '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (deviceKey) {
      headers['X-Device-Key'] = deviceKey;
    }

    const res = await fetch(`${API_URL}/biometrics/vitals`, {
      method: 'POST',
      headers,
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
