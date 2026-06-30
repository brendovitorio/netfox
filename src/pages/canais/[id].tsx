import { GetServerSideProps } from 'next';
import Link from 'next/link';
import CategoryNav from '../../components/CategoryNav';
import { Channel, fetchChannel } from '../../services/channels';

type CanalPageProps = {
  channel: Channel;
};

export default function CanalPage({ channel }: CanalPageProps) {
  return (
    <main className="min-h-screen bg-[#050505] px-5 py-6 text-white sm:px-10 lg:px-16">
      <CategoryNav />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        {channel.logoUrl ? (
          <img src={channel.logoUrl} alt={channel.name} className="h-10 w-auto object-contain" />
        ) : null}
        <div>
          <h1 className="text-2xl font-black">{channel.name}</h1>
          {channel.nowPlayingTitle ? <p className="text-sm text-zinc-400">Agora: {channel.nowPlayingTitle}</p> : null}
        </div>
        <span className="ml-auto flex items-center gap-2 rounded-full bg-red-600/20 px-3 py-1 text-xs font-bold text-red-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> AO VIVO
        </span>
      </div>

      <div className="aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl shadow-black/60">
        <iframe
          src={channel.embedUrl}
          title={channel.name}
          className="h-full w-full border-0 bg-black"
          allow="autoplay *; encrypted-media *; picture-in-picture *; fullscreen *"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        />
      </div>

      <Link
        href="/canais"
        className="mt-6 inline-block rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20"
      >
        ← Todos os canais
      </Link>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<CanalPageProps> = async (context) => {
  const id = Array.isArray(context.params?.id) ? context.params?.id[0] : context.params?.id;
  if (!id) return { notFound: true };

  try {
    const channel = await fetchChannel(id);
    if (!channel) return { notFound: true };
    return { props: { channel } };
  } catch (error) {
    console.error('Erro ao carregar canal:', error);
    return { notFound: true };
  }
};
