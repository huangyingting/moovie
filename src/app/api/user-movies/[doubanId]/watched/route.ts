import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { AdmissionError } from '@/lib/passwords';

export async function POST(
  request: Request,
  context: { params: Promise<{ doubanId: string }> }
) {
  try {
    const user = await requireUser();
    const { doubanId } = await context.params;

    const movie = await prisma.movie.findUnique({ where: { doubanId } });
    if (!movie) {
      return NextResponse.json({ error: '影片不存在' }, { status: 404 });
    }

    let rating = 5;
    let commentText = '';
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      rating = Math.min(5, Math.max(1, Number(body.rating || 5)));
      commentText = String(body.comment || '').trim().slice(0, 500);
    } else {
      const formData = await request.formData();
      rating = Math.min(5, Math.max(1, Number(formData.get('rating') || 5)));
      commentText = String(formData.get('comment') || '').trim().slice(0, 500);
    }

    const now = new Date();
    const userMovie = await prisma.userMovie.upsert({
      where: { userId_movieId: { userId: user.id, movieId: movie.id } },
      create: {
        userId: user.id,
        movieId: movie.id,
        doubanId,
        status: 'watched',
        rating,
        comment: commentText || null,
        watchedAt: now,
      },
      update: {
        status: 'watched',
        rating,
        comment: commentText || null,
        watchedAt: now,
      },
    });

    await prisma.movie.update({
      where: { id: movie.id },
      data: { watchedCount: { increment: 1 } },
    });

    let reviewId: string | null = null;
    if (commentText) {
      const existingComment = await prisma.comment.findFirst({
        where: { movieId: movie.id, userId: user.id },
      });
      if (existingComment) {
        const updatedComment = await prisma.comment.update({
          where: { id: existingComment.id },
          data: {
            rating,
            content: commentText,
            authorName: user.name || '片友',
            authorAvatar: user.avatar || '🎬',
            isFeatured: user.isPublic,
          },
        });
        reviewId = updatedComment.id;
      } else {
        const createdComment = await prisma.comment.create({
          data: {
            movieId: movie.id,
            doubanId,
            userId: user.id,
            authorName: user.name || '片友',
            authorAvatar: user.avatar || '🎬',
            rating,
            content: commentText,
            isFeatured: user.isPublic,
          },
        });
        reviewId = createdComment.id;
      }
    }

    return NextResponse.json({
      ok: true,
      userMovie,
      reviewId,
    });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}
