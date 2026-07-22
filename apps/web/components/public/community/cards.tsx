import Link from 'next/link';
import Image from 'next/image';
import {
  BadgeCheck,
  CalendarDays,
  HeartHandshake,
  MapPin,
  Megaphone,
  PawPrint,
  Search,
  Tag,
  UsersRound,
} from 'lucide-react';
import type {
  Classified,
  CommunityEvent,
  CommunityGroup,
  CommunityGroupPost,
  LostAndFound,
  LostPet,
  Obituary,
} from '@/lib/community/types';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function EventCard({ event }: { event: CommunityEvent }) {
  return (
    <Link
      href={`/comunidade/agenda/${event.slug}`}
      className="border-ink-100 shadow-card hover:border-clay-200 group relative block overflow-hidden rounded-2xl border bg-white p-4 hover:no-underline"
    >
      <CalendarDays
        className="text-clay-700/10 pointer-events-none absolute -bottom-6 -right-5 h-24 w-24"
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-clay-700 m-0 flex items-center gap-1.5 text-[12px] font-bold uppercase">
            <CalendarDays size={14} aria-hidden="true" />
            {dateFormatter.format(new Date(event.startAt))}
          </p>
          <h2 className="font-display text-ink-900 m-0 mt-1 text-[19px] font-extrabold leading-tight">
            {event.title}
          </h2>
        </div>
        <span className="bg-sun-100 text-ink-900 rounded-full px-2.5 py-1 text-[11px] font-extrabold">
          {event.isFree ? 'Grátis' : 'Pago'}
        </span>
      </div>
      {event.location ? (
        <p className="text-ink-600 relative m-0 mt-2 flex items-center gap-1.5 text-[13px] font-medium">
          <MapPin size={14} aria-hidden="true" />
          {event.location}
        </p>
      ) : null}
      {event.description ? (
        <p className="text-ink-700 relative m-0 mt-3 line-clamp-2 text-[13px] leading-relaxed">
          {event.description}
        </p>
      ) : null}
    </Link>
  );
}

export function ClassifiedCard({ classified }: { classified: Classified }) {
  return (
    <article className="border-ink-100 shadow-card relative overflow-hidden rounded-2xl border bg-white p-4">
      <Tag
        className="text-clay-700/10 pointer-events-none absolute -bottom-5 -right-5 h-20 w-20"
        aria-hidden="true"
      />
      <p className="text-clay-700 m-0 text-[12px] font-bold uppercase">
        {classified.categoryLabel ?? classified.type}
      </p>
      <h2 className="font-display text-ink-900 relative m-0 mt-1 text-[18px] font-extrabold">
        {classified.title}
      </h2>
      <p className="text-cerrado-700 relative m-0 mt-2 text-[16px] font-extrabold">
        {classified.price === null ? 'Combinar' : moneyFormatter.format(classified.price)}
      </p>
      {classified.description ? (
        <p className="text-ink-700 relative m-0 mt-2 line-clamp-3 text-[13px] leading-relaxed">
          {classified.description}
        </p>
      ) : null}
      <p className="bg-paper text-ink-800 relative m-0 mt-3 rounded-lg p-2 text-[13px] font-semibold">
        Contato: {classified.contactWhatsapp ?? classified.contactPhone}
      </p>
    </article>
  );
}

export function PetCard({ pet }: { pet: LostPet }) {
  return (
    <article className="border-ink-100 shadow-card relative overflow-hidden rounded-2xl border bg-white p-4">
      <PawPrint
        className="pointer-events-none absolute -bottom-5 -right-5 h-20 w-20 text-sky-700/10"
        aria-hidden="true"
      />
      <p className="m-0 text-[12px] font-bold uppercase text-sky-700">
        {pet.status === 'found' ? 'Encontrado' : pet.status === 'reunited' ? 'Reunido' : 'Perdido'}
      </p>
      <h2 className="font-display text-ink-900 relative m-0 mt-1 text-[18px] font-extrabold">
        {pet.petName ?? pet.species ?? 'Pet'}
      </h2>
      <p className="text-ink-600 relative m-0 mt-2 text-[13px]">
        {[pet.species, pet.color, pet.size].filter(Boolean).join(' - ') || 'Sem detalhes.'}
      </p>
      {pet.lastSeenLocation ? (
        <p className="text-ink-700 relative m-0 mt-2 text-[13px]">Local: {pet.lastSeenLocation}</p>
      ) : null}
      <p className="bg-paper text-ink-800 relative m-0 mt-3 rounded-lg p-2 text-[13px] font-semibold">
        Contato: {pet.contactWhatsapp ?? pet.contactPhone}
      </p>
    </article>
  );
}

