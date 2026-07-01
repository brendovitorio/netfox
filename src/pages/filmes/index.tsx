import { GetStaticProps } from 'next';
import CategoryNav from '../../components/CategoryNav';
import MediaRow from '../../components/MediaRow';
import { fetchMovies, MediaItem } from '../../services/tmdb';

type FilmesPageProps = {
  nowPlaying: MediaItem[];
  popular: MediaItem[];
  topRated: MediaItem[];
  upcoming: MediaItem[];
};

export default function FilmesPage({ nowPlaying, popular, topRated, upcoming }: FilmesPageProps) {
  return (
    <main className="min-h-screen bg-[#050505] px-5 py-6 text-white sm:px-10 lg:px-16">
      <CategoryNav />
      <h1 className="mb-8 text-4xl font-black">Filmes</h1>
      <div className="space-y-12 pb-12">
        <MediaRow title="Em cartaz" items={nowPlaying} />
        <MediaRow title="Populares" items={popular} />
        <MediaRow title="Mais bem avaliados" items={topRated} />
        <MediaRow title="Lançamentos" items={upcoming} />
      </div>
    </main>
  );
}

export const getStaticProps: GetStaticProps<FilmesPageProps> = async () => {
  const [r1, r2, r3, r4] = await Promise.allSettled([
    fetchMovies('/movie/now_playing'),
    fetchMovies('/movie/popular'),
    fetchMovies('/movie/top_rated'),
    fetchMovies('/movie/upcoming'),
  ]);

  return {
    props: {
      nowPlaying: r1.status === 'fulfilled' ? r1.value : [],
      popular: r2.status === 'fulfilled' ? r2.value : [],
      topRated: r3.status === 'fulfilled' ? r3.value : [],
      upcoming: r4.status === 'fulfilled' ? r4.value : [],
    },
    revalidate: 600,
  };
};
