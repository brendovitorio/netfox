import CategoryNav from '../../components/CategoryNav';
import MediaRow from '../../components/MediaRow';
import { fetchAniListSection } from '../../services/anilist';

export default function AnimesPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-5 py-6 text-white sm:px-10 lg:px-16">
      <CategoryNav />
      <h1 className="mb-8 text-4xl font-black">Animes</h1>
      <div className="space-y-12 pb-12">
        <MediaRow title="Em alta" fetcher={() => fetchAniListSection('trending', 18)} empty="Nada retornado pela AniList." />
        <MediaRow title="Populares" fetcher={() => fetchAniListSection('popular', 18)} empty="Nada retornado pela AniList." />
        <MediaRow title="Temporada atual" fetcher={() => fetchAniListSection('seasonal', 18)} empty="Nada retornado pela AniList." />
        <MediaRow title="Mais bem avaliados" fetcher={() => fetchAniListSection('top', 18)} empty="Nada retornado pela AniList." />
        <MediaRow title="Recentes" fetcher={() => fetchAniListSection('recent', 18)} empty="Nada retornado pela AniList." />
      </div>
    </main>
  );
}
