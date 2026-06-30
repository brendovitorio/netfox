import Link from 'next/link';
import { Channel } from '../services/channels';

export default function ChannelCard({ channel }: { channel: Channel }) {
  return (
    <Link href={`/canais/${channel.id}`} className="group block">
      <article className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-xl shadow-black/30 transition duration-300 group-hover:-translate-y-1 group-hover:border-red-500/60">
        <div className="grid aspect-video place-items-center overflow-hidden rounded-xl bg-black/40">
          {channel.logoUrl ? (
            <img
              src={channel.logoUrl}
              alt={channel.name}
              className="max-h-[70%] max-w-[80%] object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-2xl font-black text-zinc-600">{channel.name.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="mt-3">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Ao vivo
          </p>
          <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-zinc-100">{channel.name}</h3>
          {channel.nowPlayingTitle ? (
            <p className="line-clamp-1 text-xs text-zinc-500">{channel.nowPlayingTitle}</p>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
