'use client';

import { useRouter } from 'next/navigation';
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
import { Eye, EyeOff, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  deleteHomeBannerAction,
  reorderHomeBannersAction,
  toggleHomeBannerAction,
} from '@/lib/home/actions';
import type { HomeBannerEditable } from '@/lib/home';

type Props = {
  blockId: string;
  initial: HomeBannerEditable[];
  /** Quando true, esconde o handle de arrastar (caso so 1 banner faz sentido). */
  singleMode?: boolean;
};

export function SortableBannerList({ blockId, initial, singleMode = false }: Props) {
  const stateKey = initial
    .map((item) => `${item.id}:${item.active}:${item.imageAssetId}:${item.videoAssetId ?? 'none'}`)
    .join('|');

  return (
    <SortableBannerListState
      key={stateKey}
      blockId={blockId}
      initial={initial}
      singleMode={singleMode}
    />
  );
}

function SortableBannerListState({ blockId, initial, singleMode = false }: Props) {
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
        await reorderHomeBannersAction({ blockId, bannerIds: reordered.map((i) => i.id) });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao reordenar.');
        setItems(previousItems);
      }
    });
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhum banner ainda.</p>;
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <DndContext
        id="home-banners-sortable"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ol className={`space-y-2 ${isPending ? 'opacity-60' : ''}`}>
            {items.map((banner) => (
              <SortableBannerRow
                key={banner.id}
                banner={banner}
                singleMode={singleMode}
                onToggle={(bannerId, active) => {
                  setItems((current) =>
                    current.map((item) => (item.id === bannerId ? { ...item, active } : item)),
                  );
                }}
                onRemove={(bannerId) => {
                  setItems((current) => current.filter((item) => item.id !== bannerId));
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

function SortableBannerRow({
  banner,
  singleMode,
  onToggle,
  onRemove,
  onError,
}: {
  banner: HomeBannerEditable;
  singleMode: boolean;
  onToggle: (bannerId: string, active: boolean) => void;
  onRemove: (bannerId: string) => void;
  onError: (message: string | null) => void;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: banner.id,
  });
  const [, startTransition] = useTransition();
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 'auto',
  };

  function toggle() {
    const nextActive = !banner.active;
    const formData = new FormData();
    formData.set('banner_id', banner.id);
    formData.set('active', nextActive ? 'true' : 'false');
    onError(null);
    onToggle(banner.id, nextActive);
    startTransition(async () => {
      try {
        await toggleHomeBannerAction(formData);
        router.refresh();
      } catch (err) {
        onToggle(banner.id, banner.active);
        onError(err instanceof Error ? err.message : 'Falha ao atualizar banner.');
      }
    });
  }

  function remove() {
    if (!confirm('Remover este banner?')) return;
    const formData = new FormData();
    formData.set('banner_id', banner.id);
    onError(null);
    onRemove(banner.id);
    startTransition(async () => {
      try {
        await deleteHomeBannerAction(formData);
        router.refresh();
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Falha ao remover banner.');
        router.refresh();
      }
    });
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border bg-paper p-3 ${
        isDragging ? 'shadow-lg ring-2 ring-primary/30' : ''
      }`}
    >
      {!singleMode ? (
        <button
          type="button"
          aria-label="Arrastar"
          className="text-muted-foreground hover:text-foreground cursor-grab touch-none p-1 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
      ) : null}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={banner.imageUrl} alt="" className="h-14 w-24 shrink-0 rounded-md object-cover" />
      <div className="min-w-0 flex-1">
        <p className="text-ink-900 truncate text-sm font-semibold">
          {banner.title ?? '(sem titulo)'}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {banner.linkType === 'none'
            ? 'Sem link'
            : `${banner.linkType} → ${banner.linkUrl ?? '—'}`}
          {banner.videoUrl ? ' · com video' : ''}
          {!banner.active ? ' · inativo' : ''}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={banner.active ? 'Desativar' : 'Ativar'}
          title={banner.active ? 'Ocultar banner' : 'Mostrar banner'}
          onClick={toggle}
          className="gap-1.5"
        >
          {banner.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          <span className="hidden sm:inline">{banner.active ? 'Ocultar' : 'Mostrar'}</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-destructive"
          aria-label="Remover"
          title="Excluir banner"
          onClick={remove}
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Excluir</span>
        </Button>
      </div>
    </li>
  );
}
