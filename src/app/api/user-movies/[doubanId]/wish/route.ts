import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { AdmissionError } from '@/lib/passwords';

export async function POST(
  _request: Request,
  context: { params: Promise<{ doubanId: string }> }
) {
  try {
    const user = await requireUser();
    const { doubanId } = await context.params;

    const movie = await prisma.movie.findUnique({ where: { doubanId } });
    if (!movie) {
      return NextResponse.json({ error: '影片不存在' }, { status: 404 });
    }

    const existing = await prisma.userMovie.findUnique({
      where: { userId_movieId: { userId: user.id, movieId: movie.id } },
    });

    if (existing && existing.status === 'wish') {
      await prisma.userMovie.delete({ where: { id: existing.id } });
      await prisma.movie.update({
        where: { id: movie.id },
        data: { wishCount: { decrement: movie.wishCount > 0 ? 1 : 0 } },
      });
      return NextResponse.json({ ok: true, status: null, wished: false });
    }

    const updated = await prisma.userMovie.upsert({
      where: { userId_movieId: { userId: user.id, movieId: movie.id } },
      create: {
        userId: user.id,
        movieId: movie.id,
        doubanId,
        status: 'wish',
      },
      update: {
        status: 'wish',
      },
    });

    await prisma.movie.update({
      where: { id: movie.id },
      data: { wishCount: { increment: 1 } },
    });

    return NextResponse.json({ ok: true, status: updated.status, wished: true });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
