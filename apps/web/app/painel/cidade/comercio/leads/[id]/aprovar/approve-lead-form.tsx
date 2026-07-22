'use client';

import { useActionState, useEffect, useMemo, useState, startTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BusinessLead } from '@/lib/business-leads/types';
import { approveLeadAndCreateBusinessAction, type ApproveLeadActionState } from '../../actions';

type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number | null;
};

type Props = {
  lead: BusinessLead;
  categories: Category[];
};

const initialState: ApproveLeadActionState = { ok: false, message: '' };

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function ApproveLeadForm({ lead, categories }: Props) {
  const [state, formAction, pending] = useActionState(
    approveLeadAndCreateBusinessAction,
    initialState,
  );
  const [name, setName] = useState(lead.business_name);
  const [slug, setSlug] = useState(slugify(lead.business_name));
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (slugTouched) return;
    startTransition(() => {
      setSlug(slugify(name));
    });
  }, [name, slugTouched]);

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) => {
        const ao = a.display_order ?? 999;
        const bo = b.display_order ?? 999;
        if (ao !== bo) return ao - bo;
        return a.name.localeCompare(b.name);
      }),
    [categories],
  );

  return (
    <form action={formAction} className="space-y-5 rounded-xl bg-paper-card p-5 shadow-card">
      <input type="hidden" name="lead_id" value={lead.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome da ficha" error={state.fieldErrors?.name}>
          <Input
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={160}
          />
        </Field>
        <Field label="Slug público" hint="Aparece na URL. Sem acentos." error={state.fieldErrors?.slug}>
          <Input
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value);
              setSlugTouched(true);
            }}
            required
            pattern="[a-z0-9-]+"
            minLength={2}
            maxLength={80}
          />
        </Field>
      </div>

      <Field label="Categoria principal" error={state.fieldErrors?.category_id}>
        <select
          name="category_id"
          required
          defaultValue=""
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="" disabled>
            Selecione…
          </option>
          {sortedCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Descrição curta"
        hint="Aparece em listagens — até 160 caracteres."
        error={state.fieldErrors?.short_description}
      >
        <Input
          name="short_description"
          defaultValue=""
          maxLength={160}
          placeholder={lead.message?.slice(0, 160) ?? ''}
        />
      </Field>

      <Field label="Descrição completa" error={state.fieldErrors?.description}>
        <textarea
          name="description"
          defaultValue={lead.message ?? ''}
          maxLength={4000}
          rows={5}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Telefone" error={state.fieldErrors?.phone}>
          <Input name="phone" defaultValue={lead.phone} maxLength={40} />
        </Field>
        <Field label="WhatsApp" error={state.fieldErrors?.whatsapp}>
          <Input name="whatsapp" defaultValue={lead.whatsapp ?? ''} maxLength={40} />
        </Field>
        <Field label="Email público" error={state.fieldErrors?.email}>
          <Input name="email" type="email" defaultValue={lead.email} maxLength={320} />
        </Field>
        <Field label="Site" error={state.fieldErrors?.website}>
          <Input name="website" defaultValue={lead.website ?? ''} maxLength={500} />
        </Field>
        <Field label="Instagram" error={state.fieldErrors?.instagram}>
          <Input name="instagram" defaultValue={lead.instagram ?? ''} maxLength={500} />
        </Field>
        <Field label="Endereço" error={state.fieldErrors?.address}>
          <Input name="address" defaultValue={lead.address ?? ''} maxLength={500} />
        </Field>
      </div>

      {state.message && !state.ok ? (
        <p className="rounded-md border border-destructive/30 bg-[#fbebeb] px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar e aprovar'}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-ink-500">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
