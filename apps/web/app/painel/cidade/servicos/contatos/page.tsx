import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ReactNode } from 'react';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { listEmergencyContacts } from '@/lib/utilities/queries';
import type { EmergencyContact } from '@/lib/utilities/types';
import { reorderEmergencyContactsAction, upsertEmergencyContactAction } from './actions';

export default async function ServicosContatosAdminPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const contacts = await listEmergencyContacts({ city_id: city.id, includeInactive: true });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Telefones úteis</h1>
        <p className="text-muted-foreground">
          Lista editável usada pela página pública, pela busca e pelo assistente.
        </p>
      </header>

      <ContactForm cityId={city.id} title="Novo contato" />

      <form action={reorderEmergencyContactsAction} className="rounded-2xl border bg-card p-5">
        <input type="hidden" name="city_id" value={city.id} />
        <Label htmlFor="ordered_ids">Reordenar IDs</Label>
        <Input id="ordered_ids" name="ordered_ids" defaultValue={contacts.map((contact) => contact.id).join(',')} />
        <Button className="mt-3" type="submit" variant="secondary">Aplicar ordem</Button>
      </form>

      <div className="space-y-4">
        {contacts.map((contact) => (
          <ContactForm key={contact.id} cityId={city.id} contact={contact} title={contact.name} />
        ))}
      </div>
    </div>
  );
}

function ContactForm({
  cityId,
  contact,
  title,
}: {
  cityId: string;
  contact?: EmergencyContact;
  title: string;
}) {
  return (
    <form action={upsertEmergencyContactAction} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-4">
      <input type="hidden" name="city_id" value={cityId} />
      {contact ? <input type="hidden" name="id" value={contact.id} /> : null}
      <div className="md:col-span-4">
        <h2 className="font-semibold">{title}</h2>
        {contact ? (
          <p className="text-sm text-muted-foreground">
            {contact.category} · {contact.phone} · ordem {contact.displayOrder} · {contact.active ? 'ativo' : 'inativo'}
          </p>
        ) : null}
      </div>

      <Field label="Categoria" id={fieldId(contact, 'category')}>
        <Input id={fieldId(contact, 'category')} name="category" defaultValue={contact?.category ?? 'prefeitura'} required />
      </Field>
      <Field label="Nome" id={fieldId(contact, 'name')}>
        <Input id={fieldId(contact, 'name')} name="name" defaultValue={contact?.name ?? ''} required />
      </Field>
      <Field label="Telefone" id={fieldId(contact, 'phone')}>
        <Input id={fieldId(contact, 'phone')} name="phone" defaultValue={contact?.phone ?? ''} required />
      </Field>
      <Field label="Discagem curta" id={fieldId(contact, 'short_dial')}>
        <Input id={fieldId(contact, 'short_dial')} name="short_dial" defaultValue={contact?.shortDial ?? ''} placeholder="190" />
      </Field>
      <Field label="WhatsApp" id={fieldId(contact, 'whatsapp')}>
        <Input id={fieldId(contact, 'whatsapp')} name="whatsapp" defaultValue={contact?.whatsapp ?? ''} />
      </Field>
      <Field label="E-mail" id={fieldId(contact, 'email')}>
        <Input id={fieldId(contact, 'email')} name="email" type="email" defaultValue={contact?.email ?? ''} />
      </Field>
      <Field label="Endereço" id={fieldId(contact, 'address')}>
        <Input id={fieldId(contact, 'address')} name="address" defaultValue={contact?.address ?? ''} />
      </Field>
      <Field label="Horário" id={fieldId(contact, 'hours_legacy_text')}>
        <Input id={fieldId(contact, 'hours_legacy_text')} name="hours_legacy_text" defaultValue={contact?.hoursLegacyText ?? ''} />
      </Field>
      <Field label="Fonte" id={fieldId(contact, 'source_type')}>
        <Input id={fieldId(contact, 'source_type')} name="source_type" defaultValue={contact?.sourceType ?? 'oficial'} />
      </Field>
      <Field label="Última verificação" id={fieldId(contact, 'last_verified_at')}>
        <Input id={fieldId(contact, 'last_verified_at')} name="last_verified_at" type="date" defaultValue={contact?.lastVerifiedAt ?? ''} />
      </Field>
      <Field label="Ordem" id={fieldId(contact, 'display_order')}>
        <Input id={fieldId(contact, 'display_order')} name="display_order" type="number" defaultValue={contact?.displayOrder ?? 0} />
      </Field>
      <Field label="Tags" id={fieldId(contact, 'tags')}>
        <Input id={fieldId(contact, 'tags')} name="tags" defaultValue={contact?.tags.join(', ') ?? ''} placeholder="saúde, prefeitura" />
      </Field>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={fieldId(contact, 'description')}>Descrição</Label>
        <textarea
          id={fieldId(contact, 'description')}
          name="description"
          defaultValue={contact?.description ?? ''}
          className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={fieldId(contact, 'when_to_use')}>Quando usar</Label>
        <textarea
          id={fieldId(contact, 'when_to_use')}
          name="when_to_use"
          defaultValue={contact?.whenToUse ?? ''}
          className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-2 md:col-span-4">
        <Label htmlFor={fieldId(contact, 'note')}>Nota interna/pública de verificação</Label>
        <textarea
          id={fieldId(contact, 'note')}
          name="note"
          defaultValue={contact?.note ?? ''}
          className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="needs_verification" defaultChecked={contact?.needsVerification ?? false} />
        Precisa de verificação
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={contact?.active ?? true} />
        Ativo
      </label>

      <div className="md:col-span-4">
        <Button type="submit">Salvar contato</Button>
      </div>
    </form>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function fieldId(contact: EmergencyContact | undefined, field: string): string {
  return `${contact?.id ?? 'new'}-${field}`;
}
