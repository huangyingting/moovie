import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import { AdmissionError } from '@/lib/passwords';

export async function GET() {
  try {
    await requireRole(['ADMIN', 'EDITOR']);
    const items = await prisma.contentFilter.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, items });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: 'Failed to load filters' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole(['ADMIN', 'EDITOR']);
    const body = await request.json();
    const keyword = String(body.keyword || '').trim();
    if (!keyword) {
      return NextResponse.json({ ok: false, error: '请输入过滤关键词' }, { status: 400 });
    }

    const filter = await prisma.contentFilter.upsert({
      where: { keyword },
      create: {
        keyword,
        isBlocked: Boolean(body.isBlocked),
        isCopyright: Boolean(body.isCopyright),
        isSensitive: Boolean(body.isSensitive),
        note: body.note ? String(body.note).trim() : null,
      },
      update: {
        isBlocked: Boolean(body.isBlocked),
        isCopyright: Boolean(body.isCopyright),
        isSensitive: Boolean(body.isSensitive),
        note: body.note ? String(body.note).trim() : null,
      },
    });

    await writeAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'CONTENT_FILTER_UPSERTED',
      targetType: 'ContentFilter',
      targetId: filter.id,
      metadata: {
        keyword: filter.keyword,
        isBlocked: filter.isBlocked,
        isCopyright: filter.isCopyright,
        isSensitive: filter.isSensitive,
      },
    });

    return NextResponse.json({ ok: true, filter });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: '保存过滤规则失败' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requireRole(['ADMIN', 'EDITOR']);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || '';
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
    }
    await prisma.contentFilter.deleteMany({ where: { id } });
    await writeAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'CONTENT_FILTER_DELETED',
      targetType: 'ContentFilter',
      targetId: id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: '删除失败' }, { status: 500 });
  }
}
