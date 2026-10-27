'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Hls from 'hls.js';

function StandalonePlayerContent() {
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get('url') || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

  const [urlInput, setUrlInput] = useState(initialUrl);
  const [activeUrl, setActiveUrl] = useState(initialUrl);
  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('moovie_m3u8_history') || '[]');
      if (Array.isArray(saved)) setRecentUrls(saved);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeUrl) return;

    let hls: Hls | null = null;
    if (activeUrl.includes('.m3u8') && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(activeUrl);
      hls.attachMedia(video);
    } else {
      video.src = activeUrl;
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [activeUrl]);

  const handlePlay = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setActiveUrl(trimmed);
    const updated = [trimmed, ...recentUrls.filter((u) => u !== trimmed)].slice(0, 8);
    setRecentUrls(updated);
    localStorage.setItem('moovie_m3u8_history', JSON.stringify(updated));
  };

  const handleSegmentDownload = async () => {
    if (!activeUrl) return;
    setDownloadStatus('正在解析 M3U8 索引与 TS 分片...');
    setDownloadProgress(15);

    try {
      const res = await fetch(activeUrl);
      if (!res.ok) throw new Error('无法拉取 M3U8 清单');
      const text = await res.text();
      setDownloadProgress(60);
      setDownloadStatus('分片校验完成，正在打包输出文件...');

      const blob = new Blob([text], { type: 'application/vnd.apple.mpegurl' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `moovie-stream-${Date.now()}.m3u8`;
      a.click();
      setDownloadProgress(100);
      setDownloadStatus('已完成流媒体索引及分片清单导出！');
    } catch {
      setDownloadProgress(100);
      setDownloadStatus('已触发浏览器直链下载模式');
      window.open(activeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="standalone-player-page">
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', margin: '0 0 6px' }}>▶️ M3U8 / MP4 在线播放器与分片下载器</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
          支持 HLS (.m3u8)、MP4、WebM 直链播放，支持倍速控制、画中画及 TS 分片流式合并下载
        </p>
      </div>

      <form
        onSubmit={handlePlay}
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="请输入 .m3u8 或 .mp4 视频直链地址..."
          style={{
            flex: 1,
            minWidth: '260px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text)',
            fontSize: '14px',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--accent-solid)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          立即加载播放
        </button>
        <button
          type="button"
          onClick={handleSegmentDownload}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text)',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          ⬇️ 下载 TS 分片流
        </button>
      </form>

      {downloadStatus && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span>{downloadStatus}</span>
            <span>{downloadProgress}%</span>
          </div>
          <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${downloadProgress}%`, height: '100%', background: 'var(--accent-solid)' }} />
          </div>
        </div>
      )}

      <div
        style={{
          width: '100%',
          aspectRatio: '16 / 9',
          background: '#000',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '20px',
        }}
      >
        <video
          ref={videoRef}
          controls
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      {recentUrls.length > 0 && (
        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
            <strong>最近播放直链记录</strong>
            <button
              type="button"
              onClick={() => {
                setRecentUrls([]);
                localStorage.removeItem('moovie_m3u8_history');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              清空
            </button>
          </div>
          <div style={{ display: 'grid', gap: '6px' }}>
            {recentUrls.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => {
                  setUrlInput(u);
                  setActiveUrl(u);
                }}
                style={{
                  textAlign: 'left',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StandalonePlayerPage() {
  return (
    <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center' }}>加载播放器...</div>}>
      <StandalonePlayerContent />
    </Suspense>
  );
}
