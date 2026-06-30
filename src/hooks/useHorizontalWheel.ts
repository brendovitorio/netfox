import { useEffect, useRef } from 'react';

/**
 * Translates vertical mouse-wheel scroll into horizontal scroll for a row.
 * Without this, mouse-wheel users have no way to move a horizontally
 * overflowing row sideways (only click-drag on the scrollbar works).
 */
export function useHorizontalWheel<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      el.scrollLeft += event.deltaY;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return ref;
}
