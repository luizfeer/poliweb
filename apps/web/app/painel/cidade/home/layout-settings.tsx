'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { updateHomeLayoutConfigAction } from '@/lib/home/actions';
import type { HomeLayoutConfig, HomeTopMargin } from '@/lib/home';

const TOP_MARGIN_OPTIONS: { value: HomeTopMargin; label: string }[] = [
  { value: 'none', label: 'Nenhuma (encosta na navbar)' },
  { value: 'sm', label: 'Pequena (12px)' },
  { value: 'md', label: 'Media (24px)' },
  { value: 'lg', label: 'Grande (40px)' },
];

type Props = { initial: HomeLayoutConfig };

export function LayoutSettings({ initial }: Props) {
  const router = useRouter();
  const [topMargin, setTopMargin] = useState<HomeTopMargin>(initial.topMargin ?? 'none');
  const [headerFade, setHeaderFade] = useState<boolean>(initial.headerFade ?? false);
  const [error, setError] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const savedTimeout = useRef<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await updateHomeLayoutConfigAction({ topMargin, headerFade });
        if (savedTimeout.current !== null) window.clearTimeout(savedTimeout.current);
        setShowSaved(true);
        savedTimeout.current = window.setTimeout(() => setShowSaved(false), 4000);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao salvar.');
      }
    });
  }

  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="text-lg font-semibold">Layout geral</h2>
      <p className="text-muted-foreground text-sm">
        Configuracoes que afetam a home toda (antes do primeiro bloco).
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="layout-top-margin">Margem superior</Label>
          <select
            id="layout-top-margin"
            value={topMargin}
            onChange={(e) => setTopMargin(e.target.value as HomeTopMargin)}
            className="border-ink-200 h-9 rounded-md border bg-white px-2 text-sm"
          >
            {TOP_MARGIN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-muted-foreground text-xs">
            Espaco entre o cabecalho e o primeiro bloco da home.
          </p>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="layout-header-fade">Fade da navbar</Label>
          <label className="flex h-9 items-center gap-2 text-sm">
            <input
              id="layout-header-fade"
              type="checkbox"
              checked={headerFade}
              onChange={(e) => setHeaderFade(e.target.checked)}
            />
            Ativar gradiente do laranja pro branco
          </label>
          <p className="text-muted-foreground text-xs">
            Desce um gradiente do laranja da navbar pro fundo, suavizando a borda.
          </p>
        </div>
      </div>

      {error ? <p className="text-destructive mt-3 text-sm">{error}</p> : null}

      <div className="mt-4 flex items-center gap-3">
        <Button type="button" onClick={save} disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar layout'}
        </Button>
        {showSaved ? <span className="text-sm font-semibold text-emerald-600">✓ Salvo</span> : null}
      </div>
    </section>
  );
}
