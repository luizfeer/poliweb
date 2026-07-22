'use client';

import { useEffect, useRef, useState } from 'react';
import { MobileWebViewSectionBridge } from '@/components/carmo/mobile-webview-section-bridge';
import type { CatalogSection } from '@/lib/businesses/catalog-types';
import { cn } from '@/lib/utils';

type CatalogNavProps = {
  sections: CatalogSection[];
};

export function CatalogNav({ sections }: CatalogNavProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '');
  const navRef = useRef<HTMLDivElement>(null);
  const isScrollingTo = useRef(false);

  useEffect(() => {
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingTo.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = visible[0].target.getAttribute('data-section-id');
          if (id) setActiveId(id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      },
    );

    sections.forEach((s) => {
      const el = document.querySelector(`[data-section-id="${s.id}"]`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const activeBtn = nav.querySelector(`[data-pill-id="${activeId}"]`) as HTMLElement | null;
    if (!activeBtn) return;
    const navWidth = nav.offsetWidth;
    const btnLeft = activeBtn.offsetLeft;
    const btnWidth = activeBtn.offsetWidth;
    const target = btnLeft - navWidth / 2 + btnWidth / 2;
    nav.scrollTo({ left: target, behavior: 'smooth' });
  }, [activeId]);

  function scrollToSection(sectionId: string) {
    const el = document.getElementById(`sec-${sectionId}`);
    if (!el) return;
    isScrollingTo.current = true;
    setActiveId(sectionId);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      isScrollingTo.current = false;
    }, 800);
  }

  return (
    <div
      data-hide-in-embedded-app
      className="sticky top-0 z-30 border-b border-ink-100 bg-white shadow-[0_1px_3px_rgba(25,25,25,0.06)]"
    >
      <MobileWebViewSectionBridge
        sections={sections.map((s) => ({
          id: s.id,
          label: s.name,
          href: `#${s.id}`,
        }))}
        mode="scroll"
      />
      <div
        ref={navRef}
        className="no-scrollbar flex gap-1 overflow-x-auto px-3 py-2"
        style={{ scrollPaddingLeft: 12 }}
      >
        {sections.map((s) => {
          const isActive = activeId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              data-pill-id={s.id}
              onClick={() => scrollToSection(s.id)}
              className={cn(
                'flex-shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-150',
                isActive
                  ? 'bg-clay-500 text-white'
                  : 'bg-paper-deep text-ink-700 hover:bg-paper-tint',
              )}
            >
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

