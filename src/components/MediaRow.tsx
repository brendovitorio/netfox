import Link from 'next/link';
import { useEffect, useState } from 'react';
import MovieCard from './MovieCard';
import ScrollRow from './ScrollRow';
import { MediaItem, titleOf } from '../services/tmdb';

type MediaRowProps = {
  title: string;
  fetcher?: () => Promise<MediaItem[]>;
  items?: MediaItem[];
  empty?: string;
  limit?: number;
  viewAllHref?: string;
};

export default function MediaRow({ title, fetcher, items: initialItems, empty = 'Nada encontrado.', limit = 18, viewAllHref }: MediaRowProps) {
  const [items, setItems] = useState<MediaItem[]>(() => (initialItems ? initialItems.slice(0, limit) : []));
  const [loading, setLoading] = useState(!initialItems);

  useEffect(() => {
    if (initialItems || !fetcher) return;

    let active = true;
    setLoading(true);

    fetcher()
      .then((data) => {
        if (active) setItems(data.slice(0, limit));
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
        {viewAllHref ? (
          <Link href={viewAllHref} className="shrink-0 text-sm font-bold text-red-400 hover:text-red-300">
            Ver tudo →
          </Link>
        ) : null}
      </div>
      {loading ? (
        <SkeletonRow />
      ) : items.length ? (
        <ScrollRow gapClassName="gap-4">
          {items.map((item) => (
            <MovieCard
              key={`${item.media_type}-${item.id}`}
              id={item.id}
              title={titleOf(item)}
              posterPath={item.poster_path}
              mediaType={item.media_type}
              rating={item.vote_average}
            />
          ))}
        </ScrollRow>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-5 text-zinc-400">{empty}</p>
      )}
    </section>
  );
}

function SkeletonRow() {
  return (
    <div className="flex gap-4 overflow-hidden pb-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-[270px] min-w-[152px] animate-pulse rounded-2xl bg-white/10 sm:min-w-[180px]" />
      ))}
    </div>
  );
}
