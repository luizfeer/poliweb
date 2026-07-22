import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';

export default async function RealtorPanelPage() {
  const city = await getCurrentCity();
  if (!city) return null;
  const auth = await requireProfile();
  const supabase = await createClient();
  const [{ count: activeCount }, { count: leadCount }] = await Promise.all([
    supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('city_id', city.id)
      .eq('owner_profile_id', auth.profile.id)
      .eq('status', 'published'),
    supabase
      .from('property_inquiries')
      .select('id', { count: 'exact', head: true }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Painel imobiliário</h1>
        <p className="text-muted-foreground">Gerencie seus anúncios e contatos em {city.name}.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{activeCount ?? 0}</CardTitle>
            <CardDescription>Imóveis publicados</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{leadCount ?? 0}</CardTitle>
            <CardDescription>Leads recebidos</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="flex gap-2">
        <Link href="/painel/imobiliaria/imoveis" className={buttonVariants({ variant: 'outline' })}>
          Meus imóveis
        </Link>
        <Link href="/painel/imobiliaria/imoveis/novo" className={buttonVariants()}>
          Novo imóvel
        </Link>
      </div>
    </div>
  );
}
