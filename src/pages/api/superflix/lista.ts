import type { NextApiRequest, NextApiResponse } from 'next';

const SUPERFLIX_BASE_URL = 'https://superflixapi.cyou/lista';
const ALLOWED_CATEGORIES = new Set(['filme', 'serie', 'anime', 'dorama']);
const ALLOWED_TYPES = new Set(['generos', 'imdb', 'tmdb']);

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, error: 'Método não permitido.' });
  }

  const category = first(req.query.category);
  const type = first(req.query.type);
  const genero = first(req.query.genero);
  const order = first(req.query.order) ?? 'asc';

  if (!category || !ALLOWED_CATEGORIES.has(category)) {
    return res.status(400).json({
      success: false,
      error: 'Categoria inválida. Use filme, serie, anime ou dorama.',
    });
  }

  if (!type || !ALLOWED_TYPES.has(type)) {
    return res.status(400).json({
      success: false,
      error: 'Tipo inválido. Use generos, imdb ou tmdb.',
    });
  }

  const upstream = new URL(SUPERFLIX_BASE_URL);
  upstream.searchParams.set('category', category);
  upstream.searchParams.set('type', type);
  upstream.searchParams.set('format', 'json');

  if (genero) upstream.searchParams.set('genero', genero);
  if (order) upstream.searchParams.set('order', order);

  try {
    const response = await fetch(upstream.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Netfox/1.0',
      },
    });

    const text = await response.text();

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json; charset=utf-8');

    return res.status(response.status).send(text);
  } catch (error) {
    return res.status(502).json({
      success: false,
      error: 'Não foi possível consultar a API externa agora.',
    });
  }
}
