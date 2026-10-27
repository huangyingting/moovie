import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ready', db: 'connected', version: 'v4.2.1' });
  } catch (err) {
    return NextResponse.json(
      { status: 'not_ready', error: err instanceof Error ? err.message : 'db_error' },
      { status: 503 }
    );
  }
}
