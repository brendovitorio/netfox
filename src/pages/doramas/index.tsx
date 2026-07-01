import { GetStaticProps } from 'next';
import CategoryNav from '../../components/CategoryNav';
import MediaRow from '../../components/MediaRow';
import { fetchDoramas, MediaItem } from '../../services/tmdb';

type DoramasPageProps = {
  popular: MediaItem[];
  topRated: MediaItem[];
};

export default function DoramasPage({ popular, topRated }: DoramasPageProps) {
  return (
    <main className="min-h-screen bg-[#050505] px-5 py-6 text-white sm:px-10 lg:px-16">
      <CategoryNav />
      <h1 className="mb-2 text-4xl font-black">Doramas</h1>
      <p className="mb-8 text-sm text-zinc-400">Dramas asiáticos (Coreia, Japão, China e Tailândia) via TMDB.</p>
      <div className="space-y-12 pb-12">
        <MediaRow title="Populares" items={popular} />
        <MediaRow title="Mais bem avaliados" items={topRated} />
      </div>
    </main>
  );
}

export const getStaticProps: GetStaticProps<DoramasPageProps> = async () => {
  const [r1, r2] = await Promise.allSettled([
    fetchDoramas('popularity.desc'),
    fetchDoramas('vote_average.desc'),
  ]);

  return {
    props: {
      popular: r1.status === 'fulfilled' ? r1.value : [],
      topRated: r2.status === 'fulfilled' ? r2.value : [],
    },
    revalidate: 600,
  };
};
