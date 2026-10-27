import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { AdmissionError } from '@/lib/passwords';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const fingerprint = String(body.fingerprint || '').trim();
    const isAd = body.is_ad !== false && body.isAd !== false;
    const sourceKey = String(body.source_key || body.sourceKey || 'ffzy');
    const segmentDuration = Number(body.segment_duration || body.segmentDuration || 15);

    if (!fingerprint) {
      return NextResponse.json({ error: '缺少广告指纹' }, { status: 400 });
    }

    let record = await prisma.adFingerprint.findUnique({ where: { fingerprint } });
    if (!record) {
      record = await prisma.adFingerprint.create({
        data: {
          fingerprint,
          sourceKey,
          segmentDuration,
          confirmVotes: 0,
          rejectVotes: 0,
          isConfirmed: false,
        },
      });
    }

    const existingVote = await prisma.adFingerprintVote.findUnique({
      where: {
        fingerprintId_userId: {
          fingerprintId: record.id,
          userId: user.id,
        },
      },
    });

    if (!existingVote) {
      await prisma.adFingerprintVote.create({
        data: {
          fingerprintId: record.id,
          userId: user.id,
          isAd,
        },
      });

      const confirmVotes = record.confirmVotes + (isAd ? 1 : 0);
      const rejectVotes = record.rejectVotes + (isAd ? 0 : 1);
      const total = confirmVotes + rejectVotes;
      const isConfirmed = confirmVotes >= 5 && confirmVotes / Math.max(1, total) >= 0.8;

      record = await prisma.adFingerprint.update({
        where: { id: record.id },
        data: {
          confirmVotes,
          rejectVotes,
          isConfirmed,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      fingerprint: record.fingerprint,
      confirm_votes: record.confirmVotes,
      reject_votes: record.rejectVotes,
      is_confirmed: record.isConfirmed,
    });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: '投票失败' }, { status: 500 });
  }
}
