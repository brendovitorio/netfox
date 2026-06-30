import CategoryNav from '../../components/CategoryNav';
import MediaRow from '../../components/MediaRow';
import { fetchDoramas } from '../../services/tmdb';

export default function DoramasPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-5 py-6 text-white sm:px-10 lg:px-16">
      <CategoryNav />
      <h1 className="mb-2 text-4xl font-black">Doramas</h1>
      <p className="mb-8 text-sm text-zinc-400">Dramas asiáticos (Coreia, Japão, China e Tailândia) via TMDB.</p>
      <div className="space-y-12 pb-12">
        <MediaRow title="Populares" fetcher={() => fetchDoramas('popularity.desc')} />
        <MediaRow title="Mais bem avaliados" fetcher={() => fetchDoramas('vote_average.desc')} />
      </div>
    </main>
  );
}
