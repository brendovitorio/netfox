import { GetServerSideProps } from 'next';
import Link from 'next/link';
import MovieCard from '../../../components/MovieCard';
import ScrollRow from '../../../components/ScrollRow';
import { fetchAniListDetails, fetchAniListSimilar } from '../../../services/anilist';
import {
  fetchDetails,
  fetchSimilar,
  fetchTmdbSeasons,
  imageUrl,
  MediaItem,
  MediaType,
  resolveAnimeTmdbMatch,
  titleOf,
  TmdbMediaType,
  TmdbSeasonSummary,
} from '../../../services/tmdb';
import { getStream, StreamSource } from '../../../data/Streams';

type WatchPageProps = {
  mediaType: MediaType;
  details: any;
  similar: MediaItem[];
  stream: StreamSource | null;
  seasons: TmdbSeasonSummary[];
  selectedSeason: number;
  selectedEpisode: number;
  approximateMatch: boolean;
};

function mediaLabel(mediaType: MediaType) {
  if (mediaType === 'anime') return 'Anime';
  if (mediaType === 'dorama') return 'Dorama';
  if (mediaType === 'tv') return 'Série';
  return 'Filme';
}

function findAdjacentEpisode(
  seasons: TmdbSeasonSummary[],
  currentSeason: number,
  currentEpisode: number,
  direction: 'next' | 'prev'
): { season: number; episode: number } | null {
  const sorted = [...seasons].sort((a, b) => a.season_number - b.season_number);
  const index = sorted.findIndex((season) => season.season_number === currentSeason);
  if (index === -1) return null;

  if (direction === 'next') {
    const episodeCount = sorted[index].episode_count || 1;
    if (currentEpisode < episodeCount) return { season: currentSeason, episode: currentEpisode + 1 };
    const nextSeason = sorted[index + 1];
    return nextSeason ? { season: nextSeason.season_number, episode: 1 } : null;
  }

  if (currentEpisode > 1) return { season: currentSeason, episode: currentEpisode - 1 };
  const prevSeason = sorted[index - 1];
  return prevSeason ? { season: prevSeason.season_number, episode: prevSeason.episode_count || 1 } : null;
}

