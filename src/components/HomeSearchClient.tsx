'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type SuggestItem = {
  douban_id: string;
  title: string;
  sub_title?: string;
  year: string;
  type: string;
  episode?: string;
  rating: string;
  poster: string;
};

type TodayUpdateItem = {
  douban_id: string;
  title: string;
  poster: string;
  episode_badge: string;
  next_air_date: string;
};

export type ContinueWatchingItem = {
  id: string;
  douban_id: string;
  title: string;
  poster: string;
  year: string;
  type: string;
  episode_number: number;
  episode_title: string;
  source_key: string;
  vod_id: string;
  current_time: number;
  duration: number;
  progress_percent: number;
  is_sensitive: boolean;
};

export function HomeSearchClient({
  initialContinueWatching = [],
  hotTrends = [],
  serverHistory,
}: {
  initialContinueWatching?: ContinueWatchingItem[];
  hotTrends?: Array<{ keyword: string; count: number }>;
  serverHistory?: Array<Partial<ContinueWatchingItem> & { id: string; douban_id: string; title: string }>;
}) {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const normalizedInitial: ContinueWatchingItem[] =
    initialContinueWatching.length > 0
      ? initialContinueWatching
      : (serverHistory || []).map((it) => ({
          id: it.id,
          douban_id: it.douban_id,
          title: it.title,
          poster: it.poster || '/static/img/placeholder.svg',
          year: it.year || '',
          type: it.type || 'movie',
          episode_number: Number(it.episode_number || 1),
          episode_title: it.episode_title || '第01集',
          source_key: it.source_key || 'ffzy',
          vod_id: it.vod_id || '',
          current_time: Number(it.current_time || 0),
          duration: Number(it.duration || 3600),
          progress_percent: Math.min(
            100,
            Math.round((Number(it.current_time || 0) / Math.max(1, Number(it.duration || 3600))) * 100)
          ),
          is_sensitive: Boolean(it.is_sensitive),
        }));
  const [continueList, setContinueList] = useState<ContinueWatchingItem[]>(normalizedInitial);
  const [todayUpdates, setTodayUpdates] = useState<TodayUpdateItem[]>([]);
  const [cloudSynced, setCloudSynced] = useState<boolean>(normalizedInitial.length > 0);
  const [unblurredIds, setUnblurredIds] = useState<Record<string, boolean>>({});
  const boxRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('moovie_recentSearches') || '[]');
      if (Array.isArray(saved)) setRecentSearches(saved.slice(0, 8));
    } catch {
      // ignore
    }

    // Also load local play state and merge/sync
    let localItems: ContinueWatchingItem[] = [];
    try {
      const rawPlayState = JSON.parse(localStorage.getItem('moovie_play_state') || '{}');
      localItems = Object.values(rawPlayState || {})
        .filter((it: any) => it && it.douban_id && it.title)
        .map((it: any) => ({
          id: String(it.douban_id),
          douban_id: String(it.douban_id),
          title: String(it.title),
          poster: String(it.poster || '/static/img/placeholder.svg'),
          year: String(it.year || ''),
          type: String(it.type || 'movie'),
          episode_number: Number(it.episode_number || 1),
          episode_title: String(it.episode_title || '第01集'),
          source_key: String(it.source_key || 'ffzy'),
          vod_id: String(it.vod_id || ''),
          current_time: Number(it.current_time || 0),
          duration: Number(it.duration || 3600),
          progress_percent: Math.min(
            100,
            Math.round((Number(it.current_time || 0) / Math.max(1, Number(it.duration || 3600))) * 100)
          ),
          is_sensitive: Boolean(it.is_sensitive),
        }));

      if (localItems.length > 0 && initialContinueWatching.length === 0) {
        setContinueList((prev) => {
          const merged = [...prev];
          for (const item of localItems) {
            if (!merged.some((m) => m.douban_id === item.douban_id)) {
              merged.push(item);
            }
          }
          return merged;
        });
      }
    } catch {
      // ignore
    }

    if (localItems.length > 0) {
      fetch('/api/v2/history/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: 'web-browser-v2',
          cursor: 0,
          operations: localItems.map((it, idx) => ({
            operation_id: `op_${it.douban_id}_${idx}`,
            device_seq: idx + 1,
            type: 'upsert',
            douban_id: it.douban_id,
            source_key: it.source_key,
            vod_id: it.vod_id,
            episode: it.episode_number,
            episode_key: it.episode_title,
            position_seconds: it.current_time,
            duration_seconds: it.duration,
            title: it.title,
            poster: it.poster,
          })),
        }),
      }).catch(() => {});
    }

    fetch('/api/v2/history/sync')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.items) && data.items.length > 0) {
          setContinueList(data.items);
          setCloudSynced(true);
        }
      })
      .catch(() => {});

    fetch('/api/htmx/history/today-updates?format=json')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.items)) {
          setTodayUpdates(data.items);
        }
        if (data.authenticated) {
          setCloudSynced(true);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = keyword.trim();
    if (!q) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v2/media/suggest?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data : []);
          setShowSuggestions(true);
          setActiveIndex(-1);
        }
      } catch {
        // ignore
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveRecentSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    const updated = [clean, ...recentSearches.filter((s) => s !== clean)].slice(0, 8);
    setRecentSearches(updated);
    try {
      localStorage.setItem('moovie_recentSearches', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showSuggestions && activeIndex >= 0 && suggestions[activeIndex]) {
      const sel = suggestions[activeIndex];
      saveRecentSearch(sel.title);
      router.push(`/movie/${sel.douban_id}`);
      return;
    }
    const q = keyword.trim();
    if (!q) return;
    saveRecentSearch(q);
    router.push(`/search?kw=${encodeURIComponent(q)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const removeRecent = (term: string) => {
    const next = recentSearches.filter((t) => t !== term);
    setRecentSearches(next);
    localStorage.setItem('moovie_recentSearches', JSON.stringify(next));
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('moovie_recentSearches');
  };

  const removeContinueWatching = async (id: string, doubanId: string) => {
    setContinueList((prev) => prev.filter((item) => item.id !== id && item.douban_id !== doubanId));
    try {
      const raw = JSON.parse(localStorage.getItem('moovie_play_state') || '{}');
      delete raw[doubanId];
      localStorage.setItem('moovie_play_state', JSON.stringify(raw));
    } catch {
      // ignore
    }
    try {
      await fetch(`/api/v2/history/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
  };

  return (
    <>
      <form
        action="/search"
        method="GET"
        className="search-form"
        id="searchForm"
        ref={boxRef}
        onSubmit={handleSubmit}
      >
        <div className="search-input-wrapper">
          <input
            type="text"
            name="kw"
            id="searchInput"
            className="search-input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="想看就搜，看你想看..."
            autoComplete="off"
          />
          <button type="submit" className="search-btn">
            搜索
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="search-suggestions" id="searchSuggestions" style={{ display: 'block' }}>
            {suggestions.map((item, idx) => (
              <Link
                key={item.douban_id}
                href={`/movie/${item.douban_id}`}
                onClick={() => saveRecentSearch(item.title)}
                className={`search-suggestion-item suggestion-item ${idx === activeIndex ? 'selected active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  textDecoration: 'none',
                  color: 'var(--text)',
                }}
              >
                <img
                  src={item.poster || '/static/img/placeholder.svg'}
                  alt={item.title}
                  className="suggestion-poster"
                  width={42}
                  height={58}
                />
                <div className="suggestion-info">
                  <div className="suggestion-title">
                    {item.title}{' '}
                    <span className="suggestion-year">({item.year})</span>
                  </div>
                  <div className="suggestion-meta">
                    <span className="suggestion-type">
                      {item.type === 'tv'
                        ? '剧集'
                        : item.type === 'show'
                          ? '综艺'
                          : item.type === 'cartoon'
                            ? '动漫'
                            : '电影'}
                    </span>
                    {item.episode && <span className="suggestion-year">{item.episode}</span>}
                    {item.rating && <span className="suggestion-rating" style={{ color: '#f5a623', fontWeight: 600 }}>★ {item.rating}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </form>

      {recentSearches.length > 0 && (
        <div className="recent-searches" id="recentSearches">
          <div className="section-header-small">
            <span>最近搜索</span>
            <button type="button" className="clear-btn" onClick={clearRecent}>
              清空
            </button>
          </div>
          <div className="tags" id="recentTags">
            {recentSearches.map((term) => (
              <span key={term} className="tag">
                <Link href={`/search?kw=${encodeURIComponent(term)}`}>{term}</Link>
                <button
                  type="button"
                  className="tag-remove"
                  onClick={() => removeRecent(term)}
                  aria-label={`删除 ${term}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {todayUpdates.length > 0 && (
        <div
          id="today-updates"
          className="today-updates"
          style={{
            marginTop: '18px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            fontSize: '13px',
            textAlign: 'left',
          }}
        >
          <span style={{ fontWeight: 700, color: 'var(--accent)' }}>📅 今日追剧更新：</span>
          {todayUpdates.map((u) => (
            <Link
              key={u.douban_id}
              href={`/watch/${u.douban_id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: '14px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                textDecoration: 'none',
                fontSize: '12px',
              }}
            >
              <strong>{u.title}</strong>
              <span style={{ color: 'var(--accent)' }}>{u.episode_badge}</span>
            </Link>
          ))}
        </div>
      )}

      {continueList.length > 0 && (
        <section className="home-section" id="continueWatching" style={{ marginTop: '28px', textAlign: 'left' }}>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="section-title">▶️ 继续观看</h2>
            <span id="continue-watching-hint" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {cloudSynced ? '数据已云端同步' : '登录并打勾“记住我”，跨设备同步观看记录'}
            </span>
          </div>
          <div className="movie-grid">
            {continueList.map((item) => {
              const blurred = item.is_sensitive && !unblurredIds[item.id];
              return (
                <div key={item.id} className="movie-card" style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="watch-delete-btn"
                    onClick={() => removeContinueWatching(item.id, item.douban_id)}
                    title="移除观看记录"
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      zIndex: 5,
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(0,0,0,0.65)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      lineHeight: '24px',
                    }}
                  >
                    ×
                  </button>
                  <Link
                    href={`/watch/${item.douban_id}?ep=${item.episode_number}&source=${item.source_key}`}
                    onClick={(e) => {
                      if (blurred) {
                        e.preventDefault();
                        setUnblurredIds((prev) => ({ ...prev, [item.id]: true }));
                      }
                    }}
                  >
                    <div className="movie-poster" style={{ position: 'relative' }}>
                      <img
                        src={item.poster || '/static/img/placeholder.svg'}
                        alt={item.title}
                        style={blurred ? { filter: 'blur(14px)' } : undefined}
                      />
                      <span className="episode-badge">
                        [{item.source_key}] {item.episode_title} · {item.progress_percent}%
                      </span>
                      <div
                        className="progress-bar"
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          height: '4px',
                          width: `${Math.max(4, item.progress_percent)}%`,
                          background: 'var(--accent)',
                        }}
                      />
                    </div>
                    <div className="movie-info">
                      <h3 className="movie-title">{item.title}</h3>
                      <span className="movie-year">继续播放</span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
