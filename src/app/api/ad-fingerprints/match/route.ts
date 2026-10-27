import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sourceKey = (searchParams.get('sourceKey') || '').trim();
  const records = await prisma.adFingerprint.findMany({
    where: sourceKey ? { sourceKey } : undefined,
    take: 20,
  });
  return NextResponse.json({
    ok: true,
    segments: records,
    matches: records.map((r) => ({
      fingerprint: r.fingerprint,
      source_key: r.sourceKey,
      segment_duration: r.segmentDuration,
      confirm_votes: r.confirmVotes,
      reject_votes: r.rejectVotes,
      is_confirmed: r.isConfirmed,
    })),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fingerprints: string[] = Array.isArray(body.fingerprints)
      ? body.fingerprints.map((f: unknown) => String(f))
      : body.fingerprint
        ? [String(body.fingerprint)]
        : [];

    const records = fingerprints.length
      ? await prisma.adFingerprint.findMany({
          where: { fingerprint: { in: fingerprints } },
        })
      : await prisma.adFingerprint.findMany({ take: 10 });

    return NextResponse.json({
      ok: true,
      matches: records.map((r) => ({
        fingerprint: r.fingerprint,
        source_key: r.sourceKey,
        segment_duration: r.segmentDuration,
        confirm_votes: r.confirmVotes,
        reject_votes: r.rejectVotes,
        is_confirmed: r.isConfirmed,
      })),
    });
  } catch {
    return NextResponse.json({ ok: true, matches: [] });
  }
}
