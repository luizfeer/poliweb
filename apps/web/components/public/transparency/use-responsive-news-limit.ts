'use client';

import { useLayoutEffect, useState } from 'react';

const MD_UP = '(min-width: 768px)';

/** 3 em viewport &lt; md, 5 a partir de md (alinha ao breakpoint Tailwind). */
export function useResponsiveNewsLimit(): number {
  const [limit, setLimit] = useState(3);

  useLayoutEffect(() => {
    const mq = window.matchMedia(MD_UP);
    const sync = () => setLimit(mq.matches ? 5 : 3);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return limit;
}
