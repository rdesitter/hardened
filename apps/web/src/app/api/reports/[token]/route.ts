import { NextRequest, NextResponse } from 'next/server';

const HONO_API_URL = process.env.HONO_API_URL ?? 'http://api:4000';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    // Reports are public — no internal token needed
    const res = await fetch(`${HONO_API_URL}/api/reports/${token}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'API unavailable' }, { status: 502 });
  }
}