export default function WatchPage({
  mediaType,
  details,
  similar,
  stream,
  seasons,
  selectedSeason,
  selectedEpisode,
  approximateMatch,
}: WatchPageProps) {
  const title = details.title || details.name || 'Sem título';
  const year = (details.release_date || details.first_air_date || '').slice(0, 4);
  const hasEpisodeNavigation = seasons.length > 0;

  const runtime =
    mediaType === 'movie' && details.runtime
      ? `${details.runtime} min`
      : mediaType === 'anime' && details.number_of_episodes
        ? `${details.number_of_episodes} episódio(s)`
        : details.number_of_seasons
          ? `${details.number_of_seasons} temporada(s)`
          : null;

  const backdrop = imageUrl(details.backdrop_path || details.poster_path, 'original');
  const poster = imageUrl(details.poster_path, 'w500');

  const genres = Array.isArray(details.genres)
    ? details.genres.map((genre: any) => (typeof genre === 'string' ? genre : genre.name)).filter(Boolean).join(' • ')
    : '';

  const currentSeason = seasons.find((season) => season.season_number === selectedSeason);
  const episodeCount = currentSeason?.episode_count || 1;
  const episodeList = Array.from({ length: episodeCount }, (_, index) => index + 1);

  const prevEpisode = hasEpisodeNavigation ? findAdjacentEpisode(seasons, selectedSeason, selectedEpisode, 'prev') : null;
  const nextEpisode = hasEpisodeNavigation ? findAdjacentEpisode(seasons, selectedSeason, selectedEpisode, 'next') : null;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="relative isolate overflow-hidden px-5 pb-10 pt-6 sm:px-10 lg:px-16">
        <div className="absolute inset-0 -z-10 bg-cover bg-center opacity-35" style={{ backgroundImage: `url(${backdrop})` }} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-[#050505]/55" />

        <nav className="mb-12 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black text-red-500">NETFOX</Link>
          <Link href="/" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20">Voltar</Link>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:items-end">
          <img src={poster} alt={title} className="hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/70 lg:block" />
          <div className="max-w-4xl space-y-5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-wider">{mediaLabel(mediaType)}</span>
              {year ? <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-zinc-200">{year}</span> : null}
              {runtime ? <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-zinc-200">{runtime}</span> : null}
              {details.vote_average ? <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-black">{Number(details.vote_average).toFixed(1)}</span> : null}
              {mediaType === 'anime' ? <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-black text-white">AniList</span> : null}
            </div>
            <h1 className="text-4xl font-black leading-tight sm:text-6xl">{title}</h1>
            {genres ? <p className="text-sm font-semibold text-red-200/80">{genres}</p> : null}
            <p className="max-w-3xl text-base leading-7 text-zinc-200">{details.overview || 'Sem sinopse disponível em português.'}</p>
          </div>
        </div>
      </section>

      <section className="px-5 pb-12 sm:px-10 lg:px-16">
        {hasEpisodeNavigation ? (
          <div className="mb-5 space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            {approximateMatch ? (
              <p className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-3 text-xs text-purple-100">
                Correspondência automática AniList → TMDB. Se a temporada/episódio não bater com o esperado, use os seletores abaixo para ajustar.
              </p>
            ) : null}

            {seasons.length > 1 ? (
              <div>
                <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-zinc-400">Temporadas</h2>
                <ScrollRow>
                  {seasons.map((season) => (
                    <Link
                      key={season.season_number}
                      href={`/watch/${mediaType}/${details.id}?season=${season.season_number}&episode=1`}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                        selectedSeason === season.season_number ? 'bg-red-600 text-white' : 'bg-white/10 text-zinc-200 hover:bg-white/20'
                      }`}
                    >
                      T{season.season_number}
                    </Link>
                  ))}
                </ScrollRow>
              </div>
            ) : null}

            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400">Episódios</h2>
                <div className="flex items-center gap-2">
                  <Link
                    href={prevEpisode ? `/watch/${mediaType}/${details.id}?season=${prevEpisode.season}&episode=${prevEpisode.episode}` : '#'}
                    aria-disabled={!prevEpisode}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      prevEpisode ? 'bg-white/10 text-zinc-200 hover:bg-white/20' : 'pointer-events-none bg-white/5 text-zinc-600'
                    }`}
                  >
                    ◀ Anterior
                  </Link>
                  <Link
                    href={nextEpisode ? `/watch/${mediaType}/${details.id}?season=${nextEpisode.season}&episode=${nextEpisode.episode}` : '#'}
                    aria-disabled={!nextEpisode}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      nextEpisode ? 'bg-red-600 text-white hover:bg-red-500' : 'pointer-events-none bg-white/5 text-zinc-600'
                    }`}
                  >
                    Próximo ▶
                  </Link>
                </div>
              </div>
              <ScrollRow>
                {episodeList.map((episode) => (
                  <Link
                    key={episode}
                    href={`/watch/${mediaType}/${details.id}?season=${selectedSeason}&episode=${episode}`}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                      selectedEpisode === episode ? 'bg-red-600 text-white' : 'bg-white/10 text-zinc-200 hover:bg-white/20'
                    }`}
                  >
                    EP {episode}
                  </Link>
                ))}
              </ScrollRow>
            </div>
          </div>
        ) : null}

        <div className="aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl shadow-black/60">
          {stream ? (
            <iframe
              key={stream.src}
              src={stream.src}
              title={`${title} - ${stream.provider}`}
              className="h-full w-full border-0 bg-black"
              allow="autoplay *; encrypted-media *; picture-in-picture *; fullscreen *; clipboard-write *; accelerometer *; gyroscope *; web-share *"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
            />
          ) : (
            <div className="grid h-full min-h-[320px] place-items-center bg-[radial-gradient(circle_at_center,rgba(220,38,38,.22),transparent_45%),#080808] p-6 text-center">
              <div className="max-w-2xl space-y-4">
                <p className="text-5xl">🎬</p>
                <h2 className="text-2xl font-black">Player não encontrado</h2>
                <p className="text-zinc-300">
                  {mediaType === 'anime'
                    ? 'Não encontramos esse anime no catálogo do player. Tente outro título ou ajuste a temporada manualmente.'
                    : 'Não foi possível gerar a fonte para este conteúdo.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {stream ? (
          <p className="mt-3 text-xs text-zinc-500">Fonte: {stream.provider} • {stream.quality || 'auto'}</p>
        ) : null}
      </section>

      {similar.length ? (
        <section className="px-5 pb-16 sm:px-10 lg:px-16">
          <h2 className="mb-4 text-3xl font-black">Parecidos</h2>
          <ScrollRow gapClassName="gap-4">
            {similar.map((item) => (
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
        </section>
      ) : null}
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<WatchPageProps> = async (context) => {
  const mediaTypeParam = Array.isArray(context.params?.mediaType) ? context.params?.mediaType[0] : context.params?.mediaType;
  const idParam = Array.isArray(context.params?.id) ? context.params?.id[0] : context.params?.id;

  const seasonParam = Array.isArray(context.query.season) ? context.query.season[0] : context.query.season;
  const episodeParam = Array.isArray(context.query.episode) ? context.query.episode[0] : context.query.episode;

  const validMediaTypes = ['movie', 'tv', 'anime', 'dorama'];
  if (!validMediaTypes.includes(mediaTypeParam || '') || !idParam) {
    return { notFound: true };
  }

  const seasonExplicit = seasonParam !== undefined;
  const requestedSeason = Math.max(Number(seasonParam || 1), 1);
  const requestedEpisode = Math.max(Number(episodeParam || 1), 1);

  try {
    if (mediaTypeParam === 'anime') {
      const [details, similar] = await Promise.all([
        fetchAniListDetails(idParam),
        fetchAniListSimilar(idParam).catch(() => []),
      ]);

      const isMovieFormat = details.format === 'MOVIE';
      const tmdbMediaType: TmdbMediaType = isMovieFormat ? 'movie' : 'tv';
      const titleCandidates = [details.titleEnglish, details.titleRomaji, details.title].filter(Boolean) as string[];

      const match = await resolveAnimeTmdbMatch(titleCandidates, details.seasonYear, tmdbMediaType).catch(() => null);

      let seasons: TmdbSeasonSummary[] = [];
      let stream: StreamSource | null = null;
      let selectedSeason = requestedSeason;
      let selectedEpisode = requestedEpisode;

      if (match && match.mediaType === 'tv') {
        seasons = await fetchTmdbSeasons(match.id).catch(() => []);

        if (!seasonExplicit && match.seasonHint && seasons.find((season) => season.season_number === match.seasonHint)) {
          selectedSeason = match.seasonHint;
        } else if (!seasons.find((season) => season.season_number === selectedSeason)) {
          selectedSeason = seasons[0]?.season_number || 1;
        }
        const currentSeason = seasons.find((season) => season.season_number === selectedSeason);
        const maxEpisode = currentSeason?.episode_count || 1;
        selectedEpisode = Math.min(selectedEpisode, maxEpisode);
        stream = getStream('tv', match.id, { season: selectedSeason, episode: selectedEpisode });
      } else if (match && match.mediaType === 'movie') {
        selectedSeason = 1;
        selectedEpisode = 1;
        stream = getStream('movie', match.id);
      }

      return {
        props: {
          mediaType: 'anime',
          details,
          similar,
          stream,
          seasons,
          selectedSeason,
          selectedEpisode,
          approximateMatch: Boolean(match),
        },
      };
    }

    const tmdbMediaType: TmdbMediaType = mediaTypeParam === 'dorama' ? 'tv' : (mediaTypeParam as TmdbMediaType);

    const [details, similar] = await Promise.all([
      fetchDetails(tmdbMediaType, idParam),
      fetchSimilar(tmdbMediaType, idParam).catch(() => []),
    ]);

    const seasons: TmdbSeasonSummary[] =
      tmdbMediaType === 'tv'
        ? (details.seasons || [])
            .filter((season: any) => season.season_number > 0)
            .map((season: any) => ({
              season_number: season.season_number,
              episode_count: season.episode_count,
              name: season.name,
            }))
        : [];

    let selectedSeason = requestedSeason;
    let selectedEpisode = requestedEpisode;

    if (seasons.length) {
      if (!seasons.find((season) => season.season_number === selectedSeason)) {
        selectedSeason = seasons[0].season_number;
      }
      const currentSeason = seasons.find((season) => season.season_number === selectedSeason);
      selectedEpisode = Math.min(selectedEpisode, currentSeason?.episode_count || 1);
    }

    const stream = getStream(tmdbMediaType, idParam, {
      season: selectedSeason,
      episode: selectedEpisode,
    });

    return {
      props: {
        mediaType: mediaTypeParam as MediaType,
        details,
        similar,
        stream,
        seasons,
        selectedSeason,
        selectedEpisode,
        approximateMatch: false,
      },
    };
  } catch (error) {
    console.error('Erro ao carregar página watch:', error);
    return { notFound: true };
  }
};
