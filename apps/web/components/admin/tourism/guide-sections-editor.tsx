'use client';

import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  ImageIcon,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Video as VideoIcon,
  X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  deleteMediaAction,
  finalizeMediaUploadAction,
  requestMediaUploadTokenAction,
} from '@/lib/media/actions';
import { uploadDirectToProcessor } from '@/lib/media/direct-upload';
import { videoPosterUrl } from '@/lib/media/video-poster';

async function deleteAssetSafe(assetId: string | null | undefined) {
  if (!assetId) return;
  try {
    const fd = new FormData();
    fd.set('asset_id', assetId);
    await deleteMediaAction(fd);
  } catch (caught) {
    console.error('[guide-sections-editor] falha ao remover asset', assetId, caught);
    toast.error('Falha ao remover mídia da CDN. Verifique o painel.');
  }
}

type MediaKind = 'image' | 'video';

type SectionItem = {
  title: string;
  description: string;
  image: string | null;
  imageAssetId: string | null;
  alt: string | null;
  tags: string[];
  mediaKind: MediaKind | null;
};

type SectionExperience = {
  title: string;
  description: string;
  image: string | null;
  imageAssetId: string | null;
  alt: string | null;
  mediaKind: MediaKind | null;
  duration: string | null;
  price: string | null;
  tags: string[];
  cta: { label: string; href: string } | null;
};

type SectionData = {
  id: string;
  title: string;
  subtitle: string | null;
  // Display kind chosen by editor — drives which structured block is rendered.
  kind: 'items' | 'experiences' | 'raw';
  items: SectionItem[];
  experiences: SectionExperience[];
  // Raw JSON for any other field (places, fares, seasons, programHighlights, etc.)
  // Kept untouched on save.
  extra: Record<string, unknown>;
};

type GuideSectionsEditorProps = {
  entityType: string;
  entityId: string;
  initialJson: string;
};

function genId(prefix = 'sec'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function isVideoUrl(url: string | null): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return /\.(mp4|webm|mov|m4v|ogv)$/.test(clean);
}

function parseInitial(json: string): SectionData[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row): SectionData => {
      const r = row as Record<string, unknown>;
      const itemsRaw = Array.isArray(r.items) ? (r.items as Array<Record<string, unknown>>) : [];
      const experiencesRaw = Array.isArray(r.experiences)
        ? (r.experiences as Array<Record<string, unknown>>)
        : [];

      const items = itemsRaw.map<SectionItem>((it) => {
        const image = typeof it.image === 'string' && it.image ? it.image : null;
        const rawKind = it.mediaKind;
        const mediaKind: MediaKind | null =
          rawKind === 'image' || rawKind === 'video'
            ? rawKind
            : image
              ? isVideoUrl(image)
                ? 'video'
                : 'image'
              : null;
        return {
          title: String(it.title ?? ''),
          description: String(it.description ?? ''),
          image,
          imageAssetId: typeof it.imageAssetId === 'string' ? it.imageAssetId : null,
          alt: typeof it.alt === 'string' ? it.alt : null,
          tags: Array.isArray(it.tags) ? it.tags.filter((t): t is string => typeof t === 'string') : [],
          mediaKind,
        };
      });

      const experiences = experiencesRaw.map<SectionExperience>((ex) => {
        const image = typeof ex.image === 'string' && ex.image ? ex.image : null;
        const rawKind = ex.mediaKind;
        const mediaKind: MediaKind | null =
          rawKind === 'image' || rawKind === 'video'
            ? rawKind
            : image
              ? isVideoUrl(image)
                ? 'video'
                : 'image'
              : null;
        const ctaObj = ex.cta && typeof ex.cta === 'object' ? (ex.cta as Record<string, unknown>) : null;
        return {
          title: String(ex.title ?? ''),
          description: String(ex.description ?? ''),
          image,
          imageAssetId: typeof ex.imageAssetId === 'string' ? ex.imageAssetId : null,
          alt: typeof ex.alt === 'string' ? ex.alt : null,
          mediaKind,
          duration: typeof ex.duration === 'string' ? ex.duration : null,
          price: typeof ex.price === 'string' ? ex.price : null,
          tags: Array.isArray(ex.tags) ? ex.tags.filter((t): t is string => typeof t === 'string') : [],
          cta: ctaObj
            ? {
                label: String(ctaObj.label ?? ''),
                href: String(ctaObj.href ?? ''),
              }
            : null,
        };
      });

      const kind: SectionData['kind'] = experiences.length > 0 ? 'experiences' : items.length > 0 ? 'items' : 'raw';

      // Strip handled keys; keep everything else as extra.
      const handled = new Set(['id', 'title', 'subtitle', 'items', 'experiences']);
      const extra: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(r)) {
        if (!handled.has(k)) extra[k] = v;
      }

      return {
        id: String(r.id ?? genId()),
        title: String(r.title ?? ''),
        subtitle: typeof r.subtitle === 'string' ? r.subtitle : null,
        kind,
        items,
        experiences,
        extra,
      };
    });
  } catch {
    return [];
  }
}

