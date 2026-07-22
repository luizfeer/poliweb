'use client';

import Link from 'next/link';
import { CalendarDays, ChevronRight, PawPrint, Search, Tag, UsersRound, X, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import {
  submitEventAction,
  submitLostAndFoundAction,
  submitLostPetAction,
} from '@/lib/community/actions';
import { SubmitOnceButton, SubmitOnceForm } from '@/components/admin/forms/submit-once-form';

type EventCategory = {
  id: string;
  name: string;
};

type CommunityAction = {
  kind: 'event' | 'classified' | 'pet' | 'lost_found' | 'group';
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: string;
};

type CommunityActionCardsProps = {
  cityId: string;
  eventCategories: EventCategory[];
};

const actions: CommunityAction[] = [
  {
    kind: 'event',
    href: '/comunidade/agenda/submeter',
    title: 'Enviar evento',
    description: 'Divulgue festas, encontros, cursos e atividades abertas da cidade.',
    icon: CalendarDays,
    tone: 'bg-sky-100 text-sky-700',
  },
  {
    kind: 'classified',
    href: '/painel/cidadao/classificados/novo',
    title: 'Postar classificado',
    description: 'Anuncie venda, vaga, serviço ou item usado para quem está por perto.',
    icon: Tag,
    tone: 'bg-clay-50 text-clay-700',
  },
  {
    kind: 'pet',
    href: '/comunidade/pets/postar',
    title: 'Postar pet',
    description: 'Peça ajuda para encontrar ou avisar sobre animais vistos na região.',
    icon: PawPrint,
    tone: 'bg-cerrado-100 text-cerrado-700',
  },
  {
    kind: 'lost_found',
    href: '/comunidade/achados/postar',
    title: 'Achado ou perdido',
    description: 'Publique documentos, objetos e avisos para facilitar a devolução.',
    icon: Search,
    tone: 'bg-sun-100 text-ink-900',
  },
  {
    kind: 'group',
    href: '/comunidade/grupos/novo',
    title: 'Cadastrar grupo',
    description: 'Adicione coletivos locais e grupos de WhatsApp úteis para a cidade.',
    icon: UsersRound,
    tone: 'bg-cerrado-100 text-cerrado-700',
  },
];

export function CommunityActionCards({ cityId, eventCategories }: CommunityActionCardsProps) {
  const [selectedAction, setSelectedAction] = useState<CommunityAction | null>(null);

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;

          if (action.kind === 'classified' || action.kind === 'group') {
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex min-h-32 items-start gap-4 rounded-xl border bg-card p-4 text-left text-foreground shadow-sm transition hover:border-clay-300 hover:bg-clay-50 hover:no-underline"
              >
                <ActionCardContent action={action} icon={Icon} />
              </Link>
            );
          }

          return (
            <button
              key={action.href}
              type="button"
              onClick={() => setSelectedAction(action)}
              className="group flex min-h-32 items-start gap-4 rounded-xl border bg-card p-4 text-left text-foreground shadow-sm transition hover:border-clay-300 hover:bg-clay-50"
            >
              <ActionCardContent action={action} icon={Icon} />
            </button>
          );
        })}
      </section>

      {selectedAction && (
        <div className="fixed inset-0 z-[90] grid place-items-end bg-foreground/40 px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 sm:place-items-center">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-xl border bg-card shadow-pop">
            <div className="flex items-start gap-3 border-b bg-clay-50 p-4">
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${selectedAction.tone}`}>
                <selectedAction.icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold">{selectedAction.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selectedAction.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-background"
                aria-label="Fechar"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="max-h-[calc(92vh-86px)] overflow-y-auto p-4">
              {selectedAction.kind === 'event' && (
                <EventForm cityId={cityId} eventCategories={eventCategories} onCancel={() => setSelectedAction(null)} />
              )}
              {selectedAction.kind === 'pet' && (
                <PetForm cityId={cityId} onCancel={() => setSelectedAction(null)} />
              )}
              {selectedAction.kind === 'lost_found' && (
                <LostAndFoundForm cityId={cityId} onCancel={() => setSelectedAction(null)} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ActionCardContent({ action, icon: Icon }: { action: CommunityAction; icon: LucideIcon }) {
  return (
    <>
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${action.tone}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">{action.title}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{action.description}</span>
      </span>
      <ChevronRight
        className="mt-1 size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-clay-700"
        aria-hidden="true"
      />
    </>
  );
}

function EventForm({
  cityId,
  eventCategories,
  onCancel,
}: {
  cityId: string;
  eventCategories: EventCategory[];
  onCancel: () => void;
}) {
  return (
    <SubmitOnceForm action={submitEventAction} className="grid gap-4">
      <input type="hidden" name="city_id" value={cityId} />
      <Field label="Título" name="title" required />
      <Field label="Slug público" name="slug" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Início" name="start_at" type="datetime-local" required />
        <Field label="Fim" name="end_at" type="datetime-local" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Local" name="location" />
        <label className="grid gap-1 text-sm font-medium">
          Categoria
          <select name="category_id" className="rounded-md border bg-background px-3 py-2">
            <option value="">Sem categoria</option>
            {eventCategories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
      </div>
      <TextArea label="Descrição" name="description" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Organizador" name="organizer_name" />
        <Field label="URL de ingresso" name="ticket_url" />
      </div>
      <FileField />
      <input type="hidden" name="cover_url" value="" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_free" defaultChecked />
        Evento gratuito
      </label>
      <FormActions onCancel={onCancel} />
    </SubmitOnceForm>
  );
}

function PetForm({ cityId, onCancel }: { cityId: string; onCancel: () => void }) {
  return (
    <SubmitOnceForm action={submitLostPetAction} className="grid gap-4">
      <input type="hidden" name="city_id" value={cityId} />
      <label className="grid gap-1 text-sm font-medium">
        Situação
        <select name="status" className="rounded-md border bg-background px-3 py-2">
          <option value="lost">Perdido</option>
          <option value="found">Encontrado</option>
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome do pet" name="pet_name" />
        <Field label="Espécie" name="species" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Raça" name="breed" />
        <Field label="Cor" name="color" />
        <Field label="Porte" name="size" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Visto em" name="last_seen_at" type="datetime-local" />
        <Field label="Local" name="last_seen_location" />
      </div>
      <TextArea label="Descrição" name="description" required />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Nome de contato" name="contact_name" required />
        <Field label="Telefone" name="contact_phone" required />
        <Field label="WhatsApp" name="contact_whatsapp" />
      </div>
      <FileField />
      <input type="hidden" name="cover_url" value="" />
      <FormActions onCancel={onCancel} />
    </SubmitOnceForm>
  );
}

function LostAndFoundForm({ cityId, onCancel }: { cityId: string; onCancel: () => void }) {
  return (
    <SubmitOnceForm action={submitLostAndFoundAction} className="grid gap-4">
      <input type="hidden" name="city_id" value={cityId} />
      <label className="grid gap-1 text-sm font-medium">
        Tipo
        <select name="type" className="rounded-md border bg-background px-3 py-2">
          <option value="lost">Perdi</option>
          <option value="found">Encontrei</option>
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Descrição do item" name="item_description" required />
        <Field label="Categoria" name="category" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Local" name="location" />
        <Field label="Data aproximada" name="occurred_at" type="datetime-local" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Telefone" name="contact_phone" required />
        <Field label="WhatsApp" name="contact_whatsapp" />
      </div>
      <FileField />
      <input type="hidden" name="cover_url" value="" />
      <FormActions onCancel={onCancel} />
    </SubmitOnceForm>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <input name={name} type={type} required={required} className="rounded-md border bg-background px-3 py-2" />
    </label>
  );
}

function TextArea({ label, name, required = false }: { label: string; name: string; required?: boolean }) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <textarea name={name} rows={5} required={required} className="rounded-md border bg-background px-3 py-2" />
    </label>
  );
}

function FileField() {
  return (
    <label className="grid gap-1 text-sm font-medium">
      Imagem ou vídeo de capa
      <input
        name="cover_file"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,video/mp4,video/quicktime,video/webm"
        className="rounded-md border bg-background px-3 py-2"
      />
    </label>
  );
}

function FormActions({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="sticky bottom-0 -mx-4 -mb-4 mt-2 flex gap-2 border-t bg-card p-4">
      <button type="button" onClick={onCancel} className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted">
        Cancelar
      </button>
      <SubmitOnceButton
        label="Enviar para moderação"
        pendingLabel="Enviando..."
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-wait disabled:opacity-75"
      />
    </div>
  );
}
