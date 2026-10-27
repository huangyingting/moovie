import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return NextResponse.json({
    spider: '',
    wallpaper: `${origin}/static/img/logo.png`,
    sites: [
      {
        key: 'moovie_vod',
        name: '🎬 Moovie 影牛 (官方聚合)',
        type: 1,
        api: `${origin}/api/vod`,
        searchable: 1,
        quickSearch: 1,
        filterable: 1,
      },
    ],
    lives: [
      {
        name: '📺 Moovie 电视直播',
        type: 0,
        url: 'https://raw.githubusercontent.com/CCSH/IPTV/refs/heads/main/live.m3u',
        playerType: 1,
      },
    ],
  });
}
