import { GetStaticProps } from 'next';
import CategoryNav from '../../components/CategoryNav';
import MediaRow from '../../components/MediaRow';
import { fetchMovies, MediaItem } from '../../services/tmdb';

type SeriesPageProps = {
  airingToday: MediaItem[];
  popular: MediaItem[];
  topRated: MediaItem[];
  onTheAir: MediaItem[];
};

export default function SeriesPage({ airingToday, popular, topRated, onTheAir }: SeriesPageProps) {
  return (
    <main className="min-h-screen bg-[#050505] px-5 py-6 text-white sm:px-10 lg:px-16">
      <CategoryNav />
      <h1 className="mb-8 text-4xl font-black">Séries</h1>
      <div className="space-y-12 pb-12">
        <MediaRow title="No ar hoje" items={airingToday} />
        <MediaRow title="Populares" items={popular} />
        <MediaRow title="Mais bem avaliadas" items={topRated} />
        <MediaRow title="No ar" items={onTheAir} />
      </div>
    </main>
  );
}

export const getStaticProps: GetStaticProps<SeriesPageProps> = async () => {
  const [r1, r2, r3, r4] = await Promise.allSettled([
    fetchMovies('/tv/airing_today'),
    fetchMovies('/tv/popular'),
    fetchMovies('/tv/top_rated'),
    fetchMovies('/tv/on_the_air'),
  ]);

  return {
    props: {
      airingToday: r1.status === 'fulfilled' ? r1.value : [],
      popular: r2.status === 'fulfilled' ? r2.value : [],
      topRated: r3.status === 'fulfilled' ? r3.value : [],
      onTheAir: r4.status === 'fulfilled' ? r4.value : [],
    },
    revalidate: 600,
  };
};
