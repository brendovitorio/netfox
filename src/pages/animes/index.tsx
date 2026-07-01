import { GetStaticProps } from 'next';
import CategoryNav from '../../components/CategoryNav';
import MediaRow from '../../components/MediaRow';
import { fetchAniListSection } from '../../services/anilist';
import { MediaItem } from '../../services/tmdb';

type AnimesPageProps = {
  trending: MediaItem[];
  popular: MediaItem[];
  seasonal: MediaItem[];
  top: MediaItem[];
  recent: MediaItem[];
};

export default function AnimesPage({ trending, popular, seasonal, top, recent }: AnimesPageProps) {
  return (
    <main className="min-h-screen bg-[#050505] px-5 py-6 text-white sm:px-10 lg:px-16">
      <CategoryNav />
      <h1 className="mb-8 text-4xl font-black">Animes</h1>
      <div className="space-y-12 pb-12">
        <MediaRow title="Em alta" items={trending} empty="Nada retornado pela AniList." />
        <MediaRow title="Populares" items={popular} empty="Nada retornado pela AniList." />
        <MediaRow title="Temporada atual" items={seasonal} empty="Nada retornado pela AniList." />
        <MediaRow title="Mais bem avaliados" items={top} empty="Nada retornado pela AniList." />
        <MediaRow title="Recentes" items={recent} empty="Nada retornado pela AniList." />
      </div>
    </main>
  );
}

export const getStaticProps: GetStaticProps<AnimesPageProps> = async () => {
  const [r1, r2, r3, r4, r5] = await Promise.allSettled([
    fetchAniListSection('trending', 18),
    fetchAniListSection('popular', 18),
    fetchAniListSection('seasonal', 18),
    fetchAniListSection('top', 18),
    fetchAniListSection('recent', 18),
  ]);

  return {
    props: {
      trending: r1.status === 'fulfilled' ? r1.value : [],
      popular: r2.status === 'fulfilled' ? r2.value : [],
      seasonal: r3.status === 'fulfilled' ? r3.value : [],
      top: r4.status === 'fulfilled' ? r4.value : [],
      recent: r5.status === 'fulfilled' ? r5.value : [],
    },
    revalidate: 600,
  };
};
