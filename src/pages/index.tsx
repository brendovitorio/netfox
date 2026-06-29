import { useEffect, useRef, useState } from 'react';
import MovieCard from '../components/MovieCard';
import { fetchAniListSection, searchAniList } from '../services/anilist';
import {
  fetchMovies,
  imageUrl,
  MediaItem,
  searchMulti,
  titleOf,
} from '../services/tmdb';

const tmdbSections = [
  { title: 'Filmes populares', endpoint: '/movie/popular', tag: 'TMDB' },
  { title: 'Séries populares', endpoint: '/tv/popular', tag: 'TMDB' },
  { title: 'Mais bem avaliados', endpoint: '/movie/top_rated', tag: 'TMDB' },
  { title: 'Nos cinemas', endpoint: '/movie/now_playing', tag: 'TMDB' },
];

const animeSections = [
  { title: 'Animes em alta', section: 'trending' as const, tag: 'AniList' },
  { title: 'Animes populares', section: 'popular' as const, tag: 'AniList' },
  { title: 'Temporada atual', section: 'seasonal' as const, tag: 'AniList' },
  { title: 'Animes mais bem avaliados', section: 'top' as const, tag: 'AniList' },
];

export default function Home() {
  const [hero, setHero] = useState<MediaItem | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      fetchMovies('/trending/all/week'),
      fetchAniListSection('trending', 6),
    ])
      .then(([tmdbResult, animeResult]) => {
        const tmdbItems = tmdbResult.status === 'fulfilled' ? tmdbResult.value : [];
        const animeItems = animeResult.status === 'fulfilled' ? animeResult.value : [];
        const valid = [...animeItems, ...tmdbItems].filter((item) => item.poster_path || item.backdrop_path);
        setHero(valid[0] || null);
      })
      .catch(() => setHero(null));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setSearching(true);
      try {
        const [tmdb, anime] = await Promise.allSettled([
          searchMulti(query),
          searchAniList(query, 12),
        ]);

        const merged = [
          ...(anime.status === 'fulfilled' ? anime.value : []),
          ...(tmdb.status === 'fulfilled' ? tmdb.value : []),
        ];

        const unique = new Map<string, MediaItem>();
        merged.forEach((item) => unique.set(`${item.media_type}:${item.id}`, item));
        setResults(Array.from(unique.values()));
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

  const heroTitle = hero ? titleOf(hero) : 'Netfox';
  const heroImage = hero ? imageUrl(hero.backdrop_path || hero.poster_path, 'original') : '/globe.svg';
  const heroHref = hero ? `/watch/${hero.media_type}/${hero.id}` : '#catalogo';

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="relative isolate overflow-hidden px-5 pb-12 pt-6 sm:px-10 lg:px-16">
        <div className="absolute inset-0 -z-10 bg-cover bg-center opacity-40 blur-[1px]" style={{ backgroundImage: `url(${heroImage})` }} />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,.35),transparent_30%),linear-gradient(90deg,#050505_0%,rgba(5,5,5,.88)_35%,rgba(5,5,5,.56)_100%)]" />

        <header className="mb-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-red-600 text-2xl font-black shadow-lg shadow-red-950/60">N</div>
            <div>
              <p className="text-xl font-black tracking-tight">Netfox</p>
              <p className="text-xs uppercase tracking-[0.3em] text-red-200/70">Cinema UI</p>
            </div>
          </div>
          <a href="#catalogo" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/20">
            Catálogo
          </a>
        </header>

        <div className="max-w-3xl space-y-6">
          <span className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-red-200">
            Catálogo AniList + player Superflix
          </span>
          <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">{heroTitle}</h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-200 sm:text-lg">
            Filmes e séries usam o catálogo do TMDB. Animes usam a AniList para catálogo e busca, com o vídeo carregado pelo mesmo player (Superflix) usado em filmes e séries.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href={heroHref} className="rounded-xl bg-red-600 px-6 py-3 text-center font-black text-white shadow-xl shadow-red-950/40 transition hover:bg-red-500">
              Ver detalhes
            </a>
            <a href="#busca" className="rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-center font-bold backdrop-blur transition hover:bg-white/20">
              Buscar agora
            </a>
          </div>
        </div>
      </section>

      <section id="busca" className="mx-auto -mt-6 max-w-6xl px-5 sm:px-10 lg:px-16">
        <div className="rounded-3xl border border-white/10 bg-zinc-950/90 p-4 shadow-2xl shadow-black/50 backdrop-blur">
          <label className="mb-2 block text-sm font-semibold text-zinc-300">Buscar filme, série ou anime</label>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Digite: Naruto, One Piece, Vingadores, Breaking Bad..."
            className="w-full rounded-2xl border border-white/10 bg-black px-5 py-4 text-lg text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500"
          />
          {query.trim().length >= 2 ? (
            <div className="mt-5">
              <p className="mb-3 text-sm text-zinc-400">{searching ? 'Buscando...' : `${results.length} resultado(s)`}</p>
              <Grid items={results.slice(0, 18)} empty="Nenhum resultado encontrado." />
            </div>
          ) : null}
        </div>
      </section>

      <section id="catalogo" className="space-y-12 px-5 py-12 sm:px-10 lg:px-16">
        <div className="rounded-3xl border border-red-500/20 bg-red-950/10 p-5">
          <h2 className="text-2xl font-black">Seção de anime</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
            O catálogo e a busca de animes vêm da AniList. Ao abrir um anime, identificamos automaticamente o título correspondente no TMDB para reproduzir pelo mesmo player usado em filmes e séries.
          </p>
        </div>

        {animeSections.map((section) => (
          <AnimeSection key={section.title} {...section} />
        ))}

        {tmdbSections.map((section) => (
          <TmdbSection key={section.title} {...section} />
        ))}
      </section>
    </main>
  );
}

