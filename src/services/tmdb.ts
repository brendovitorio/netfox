export type MediaType = 'movie' | 'tv' | 'anime' | 'dorama';
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
  vote_average?: number | null;
};

export type TmdbSeasonSummary = {
  season_number: number;
  episode_count: number;
  name?: string;
};

export type TmdbMatch = {
  mediaType: TmdbMediaType;
  id: number;
  seasonHint?: number;
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

const DORAMA_ORIGIN_COUNTRIES = 'KR|JP|CN|TH';

async function discoverTv(params: Record<string, string | number | undefined>): Promise<MediaItem[]> {
  const data = await tmdbFetch<{ results: MediaItem[] }>('/discover/tv', params);
  return (data.results || [])
    .filter((item) => item.poster_path || item.backdrop_path)
    .map((item) => ({ ...item, media_type: 'dorama' as const }));
}

export async function fetchDoramas(sort: 'popularity.desc' | 'vote_average.desc' = 'popularity.desc'): Promise<MediaItem[]> {
  return discoverTv({
    with_origin_country: DORAMA_ORIGIN_COUNTRIES,
    sort_by: sort,
    ...(sort === 'vote_average.desc' ? { 'vote_count.gte': 50 } : {}),
  });
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

const SEASON_HINT_PATTERNS = [/(\d+)(?:st|nd|rd|th)\s+season/i, /season\s+(\d+)/i, /part\s+(\d+)/i, /cour\s+(\d+)/i];
const ROMAN_SEASON_HINTS: Record<string, number> = { ii: 2, iii: 3, iv: 4, v: 5 };

/**
 * Animes em continuação (ex: "Witch Hat Atelier Season 2") costumam ter uma
 * entrada própria na AniList mas compartilham o mesmo show no TMDB, dividido
 * em temporadas. Extrai esse número para já abrir na temporada certa em vez
 * de cair sempre na T1.
 */
function extractSeasonHint(title: string): { season: number; cleanTitle: string } | null {
  for (const pattern of SEASON_HINT_PATTERNS) {
    const match = title.match(pattern);
    if (match) {
      const season = Number(match[1]);
      if (season > 0) return { season, cleanTitle: title.replace(pattern, '').replace(/\s+/g, ' ').trim() };
    }
  }

  const romanMatch = title.trim().match(/\s(ii|iii|iv|v)$/i);
  if (romanMatch) {
    const season = ROMAN_SEASON_HINTS[romanMatch[1].toLowerCase()];
    if (season) return { season, cleanTitle: title.slice(0, romanMatch.index).trim() };
  }

  return null;
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

    const hint = extractSeasonHint(title);
    const searchTitle = hint?.cleanTitle || title;

    const candidates = await searchTmdbCandidates(mediaType, searchTitle).catch(() => []);
    if (!candidates.length) continue;

    const exact = candidates.find((item) => normalizeTitle(item[nameKey] || '') === normalizeTitle(searchTitle));
    if (exact) return { mediaType, id: exact.id, seasonHint: hint?.season };

    if (year) {
      const closeYear = candidates.find((item) => {
        const itemYear = Number((item[dateKey] || '').slice(0, 4));
        return itemYear && Math.abs(itemYear - year) <= 1;
      });
      if (closeYear) return { mediaType, id: closeYear.id, seasonHint: hint?.season };
    }

    return { mediaType, id: candidates[0].id, seasonHint: hint?.season };
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
