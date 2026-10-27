import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  if (!Array.isArray(slug) || slug.length < 2) {
    return NextResponse.redirect(new URL('/static/img/placeholder.svg', request.url));
  }
  const [proto, ...rest] = slug;
  if (proto !== 'http' && proto !== 'https') {
    return NextResponse.redirect(new URL('/static/img/placeholder.svg', request.url));
  }
  const targetUrl = `${proto}://${rest.join('/')}`;
  return NextResponse.redirect(targetUrl);
}
