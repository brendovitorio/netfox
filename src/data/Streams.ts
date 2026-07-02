export type StreamSource = {
  provider: string;
  type: 'iframe';
  src: string;
  quality?: string;
  language?: string;
};

export type MediaType = 'movie' | 'tv';

export type GetStreamOptions = {
  season?: string | number;
  episode?: string | number;
};

type ProviderDef = {
  name: string;
  movie: (id: string) => string;
  tv: (id: string, season: number, episode: number) => string;
};

const PROVIDERS: ProviderDef[] = [
  {
    // Stable, no ads, TMDB native — vidsrc.to is the reliable domain
    name: 'VidSrc',
    movie: (id) => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    // Clean player, no ads, supports color/autoplay params
    name: 'VidLink',
    movie: (id) => `https://vidlink.pro/movie/${id}?autoplay=true`,
    tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=true`,
  },
  {
    // Free TMDB player API — 14+ servers, minimal ads, no API key needed
    name: 'VidCore',
    movie: (id) => `https://www.vidcore.org/embed/movie/${id}`,
    tv: (id, s, e) => `https://www.vidcore.org/embed/tv/${id}/${s}/${e}`,
  },
  {
    // No ads version — autoembed uses tmdb/ prefix in the path
    name: 'AutoEmbed',
    movie: (id) => `https://autoembed.co/movie/tmdb/${id}`,
    tv: (id, s, e) => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`,
  },
  {
    // Brazilian provider — filmes/séries/anime/doramas, documented API
    name: 'BetterFlix',
    movie: (id) => `https://betterflix.click/api/player?id=${id}&type=movie`,
    tv: (id, s, e) => `https://betterflix.click/api/player?id=${id}&type=tv&season=${s}&episode=${e}`,
  },
  {
    // SuperFlixAPI .rest domain (same backend as .lifestyle, different domain)
    name: 'SuperFlix',
    movie: (id) => `https://superflixapi.rest/filme/${id}`,
    tv: (id, s, e) => `https://superflixapi.rest/serie/${id}/${s}/${e}`,
  },
  {
    // SuperFlixAPI .asia domain — extra fallback
    name: 'SuperFlix Asia',
    movie: (id) => `https://superflixapi.asia/filme/${id}`,
    tv: (id, s, e) => `https://superflixapi.asia/serie/${id}/${s}/${e}`,
  },
  {
    // Original .lifestyle domain
    name: 'SuperFlix .life',
    movie: (id) => `https://superflixapi.lifestyle/filme/${id}`,
    tv: (id, s, e) => `https://superflixapi.lifestyle/serie/${id}/${s}/${e}`,
  },
  {
    // Multi-provider aggregator — TMDB flag required
    name: 'MultiEmbed',
    movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    name: 'Embed.su',
    movie: (id) => `https://embed.su/embed/movie/${id}`,
    tv: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },
];

function sanitizeId(id: string | number) {
  const value = String(id).trim();
  if (!value) throw new Error('ID inválido.');
  return encodeURIComponent(value);
}

export function getStreams(
  mediaType: MediaType,
  id: string | number,
  options: GetStreamOptions = {}
): StreamSource[] {
  const tmdbId = sanitizeId(id);
  const season = Number(options.season ?? 1);
  const episode = Number(options.episode ?? 1);

  return PROVIDERS.map((p) => ({
    provider: p.name,
    type: 'iframe' as const,
    src: mediaType === 'movie' ? p.movie(tmdbId) : p.tv(tmdbId, season, episode),
    quality: 'auto',
    language: 'pt-BR',
  }));
}

export function getStream(
  mediaType: MediaType,
  id: string | number,
  options: GetStreamOptions = {}
): StreamSource | null {
  return getStreams(mediaType, id, options)[0] ?? null;
}
