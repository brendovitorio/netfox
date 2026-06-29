import { MediaItem } from './tmdb';

const ANILIST_URL = 'https://graphql.anilist.co';

export type AniListSection = 'trending' | 'popular' | 'seasonal' | 'top' | 'recent';

function currentAniListSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 1 && month <= 3) return 'WINTER';
  if (month >= 4 && month <= 6) return 'SPRING';
  if (month >= 7 && month <= 9) return 'SUMMER';
  return 'FALL';
}

function stripHtml(value?: string | null) {
  return (value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

function dateFromAniList(date?: { year?: number; month?: number; day?: number }) {
  if (!date?.year) return '';
  const month = String(date.month || 1).padStart(2, '0');
  const day = String(date.day || 1).padStart(2, '0');
  return `${date.year}-${month}-${day}`;
}

function titleFromAniList(title?: { romaji?: string; english?: string; native?: string }) {
  return title?.english || title?.romaji || title?.native || 'Sem título';
}

function mapAnime(item: any): MediaItem {
  return {
    id: Number(item.id),
    media_type: 'anime',
    title: titleFromAniList(item.title),
    name: titleFromAniList(item.title),
    overview: stripHtml(item.description),
    poster_path: item.coverImage?.extraLarge || item.coverImage?.large || null,
    backdrop_path: item.bannerImage || item.coverImage?.extraLarge || null,
    first_air_date: dateFromAniList(item.startDate),
    vote_average: typeof item.averageScore === 'number' ? item.averageScore / 10 : undefined,
  };
}

async function aniListFetch<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const response = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) throw new Error(`AniList respondeu ${response.status}`);

  const payload = await response.json();
  if (payload.errors?.length) throw new Error(payload.errors[0]?.message || 'Erro na AniList.');

  return payload.data as T;
}

function sectionVariables(section: AniListSection) {
  const year = new Date().getFullYear();

  switch (section) {
    case 'popular':
      return { sort: ['POPULARITY_DESC'], season: undefined, seasonYear: undefined };
    case 'seasonal':
      return { sort: ['TRENDING_DESC', 'POPULARITY_DESC'], season: currentAniListSeason(), seasonYear: year };
    case 'top':
      return { sort: ['SCORE_DESC'], season: undefined, seasonYear: undefined };
    case 'recent':
      return { sort: ['UPDATED_AT_DESC'], season: undefined, seasonYear: undefined };
    case 'trending':
    default:
      return { sort: ['TRENDING_DESC'], season: undefined, seasonYear: undefined };
  }
}

const LIST_QUERY = `
  query AnimeList($page: Int, $perPage: Int, $sort: [MediaSort], $season: MediaSeason, $seasonYear: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: $sort, season: $season, seasonYear: $seasonYear, isAdult: false) {
        id
        title { romaji english native }
        description(asHtml: false)
        coverImage { large extraLarge }
        bannerImage
        averageScore
        startDate { year month day }
      }
    }
  }
`;

export async function fetchAniListSection(section: AniListSection, perPage = 18): Promise<MediaItem[]> {
  const variables = { page: 1, perPage, ...sectionVariables(section) };
  const data = await aniListFetch<{ Page: { media: any[] } }>(LIST_QUERY, variables);
  return (data.Page?.media || []).map(mapAnime).filter((item) => item.poster_path || item.backdrop_path);
}

const SEARCH_QUERY = `
  query AnimeSearch($query: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, search: $query, sort: POPULARITY_DESC, isAdult: false) {
        id
        title { romaji english native }
        description(asHtml: false)
        coverImage { large extraLarge }
        bannerImage
        averageScore
        startDate { year month day }
      }
    }
  }
`;

export async function searchAniList(query: string, perPage = 12): Promise<MediaItem[]> {
  if (!query.trim()) return [];
  const data = await aniListFetch<{ Page: { media: any[] } }>(SEARCH_QUERY, { query, page: 1, perPage });
  return (data.Page?.media || []).map(mapAnime).filter((item) => item.poster_path || item.backdrop_path);
}

const DETAILS_QUERY = `
  query AnimeDetails($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title { romaji english native }
      description(asHtml: false)
      coverImage { large extraLarge }
      bannerImage
      averageScore
      startDate { year month day }
      episodes
      duration
      status
      format
      seasonYear
      genres
      studios(isMain: true) { nodes { name } }
      recommendations(sort: RATING_DESC, perPage: 18) {
        nodes {
          mediaRecommendation {
            id
            title { romaji english native }
            description(asHtml: false)
            coverImage { large extraLarge }
            bannerImage
            averageScore
            startDate { year month day }
          }
        }
      }
    }
  }
`;

export async function fetchAniListDetails(id: string | number) {
  const data = await aniListFetch<{ Media: any }>(DETAILS_QUERY, { id: Number(id) });
  const media = data.Media;

  if (!media?.id) throw new Error('Anime não encontrado na AniList.');

  const title = titleFromAniList(media.title);

  return {
    id: media.id,
    title,
    name: title,
    titleEnglish: media.title?.english,
    titleRomaji: media.title?.romaji,
    overview: stripHtml(media.description),
    poster_path: media.coverImage?.extraLarge || media.coverImage?.large || null,
    backdrop_path: media.bannerImage || media.coverImage?.extraLarge || null,
    first_air_date: dateFromAniList(media.startDate),
    vote_average: typeof media.averageScore === 'number' ? media.averageScore / 10 : undefined,
    runtime: media.duration,
    number_of_episodes: media.episodes,
    status: media.status,
    format: media.format,
    seasonYear: media.seasonYear,
    genres: Array.isArray(media.genres) ? media.genres.map((name: string) => ({ name })) : [],
    studios: media.studios?.nodes || [],
    recommendations: media.recommendations?.nodes || [],
  };
}

export async function fetchAniListSimilar(id: string | number): Promise<MediaItem[]> {
  const data = await aniListFetch<{ Media: any }>(DETAILS_QUERY, { id: Number(id) });
  const nodes = data.Media?.recommendations?.nodes || [];

  return nodes
    .map((node: any) => node.mediaRecommendation)
    .filter(Boolean)
    .map(mapAnime)
    .filter((item: MediaItem) => item.poster_path || item.backdrop_path);
}

