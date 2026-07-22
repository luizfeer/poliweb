import { notFound } from 'next/navigation';
import { BookOpen, ChevronRight, ExternalLink, ImageIcon, Pencil } from 'lucide-react';
import { Link } from '@/components/navigation/link';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';

type PageProps = { params: Promise<{ id: string }> };

export default async function CidadeTurismoGuiaHubPage({ params }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const { id } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: guide } = await sb
    .from('tourism_guides')
    .select('id, name, slug, kind, status, featured, tagline, cover_url, updated_at')
    .eq('id', id)
    .eq('city_id', city.id)
    .maybeSingle();
  if (!guide) notFound();

  const row = guide as Record<string, unknown>;
  const name = String(row.name ?? '');
  const slug = String(row.slug ?? '');
  const status = String(row.status ?? '');

  const [{ count: galleryCount }, { count: linkedCount }] = await Promise.all([
    supabase
      .from('media_links')
      .select('id', { count: 'exact', head: true })
      .eq('city_id', city.id)
      .eq('entity_type', 'tourism_guide')
      .eq('entity_id', id)
      .eq('role', 'gallery'),
    sb
      .from('guide_linked_entities')
      .select('entity_id', { count: 'exact', head: true })
      .eq('guide_id', id),
  ]);

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <Link
          href="/painel/cidade/turismo/guias"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          ← Todos os guias
        </Link>
        <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <BookOpen className="size-4" aria-hidden="true" />
          Guia editorial
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{name}</h1>
          <StatusBadge status={status} />
          {row.featured ? (
            <span className="inline-flex items-center rounded-full bg-sun-100 px-2.5 py-0.5 text-xs font-semibold text-ink-900">
              Em destaque
            </span>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {slug} · {String(row.kind ?? '')}
        </p>
        {row.tagline ? (
          <p className="text-ink-700 max-w-2xl text-sm">{String(row.tagline)}</p>
        ) : null}
        <div>
          <Link
            href={`/turismo/guias/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            prefetch={false}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Ver página pública <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <ActionCard
          href={`/painel/cidade/turismo/guias/${id}/editar`}
          icon={<Pencil className="size-6" />}
          title="Editar conteúdo"
          description="Dados, atrações vinculadas, blocos e SEO do guia."
          meta={`${linkedCount ?? 0} entidades vinculadas`}
          accent="bg-clay-50 text-clay-700 ring-clay-200"
        />
        <ActionCard
          href={`/painel/cidade/turismo/guias/${id}/midia`}
          icon={<ImageIcon className="size-6" />}
          title="Mídia"
          description="Capa, galeria CDN e importação de fotos do Google."
          meta={`${galleryCount ?? 0} fotos na galeria CDN`}
          accent="bg-cerrado-50 text-cerrado-700 ring-cerrado-200"
        />
      </section>
    </main>
  );
}

function ActionCard({
  href,
  icon,
  title,
  description,
  meta,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  meta?: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/50 hover:bg-clay-50/40"
    >
      <div className={`inline-flex size-12 items-center justify-center rounded-full ring-1 ${accent}`}>
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-extrabold text-ink-900">{title}</h2>
        <p className="mt-1 text-sm text-ink-700">{description}</p>
        {meta ? <p className="mt-2 text-xs font-semibold text-muted-foreground">{meta}</p> : null}
      </div>
      <div className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-primary">
        Abrir <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    published: { label: 'Publicado', className: 'bg-emerald-100 text-emerald-800' },
    draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
    pending: { label: 'Em revisão', className: 'bg-amber-100 text-amber-800' },
    archived: { label: 'Arquivado', className: 'bg-muted text-muted-foreground' },
  };
  const meta = map[status] ?? { label: status || '—', className: 'bg-muted text-muted-foreground' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}
