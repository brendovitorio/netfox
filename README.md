# Netfox

Clone visual estilo streaming feito em Next.js.

## Fontes de dados

- **Filmes e séries:** TMDB (catálogo) + Superflix (player via iframe).
- **Animes/catálogo:** AniList API.
- **Animes/player:** o título da AniList é localizado automaticamente no TMDB (por nome/ano) e reproduzido pelo mesmo player Superflix usado em filmes/séries.

## Rotas principais

```txt
/
/watch/movie/:id
/watch/tv/:id?season=1&episode=1
/watch/anime/:id?season=1&episode=1
```

## Variáveis de ambiente

Crie um `.env.local`:

```env
NEXT_PUBLIC_TMDB_API_KEY=sua_chave_tmdb
```

## Instalação

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
