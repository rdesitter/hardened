import { NextRequest, NextResponse } from 'next/server';
import { proxyToHono } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const res = await proxyToHono('/api/scans', {
      method: 'POST',
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'API unavailable' }, { status: 502 });
  }
}

export async function GET() {
  try {
    const res = await proxyToHono('/api/scans');
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'API unavailable' }, { status: 502 });
  }
}
