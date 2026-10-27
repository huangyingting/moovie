import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import { AdmissionError } from '@/lib/passwords';

export async function POST(request: Request) {
  try {
    const actor = await requireRole(['ADMIN', 'EDITOR']);
    const body = await request.json();
    const slug = String(body.slug || '').trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();
    const isPublished = body.isPublished !== false;
    const items: Array<{ doubanId: string; note?: string }> = Array.isArray(body.items)
      ? body.items
      : [];

    if (!slug || !title || !description) {
      return NextResponse.json(
        { ok: false, error: '请完整填写片单标识 (slug)、标题和导语' },
        { status: 400 }
      );
    }

    const list = await prisma.curatedList.upsert({
      where: { slug },
      create: {
        slug,
        title,
        description,
        isPublished,
      },
      update: {
        title,
        description,
        isPublished,
      },
    });

    if (items.length > 0) {
      await prisma.curatedListItem.deleteMany({ where: { listId: list.id } });
      let rank = 1;
      for (const item of items) {
        const doubanId = String(item.doubanId || '').trim();
        if (!doubanId) continue;
        const movie = await prisma.movie.findUnique({ where: { doubanId } });
        if (!movie) continue;
        await prisma.curatedListItem.create({
          data: {
            listId: list.id,
            movieId: movie.id,
            doubanId: movie.doubanId,
            rank: rank++,
            note: String(item.note || '编辑精选推荐').trim(),
          },
        });
      }
    }

    await writeAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'CURATED_LIST_SAVED',
      targetType: 'CuratedList',
      targetId: list.id,
      metadata: { slug: list.slug, title: list.title, isPublished },
    });

    return NextResponse.json({ ok: true, list });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: '保存片单失败' }, { status: 500 });
  }
}
