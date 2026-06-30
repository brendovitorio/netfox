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

const SUPERFLIX_BASE_URL = 'https://superflixapi.lifestyle';

export const Streams: Record<string, StreamSource> = {};

function getSuperflixPath(mediaType: MediaType) {
  if (mediaType === 'movie') return 'filme';
  if (mediaType === 'tv') return 'serie';
  return null;
}

function sanitizeId(id: string | number) {
  const value = String(id).trim();
  if (!value) throw new Error('ID inválido.');
  return encodeURIComponent(value);
}

export function buildSuperflixUrl(
  mediaType: MediaType,
  id: string | number,
  options: GetStreamOptions = {}
) {
  const type = getSuperflixPath(mediaType);
  const tmdbId = sanitizeId(id);

  if (!type) return null;

  if (mediaType === 'movie') {
    return `${SUPERFLIX_BASE_URL}/${type}/${tmdbId}`;
  }

  const season = options.season ?? 1;
  const episode = options.episode ?? 1;

  return `${SUPERFLIX_BASE_URL}/${type}/${tmdbId}/${season}/${episode}`;
}

export function getStream(
  mediaType: MediaType,
  id: string | number,
  options: GetStreamOptions = {}
): StreamSource | null {
  const season = options.season ?? 1;
  const episode = options.episode ?? 1;

  const keys = [
    `${mediaType}:${id}:${season}:${episode}`,
    `${mediaType}:${id}`,
  ];

  for (const key of keys) {
    if (Streams[key]) return Streams[key];
  }

  try {
    const src = buildSuperflixUrl(mediaType, id, options);
    if (!src) return null;

    return {
      provider: 'Superflix',
      type: 'iframe',
      src,
      quality: 'auto',
      language: 'pt-BR',
    };
  } catch {
    return null;
  }
}