export function LostAndFoundCard({ item }: { item: LostAndFound }) {
  return (
    <article className="border-ink-100 shadow-card relative overflow-hidden rounded-2xl border bg-white p-4">
      <Search
        className="text-cerrado-700/10 pointer-events-none absolute -bottom-5 -right-5 h-20 w-20"
        aria-hidden="true"
      />
      <p className="text-cerrado-700 m-0 text-[12px] font-bold uppercase">
        {item.type === 'found' ? 'Achado' : 'Perdido'}
      </p>
      <h2 className="font-display text-ink-900 relative m-0 mt-1 text-[18px] font-extrabold">
        {item.itemDescription}
      </h2>
      {item.location ? (
        <p className="text-ink-600 relative m-0 mt-2 text-[13px]">{item.location}</p>
      ) : null}
      <p className="bg-paper text-ink-800 relative m-0 mt-3 rounded-lg p-2 text-[13px] font-semibold">
        Contato: {item.contactWhatsapp ?? item.contactPhone}
      </p>
    </article>
  );
}

export function ObituaryCard({ obituary }: { obituary: Obituary }) {
  return (
    <article className="border-ink-100 shadow-card rounded-2xl border bg-white p-4">
      <p className="text-ink-600 m-0 flex items-center gap-1.5 text-[12px] font-bold">
        <HeartHandshake size={14} aria-hidden="true" />
        {new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(
          new Date(obituary.deathDate),
        )}
      </p>
      <h2 className="font-display text-ink-900 m-0 mt-1 text-[18px] font-extrabold">
        {obituary.fullName}
      </h2>
      {obituary.age ? (
        <p className="text-ink-600 m-0 mt-1 text-[13px]">{obituary.age} anos</p>
      ) : null}
      {obituary.familyMessage ? (
        <p className="text-ink-700 m-0 mt-3 text-[13px] leading-relaxed">
          {obituary.familyMessage}
        </p>
      ) : null}
      {obituary.funeralHome ? (
        <p className="text-ink-600 m-0 mt-3 text-[13px]">{obituary.funeralHome}</p>
      ) : null}
    </article>
  );
}

export function CommunityGroupCard({ group }: { group: CommunityGroup }) {
  const imageUrl = group.thumbnailUrl ?? group.coverUrl;
  const isFeatured = group.featuredUntil
    ? new Date(group.featuredUntil).getTime() > Date.now()
    : false;

  return (
    <Link
      href={`/comunidade/grupos/${group.slug}`}
      className={`shadow-card group relative block overflow-hidden rounded-2xl border bg-white p-4 hover:no-underline ${
        isFeatured ? 'border-sun-300 ring-sun-200 ring-1' : 'border-ink-100 hover:border-cerrado-100'
      }`}
    >
      <UsersRound
        className="text-cerrado-700/10 pointer-events-none absolute -bottom-5 -right-5 h-24 w-24"
        aria-hidden="true"
      />
      <div className="flex items-start gap-3">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            width={56}
            height={56}
            unoptimized
            className="size-14 rounded-lg object-cover"
          />
        ) : (
          <div className="bg-cerrado-100 text-cerrado-700 flex size-14 items-center justify-center rounded-xl text-sm font-extrabold">
            {group.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-cerrado-100 text-cerrado-700 rounded-full px-2 py-1 text-[11px] font-bold">
              {group.type === 'whatsapp_group' ? 'WhatsApp' : 'Grupo'}
            </span>
            <span className="text-ink-500 text-[11px] font-bold uppercase">{group.category}</span>
            {isFeatured ? (
              <span className="bg-sun-300 text-ink-900 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase">
                <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                Destaque
              </span>
            ) : null}
          </div>
          <h2 className="font-display text-ink-900 m-0 mt-2 line-clamp-2 text-[18px] font-extrabold leading-tight">
            {group.name}
          </h2>
          {group.shortDescription ? (
            <p className="text-ink-700 m-0 mt-2 line-clamp-3 text-[13px] leading-relaxed">
              {group.shortDescription}
            </p>
          ) : null}
          <p className="text-ink-600 m-0 mt-3 text-[13px] font-semibold">
            {[group.neighborhood, group.memberEstimate ? `${group.memberEstimate} pessoas` : null]
              .filter(Boolean)
              .join(' - ') || 'Ver detalhes e contato'}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function CommunityGroupPostCard({ post }: { post: CommunityGroupPost }) {
  return (
    <article className="border-ink-100 shadow-card rounded-2xl border bg-white p-4">
      <p className="text-clay-700 m-0 flex items-center gap-1.5 text-[12px] font-bold uppercase">
        <Megaphone size={14} aria-hidden="true" />
        {labelPostType(post.postType)}
      </p>
      <h2 className="font-display text-ink-900 m-0 mt-1 text-[18px] font-extrabold">
        {post.title}
      </h2>
      {post.body ? (
        <p className="text-ink-700 m-0 mt-2 line-clamp-4 text-[13px] leading-relaxed">
          {post.body}
        </p>
      ) : null}
      <p className="text-ink-600 m-0 mt-3 text-[13px] font-semibold">
        {[post.contactWhatsapp ?? post.contactPhone, post.contactEmail]
          .filter(Boolean)
          .join(' - ') || 'Comunicado publicado pelo grupo'}
      </p>
    </article>
  );
}

function labelPostType(type: CommunityGroupPost['postType']) {
  const labels: Record<CommunityGroupPost['postType'], string> = {
    notice: 'Aviso',
    request: 'Pedido',
    donation: 'Doação',
    opportunity: 'Oportunidade',
    announcement: 'Comunicado',
    lost_found: 'Achado ou perdido',
  };

  return labels[type];
}
