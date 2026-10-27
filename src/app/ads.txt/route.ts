import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse(
    '# Moovie 影牛 Authorized Digital Sellers (ads.txt)\n# Contact: moovie@c2v2.com\n',
    {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    }
  );
}
