'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CloudSun,
  Code2,
  Eye,
  EyeOff,
  GalleryHorizontal,
  GripVertical,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  LayoutPanelTop,
  List,
  Mail,
  MapPinned,
  Megaphone,
  MessageCircleQuestion,
  Mountain,
  PanelTop,
  Pencil,
  Sparkles,
  Tag,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BLOCK_CATALOG, type HomeBlockType } from '@/lib/home';
import {
  deleteHomeBlockAction,
  reorderHomeBlocksAction,
  toggleHomeBlockAction,
} from '@/lib/home/actions';

export type SortableBlock = {
  id: string;
  type: HomeBlockType;
  title: string | null;
  enabled: boolean;
  bannerCount: number | null;
  groupWithNext: boolean;
  groupTitle: string | null;
};

type Props = {
  initial: SortableBlock[];
};

const BLOCK_ICON: Record<HomeBlockType, LucideIcon> = {
  banner_carousel: GalleryHorizontal,
  category_grid: LayoutGrid,
  entity_list: List,
  promo_strip: Tag,
  business_promo_hero: Megaphone,
  features_grid: LayoutPanelTop,
  tile_strip: LayoutDashboard,
  service_list: List,
  tourism_gateway: Mountain,
  lodging_map: MapPinned,
  assistant_cta: MessageCircleQuestion,
  transparency_pulse: Landmark,
  cta_grid: LayoutGrid,
  newsletter_cta: Mail,
  weather: CloudSun,
  custom_hero_banner: Sparkles,
  wide_banner: PanelTop,
  featured_promo_grid: Sparkles,
  hero_composite: LayoutPanelTop,
  raw_html: Code2,
};

export function SortableBlockList({ initial }: Props) {
  const stateKey = initial
    .map((item) => `${item.id}:${item.enabled}:${item.bannerCount ?? 'n'}`)
    .join('|');

  return <SortableBlockListState key={stateKey} initial={initial} />;
}

function SortableBlockListState({ initial }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const previousItems = items;
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    setError(null);
    startTransition(async () => {
      try {
        await reorderHomeBlocksAction({ blockIds: reordered.map((i) => i.id) });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao reordenar.');
        setItems(previousItems);
      }
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground mt-2 text-sm">
        Nenhum bloco ainda. Use o form acima pra adicionar.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <DndContext
        id="home-blocks-sortable"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ol className={`space-y-2 ${isPending ? 'opacity-60' : ''}`}>
            {items.map((block) => (
              <SortableRow
                key={block.id}
                block={block}
                Icon={BLOCK_ICON[block.type]}
                onToggle={(blockId, enabled) => {
                  setItems((current) =>
                    current.map((item) => (item.id === blockId ? { ...item, enabled } : item)),
                  );
                }}
                onRemove={(blockId) => {
                  setItems((current) => current.filter((item) => item.id !== blockId));
                }}
                onError={setError}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableRow({
  block,
  Icon,
  onToggle,
  onRemove,
  onError,
}: {
  block: SortableBlock;
  Icon: LucideIcon;
  onToggle: (blockId: string, enabled: boolean) => void;
  onRemove: (blockId: string) => void;
  onError: (message: string | null) => void;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  const [, startTransition] = useTransition();
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 'auto',
  };
  const meta = BLOCK_CATALOG[block.type];

  function toggle() {
    const nextEnabled = !block.enabled;
    const formData = new FormData();
    formData.set('block_id', block.id);
    formData.set('enabled', nextEnabled ? 'true' : 'false');
    onError(null);
    onToggle(block.id, nextEnabled);
    startTransition(async () => {
      try {
        await toggleHomeBlockAction(formData);
        router.refresh();
      } catch (err) {
        onToggle(block.id, block.enabled);
        onError(err instanceof Error ? err.message : 'Falha ao atualizar bloco.');
      }
    });
  }

  function remove() {
    if (!confirm('Remover este bloco da home?')) return;
    const formData = new FormData();
    formData.set('block_id', block.id);
    onError(null);
    onRemove(block.id);
    startTransition(async () => {
      try {
        await deleteHomeBlockAction(formData);
        router.refresh();
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Falha ao remover bloco.');
        router.refresh();
      }
    });
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-2xl border bg-card p-3 sm:p-4 ${
        isDragging ? 'shadow-lg ring-2 ring-primary/30' : ''
      }`}
    >
      <button
        type="button"
        aria-label="Arrastar"
        className="text-muted-foreground hover:text-foreground -ml-1 cursor-grab touch-none p-1.5 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="bg-paper-deep text-ink-900 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-ink-900 font-semibold">{block.title ?? meta.label}</span>
          <span className="bg-paper text-ink-600 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase">
            {meta.label}
          </span>
          {!block.enabled ? (
            <span className="rounded-full bg-clay-100 px-2 py-0.5 text-[11px] font-semibold text-clay-700">
              Desativado
            </span>
          ) : null}
          {block.groupWithNext ? (
            <span
              className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700"
              title={block.groupTitle ?? 'Agrupado com o próximo no desktop'}
            >
              ↳ Agrupado com o próximo
            </span>
          ) : null}
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {meta.description}
          {block.bannerCount !== null ? ` · ${block.bannerCount} banner(s)` : ''}
          {block.groupWithNext && block.groupTitle ? ` · "${block.groupTitle}"` : ''}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={block.enabled ? 'Desativar' : 'Ativar'}
          title={block.enabled ? 'Ocultar da home' : 'Mostrar na home'}
          onClick={toggle}
          className="gap-1.5"
        >
          {block.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          <span className="hidden sm:inline">{block.enabled ? 'Ocultar' : 'Mostrar'}</span>
        </Button>
        <Link
          href={`/painel/cidade/home/${block.id}`}
          aria-label="Editar"
          title="Editar bloco"
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium hover:bg-muted"
        >
          <Pencil className="h-4 w-4" />
          <span className="hidden sm:inline">Editar</span>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-destructive"
          aria-label="Remover"
          title="Excluir bloco"
          onClick={remove}
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Excluir</span>
        </Button>
      </div>
    </li>
  );
}
