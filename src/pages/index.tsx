import { useEffect, useState } from 'react';
import CategoryNav from '../components/CategoryNav';
import MediaRow from '../components/MediaRow';
import MovieCard from '../components/MovieCard';
import { fetchAniListSection, searchAniList } from '../services/anilist';
import { fetchDoramas, fetchMovies, imageUrl, MediaItem, searchMulti, titleOf } from '../services/tmdb';

export default function Home() {
  const [hero, setHero] = useState<MediaItem | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    Promise.allSettled([fetchMovies('/trending/all/week'), fetchAniListSection('trending', 6)])
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
        const [tmdb, anime] = await Promise.allSettled([searchMulti(query), searchAniList(query, 12)]);

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

        <CategoryNav />

        <div className="max-w-3xl space-y-6">
          <span className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-red-200">
            Filmes • Séries • Animes • Doramas • TV
          </span>
          <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">{heroTitle}</h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-200 sm:text-lg">
            Cada categoria tem sua própria página, só com o conteúdo dela. Use a barra acima para navegar.
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
          <label className="mb-2 block text-sm font-semibold text-zinc-300">Buscar filme, série, anime ou dorama</label>
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
        <MediaRow title="Filmes populares" fetcher={() => fetchMovies('/movie/popular')} viewAllHref="/filmes" />
        <MediaRow title="Séries populares" fetcher={() => fetchMovies('/tv/popular')} viewAllHref="/series" />
        <MediaRow
          title="Animes em alta"
          fetcher={() => fetchAniListSection('trending', 18)}
          empty="Nada retornado pela AniList."
          viewAllHref="/animes"
        />
        <MediaRow title="Doramas populares" fetcher={() => fetchDoramas('popularity.desc')} viewAllHref="/doramas" />

        <section>
          <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">TV ao vivo</h2>
              <p className="mt-1 text-sm text-zinc-400">Canais 24h em tempo real, sem precisar escolher episódio.</p>
            </div>
            <a href="/canais" className="shrink-0 rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-500">
              Ver canais →
            </a>
          </div>
        </section>
      </section>
    </main>
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
