'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

type ChannelItem = {
  id: string;
  name: string;
  group: string;
  url: string;
};

const PRESET_CHANNELS: ChannelItem[] = [
  {
    id: 'cctv1',
    name: 'CCTV-1 综合高清',
    group: '央视频道',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
  {
    id: 'cctv6',
    name: 'CCTV-6 电影频道',
    group: '央视频道',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
  {
    id: 'cctv5',
    name: 'CCTV-5 体育赛事',
    group: '体育竞技',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
  {
    id: 'hunan',
    name: '湖南卫视 HD',
    group: '地方卫视',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
  {
    id: 'zhejiang',
    name: '浙江卫视 HD',
    group: '地方卫视',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
  {
    id: 'doc-nat',
    name: '4K 纪实人文探索',
    group: '纪录电影',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
];

export default function IptvPage() {
  const [channels, setChannels] = useState<ChannelItem[]>(PRESET_CHANNELS);
  const [activeChannel, setActiveChannel] = useState<ChannelItem>(PRESET_CHANNELS[0]);
  const [activeGroup, setActiveGroup] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [customM3uUrl, setCustomM3uUrl] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('moovie_iptv_favs') || '[]');
      if (Array.isArray(saved)) setFavorites(saved);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeChannel) return;

    let hls: Hls | null = null;
    if (activeChannel.url.includes('.m3u8') && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(activeChannel.url);
      hls.attachMedia(video);
    } else {
      video.src = activeChannel.url;
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [activeChannel]);

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    setFavorites(next);
    localStorage.setItem('moovie_iptv_favs', JSON.stringify(next));
  };

  const handleLoadCustomM3u = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customM3uUrl.trim();
    if (!trimmed) return;
    if (trimmed.endsWith('.m3u8')) {
      const customChan: ChannelItem = {
        id: `custom_${Date.now()}`,
        name: `自定义频道 (${trimmed.slice(0, 28)}...)`,
        group: '自定义源',
        url: trimmed,
      };
      setChannels((prev) => [customChan, ...prev]);
      setActiveChannel(customChan);
      setCustomM3uUrl('');
    }
  };

  const groups = ['全部', '收藏频道', ...Array.from(new Set(channels.map((c) => c.group)))];

  const filteredChannels = channels.filter((c) => {
    if (activeGroup === '收藏频道' && !favorites.includes(c.id)) return false;
    if (activeGroup !== '全部' && activeGroup !== '收藏频道' && c.group !== activeGroup) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="iptv-page">
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', margin: '0 0 6px' }}>📡 IPTV 电视直播中心</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
          聚合全球及国内高清电视频道 · 支持自定义 M3U 订阅源与频道收藏
        </p>
      </div>

      {/* Custom M3U Source Bar */}
      <form
        onSubmit={handleLoadCustomM3u}
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '18px',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="url"
          value={customM3uUrl}
          onChange={(e) => setCustomM3uUrl(e.target.value)}
          placeholder="输入自定义 M3U / M3U8 直播流地址添加至频道列表..."
          style={{
            flex: 1,
            minWidth: '240px',
            padding: '9px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text)',
            fontSize: '13px',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '9px 18px',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--accent-solid)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          导入直播源
        </button>
      </form>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)',
          gap: '18px',
        }}
      >
        {/* Live Video Player */}
        <div>
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px 10px 0 0',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderBottom: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '14px' }}>
              🔴 正在直播：{activeChannel?.name}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {activeChannel?.group}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              background: '#000',
              borderRadius: '0 0 10px 10px',
              overflow: 'hidden',
            }}
          >
            <video
              ref={videoRef}
              controls
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Channel Sidebar */}
        <div
          id="iptv-sidebar"
          className="iptv-sidebar"
          style={{
            padding: '14px',
            borderRadius: '10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <input
            type="text"
            id="iptv-channel-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索频道名称..."
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '13px',
            }}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {groups.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setActiveGroup(g)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '14px',
                  border: '1px solid var(--border)',
                  background: activeGroup === g ? 'var(--accent-solid)' : 'var(--bg)',
                  color: activeGroup === g ? '#fff' : 'var(--text)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {g}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
            {filteredChannels.map((c) => {
              const isSelected = activeChannel?.id === c.id;
              const isFav = favorites.includes(c.id);
              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: isSelected ? 'var(--accent-light)' : 'var(--bg)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveChannel(c)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text)',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '13px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      flex: 1,
                    }}
                  >
                    {c.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(c.id)}
                    title="收藏频道"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: isFav ? '#f5a623' : 'var(--text-muted)',
                      fontSize: '15px',
                    }}
                  >
                    {isFav ? '★' : '☆'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
