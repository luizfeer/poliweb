import { Building2, HeartPulse, Landmark, Mail, MapPin, MessageCircle, Phone, ShieldAlert } from 'lucide-react';
import type { EmergencyContact } from '@/lib/utilities/types';
import { cn } from '@/lib/utils';

function digits(value: string | null): string {
  return value?.replace(/\D/g, '') ?? '';
}

function whatsappHref(value: string | null): string | null {
  const raw = digits(value);
  if (!isMobilePhone(raw)) return null;
  const withCountry = raw.startsWith('55') ? raw : `55${raw}`;
  return `https://wa.me/${withCountry}`;
}

function isMobilePhone(raw: string): boolean {
  const local = raw.startsWith('55') ? raw.slice(2) : raw;
  return local.length === 11 && local[2] === '9';
}

export function PhoneCard({ contact }: { contact: EmergencyContact }) {
  const phoneHref = `tel:${digits(contact.phone)}`;
  const whatsappUrl = whatsappHref(contact.whatsapp ?? contact.phone);
  const initials = contact.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <article className="rounded-lg border border-ink-200 bg-white p-3 shadow-card">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <span
              className={cn(
                'flex size-12 items-center justify-center rounded-full text-[13px] font-extrabold',
                contact.category === 'emergencia' ? 'bg-red-100 text-red-800' : 'bg-sky-100 text-sky-700',
              )}
              aria-hidden="true"
            >
              {initials || <CategoryIcon category={contact.category} />}
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border border-white bg-cerrado-100 text-cerrado-800">
              <CategoryIcon category={contact.category} size={13} />
            </span>
          </div>
          <div className="min-w-0">
            <a
              href={phoneHref}
              className="block font-sans text-[15px] font-extrabold leading-snug text-ink-900 no-underline hover:text-clay-700 hover:underline"
            >
              {contact.name}
            </a>
            <p className="m-0 mt-0.5 truncate text-[12px] font-semibold text-ink-600">
              {contact.hoursLegacyText ?? contact.description ?? contact.category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:justify-end">
          {contact.shortDial ? (
            <span className="rounded-md bg-sky-100 px-2 py-1 text-[12px] font-extrabold text-sky-900">
              {contact.shortDial}
            </span>
          ) : null}
          <a
            href={phoneHref}
            className="inline-flex items-center gap-1.5 rounded-md border border-cerrado-400 bg-white px-3 py-2 text-[14px] font-extrabold text-cerrado-900 no-underline hover:bg-cerrado-50"
          >
            <Phone size={16} aria-hidden="true" />
            {contact.phone}
          </a>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              aria-label={`Abrir WhatsApp de ${contact.name}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[#1f8f4d] bg-[#e7f7ee] px-3 py-2 text-[13px] font-extrabold text-[#126c37] no-underline hover:bg-[#d8f1e2]"
            >
              <MessageCircle size={17} aria-hidden="true" />
              <span>WhatsApp</span>
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-2 space-y-2 sm:pl-[60px]">
        {contact.whenToUse ? (
          <p className="m-0 text-[12px] font-medium leading-relaxed text-ink-600">{contact.whenToUse}</p>
        ) : null}
        {contact.address || contact.email ? (
          <div className="space-y-1 text-[12px] font-medium text-ink-600">
            {contact.address ? (
              <p className="m-0 flex gap-1.5">
                <MapPin className="mt-0.5 shrink-0" size={14} aria-hidden="true" />
                {contact.address}
              </p>
            ) : null}
            {contact.email ? (
              <p className="m-0 flex gap-1.5">
                <Mail className="mt-0.5 shrink-0" size={14} aria-hidden="true" />
                <a href={`mailto:${contact.email}`} className="text-sky-700 no-underline hover:underline">
                  {contact.email}
                </a>
              </p>
            ) : null}
          </div>
        ) : null}
        {contact.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {contact.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-[#eef4ec] px-2 py-1 text-[11px] font-bold text-ink-700">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function CategoryIcon({ category, size = 20 }: { category: string; size?: number }) {
  if (category === 'emergencia' || category === 'seguranca' || category === 'seguranca-publica') {
    return <ShieldAlert size={size} aria-hidden="true" />;
  }
  if (category === 'saude') return <HeartPulse size={size} aria-hidden="true" />;
  if (category === 'prefeitura' || category === 'secretarias') return <Building2 size={size} aria-hidden="true" />;
  if (category === 'servicos-estaduais') return <Landmark size={size} aria-hidden="true" />;
  return <Phone size={size} aria-hidden="true" />;
}
