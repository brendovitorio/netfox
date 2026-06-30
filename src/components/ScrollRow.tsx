import { ReactNode } from 'react';
import { useHorizontalWheel } from '../hooks/useHorizontalWheel';

type ScrollRowProps = {
  children: ReactNode;
  gapClassName?: string;
};

export default function ScrollRow({ children, gapClassName = 'gap-2' }: ScrollRowProps) {
  const ref = useHorizontalWheel<HTMLDivElement>();

  const scrollBy = (amount: number) => {
    ref.current?.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={() => scrollBy(-280)}
        aria-label="Rolar para a esquerda"
        className="absolute left-0 z-10 hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-black/80 text-white shadow-lg hover:bg-black sm:grid"
      >
        ◀
      </button>
      <div ref={ref} className={`scrollbar-hide flex w-full overflow-x-auto pb-1 sm:px-10 ${gapClassName}`}>
        {children}
      </div>
      <button
        type="button"
        onClick={() => scrollBy(280)}
        aria-label="Rolar para a direita"
        className="absolute right-0 z-10 hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-black/80 text-white shadow-lg hover:bg-black sm:grid"
      >
        ▶
      </button>
    </div>
  );
}
