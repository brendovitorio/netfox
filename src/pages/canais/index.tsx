import { GetServerSideProps } from 'next';
import { useState } from 'react';
import CategoryNav from '../../components/CategoryNav';
import ChannelCard from '../../components/ChannelCard';
import ScrollRow from '../../components/ScrollRow';
import { Channel, ChannelCategory, fetchChannelCategories, fetchChannels } from '../../services/channels';

type CanaisPageProps = {
  channels: Channel[];
  categories: ChannelCategory[];
};

export default function CanaisPage({ channels, categories }: CanaisPageProps) {
  const [active, setActive] = useState<string>('todos');

  const filtered = active === 'todos' ? channels : channels.filter((channel) => channel.category === active);

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-6 text-white sm:px-10 lg:px-16">
      <CategoryNav />
      <h1 className="mb-2 text-4xl font-black">TV ao vivo</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Canais 24h via Rei dos Embeds. É programação em tempo real — não dá pra escolher episódio.
      </p>

      <div className="mb-8">
        <ScrollRow>
          <button
            type="button"
            onClick={() => setActive('todos')}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
              active === 'todos' ? 'bg-red-600 text-white' : 'bg-white/10 text-zinc-200 hover:bg-white/20'
            }`}
          >
            Todos
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActive(category.name)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                active === category.name ? 'bg-red-600 text-white' : 'bg-white/10 text-zinc-200 hover:bg-white/20'
              }`}
            >
              {category.name}
            </button>
          ))}
        </ScrollRow>
      </div>

      {filtered.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-5 text-zinc-400">
          {channels.length ? 'Nenhum canal nessa categoria.' : 'Não foi possível carregar os canais agora.'}
        </p>
      )}
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<CanaisPageProps> = async () => {
  const [channels, categories] = await Promise.all([
    fetchChannels().catch(() => []),
    fetchChannelCategories().catch(() => []),
  ]);

  return { props: { channels, categories } };
};
