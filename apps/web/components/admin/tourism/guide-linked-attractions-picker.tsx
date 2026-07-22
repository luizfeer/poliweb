'use client';

import { ChevronDown, ChevronUp, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  searchAttractionsForGuideLinkAction,
  type GuideAttractionSearchHit,
} from '@/app/painel/cidade/turismo/guias/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TYPE_LABEL: Record<string, string> = {
  balneario: 'Balneário',
  mirante: 'Mirante',
  cachoeira: 'Cachoeira',
  trilha: 'Trilha',
  igreja: 'Igreja',
  museu: 'Museu',
  parque: 'Parque',
  praia: 'Praia',
  lago: 'Lago',
  historico: 'Histórico',
};

export type LinkedAttractionInitial = {
  entityId: string;
  name: string;
  slug: string;
  type: string;
  label: string | null;
  description: string | null;
};

type NonAttractionRow = {
  entity_type: string;
  entity_id: string;
  sort_order?: number;
  label?: string | null;
  description?: string | null;
};

type Props = {
  nonAttractionEntitiesJson: string;
  linkedAttractionsInitial: LinkedAttractionInitial[];
};

function mergeLinkedEntitiesJson(
  attractions: LinkedAttractionInitial[],
  nonAttraction: NonAttractionRow[],
): string {
  const attractionPayload = attractions.map((row, index) => ({
    entity_type: 'attraction' as const,
    entity_id: row.entityId,
    sort_order: index,
    label: row.label?.trim() ? row.label.trim() : null,
    description: row.description?.trim() ? row.description.trim() : null,
  }));
  const othersSorted = [...nonAttraction].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const rest = othersSorted.map((row, index) => ({
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    sort_order: attractionPayload.length + index,
    label: row.label ?? null,
    description: row.description ?? null,
  }));
  return JSON.stringify([...attractionPayload, ...rest]);
}

export function GuideLinkedAttractionsPicker({
  nonAttractionEntitiesJson,
  linkedAttractionsInitial,
}: Props) {
  const nonAttraction = useMemo(() => {
    try {
      const parsed = JSON.parse(nonAttractionEntitiesJson) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((row): row is NonAttractionRow => {
        if (!row || typeof row !== 'object') return false;
        const o = row as Record<string, unknown>;
        return (
          typeof o.entity_type === 'string' &&
          o.entity_type !== 'attraction' &&
          typeof o.entity_id === 'string'
        );
      });
    } catch {
      return [];
    }
  }, [nonAttractionEntitiesJson]);

  const [attractions, setAttractions] = useState<LinkedAttractionInitial[]>(() => [...linkedAttractionsInitial]);

  const mergedJson = useMemo(
    () => mergeLinkedEntitiesJson(attractions, nonAttraction),
    [attractions, nonAttraction],
  );

  const [query, setQuery] = useState('');
  const [searchHits, setSearchHits] = useState<GuideAttractionSearchHit[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearchPending, startSearchTransition] = useTransition();

  const displayHits = query.trim().length < 2 ? [] : searchHits;

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }
    const t = setTimeout(() => {
      startSearchTransition(async () => {
        const result = await searchAttractionsForGuideLinkAction({ q: query.trim() });
        setSearchHits(result.items.filter((h) => !attractions.some((a) => a.entityId === h.id)));
      });
    }, 280);
    return () => clearTimeout(t);
  }, [query, attractions]);

  function addHit(hit: GuideAttractionSearchHit) {
    setAttractions((list) => [
      ...list,
      {
        entityId: hit.id,
        name: hit.name,
        slug: hit.slug,
        type: hit.type,
        label: null,
        description: null,
      },
    ]);
    setQuery('');
    setSearchHits((h) => h.filter((x) => x.id !== hit.id));
    setShowResults(false);
  }

  function move(index: number, dir: -1 | 1) {
    setAttractions((list) => {
      const next = [...list];
      const j = index + dir;
      if (j < 0 || j >= next.length) return list;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  function remove(index: number) {
    setAttractions((list) => list.filter((_, i) => i !== index));
  }

  function updateRow(index: number, patch: Partial<Pick<LinkedAttractionInitial, 'label' | 'description'>>) {
    setAttractions((list) =>
      list.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  return (
    <div className="space-y-3 md:col-span-2">
      <input type="hidden" name="linked_entities_json" value={mergedJson} />

      <div>
        <Label className="text-base">Principais atrações</Label>
        <p className="text-muted-foreground mt-1 text-xs">
          Busque atrações já cadastradas na cidade e ordene como aparecem no bloco Principais atrações da página pública
          do guia. Textos opcionais sobrescrevem nome/descrição da ficha só neste card.
        </p>
      </div>

      {nonAttraction.length > 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-xs">
          Este guia mantém {nonAttraction.length} vínculo(s) de outros tipos (comércio, pousada, etc.) —
          continuam ao salvar; só atrações são editadas aqui.
        </p>
      ) : null}

      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              className="pl-9"
              placeholder="Buscar por nome da atração…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              autoComplete="off"
            />
          </div>
        </div>
        {showResults && displayHits.length > 0 ? (
          <ul className="bg-popover absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border shadow-md">
            {displayHits.map((hit) => (
              <li key={hit.id}>
                <button
                  type="button"
                  className="hover:bg-muted flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addHit(hit)}
                >
                  <span>
                    <strong>{hit.name}</strong>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {TYPE_LABEL[hit.type] ?? hit.type}
                    </span>
                  </span>
                  <Plus className="size-4 shrink-0 opacity-60" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {showResults && query.trim().length >= 2 && !isSearchPending && displayHits.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-xs">Nenhuma atração nova encontrada (ou já está na lista).</p>
        ) : null}
      </div>

      <div className="space-y-3">
        {attractions.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-sm">
            Nenhuma atração vinculada. Use a busca acima para adicionar.
          </p>
        ) : (
          attractions.map((row, index) => (
            <div key={row.entityId} className="rounded-xl border bg-muted/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs font-medium">
                    {TYPE_LABEL[row.type] ?? row.type}
                    {!row.slug ? (
                      <span className="text-destructive ml-2">(sem slug — verifique cadastro)</span>
                    ) : null}
                  </p>
                  <p className="font-semibold leading-snug">{row.name}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    aria-label="Subir"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    aria-label="Descer"
                    onClick={() => move(index, 1)}
                    disabled={index === attractions.length - 1}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive size-8"
                    aria-label="Remover"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Título no card (opcional)</Label>
                  <Input
                    value={row.label ?? ''}
                    placeholder={row.name}
                    onChange={(e) => updateRow(index, { label: e.target.value })}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">Descrição curta (opcional)</Label>
                  <textarea
                    value={row.description ?? ''}
                    rows={2}
                    className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="Resumo para o destaque no guia…"
                    onChange={(e) => updateRow(index, { description: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
