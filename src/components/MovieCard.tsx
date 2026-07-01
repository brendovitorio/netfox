import Image from 'next/image';
import Link from 'next/link';
import { imageUrl, MediaType } from '../services/tmdb';

interface MovieCardProps {
  id: number;
  title: string;
  posterPath?: string | null;
  mediaType?: MediaType;
  rating?: number | null;
}

function labelOf(mediaType: MediaType) {
  if (mediaType === 'anime') return 'Anime';
  if (mediaType === 'dorama') return 'Dorama';
  if (mediaType === 'tv') return 'Série';
  return 'Filme';
}

export default function MovieCard({ id, title, posterPath, mediaType = 'movie', rating }: MovieCardProps) {
  return (
    <Link href={`/watch/${mediaType}/${id}`} className="group block min-w-[152px] max-w-[152px] sm:min-w-[180px] sm:max-w-[180px]">
      <article className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-xl shadow-black/30 transition duration-300 group-hover:-translate-y-1 group-hover:border-red-500/60 group-hover:shadow-red-950/30">
        <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900">
          <Image
            src={imageUrl(posterPath, 'w342')}
            alt={title}
            fill
            sizes="(max-width: 640px) 152px, 180px"
            className="object-cover transition duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/95 to-transparent" />
          <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
            {labelOf(mediaType)}
          </span>
          {typeof rating === 'number' && rating > 0 ? (
            <span className="absolute bottom-2 right-2 rounded-full bg-yellow-400 px-2 py-1 text-xs font-black text-black">
              {rating.toFixed(1)}
            </span>
          ) : null}
        </div>
        <div className="p-3">
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold text-zinc-100">{title}</h3>
        </div>
      </article>
    </Link>
  );
}
