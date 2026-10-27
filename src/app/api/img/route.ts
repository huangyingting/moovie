import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url') || '';
  if (!rawUrl || (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://'))) {
    return NextResponse.redirect(new URL('/static/img/placeholder.svg', request.url));
  }
  return NextResponse.redirect(rawUrl);
}
