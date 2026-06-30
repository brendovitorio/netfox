import Link from 'next/link';
import { useRouter } from 'next/router';

const CATEGORIES = [
  { href: '/', label: 'Início' },
  { href: '/filmes', label: 'Filmes' },
  { href: '/series', label: 'Séries' },
  { href: '/animes', label: 'Animes' },
  { href: '/doramas', label: 'Doramas' },
  { href: '/canais', label: 'TV' },
];

export default function CategoryNav() {
  const router = useRouter();

  return (
    <nav className="mb-10 flex flex-wrap items-center justify-between gap-4">
      <Link href="/" className="text-2xl font-black text-red-500">
        NETFOX
      </Link>
      <div className="scrollbar-hide flex max-w-full gap-2 overflow-x-auto">
        {CATEGORIES.map((category) => {
          const active = router.pathname === category.href;
          return (
            <Link
              key={category.href}
              href={category.href}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                active ? 'bg-red-600 text-white' : 'bg-white/10 text-zinc-200 hover:bg-white/20'
              }`}
            >
              {category.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
