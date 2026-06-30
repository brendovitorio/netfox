import CategoryNav from '../../components/CategoryNav';
import MediaRow from '../../components/MediaRow';
import { fetchMovies } from '../../services/tmdb';

export default function FilmesPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-5 py-6 text-white sm:px-10 lg:px-16">
      <CategoryNav />
      <h1 className="mb-8 text-4xl font-black">Filmes</h1>
      <div className="space-y-12 pb-12">
        <MediaRow title="Em cartaz" fetcher={() => fetchMovies('/movie/now_playing')} />
        <MediaRow title="Populares" fetcher={() => fetchMovies('/movie/popular')} />
        <MediaRow title="Mais bem avaliados" fetcher={() => fetchMovies('/movie/top_rated')} />
        <MediaRow title="Lançamentos" fetcher={() => fetchMovies('/movie/upcoming')} />
      </div>
    </main>
  );
}
