'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
import { Camera, GripVertical, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { uploadDirectToProcessor } from '@/lib/media/direct-upload';
import { finalizeMediaUploadAction, requestMediaUploadTokenAction } from '@/lib/media/actions';
import {
  deleteMenuItemAction,
  deleteMenuSectionAction,
  reorderMenuItemsAction,
  reorderMenuSectionsAction,
  saveMenuItemAction,
  saveMenuSectionAction,
} from '@/lib/businesses/menu-actions';

export type EditorItem = {
  id: string;
  sectionId: string;
  name: string;
  description: string;
  priceCents: number;
  photoUrl: string | null;
  available: boolean;
};

export type EditorSection = {
  id: string;
  name: string;
  description: string;
  items: EditorItem[];
};

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parsePriceToCents(value: string): number {
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function MenuEditor({
  businessId,
  initialSections,
}: {
  businessId: string;
  initialSections: EditorSection[];
}) {
  const router = useRouter();
  const [sections, setSections] = useState<EditorSection[]>(initialSections);
  const [newSectionName, setNewSectionName] = useState('');
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function addSection() {
    const name = newSectionName.trim();
    if (!name) return;
    setNewSectionName('');
    startTransition(async () => {
      const res = await saveMenuSectionAction({ businessId, name });
      if (res.ok && res.id) {
        setSections((prev) => [...prev, { id: res.id!, name, description: '', items: [] }]);
      } else {
        toast.error(res.error ?? 'Falha ao criar seção.');
      }
    });
  }

  function onSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const previous = sections;
    const reordered = arrayMove(sections, oldIndex, newIndex);
    setSections(reordered);
    startTransition(async () => {
      const res = await reorderMenuSectionsAction({ businessId, sectionIds: reordered.map((s) => s.id) });
      if (!res.ok) {
        setSections(previous);
        toast.error(res.error ?? 'Falha ao reordenar.');
      }
    });
  }

  function updateSection(updated: EditorSection) {
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  function removeSection(sectionId: string) {
    const previous = sections;
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    startTransition(async () => {
      const res = await deleteMenuSectionAction({ businessId, id: sectionId });
      if (!res.ok) {
        setSections(previous);
        toast.error(res.error ?? 'Falha ao remover seção.');
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className={`space-y-4 ${isPending ? 'opacity-70' : ''}`}>
      <DndContext
        id="menu-sections-sortable"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onSectionDragEnd}
      >
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {sections.map((section) => (
              <SectionCard
                key={section.id}
                businessId={businessId}
                section={section}
                onChange={updateSection}
                onRemove={() => removeSection(section.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sections.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma seção ainda. Crie a primeira (ex.: “Pizzas”, “Bebidas”, “Combos”).
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-4">
        <input
          className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
          placeholder="Nome da nova seção"
          value={newSectionName}
          onChange={(e) => setNewSectionName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSection();
            }
          }}
        />
        <Button type="button" onClick={addSection} className="gap-1.5">
          <Plus className="h-4 w-4" /> Adicionar seção
        </Button>
      </div>
    </div>
  );
}

function SectionCard({
  businessId,
  section,
  onChange,
  onRemove,
}: {
  businessId: string;
  section: EditorSection;
  onChange: (section: EditorSection) => void;
  onRemove: () => void;
}) {
  const router = useRouter();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(section.name);
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 'auto',
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function saveName() {
    const name = nameDraft.trim();
    setEditingName(false);
    if (!name || name === section.name) {
      setNameDraft(section.name);
      return;
    }
    onChange({ ...section, name });
    startTransition(async () => {
      const res = await saveMenuSectionAction({ id: section.id, businessId, name });
      if (!res.ok) toast.error(res.error ?? 'Falha ao renomear.');
    });
  }

  function onItemDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = section.items.findIndex((i) => i.id === active.id);
    const newIndex = section.items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(section.items, oldIndex, newIndex);
    onChange({ ...section, items: reordered });
    startTransition(async () => {
      const res = await reorderMenuItemsAction({ businessId, itemIds: reordered.map((i) => i.id) });
      if (!res.ok) {
        onChange(section);
        toast.error(res.error ?? 'Falha ao reordenar.');
      }
    });
  }

  function upsertItemLocal(item: EditorItem) {
    const exists = section.items.some((i) => i.id === item.id);
    onChange({
      ...section,
      items: exists
        ? section.items.map((i) => (i.id === item.id ? item : i))
        : [...section.items, item],
    });
  }

  function removeItemLocal(itemId: string) {
    onChange({ ...section, items: section.items.filter((i) => i.id !== itemId) });
    startTransition(async () => {
      const res = await deleteMenuItemAction({ businessId, id: itemId });
      if (res.ok) router.refresh();
      else toast.error(res.error ?? 'Falha ao remover item.');
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border bg-card p-4 ${isDragging ? 'shadow-lg ring-2 ring-primary/30' : ''}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Arrastar seção"
          className="-ml-1 cursor-grab touch-none p-1.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {editingName ? (
          <input
            autoFocus
            className="min-w-0 flex-1 rounded-lg border px-2 py-1 text-lg font-semibold"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                saveName();
              }
              if (e.key === 'Escape') {
                setNameDraft(section.name);
                setEditingName(false);
              }
            }}
          />
        ) : (
          <button
            type="button"
            className="min-w-0 flex-1 truncate text-left text-lg font-semibold hover:text-primary"
            onClick={() => setEditingName(true)}
          >
            {section.name}
          </button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-destructive"
          onClick={() => {
            if (confirm(`Remover a seção “${section.name}” e seus itens?`)) onRemove();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        <DndContext
          id={`menu-items-${section.id}`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onItemDragEnd}
        >
          <SortableContext items={section.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {section.items.map((item) => (
              <ItemRow
                key={item.id}
                businessId={businessId}
                item={item}
                onSaved={upsertItemLocal}
                onRemove={() => removeItemLocal(item.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {section.items.length === 0 && !adding ? (
          <p className="px-1 text-sm text-muted-foreground">Sem itens nesta seção.</p>
        ) : null}

        {adding ? (
          <ItemForm
            businessId={businessId}
            sectionId={section.id}
            onCancel={() => setAdding(false)}
            onSaved={(item) => {
              upsertItemLocal(item);
              setAdding(false);
            }}
          />
        ) : (
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Adicionar item
          </Button>
        )}
      </div>
    </div>
  );
}

function ItemRow({
  businessId,
  item,
  onSaved,
  onRemove,
}: {
  businessId: string;
  item: EditorItem;
  onSaved: (item: EditorItem) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : 'auto' };

  if (editing) {
    return (
      <div ref={setNodeRef} style={style}>
        <ItemForm
          businessId={businessId}
          sectionId={item.sectionId}
          item={item}
          onCancel={() => setEditing(false)}
          onSaved={(saved) => {
            onSaved(saved);
            setEditing(false);
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border bg-background p-2 ${
        isDragging ? 'shadow-lg ring-2 ring-primary/30' : ''
      } ${item.available ? '' : 'opacity-60'}`}
    >
      <button
        type="button"
        aria-label="Arrastar item"
        className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {item.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.photoUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Camera className="h-4 w-4" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{item.name}</span>
          {!item.available ? (
            <span className="rounded-full bg-clay-100 px-2 py-0.5 text-[11px] font-semibold text-clay-700">
              Indisponível
            </span>
          ) : null}
        </div>
        {item.description ? (
          <p className="truncate text-xs text-muted-foreground">{item.description}</p>
        ) : null}
      </div>

      <span className="shrink-0 text-sm font-semibold tabular-nums">{formatPrice(item.priceCents)}</span>

      <Button type="button" variant="ghost" size="sm" aria-label="Editar item" onClick={() => setEditing(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Remover item"
        className="text-destructive"
        onClick={() => {
          if (confirm(`Remover “${item.name}”?`)) onRemove();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ItemForm({
  businessId,
  sectionId,
  item,
  onSaved,
  onCancel,
}: {
  businessId: string;
  sectionId: string;
  item?: EditorItem;
  onSaved: (item: EditorItem) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [price, setPrice] = useState(item ? (item.priceCents / 100).toFixed(2).replace('.', ',') : '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(item?.photoUrl ?? null);
  const [available, setAvailable] = useState(item?.available ?? true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickPhoto(file: File) {
    setUploading(true);
    try {
      const token = await requestMediaUploadTokenAction({ entityType: 'business', entityId: businessId, role: 'ad' });
      const processed = await uploadDirectToProcessor({ file, token });
      const media = await finalizeMediaUploadAction({ entityType: 'business', entityId: businessId, role: 'ad', processed });
      setPhotoUrl(media.url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao enviar a foto.');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Dê um nome ao item.');
      return;
    }
    setSaving(true);
    const priceCents = parsePriceToCents(price);
    const res = await saveMenuItemAction({
      id: item?.id,
      businessId,
      sectionId,
      name: trimmed,
      description: description.trim() || null,
      priceCents,
      photoUrl,
      available,
    });
    setSaving(false);
    if (res.ok && res.id) {
      onSaved({
        id: res.id,
        sectionId,
        name: trimmed,
        description: description.trim(),
        priceCents,
        photoUrl,
        available,
      });
    } else {
      toast.error(res.error ?? 'Falha ao salvar item.');
    }
  }

  return (
    <div className="space-y-3 rounded-xl border bg-background p-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted text-muted-foreground hover:text-foreground"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPickPhoto(file);
            e.target.value = '';
          }}
        />

        <div className="grid flex-1 gap-2">
          <input
            autoFocus
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Nome do item"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">R$</span>
            <input
              className="w-28 rounded-lg border px-3 py-2 text-sm"
              inputMode="decimal"
              placeholder="0,00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <label className="ml-auto flex items-center gap-2 text-sm">
              <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
              Disponível
            </label>
          </div>
        </div>
      </div>

      <textarea
        className="min-h-16 w-full rounded-lg border px-3 py-2 text-sm"
        placeholder="Descrição (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={onCancel}>
          <X className="h-4 w-4" /> Cancelar
        </Button>
        <Button type="button" size="sm" disabled={saving || uploading} onClick={save}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar item'}
        </Button>
      </div>
    </div>
  );
}
