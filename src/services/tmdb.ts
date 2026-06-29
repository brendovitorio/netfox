export type MediaType = 'movie' | 'tv' | 'anime';
export type TmdbMediaType = 'movie' | 'tv';

export type MediaItem = {
  id: number;
  media_type: MediaType;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

export type TmdbSeasonSummary = {
  season_number: number;
  episode_count: number;
  name?: string;
};

export type TmdbMatch = {
  mediaType: TmdbMediaType;
  id: number;
};

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY || '';

if (!API_KEY && typeof window === 'undefined') {
  console.warn('TMDB_API_KEY/NEXT_PUBLIC_TMDB_API_KEY não configurada. Requisições ao TMDB vão falhar.');
}

const BASE_URL = 'https://api.themoviedb.org/3';

function buildUrl(path: string, params: Record<string, string | number | undefined> = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'pt-BR');

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });

  return url.toString();
}

async function tmdbFetch<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const res = await fetch(buildUrl(path, params));
  if (!res.ok) throw new Error(`TMDB respondeu ${res.status}`);
  return res.json();
}

export async function fetchMovies(endpoint: string): Promise<MediaItem[]> {
  const data = await tmdbFetch<{ results: MediaItem[] }>(endpoint);
  const inferredType: TmdbMediaType = endpoint.includes('/tv') ? 'tv' : 'movie';

  return (data.results || [])
    .filter((item) => !item.media_type || item.media_type === 'movie' || item.media_type === 'tv')
    .filter((item) => item.poster_path || item.backdrop_path)
    .map((item) => ({
      ...item,
      media_type: item.media_type === 'tv' || item.media_type === 'movie' ? item.media_type : inferredType,
    }));
}

export async function searchMulti(query: string): Promise<MediaItem[]> {
  if (!query.trim()) return [];

  const data = await tmdbFetch<{ results: MediaItem[] }>('/search/multi', {
    query,
    include_adult: 'false',
  });

  return (data.results || [])
    .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
    .filter((item) => item.poster_path || item.backdrop_path);
}

export async function fetchDetails(mediaType: TmdbMediaType, id: string | number) {
  return tmdbFetch<any>(`/${mediaType}/${id}`, { append_to_response: 'credits,videos,external_ids' });
}

export async function fetchSimilar(mediaType: TmdbMediaType, id: string | number): Promise<MediaItem[]> {
  const data = await tmdbFetch<{ results: MediaItem[] }>(`/${mediaType}/${id}/similar`);
  return (data.results || []).slice(0, 18).map((item) => ({ ...item, media_type: mediaType }));
}

export function imageUrl(path?: string | null, size = 'w500') {
  if (!path) return '/window.svg';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function titleOf(item: Pick<MediaItem, 'title' | 'name'>) {
  return item.title || item.name || 'Sem título';
}

const DIACRITICS_PATTERN = new RegExp('[̀-ͯ]', 'g');

function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_PATTERN, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function searchTmdbCandidates(mediaType: TmdbMediaType, query: string): Promise<any[]> {
  const data = await tmdbFetch<{ results: any[] }>(`/search/${mediaType}`, { query });
  return data.results || [];
}

/**
 * AniList não fornece IDs do TMDB diretamente, então tentamos casar o anime
 * por título (com fallback por proximidade de ano) para reaproveitar o player
 * por iframe (Superflix) já usado em filmes/séries. É uma heurística best-effort:
 * pode escolher o show errado quando há remakes/temporadas separadas no TMDB.
 */
export async function resolveAnimeTmdbMatch(
  titles: string[],
  year: number | undefined,
  mediaType: TmdbMediaType
): Promise<TmdbMatch | null> {
  const nameKey = mediaType === 'tv' ? 'name' : 'title';
  const dateKey = mediaType === 'tv' ? 'first_air_date' : 'release_date';

  const triedTitles = new Set<string>();

  for (const rawTitle of titles) {
    const title = rawTitle?.trim();
    if (!title || triedTitles.has(title.toLowerCase())) continue;
    triedTitles.add(title.toLowerCase());

    const candidates = await searchTmdbCandidates(mediaType, title).catch(() => []);
    if (!candidates.length) continue;

    const exact = candidates.find((item) => normalizeTitle(item[nameKey] || '') === normalizeTitle(title));
    if (exact) return { mediaType, id: exact.id };

    if (year) {
      const closeYear = candidates.find((item) => {
        const itemYear = Number((item[dateKey] || '').slice(0, 4));
        return itemYear && Math.abs(itemYear - year) <= 1;
      });
      if (closeYear) return { mediaType, id: closeYear.id };
    }

    return { mediaType, id: candidates[0].id };
  }

  return null;
}

export async function fetchTmdbSeasons(id: string | number): Promise<TmdbSeasonSummary[]> {
  const details = await fetchDetails('tv', id);
  return (details.seasons || [])
    .filter((season: any) => season.season_number > 0)
    .map((season: any) => ({
      season_number: season.season_number,
      episode_count: season.episode_count,
      name: season.name,
    }));
}
