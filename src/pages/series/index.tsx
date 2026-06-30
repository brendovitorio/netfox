import CategoryNav from '../../components/CategoryNav';
import MediaRow from '../../components/MediaRow';
import { fetchMovies } from '../../services/tmdb';

export default function SeriesPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-5 py-6 text-white sm:px-10 lg:px-16">
      <CategoryNav />
      <h1 className="mb-8 text-4xl font-black">Séries</h1>
      <div className="space-y-12 pb-12">
        <MediaRow title="No ar hoje" fetcher={() => fetchMovies('/tv/airing_today')} />
        <MediaRow title="Populares" fetcher={() => fetchMovies('/tv/popular')} />
        <MediaRow title="Mais bem avaliadas" fetcher={() => fetchMovies('/tv/top_rated')} />
        <MediaRow title="No ar" fetcher={() => fetchMovies('/tv/on_the_air')} />
      </div>
    </main>
  );
}
