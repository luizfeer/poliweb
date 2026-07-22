import { notFound } from 'next/navigation';
import { Filter, MessageCircle, Plus, UsersRound } from 'lucide-react';
import { Link } from '@/components/navigation/link';
import { AppFrame, Band, TabBar } from '@/components/carmo';
import {
  CommunityHero,
  CommunityPageShell,
  CommunityPill,
} from '@/components/public/community/community-hero';
import { CommunityGroupCard } from '@/components/public/community/cards';
import { getCurrentCity } from '@/lib/cities';
import { listCommunityGroups } from '@/lib/community/queries';
import { COMMUNITY_GROUP_CATEGORY_OPTIONS } from '@/lib/community/types';

export const metadata = { title: 'Grupos de WhatsApp - Carmo Local' };

export default async function WhatsappGroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('community')) notFound();
  const params = await searchParams;

  const groups = await listCommunityGroups({
    city_id: city.id,
    type: 'whatsapp_group',
    q: params.q,
    category: params.category,
    limit: 48,
  });

  return (
    <AppFrame className="bg-paper">
      <CommunityPageShell chips={['WhatsApp', 'Regras', 'Enviar']}>
        <CommunityHero
          icon={MessageCircle}
          kicker="Links locais"
          title="Grupos de WhatsApp"
          description="Grupos públicos com tema, regras e contato visíveis para entrar com contexto, sem virar uma lista solta de links."
          tone="green"
          action={
            <>
              <Link
                href="/comunidade/grupos"
                className="border-cerrado-100 text-cerrado-700 inline-flex min-h-11 items-center gap-2 rounded-md border bg-white px-4 py-2 text-[13px] font-extrabold no-underline"
              >
                <UsersRound size={17} aria-hidden="true" />
                Todos os grupos
              </Link>
              <Link
                href="/comunidade/grupos/novo"
                className="bg-ink-900 inline-flex min-h-11 items-center gap-2 rounded-md px-4 py-2 text-[13px] font-extrabold text-white no-underline"
              >
                <Plus size={17} aria-hidden="true" />
                Enviar grupo
              </Link>
            </>
          }
          meta={
            <>
              <CommunityPill tone="green">{groups.length} links</CommunityPill>
              <CommunityPill tone="paper">Leia as regras antes de entrar</CommunityPill>
            </>
          }
        />

        <Band className="px-3.5 pb-3 md:px-6 lg:px-8">
          <form className="border-ink-100 shadow-card grid gap-2 rounded-2xl border bg-white p-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto]">
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Buscar por tema ou nome"
              className="border-ink-100 bg-paper focus:border-cerrado-100 min-h-11 rounded-md border px-3 text-[14px] font-semibold outline-none"
            />
            <select
              name="category"
              defaultValue={params.category ?? ''}
              className="border-ink-100 bg-paper focus:border-cerrado-100 min-h-11 rounded-md border px-3 text-[14px] font-semibold outline-none"
            >
              <option value="">Todos os temas</option>
              {COMMUNITY_GROUP_CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <button
              className="bg-cerrado-700 inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-[13px] font-extrabold text-white"
              type="submit"
            >
              <Filter size={16} aria-hidden="true" />
              Filtrar
            </button>
          </form>
        </Band>

        <Band className="px-3.5 pb-3 md:px-6 lg:px-8">
          <section className="border-sun-100 bg-sun-100/70 text-ink-700 shadow-card rounded-2xl border p-4 text-[13px] font-semibold leading-relaxed">
            O Carmo Local não administra esses grupos. Antes de entrar, leia as regras e confirme se
            o link ainda está válido.
          </section>
        </Band>

        <Band className="grid gap-3 px-3.5 pb-4 md:grid-cols-2 md:px-6 lg:px-8 xl:grid-cols-3">
          {groups.length > 0 ? (
            groups.map((group) => <CommunityGroupCard key={group.id} group={group} />)
          ) : (
            <p className="border-ink-100 text-ink-700 shadow-card m-0 rounded-2xl border bg-white p-4 text-[13px]">
              Nenhum grupo encontrado com esse filtro.
            </p>
          )}
        </Band>
        <TabBar active="comunidade" />
      </CommunityPageShell>
    </AppFrame>
  );
}
