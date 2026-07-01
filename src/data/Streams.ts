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
    // Primary — vidsrc.to is the stable domain (vidsrc.icu has DNS issues)
    name: 'VidSrc',
    movie: (id) => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    // Uses query-string params with tmdb=1 flag
    name: 'MultiEmbed',
    movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    name: 'Embed.su',
    movie: (id) => `https://embed.su/embed/movie/${id}`,
    tv: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: 'Superflix',
    movie: (id) => `https://superflixapi.lifestyle/filme/${id}`,
    tv: (id, s, e) => `https://superflixapi.lifestyle/serie/${id}/${s}/${e}`,
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
