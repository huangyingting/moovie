import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const count = user
    ? await prisma.notification.count({
        where: { userId: user.id, isRead: false },
      })
    : 0;

  const accept = request.headers.get('accept') || '';
  if (accept.includes('application/json')) {
    return NextResponse.json({ count });
  }

  const html = count > 0 ? `<span class="notification-badge">${count}</span>` : '';
  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
