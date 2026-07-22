import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';

export default async function CityRealEstatePage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const supabase = await createClient();
  const [{ count: pendingCount }, { count: publishedCount }, { count: realtorCount }] = await Promise.all([
    supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('city_id', city.id)
      .eq('review_status', 'pending'),
    supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('city_id', city.id)
      .eq('status', 'published'),
    supabase
      .from('realtors')
      .select('id', { count: 'exact', head: true })
      .eq('city_id', city.id),
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Imoveis</h1>
        <p className="text-muted-foreground">Configuracoes e moderacao do modulo imobiliario em {city.name}.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{pendingCount ?? 0}</CardTitle>
            <CardDescription>Na fila de aprovação</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{publishedCount ?? 0}</CardTitle>
            <CardDescription>Imóveis publicados</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{realtorCount ?? 0}</CardTitle>
            <CardDescription>Imobiliárias cadastradas</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AdminLink
          href="/painel/cidade/imoveis/aprovacao"
          title="Fila de aprovação"
          description="Aprovar, pedir mudanças ou rejeitar imóveis enviados."
        />
        <AdminLink
          href="/painel/cidade/imoveis/imoveis"
          title="Todos os imóveis"
          description="Buscar publicados, pendentes e arquivados."
        />
        <AdminLink
          href="/painel/cidade/imoveis/imobiliarias"
          title="Imobiliárias"
          description="Ver empresas, planos e status."
        />
        <AdminLink
          href="/painel/cidade/imoveis/pagamentos"
          title="Pagamentos"
          description="Acompanhar cobranças preparadas para o gateway."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Precos por tipo</CardTitle>
          <CardDescription>
            Configure a tabela usada por particulares e pela futura integracao de pagamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link className={buttonVariants()} href="/painel/cidade/imoveis/precos">
            Ajustar precos
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="rounded-xl border bg-card p-4 hover:bg-muted/40">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
