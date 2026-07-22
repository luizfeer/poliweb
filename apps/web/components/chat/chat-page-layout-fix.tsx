'use client';

import { useEffect } from 'react';

export function ChatPageLayoutFix() {
  useEffect(() => {
    document.body.style.paddingBottom = '0px';
    return () => {
      document.body.style.paddingBottom = '';
    };
  }, []);

  return null;
}