function serialize(sections: SectionData[]): string {
  return JSON.stringify(
    sections.map((s) => {
      const out: Record<string, unknown> = {
        ...s.extra,
        id: s.id,
        title: s.title,
        subtitle: s.subtitle && s.subtitle.trim() ? s.subtitle.trim() : null,
      };
      if (s.kind === 'items') {
        out.items = s.items.map((it) => ({
          title: it.title.trim(),
          description: it.description.trim(),
          image: it.image,
          imageAssetId: it.imageAssetId,
          alt: it.alt,
          tags: it.tags,
          mediaKind: it.mediaKind,
        }));
      } else if (s.kind === 'experiences') {
        out.experiences = s.experiences.map((ex) => ({
          title: ex.title.trim(),
          description: ex.description.trim(),
          image: ex.image,
          imageAssetId: ex.imageAssetId,
          alt: ex.alt,
          mediaKind: ex.mediaKind,
          duration: ex.duration,
          price: ex.price,
          tags: ex.tags,
          cta: ex.cta && ex.cta.label && ex.cta.href ? ex.cta : null,
        }));
      }
      return out;
    }),
    null,
    2,
  );
}

export function GuideSectionsEditor({ entityType, entityId, initialJson }: GuideSectionsEditorProps) {
  const [sections, setSections] = useState<SectionData[]>(() => parseInitial(initialJson));
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const serialized = useMemo(() => serialize(sections), [sections]);

  function updateSection(index: number, patch: Partial<SectionData>) {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addSection(kind: SectionData['kind']) {
    setSections((prev) => [
      ...prev,
      {
        id: genId(),
        title: kind === 'experiences' ? 'Experiências' : 'Nova seção',
        subtitle: null,
        kind,
        items: kind === 'items' ? [emptyItem()] : [],
        experiences: kind === 'experiences' ? [emptyExperience()] : [],
        extra: {},
      },
    ]);
  }

  function removeSection(index: number) {
    setSections((prev) => {
      const target = prev[index];
      if (target) {
        const ids: string[] = [];
        for (const it of target.items) if (it.imageAssetId) ids.push(it.imageAssetId);
        for (const ex of target.experiences) if (ex.imageAssetId) ids.push(ex.imageAssetId);
        void Promise.all(ids.map((id) => deleteAssetSafe(id)));
      }
      return prev.filter((_, i) => i !== index);
    });
  }

  function moveSection(index: number, dir: -1 | 1) {
    setSections((prev) => {
      const next = prev.slice();
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function toggle(id: string) {
    setCollapsed((c) => ({ ...c, [id]: !c[id] }));
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="sections_json" value={serialized} />

      {sections.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-200 bg-paper p-6 text-center text-sm text-ink-600">
          Nenhuma seção ainda.
        </div>
      ) : null}

      {sections.map((section, index) => {
        const isCollapsed = collapsed[section.id];
        return (
          <div
            key={section.id}
            className="rounded-lg border border-ink-100 bg-white shadow-sm"
          >
            <header className="flex items-center justify-between gap-2 border-b border-ink-100 bg-paper px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <GripVertical className="size-4 text-ink-400" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => toggle(section.id)}
                  className="inline-flex size-7 items-center justify-center rounded text-ink-700 hover:bg-ink-100"
                  aria-label={isCollapsed ? 'Expandir' : 'Recolher'}
                >
                  {isCollapsed ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronUp className="size-4" />
                  )}
                </button>
                <div className="min-w-0">
                  <p className="m-0 truncate text-sm font-semibold text-ink-900">
                    {section.title || '(sem título)'}
                  </p>
                  <p className="m-0 text-[11px] text-ink-500">
                    {section.kind === 'items'
                      ? `${section.items.length} card${section.items.length === 1 ? '' : 's'}`
                      : section.kind === 'experiences'
                        ? `${section.experiences.length} experiência${section.experiences.length === 1 ? '' : 's'}`
                        : 'Conteúdo avançado (JSON)'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveSection(index, -1)}
                  disabled={index === 0}
                  className="inline-flex size-7 items-center justify-center rounded text-ink-700 hover:bg-ink-100 disabled:opacity-40"
                  aria-label="Mover para cima"
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(index, 1)}
                  disabled={index === sections.length - 1}
                  className="inline-flex size-7 items-center justify-center rounded text-ink-700 hover:bg-ink-100 disabled:opacity-40"
                  aria-label="Mover para baixo"
                >
                  <ChevronDown className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeSection(index)}
                  className="inline-flex size-7 items-center justify-center rounded text-destructive hover:bg-destructive/10"
                  aria-label="Remover seção"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </header>

            {!isCollapsed ? (
              <div className="space-y-3 p-3">
                <div className="grid gap-2 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">ID (âncora)</Label>
                    <Input
                      value={section.id}
                      onChange={(e) => updateSection(index, { id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Título</Label>
                    <Input
                      value={section.title}
                      onChange={(e) => updateSection(index, { title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-3">
                    <Label className="text-xs">Subtítulo</Label>
                    <Input
                      value={section.subtitle ?? ''}
                      onChange={(e) =>
                        updateSection(index, { subtitle: e.target.value || null })
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-y border-ink-100 py-2">
                  <span className="text-xs font-semibold text-ink-600">Tipo de conteúdo:</span>
                  <KindButton
                    active={section.kind === 'items'}
                    onClick={() =>
                      updateSection(index, {
                        kind: 'items',
                        items: section.items.length > 0 ? section.items : [emptyItem()],
                      })
                    }
                  >
                    Cards com mídia
                  </KindButton>
                  <KindButton
                    active={section.kind === 'experiences'}
                    onClick={() =>
                      updateSection(index, {
                        kind: 'experiences',
                        experiences:
                          section.experiences.length > 0
                            ? section.experiences
                            : [emptyExperience()],
                      })
                    }
                  >
                    Experiências
                  </KindButton>
                  <KindButton
                    active={section.kind === 'raw'}
                    onClick={() => updateSection(index, { kind: 'raw' })}
                  >
                    Avançado (JSON)
                  </KindButton>
                </div>

                {section.kind === 'items' ? (
                  <ItemsEditor
                    entityType={entityType}
                    entityId={entityId}
                    items={section.items}
                    onChange={(items) => updateSection(index, { items })}
                  />
                ) : section.kind === 'experiences' ? (
                  <ExperiencesEditor
                    entityType={entityType}
                    entityId={entityId}
                    experiences={section.experiences}
                    onChange={(experiences) => updateSection(index, { experiences })}
                  />
                ) : (
                  <RawExtraEditor
                    extra={section.extra}
                    onChange={(extra) => updateSection(index, { extra })}
                  />
                )}
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={() => addSection('items')}>
          <Plus className="mr-1 size-4" /> Seção de cards
        </Button>
        <Button type="button" variant="secondary" onClick={() => addSection('experiences')}>
          <Sparkles className="mr-1 size-4" /> Seção de experiências
        </Button>
        <Button type="button" variant="ghost" onClick={() => addSection('raw')}>
          <Plus className="mr-1 size-4" /> Seção avançada (JSON)
        </Button>
      </div>
    </div>
  );
}

function KindButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-full bg-ink-900 px-3 py-1 text-[12px] font-semibold text-white'
          : 'rounded-full border border-ink-200 px-3 py-1 text-[12px] font-semibold text-ink-700 hover:bg-ink-50'
      }
    >
      {children}
    </button>
  );
}

function emptyItem(): SectionItem {
  return {
    title: '',
    description: '',
    image: null,
    imageAssetId: null,
    alt: null,
    tags: [],
    mediaKind: null,
  };
}

function emptyExperience(): SectionExperience {
  return {
    title: '',
    description: '',
    image: null,
    imageAssetId: null,
    alt: null,
    mediaKind: null,
    duration: null,
    price: null,
    tags: [],
    cta: null,
  };
}

function ItemsEditor({
  entityType,
  entityId,
  items,
  onChange,
}: {
  entityType: string;
  entityId: string;
  items: SectionItem[];
  onChange: (next: SectionItem[]) => void;
}) {
  function update(i: number, patch: Partial<SectionItem>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function remove(i: number) {
    const target = items[i];
    if (target?.imageAssetId) void deleteAssetSafe(target.imageAssetId);
    onChange(items.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...items, emptyItem()]);
  }
  function move(i: number, dir: -1 | 1) {
    const target = i + dir;
    if (target < 0 || target >= items.length) return;
    const next = items.slice();
    [next[i], next[target]] = [next[target], next[i]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <article key={i} className="grid gap-3 rounded-md border border-ink-100 bg-paper p-3 md:grid-cols-[160px_1fr]">
          <MediaSlot
            entityType={entityType}
            entityId={entityId}
            url={item.image}
            assetId={item.imageAssetId}
            kind={item.mediaKind}
            onChange={(url, assetId, kind) =>
              update(i, { image: url, imageAssetId: assetId, mediaKind: kind })
            }
          />
          <div className="space-y-2">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Título</Label>
                <Input value={item.title} onChange={(e) => update(i, { title: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tags (vírgula)</Label>
                <Input
                  value={item.tags.join(', ')}
                  onChange={(e) =>
                    update(i, {
                      tags: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Descrição</Label>
              <textarea
                value={item.description}
                onChange={(e) => update(i, { description: e.target.value })}
                rows={2}
                className="bg-background w-full rounded-md border px-2 py-1.5 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Texto alternativo (acessibilidade)</Label>
              <Input
                value={item.alt ?? ''}
                onChange={(e) => update(i, { alt: e.target.value || null })}
              />
            </div>
            <div className="flex justify-between gap-2 pt-1">
              <div className="flex gap-1">
                <Button type="button" size="sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                >
                  <ChevronDown className="size-4" />
                </Button>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => remove(i)} className="text-destructive">
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        </article>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={add}>
        <Plus className="mr-1 size-4" /> Adicionar card
      </Button>
    </div>
  );
}

function ExperiencesEditor({
  entityType,
  entityId,
  experiences,
  onChange,
}: {
  entityType: string;
  entityId: string;
  experiences: SectionExperience[];
  onChange: (next: SectionExperience[]) => void;
}) {
  function update(i: number, patch: Partial<SectionExperience>) {
    onChange(experiences.map((ex, idx) => (idx === i ? { ...ex, ...patch } : ex)));
  }
  function remove(i: number) {
    const target = experiences[i];
    if (target?.imageAssetId) void deleteAssetSafe(target.imageAssetId);
    onChange(experiences.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...experiences, emptyExperience()]);
  }
  function move(i: number, dir: -1 | 1) {
    const target = i + dir;
    if (target < 0 || target >= experiences.length) return;
    const next = experiences.slice();
    [next[i], next[target]] = [next[target], next[i]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {experiences.map((exp, i) => (
        <article key={i} className="grid gap-3 rounded-md border border-ink-100 bg-paper p-3 md:grid-cols-[160px_1fr]">
          <MediaSlot
            entityType={entityType}
            entityId={entityId}
            url={exp.image}
            assetId={exp.imageAssetId}
            kind={exp.mediaKind}
            onChange={(url, assetId, kind) =>
              update(i, { image: url, imageAssetId: assetId, mediaKind: kind })
            }
          />
          <div className="space-y-2">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Título</Label>
                <Input value={exp.title} onChange={(e) => update(i, { title: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tags (vírgula)</Label>
                <Input
                  value={exp.tags.join(', ')}
                  onChange={(e) =>
                    update(i, {
                      tags: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Descrição</Label>
              <textarea
                value={exp.description}
                onChange={(e) => update(i, { description: e.target.value })}
                rows={2}
                className="bg-background w-full rounded-md border px-2 py-1.5 text-sm"
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Duração</Label>
                <Input
                  placeholder="ex.: 2h, dia inteiro"
                  value={exp.duration ?? ''}
                  onChange={(e) => update(i, { duration: e.target.value || null })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Preço</Label>
                <Input
                  placeholder="ex.: R$ 80 por pessoa"
                  value={exp.price ?? ''}
                  onChange={(e) => update(i, { price: e.target.value || null })}
                />
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Botão — texto</Label>
                <Input
                  placeholder="ex.: Reservar"
                  value={exp.cta?.label ?? ''}
                  onChange={(e) =>
                    update(i, {
                      cta: {
                        label: e.target.value,
                        href: exp.cta?.href ?? '',
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Botão — link</Label>
                <Input
                  placeholder="https://… ou /caminho"
                  value={exp.cta?.href ?? ''}
                  onChange={(e) =>
                    update(i, {
                      cta: {
                        label: exp.cta?.label ?? '',
                        href: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-between gap-2 pt-1">
              <div className="flex gap-1">
                <Button type="button" size="sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => move(i, 1)}
                  disabled={i === experiences.length - 1}
                >
                  <ChevronDown className="size-4" />
                </Button>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => remove(i)} className="text-destructive">
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        </article>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={add}>
        <Plus className="mr-1 size-4" /> Adicionar experiência
      </Button>
    </div>
  );
}

function RawExtraEditor({
  extra,
  onChange,
}: {
  extra: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(extra, null, 2));
  const [err, setErr] = useState<string | null>(null);

  function handleBlur() {
    try {
      const parsed = text.trim() === '' ? {} : JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('JSON precisa ser um objeto.');
      }
      setErr(null);
      onChange(parsed as Record<string, unknown>);
    } catch (caught) {
      setErr(caught instanceof Error ? caught.message : 'JSON inválido');
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-600">
        Use para tipos especiais (places, fares, seasons, programHighlights, tips, etc.). Edição livre em JSON.
      </p>
      <textarea
        value={text}
        rows={10}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        className="bg-background font-mono w-full rounded-md border px-2 py-1.5 text-[12px]"
      />
      {err ? <p className="text-xs text-destructive">{err}</p> : null}
    </div>
  );
}

function MediaSlot({
  entityType,
  entityId,
  url,
  assetId,
  kind,
  onChange,
}: {
  entityType: string;
  entityId: string;
  url: string | null;
  assetId: string | null;
  kind: MediaKind | null;
  onChange: (url: string | null, assetId: string | null, kind: MediaKind | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    setPending(true);
    setProgress(0);
    try {
      const token = await requestMediaUploadTokenAction({
        entityType,
        entityId,
        role: 'attachment',
      });
      const processed = await uploadDirectToProcessor({
        file,
        token,
        onProgress: ({ percent }) => setProgress(percent),
      });
      const result = await finalizeMediaUploadAction({
        entityType,
        entityId,
        role: 'attachment',
        altText: null,
        processed,
      });
      const inferredKind: MediaKind = result.contentType?.startsWith('video/')
        ? 'video'
        : 'image';
      const previousAssetId = assetId;
      onChange(result.url, result.id, inferredKind);
      if (previousAssetId && previousAssetId !== result.id) {
        void deleteAssetSafe(previousAssetId);
      }
      toast.success('Mídia enviada.');
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Falha ao enviar mídia.';
      toast.error(message);
    } finally {
      setPending(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function clear() {
    const previousAssetId = assetId;
    onChange(null, null, null);
    if (previousAssetId) void deleteAssetSafe(previousAssetId);
  }

  const isVideo = kind === 'video' || isVideoUrl(url);

  return (
    <div className="space-y-1.5">
      <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-ink-200 bg-paper-deep">
        {url ? (
          isVideo ? (
            <video src={url} poster={videoPosterUrl(url) ?? undefined} className="h-full w-full object-cover" muted playsInline preload="metadata" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          )
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-ink-400">
            <ImageIcon className="size-7" strokeWidth={1.4} />
            <span className="text-[10px] font-medium">Sem mídia</span>
          </div>
        )}
        {isVideo && url ? (
          <span className="absolute left-1 top-1 inline-flex items-center gap-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white">
            <VideoIcon className="size-3" />
            Vídeo
          </span>
        ) : null}
        {pending ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 text-white">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-[11px] font-semibold">{progress}%</span>
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="flex-1"
        >
          <Upload className="mr-1 size-3.5" /> {url ? 'Trocar' : 'Upload'}
        </Button>
        {url ? (
          <Button type="button" size="sm" variant="ghost" onClick={clear} aria-label="Remover">
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,video/mp4,video/quicktime,video/webm"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
