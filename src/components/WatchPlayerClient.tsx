'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Hls from 'hls.js';
import {
  BackdropsGallery,
  MovieActionButtons,
  ShortReviewCard,
  type ReviewCommentView,
} from './MovieDetailInteractions';
import { MovieCard, type MovieCardProps } from './MovieCard';

export type WatchSourceItem = {
  id: string;
  sourceKey: string;
  sourceName: string;
  vodId: string;
  versionLabel: string;
  loadSpeedMs: number;
  stability: string;
  episodes: Array<{
    id: string;
    episodeNumber: number;
    title: string;
    playUrl: string;
    airDate?: string | null;
  }>;
};

type DanmakuItem = {
  id: string;
  text: string;
  time: number;
  color: string;
  mode: number;
};

export function WatchPlayerClient({
  movie,
  sources,
  initialSourceKey,
  initialEpisodeNumber,
  initialUserStatus,
  initialUserRating,
  initialUserComment,
  initialAdSkipEnabled,
  isLoggedIn,
  reviews,
  similarMovies,
}: {
  movie: {
    id: string;
    doubanId: string;
    imdbId?: string | null;
    title: string;
    year: string;
    type: string;
    poster: string;
    rating: number;
    genres: string;
    regions: string;
    directors: string;
    actors: string;
    duration?: string | null;
    summary: string;
    nextAirDate?: string | null;
    watchedCount: number;
    wishCount: number;
    backdrops?: string[];
    doubanReviews?: Array<{
      id?: string;
      author: string;
      rating: number;
      content: string;
      createdAt?: string;
      likes?: number;
    }>;
  };
  sources: WatchSourceItem[];
  initialSourceKey?: string;
  initialEpisodeNumber?: number;
  initialUserStatus?: string | null;
  initialUserRating?: number | null;
  initialUserComment?: string | null;
  initialAdSkipEnabled?: boolean;
  isLoggedIn: boolean;
  reviews: ReviewCommentView[];
  similarMovies: MovieCardProps[];
}) {
  const router = useRouter();
  // Automatic fallback to first available source if requested source_key is missing
  const matchedSource =
    sources.find((s) => s.sourceKey === initialSourceKey) || sources[0] || null;
  const [selectedSourceKey, setSelectedSourceKey] = useState(
    matchedSource?.sourceKey || 'ffzy'
  );
  const currentSource =
    sources.find((s) => s.sourceKey === selectedSourceKey) || sources[0] || null;

  const episodes = currentSource?.episodes || [];
  const [currentEpNum, setCurrentEpNum] = useState<number>(
    initialEpisodeNumber && episodes.some((e) => e.episodeNumber === initialEpisodeNumber)
      ? initialEpisodeNumber
      : episodes[0]?.episodeNumber || 1
  );

  const currentEpisode =
    episodes.find((e) => e.episodeNumber === currentEpNum) || episodes[0] || null;

  const [topSourceOpen, setTopSourceOpen] = useState(false);
  const [inlineSourceOpen, setInlineSourceOpen] = useState(true);
  const [expandAllEpisodes, setExpandAllEpisodes] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [danmakuEnabled, setDanmakuEnabled] = useState(true);
  const [danmakuList, setDanmakuList] = useState<DanmakuItem[]>([]);
  const [danmakuText, setDanmakuText] = useState('');
  const [danmakuColor, setDanmakuColor] = useState('#ffffff');
  const [currentTime, setCurrentTime] = useState(0);
  const [adSkipEnabled, setAdSkipEnabled] = useState(
    initialAdSkipEnabled !== undefined ? Boolean(initialAdSkipEnabled) : true
  );
  const [adToast, setAdToast] = useState<{
    fingerprint: string;
    duration: number;
    skippedAuto: boolean;
  } | null>(null);
  const [nextEpCountdown, setNextEpCountdown] = useState<number | null>(null);
  const [autoPlayDisabled, setAutoPlayDisabled] = useState(false);
  const [failFeedbackSent, setFailFeedbackSent] = useState(false);
  const [candidates, setCandidates] = useState<
    Array<{ source_key: string; source_name: string; latency_ms: number; stability: string }>
  >([]);
  const [showFailoverOverlay, setShowFailoverOverlay] = useState(false);
  const [resumePositionSec, setResumePositionSec] = useState<number | null>(null);
  const [showAdHelpTooltip, setShowAdHelpTooltip] = useState(false);
  const [castExpanded, setCastExpanded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const topSourceWrapRef = useRef<HTMLDivElement>(null);

  const streamKey = `${movie.doubanId}_${currentEpNum}`;

  const formatTimeMmSs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Load danmaku, saved resume position & playback candidates for current streamKey
  useEffect(() => {
    try {
      if (localStorage.getItem('moovie_auto_play_next') === 'false') {
        setAutoPlayDisabled(true);
      }
      if (localStorage.getItem('moovie_danmaku_visible') === '0') {
        setDanmakuEnabled(false);
      }
      const rawState = JSON.parse(localStorage.getItem('moovie_play_state') || '{}');
      const savedEntry = rawState[movie.doubanId];
      if (
        savedEntry &&
        Number(savedEntry.current_time) > 5 &&
        (!savedEntry.episode_number || Number(savedEntry.episode_number) === currentEpNum)
      ) {
        const resumeSec = Math.floor(Number(savedEntry.current_time));
        setResumePositionSec(resumeSec);
        if (videoRef.current) {
          videoRef.current.currentTime = resumeSec;
        }
      } else {
        setResumePositionSec(null);
      }
    } catch {
      // ignore
    }

    let active = true;
    fetch(`/api/danmaku?id=${encodeURIComponent(streamKey)}`)
      .then((r) => r.json())
      .then((res) => {
        if (active && Array.isArray(res.data)) {
          setDanmakuList(res.data);
        }
      })
      .catch(() => {});

    fetch(
      `/api/v2/media-units/${encodeURIComponent(streamKey)}/playback-candidates?ep=${currentEpNum}`
    )
      .then((r) => r.json())
      .then((res) => {
        if (active && Array.isArray(res.candidates)) {
          setCandidates(res.candidates);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [streamKey, currentEpNum]);

  // Attach HLS.js or native video
  useEffect(() => {
    const video = videoRef.current;
    const playUrl = currentEpisode?.playUrl;
    if (!video || !playUrl) return;

    let hls: Hls | null = null;
    if (playUrl.includes('.m3u8') && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(playUrl);
      hls.attachMedia(video);
    } else {
      video.src = playUrl;
    }

    // Report playback start event
    fetch('/api/v2/playback/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        douban_id: movie.doubanId,
        source_key: selectedSourceKey,
        episode: currentEpNum,
        event: 'load',
      }),
    }).catch(() => {});

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [currentEpisode?.playUrl, movie.doubanId, selectedSourceKey, currentEpNum]);

  // Check crowd-sourced ad fingerprints when adSkipEnabled is on
  useEffect(() => {
    if (!adSkipEnabled) {
      setAdToast(null);
      return;
    }
    const candidateFp =
      selectedSourceKey === 'ffzy'
        ? 'sha256_ffzy_discontinuity_15s_slot_01'
        : 'sha256_bfzy_candidate_ad_12s_slot_02';

    fetch('/api/ad-fingerprints/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprints: [candidateFp] }),
    })
      .then((r) => r.json())
      .then((data) => {
        const match = data.matches?.[0];
        if (match) {
          setAdToast({
            fingerprint: match.fingerprint,
            duration: Number(match.segment_duration || 15),
            skippedAuto: Boolean(match.is_confirmed),
          });
        }
      })
      .catch(() => {});
  }, [adSkipEnabled, selectedSourceKey, currentEpNum]);

  // Close top source dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (topSourceWrapRef.current && !topSourceWrapRef.current.contains(e.target as Node)) {
        setTopSourceOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Auto next episode 5-second countdown
  useEffect(() => {
    if (nextEpCountdown === null) return;
    if (nextEpCountdown <= 0) {
      setNextEpCountdown(null);
      const nextEp = episodes.find((e) => e.episodeNumber === currentEpNum + 1);
      if (nextEp) {
        setCurrentEpNum(nextEp.episodeNumber);
      }
      return;
    }
    const timer = setTimeout(() => {
      setNextEpCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [nextEpCountdown, currentEpNum, episodes]);

  const syncProgress = (timeSec: number, durationSec: number) => {
    const entry = {
      douban_id: movie.doubanId,
      title: movie.title,
      poster: movie.poster,
      year: movie.year,
      type: movie.type,
      episode_number: currentEpNum,
      episode_title: currentEpisode?.title || `第${String(currentEpNum).padStart(2, '0')}集`,
      source_key: selectedSourceKey,
      vod_id: currentSource?.vodId || `${movie.doubanId}-${selectedSourceKey}`,
      current_time: Math.round(timeSec),
      duration: Math.max(60, Math.round(durationSec || 3600)),
      updated_at: new Date().toISOString(),
    };

    try {
      const raw = JSON.parse(localStorage.getItem('moovie_play_state') || '{}');
      raw[movie.doubanId] = entry;
      localStorage.setItem('moovie_play_state', JSON.stringify(raw));
    } catch {
      // ignore
    }

    fetch('/api/v2/history/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).catch(() => {});
  };

  const handleSendDanmaku = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = danmakuText.trim();
    if (!text) return;
    const t = videoRef.current?.currentTime || currentTime || 1;
    const optimistic: DanmakuItem = {
      id: `local_${Date.now()}`,
      text,
      time: t,
      color: danmakuColor,
      mode: 0,
    };
    setDanmakuList((prev) => [...prev, optimistic]);
    setDanmakuText('');

    await fetch('/api/danmaku', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: streamKey,
        text,
        time: t,
        color: danmakuColor,
        mode: 0,
      }),
    }).catch(() => {});
  };

  const handleToggleAdSkip = async () => {
    const next = !adSkipEnabled;
    setAdSkipEnabled(next);
    if (!isLoggedIn) return;
    await Promise.all([
      fetch('/api/settings/ad-skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      }).catch(() => {}),
      fetch('/api/settings/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad_skip_enabled: next }),
      }).catch(() => {}),
    ]);
  };

  const handleUndoAdSkip = async () => {
    if (!adToast) return;
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - adToast.duration);
    }
    const fp = adToast.fingerprint;
    const dur = adToast.duration;
    setAdToast(null);
    if (isLoggedIn) {
      await fetch('/api/ad-fingerprints/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint: fp,
          source_key: selectedSourceKey,
          segment_duration: dur,
          is_ad: false,
        }),
      }).catch(() => {});
    }
  };

  const handleReportPlaybackFail = async () => {
    if (failFeedbackSent) return;
    setFailFeedbackSent(true);
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'bug',
        movie_url: `/watch/${movie.doubanId}?source=${selectedSourceKey}&ep=${currentEpNum}`,
        content: `播放失败自动上报：《${movie.title}》 [${selectedSourceKey}] 第${currentEpNum}集 无法正常播放`,
      }),
    }).catch(() => {});
  };

  const handleVoteAd = async (isAd: boolean) => {
    if (!adToast) return;
    if (isAd && videoRef.current) {
      videoRef.current.currentTime += adToast.duration;
    }
    const fp = adToast.fingerprint;
    const dur = adToast.duration;
    setAdToast(null);
    if (isLoggedIn) {
      await fetch('/api/ad-fingerprints/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint: fp,
          source_key: selectedSourceKey,
          segment_duration: dur,
          is_ad: isAd,
        }),
      }).catch(() => {});
    }
  };

  const stabilityBadgeClass = (st: string) => {
    if (st === '稳定') return 'stability-good';
    if (st === '一般') return 'stability-fair';
    if (st === '较差') return 'stability-poor';
    return 'stability-untested';
  };

  const activeDanmakus = danmakuEnabled
    ? danmakuList.filter((d) => Math.abs(d.time - currentTime) <= 4)
    : [];

  const hasPrevEp = episodes.some((e) => e.episodeNumber === currentEpNum - 1);
  const hasNextEp = episodes.some((e) => e.episodeNumber === currentEpNum + 1);

  return (
    <div className="watch-page">
      {/* Top Watch Now Bar + Collapsible Top Source Switcher (v4.1.2 / v4.2.1) */}
      <div className="watch-now-bar-wrapper" ref={topSourceWrapRef} style={{ position: 'relative', marginBottom: '12px' }}>
        <div
          className="watch-now-bar"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href={`/movie/${movie.doubanId}`}
              style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text)', textDecoration: 'none' }}
            >
              {movie.title}
            </Link>
            <span
              style={{
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                fontWeight: 500,
              }}
            >
              {currentEpisode?.title || 'HD中字'}
            </span>
            {movie.rating > 0 && (
              <span style={{ color: '#f5a623', fontSize: '13px', fontWeight: 600 }}>
                ★ {movie.rating.toFixed(1)}
              </span>
            )}
          </div>

          <button
            type="button"
            id="sourceButtonTop"
            className="watch-now-source"
            onClick={() => setTopSourceOpen((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <span
              className="w-source-dot fast"
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--green)',
                display: 'inline-block',
              }}
            />
            <span id="currentSourceLabel">当前线路：{currentSource?.sourceName || '非凡资源'}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              {((currentSource?.loadSpeedMs || 450) / 1000).toFixed(1)}s · {currentSource?.stability || '稳定'}
            </span>
            <span>{topSourceOpen ? '▲' : '▼'}</span>
          </button>
        </div>

        <div
          id="sourcePanelTop"
          className="source-panel-top"
          style={{
            display: topSourceOpen ? 'block' : 'none',
            marginTop: '8px',
            padding: '14px',
            borderRadius: '10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            选择播放线路（点击即刻切换）
          </div>
          <div
            className="source-list"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '8px',
            }}
          >
            {sources.map((src) => {
              const isSelected = src.sourceKey === selectedSourceKey;
              return (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => {
                    setSelectedSourceKey(src.sourceKey);
                    setTopSourceOpen(false);
                  }}
                  className={`source-item ${isSelected ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: isSelected ? 'var(--accent-light)' : 'var(--bg)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ fontWeight: 500 }}>
                    {src.sourceName} <small style={{ color: 'var(--text-secondary)' }}>({src.versionLabel})</small>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{(src.loadSpeedMs / 1000).toFixed(1)}s</span>
                    <span className={`stability-tag ${stabilityBadgeClass(src.stability)}`}>
                      {src.stability}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Video Player Container with Danmaku & Ad-Skip Overlay */}
      <div
        className="player-container"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          background: '#000',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <video
          ref={videoRef}
          controls
          playsInline
          poster={movie.poster}
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime;
            setCurrentTime(t);
            if (Math.floor(t) % 10 === 0 && t > 1) {
              syncProgress(t, e.currentTarget.duration || 3600);
            }
          }}
          onPause={(e) => syncProgress(e.currentTarget.currentTime, e.currentTarget.duration || 3600)}
          onEnded={() => {
            if (hasNextEp) {
              setNextEpCountdown(5);
            }
          }}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />

        {/* Floating Danmaku Overlay */}
        {danmakuEnabled && activeDanmakus.length > 0 && (
          <div
            className="danmaku-layer"
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              right: '16px',
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {activeDanmakus.map((d) => (
              <div
                key={d.id}
                style={{
                  color: d.color || '#fff',
                  textShadow: '1px 1px 3px rgba(0,0,0,0.9)',
                  fontSize: '15px',
                  fontWeight: 600,
                }}
              >
                {d.text}
              </div>
            ))}
          </div>
        )}

        {/* Auto-Resume Position Banner (from player.js) */}
        {resumePositionSec !== null && (
          <div
            id="resume-position-toast"
            className="resume-position-toast"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(23, 24, 27, 0.9)',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              zIndex: 12,
            }}
          >
            <span>⏱️ 已为您定位到上次播放位置: {formatTimeMmSs(resumePositionSec)}</span>
            <button
              type="button"
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime = 0;
                setResumePositionSec(null);
              }}
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.35)',
                background: 'transparent',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              从头播放
            </button>
            <button
              type="button"
              onClick={() => setResumePositionSec(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#bbb',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Crowd-sourced Ad-Skip Banner */}
        {adToast && (
          <div
            id={adToast.skippedAuto ? 'ad-skip-toast' : 'ad-skip-prompt'}
            className={adToast.skippedAuto ? 'ad-skip-toast' : 'ad-skip-prompt ad-skip-toast'}
            style={{
              position: 'absolute',
              top: 'auto',
              bottom: '64px',
              right: '16px',
              background: 'rgba(23, 24, 27, 0.92)',
              color: '#fff',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              zIndex: 10,
              animation: 'none',
            }}
          >
            {adToast.skippedAuto ? (
              <>
                <span>⚡ 已根据片友众包共识自动跳过 {adToast.duration}s 贴片广告</span>
                <button
                  type="button"
                  className="ad-skip-undo"
                  onClick={handleUndoAdSkip}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.35)',
                    background: 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  撤销本次
                </button>
                <button
                  type="button"
                  onClick={() => setAdToast(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#aaa',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </>
            ) : (
              <>
                <span>🔍 检测到疑似广告分片 ({adToast.duration}s)：</span>
                <button
                  type="button"
                  className="ad-prompt-yes"
                  onClick={() => handleVoteAd(true)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: 'var(--accent-solid)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  是广告，跳过
                </button>
                <button
                  type="button"
                  className="ad-prompt-no"
                  onClick={() => handleVoteAd(false)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  不是
                </button>
              </>
            )}
          </div>
        )}

        {/* Stream Failover Alternatives Overlay */}
        {showFailoverOverlay && (
          <div
            className="failover-alternatives"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.84)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              color: '#fff',
              zIndex: 22,
              padding: '20px',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 700 }}>
              📡 切换高可用备用播放线路
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {(candidates.length > 0
                ? candidates
                : sources.map((s) => ({
                    source_key: s.sourceKey,
                    source_name: s.sourceName,
                    latency_ms: s.loadSpeedMs,
                    stability: s.stability,
                  }))
              ).map((cand) => (
                <button
                  key={cand.source_key}
                  type="button"
                  className="failover-alt-btn"
                  onClick={() => {
                    setSelectedSourceKey(cand.source_key);
                    setShowFailoverOverlay(false);
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border:
                      cand.source_key === selectedSourceKey
                        ? '1px solid var(--accent)'
                        : '1px solid rgba(255,255,255,0.3)',
                    background:
                      cand.source_key === selectedSourceKey
                        ? 'var(--accent-solid)'
                        : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  {cand.source_name} · {(cand.latency_ms / 1000).toFixed(1)}s ({cand.stability})
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowFailoverOverlay(false)}
              style={{
                marginTop: '6px',
                background: 'none',
                border: 'none',
                color: '#bbb',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              关闭面板
            </button>
          </div>
        )}

        {/* Auto Next Episode Countdown Overlay (v3.2.8 / v4.2.1) */}
        {nextEpCountdown !== null && !autoPlayDisabled && (
          <div
            className="autoplay-overlay next-episode-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.82)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              color: '#fff',
              zIndex: 20,
            }}
          >
            <div className="autoplay-ring-wrap" style={{ position: 'relative', width: '56px', height: '56px' }}>
              <svg className="autoplay-ring" viewBox="0 0 64 64" width={56} height={56}>
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="4"
                />
                <circle
                  className="ring-fg"
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="4"
                />
              </svg>
              <span
                className="autoplay-countdown"
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '16px',
                }}
              >
                {nextEpCountdown}
              </span>
            </div>
            <div className="autoplay-label" style={{ fontSize: '13px', color: '#ccc' }}>
              即将播放下一集
            </div>
            <div className="autoplay-ep-title" style={{ fontSize: '18px', fontWeight: 700 }}>
              {nextEpCountdown} 秒后自动播放下一集（第 {currentEpNum + 1} 集）
            </div>
            <div className="autoplay-actions" style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="autoplay-btn autoplay-btn-play"
                onClick={() => {
                  setNextEpCountdown(null);
                  setCurrentEpNum(currentEpNum + 1);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--accent-solid)',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                立即播放
              </button>
              <button
                type="button"
                className="autoplay-btn autoplay-btn-cancel"
                onClick={() => setNextEpCountdown(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.4)',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
            </div>
            <label
              className="autoplay-toggle"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#bbb',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={autoPlayDisabled}
                onChange={(e) => {
                  const disabled = e.target.checked;
                  setAutoPlayDisabled(disabled);
                  try {
                    localStorage.setItem('moovie_auto_play_next', disabled ? 'false' : 'true');
                  } catch {
                    // ignore
                  }
                  if (disabled) setNextEpCountdown(null);
                }}
              />
              <span>不再自动播放下一集</span>
            </label>
          </div>
        )}
      </div>

      {/* Danmaku Control Bar */}
      <form
        onSubmit={handleSendDanmaku}
        className="danmaku-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginTop: '10px',
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          flexWrap: 'wrap',
        }}
      >
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={danmakuEnabled}
            onChange={(e) => setDanmakuEnabled(e.target.checked)}
          />
          <span>弹幕 ({danmakuList.length})</span>
        </label>
        <input
          type="color"
          value={danmakuColor}
          onChange={(e) => setDanmakuColor(e.target.value)}
          title="弹幕颜色"
          style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer' }}
        />
        <input
          type="text"
          value={danmakuText}
          onChange={(e) => setDanmakuText(e.target.value)}
          placeholder="发一条友善的弹幕见证此刻..."
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: '13px',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            background: 'var(--accent-solid)',
            color: '#fff',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          发送弹幕
        </button>
      </form>

      {/* Anti-Scam Disclaimer Banner (v3.4.0) */}
      <div
        className="play-disclaimer"
        style={{
          marginTop: '10px',
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'var(--yellow-bg)',
          color: 'var(--text)',
          fontSize: '13px',
          border: '1px solid var(--border)',
        }}
      >
        ⚠️ 免责声明：视频源均来自第三方采集站，请勿相信视频画面中出现的任何赌博、刷单、博彩或投资网址广告，谨防受骗！
      </div>

      {/* Watch Action Row (v4.0.3 / v4.2.1) */}
      <div
        className="watch-action-row"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginTop: '14px',
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <a
            id="downloadCurrentVideo"
            href={`/player?url=${encodeURIComponent(currentEpisode?.playUrl || '')}`}
            className="btn-mark"
            style={{ fontSize: '13px', textDecoration: 'none' }}
          >
            ⬇️ 下载当前视频（第三方）
          </a>
          <button
            type="button"
            id="reportPlaybackFailBtn"
            onClick={handleReportPlaybackFail}
            disabled={failFeedbackSent}
            className="btn-mark"
            style={{ fontSize: '13px', cursor: failFeedbackSent ? 'default' : 'pointer' }}
          >
            {failFeedbackSent ? '✓ 已上报播放失败' : '🛠️ 播放失败反馈'}
          </button>
          <button
            type="button"
            id="triggerFailoverBtn"
            onClick={() => setShowFailoverOverlay((prev) => !prev)}
            className="btn-mark"
            style={{ fontSize: '13px', cursor: 'pointer' }}
          >
            🔄 切换备用源
          </button>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              id="ad-skip-toggle"
              onClick={handleToggleAdSkip}
              className={`btn-mark ${adSkipEnabled ? 'active' : ''}`}
              style={{ fontSize: '13px' }}
            >
              {adSkipEnabled ? '⚡ 智能跳过广告：已开启' : '🛡️ 智能跳过广告：关闭'}
            </button>
            <button
              type="button"
              id="ad-skip-help-btn"
              onClick={() => setShowAdHelpTooltip((prev) => !prev)}
              aria-label="智能跳过广告说明"
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              ?
            </button>
            {showAdHelpTooltip && (
              <div
                className="ad-skip-tooltip"
                style={{
                  position: 'absolute',
                  bottom: '32px',
                  left: 0,
                  width: '280px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
                  fontSize: '12px',
                  lineHeight: 1.55,
                  color: 'var(--text-secondary)',
                  zIndex: 30,
                }}
              >
                基于 M3U8 分片时长指纹与全站片友众包投票，自动识别并跳过源流中插播的贴片广告；如遇误跳可一键撤销。
              </div>
            )}
          </div>
        </div>

        <MovieActionButtons
          doubanId={movie.doubanId}
          title={movie.title}
          initialStatus={initialUserStatus}
          initialRating={initialUserRating}
          initialComment={initialUserComment}
          isLoggedIn={isLoggedIn}
          watchedCount={movie.watchedCount}
          wishCount={movie.wishCount}
        />
      </div>

      {/* Air Schedule Notice (v4.0.0) */}
      {movie.nextAirDate && (
        <div
          className="air-schedule-card"
          style={{
            marginTop: '14px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'var(--accent-light)',
            color: 'var(--accent)',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          📅 追剧日历：{movie.nextAirDate}
        </div>
      )}

      {/* Episode Navigation & Episode Grid (only for series/shows/cartoons with >1 episodes per v4.1.2) */}
      {movie.type !== 'movie' && episodes.length > 1 && (
        <section id="episodesSection" className="episodes-section" style={{ marginTop: '20px' }}>
          <div
            id="episode-navigation"
            className="episode-navigation episode-nav-bar"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginBottom: '12px',
            }}
          >
            <button
              type="button"
              className="episode-nav-btn episode-nav-prev"
              disabled={!hasPrevEp}
              onClick={() => hasPrevEp && setCurrentEpNum(currentEpNum - 1)}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: hasPrevEp ? 'var(--text)' : 'var(--text-muted)',
                cursor: hasPrevEp ? 'pointer' : 'not-allowed',
                fontSize: '13px',
              }}
            >
              ‹ 上一集
            </button>
            <div
              className="episode-nav-current"
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--accent)',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              当前播放：{currentEpisode?.title || `第${currentEpNum}集`}
            </div>
            <button
              type="button"
              className="episode-nav-btn episode-nav-next"
              disabled={!hasNextEp}
              onClick={() => hasNextEp && setCurrentEpNum(currentEpNum + 1)}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: hasNextEp ? 'var(--text)' : 'var(--text-muted)',
                cursor: hasNextEp ? 'pointer' : 'not-allowed',
                fontSize: '13px',
              }}
            >
              下一集 ›
            </button>
          </div>

          <div
            id="episodesGrid"
            className="episodes-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))',
              gap: '8px',
            }}
          >
            {(() => {
              const total = episodes.length;
              const activeIdx = Math.max(
                0,
                episodes.findIndex((e) => e.episodeNumber === currentEpNum)
              );
              const shouldCollapse = total > 30 && !expandAllEpisodes;
              const nodes: React.ReactNode[] = [];
              let lastShown = -1;

              episodes.forEach((ep, i) => {
                const show =
                  !shouldCollapse ||
                  i < 20 ||
                  i >= total - 5 ||
                  Math.abs(i - activeIdx) <= 2;
                if (!show) return;
                if (lastShown !== -1 && i - lastShown > 1) {
                  nodes.push(
                    <span
                      key={`gap-${i}`}
                      className="episode-gap"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '13px',
                      }}
                    >
                      …
                    </span>
                  );
                }
                lastShown = i;
                const active = ep.episodeNumber === currentEpNum;
                nodes.push(
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => setCurrentEpNum(ep.episodeNumber)}
                    className={`episode-btn ${active ? 'active' : ''}`}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: active ? 'var(--accent-solid)' : 'var(--bg-secondary)',
                      color: active ? '#fff' : 'var(--text)',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    {ep.title}
                  </button>
                );
              });
              return nodes;
            })()}
          </div>
          {episodes.length > 30 && (
            <button
              type="button"
              className="episode-expand-btn"
              onClick={() => setExpandAllEpisodes((prev) => !prev)}
              style={{
                marginTop: '10px',
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              {expandAllEpisodes ? '收起选集' : `展开全部 ${episodes.length} 集`}
            </button>
          )}
        </section>
      )}

      {/* Bottom Source Panel (#sourcePanel) */}
      <section
        id="sourcePanel"
        className={`source-panel watch-source-panel ${inlineSourceOpen ? 'open' : ''}`}
        style={{ marginTop: '24px' }}
      >
        <div
          className="watch-source-header"
          onClick={() => setInlineSourceOpen((prev) => !prev)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: inlineSourceOpen ? '12px' : 0,
          }}
        >
          <h2 className="section-title" style={{ fontSize: '16px', margin: 0 }}>
            📡 播放线路 ({sources.length})
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {inlineSourceOpen ? '收起线路 ▲' : '展开线路 ▼'}
          </span>
        </div>
        {inlineSourceOpen && (
          <div
            className="source-list watch-source-list"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '10px',
            }}
          >
            {sources.map((src) => {
              const active = src.sourceKey === selectedSourceKey;
              return (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => setSelectedSourceKey(src.sourceKey)}
                  className={`source-item watch-source-chip ${active ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: active ? 'var(--accent-light)' : 'var(--bg-secondary)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  <span className="watch-source-name" style={{ fontWeight: 600 }}>
                    {src.sourceName}{' '}
                    <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>· {src.versionLabel}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <span className="watch-speed" style={{ color: 'var(--text-muted)' }}>
                      {(src.loadSpeedMs / 1000).toFixed(1)}s
                    </span>
                    <span
                      className="watch-quality-tag"
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background:
                          src.stability === '稳定'
                            ? 'var(--green-bg)'
                            : src.stability === '一般'
                              ? 'var(--yellow-bg)'
                              : 'var(--red-bg)',
                        color:
                          src.stability === '稳定'
                            ? 'var(--green)'
                            : src.stability === '一般'
                              ? 'var(--yellow)'
                              : 'var(--red)',
                        fontWeight: 600,
                      }}
                    >
                      {src.stability}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Unified Movie Info & Detail Card (.watch-info-card, v4.1.2 merged layout) */}
      <section
        className="watch-info-card"
        style={{
          marginTop: '24px',
          padding: '20px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          display: 'grid',
          gridTemplateColumns: movie.poster ? '140px 1fr' : '1fr',
          gap: '20px',
        }}
      >
        {movie.poster && (
          <Link href={`/movie/${movie.doubanId}`}>
            <img
              src={movie.poster}
              alt={movie.title}
              style={{
                width: '140px',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '8px',
                display: 'block',
              }}
            />
          </Link>
        )}

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 className="watch-title" style={{ fontSize: '20px', margin: 0 }}>
                {movie.title} <small style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({movie.year})</small>
              </h2>
              {movie.rating > 0 && (
                <span style={{ color: '#f5a623', fontSize: '15px', fontWeight: 700 }}>
                  ★ {movie.rating.toFixed(1)}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <a
                href={`https://movie.douban.com/subject/${movie.doubanId}/`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '3px 9px',
                  borderRadius: '4px',
                  background: 'var(--green-bg)',
                  color: 'var(--green)',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                豆瓣 ↗
              </a>
              {movie.imdbId && (
                <a
                  href={`https://www.imdb.com/title/${movie.imdbId}/`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '3px 9px',
                    borderRadius: '4px',
                    background: 'var(--yellow-bg)',
                    color: 'var(--yellow)',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  IMDb {movie.imdbId} ↗
                </a>
              )}
              <Link href={`/movie/${movie.doubanId}`} style={{ fontSize: '13px', color: 'var(--accent)' }}>
                独立详情页 →
              </Link>
            </div>
          </div>

          <div className="watch-meta" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            {movie.regions} · {movie.genres} {movie.duration ? `· ${movie.duration}` : ''} · 导演：{movie.directors}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            主演：
            {castExpanded
              ? movie.actors
              : movie.actors.split('/').slice(0, 5).join(' / ')}
            {movie.actors.split('/').length > 5 && (
              <button
                type="button"
                onClick={() => setCastExpanded((prev) => !prev)}
                style={{
                  marginLeft: '6px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {castExpanded ? '收起' : '展开全部'}
              </button>
            )}
          </div>

          <p
            className={`watch-summary ${summaryExpanded ? 'expanded' : ''}`}
            onClick={() => setSummaryExpanded((prev) => !prev)}
            style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: 1.65,
              color: 'var(--text)',
              cursor: 'pointer',
            }}
          >
            {movie.summary}
          </p>
        </div>
      </section>

      {/* TMDB Stills & Backdrops Lightbox on Watch Page (v4.1.2) */}
      {movie.backdrops && movie.backdrops.length > 0 && (
        <BackdropsGallery backdrops={movie.backdrops} title={movie.title} />
      )}

      {/* Douban Featured Reviews on Watch Page (v4.1.2) */}
      {movie.doubanReviews && movie.doubanReviews.length > 0 && (
        <section style={{ marginTop: '28px' }}>
          <h2 className="section-title" style={{ fontSize: '16px', marginBottom: '12px' }}>
            🌱 豆瓣精选短评 ({movie.doubanReviews.length})
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {movie.doubanReviews.map((dr, idx) => (
              <div
                key={dr.id || idx}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '13px' }}>
                  <div>
                    <strong>{dr.author}</strong>{' '}
                    <span style={{ color: '#f5a623' }}>{'★'.repeat(dr.rating || 4)}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {dr.createdAt || '豆瓣热评'} {dr.likes ? `· 👍 ${dr.likes}` : ''}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--text)' }}>
                  {dr.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Short Reviews on Watch Page (v3.4.0) */}
      <section style={{ marginTop: '28px' }}>
        <h2 className="section-title" style={{ fontSize: '16px', marginBottom: '12px' }}>
          💬 站内片友短评 ({reviews.length})
        </h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          {reviews.map((rev) => (
            <ShortReviewCard key={rev.id} review={rev} isLoggedIn={isLoggedIn} />
          ))}
        </div>
      </section>

      {/* Similar Movies */}
      {similarMovies.length > 0 && (
        <section style={{ marginTop: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 className="section-title" style={{ fontSize: '16px', margin: 0 }}>
              🎯 喜欢这部作品的人也喜欢
            </h2>
            <Link href={`/similar/${movie.doubanId}`} style={{ fontSize: '13px', color: 'var(--accent)' }}>
              查看全部 →
            </Link>
          </div>
          <div className="movie-grid">
            {similarMovies.map((m) => (
              <MovieCard key={m.doubanId} {...m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