function TmdbSection({ title, endpoint, tag }: { title: string; endpoint: string; tag: string }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useHorizontalWheel<HTMLDivElement>();

  useEffect(() => {
    setLoading(true);
    fetchMovies(endpoint)
      .then((data) => setItems(data.filter((item) => item.poster_path).slice(0, 18)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [endpoint]);

  return (
    <section>
      <SectionHeader title={title} tag={tag} />
      {loading ? <SkeletonRow /> : <HorizontalRow refValue={scrollRef} items={items} />}
    </section>
  );
}

function AnimeSection({ title, section, tag }: { title: string; section: 'trending' | 'popular' | 'seasonal' | 'top' | 'recent'; tag: string }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useHorizontalWheel<HTMLDivElement>();

  useEffect(() => {
    setLoading(true);
    fetchAniListSection(section, 18)
      .then((data) => setItems(data.filter((item) => item.poster_path)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [section]);

  return (
    <section>
      <SectionHeader title={title} tag={tag} />
      {loading ? <SkeletonRow /> : <HorizontalRow refValue={scrollRef} items={items} empty="Nada retornado pela AniList." />}
    </section>
  );
}

function SectionHeader({ title, tag }: { title: string; tag: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
      <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-400 sm:inline-flex">{tag}</span>
    </div>
  );
}

function HorizontalRow({ refValue, items, empty = 'Sem itens.' }: { refValue: any; items: MediaItem[]; empty?: string }) {
  if (!items.length) return <p className="rounded-2xl border border-white/10 bg-white/5 p-5 text-zinc-400">{empty}</p>;

  return (
    <div ref={refValue} className="scrollbar-hide flex gap-4 overflow-x-auto pb-4">
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
    </div>
  );
}

function Grid({ items, empty }: { items: MediaItem[]; empty: string }) {
  if (!items.length) return <p className="rounded-2xl border border-white/10 bg-white/5 p-5 text-zinc-400">{empty}</p>;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
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
    </div>
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

function useHorizontalWheel<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      el.scrollLeft += event.deltaY;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return ref;
}
