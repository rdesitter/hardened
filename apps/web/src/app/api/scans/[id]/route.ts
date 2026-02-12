import { NextRequest, NextResponse } from 'next/server';
import { proxyToHono } from '@/lib/api';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await proxyToHono(`/api/scans/${id}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
