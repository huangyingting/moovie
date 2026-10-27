import React from 'react';
import Link from 'next/link';

export type MovieCardProps = {
  doubanId: string;
  title: string;
  year: string;
  type?: string;
  poster: string;
  rating?: number | null;
  episodeBadge?: string | null;
  badge?: string | null;
  subtitle?: string | null;
  isNew?: boolean;
  href?: string;
};

export function MovieCard({
  doubanId,
  title,
  year,
  poster,
  rating,
  episodeBadge,
  badge,
  subtitle,
  isNew,
  href,
}: MovieCardProps) {
  const targetHref = href || `/movie/${doubanId}`;
  const effectiveBadge = badge || episodeBadge || subtitle;

  return (
    <Link href={targetHref} className="movie-card">
      <div className="movie-poster">
        <img
          src={poster || '/static/img/placeholder.svg'}
          alt={title}
          loading="lazy"
          decoding="async"
        />
        {isNew && <span className="new-badge">新</span>}
        {rating && rating > 0 ? (
          <span className="rating-badge">{rating.toFixed(1)}</span>
        ) : null}
        {effectiveBadge ? (
          <span className="episode-badge">{effectiveBadge}</span>
        ) : null}
      </div>
      <div className="movie-info">
        <h3 className="movie-title" title={title}>
          {title}
        </h3>
        <span className="movie-year">{year}</span>
      </div>
    </Link>
  );
}
