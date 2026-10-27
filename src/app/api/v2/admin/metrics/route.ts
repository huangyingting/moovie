import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { AdmissionError } from '@/lib/passwords';

export async function GET() {
  try {
    await requireRole(['ADMIN', 'EDITOR']);
    const [users, movies, sources, episodes, lists, comments, invitations, auditLogs] = await Promise.all([
      prisma.user.count(),
      prisma.movie.count(),
      prisma.playbackSource.count(),
      prisma.episode.count(),
      prisma.curatedList.count(),
      prisma.comment.count(),
      prisma.accountInvitation.count(),
      prisma.auditLog.count(),
    ]);

    return NextResponse.json({
      ok: true,
      version: 'v4.2.1',
      catalog: {
        movies,
        sources,
        episodes,
        lists,
      },
      community: {
        users,
        comments,
        invitations,
        auditLogs,
      },
      metrics: {
        users,
        movies,
        sources,
        episodes,
        lists,
        comments,
        invitations,
        auditLogs,
      },
    });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
