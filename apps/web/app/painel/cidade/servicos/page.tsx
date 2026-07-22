import Link from 'next/link';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';

const ITEMS = [
  ['/painel/cidade/servicos/coleta', 'Coleta de lixo', 'Rotas por bairro e tipo'],
  ['/painel/cidade/servicos/contatos', 'Telefones úteis', 'Emergência, prefeitura e saúde'],
  ['/painel/cidade/servicos/farmacias', 'Farmácias', 'Cadastro e plantões'],
  ['/painel/cidade/servicos/saude', 'Saúde', 'UBS, unidades e campanhas'],
  ['/painel/cidade/servicos/alertas', 'Alertas', 'Água, energia, clima e avisos'],
  ['/painel/cidade/servicos/balsas', 'Balsas', 'Travessias, horários e tarifas'],
] as const;

export default async function CidadeServicosPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">Admin da cidade</p>
        <h1 className="text-3xl font-bold">Serviços públicos</h1>
        <p className="mt-2 text-muted-foreground">Dados curados pelo city_admin para o módulo utilities.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {ITEMS.map(([href, title, text]) => (
          <Link key={href} href={href} className="rounded-2xl border bg-card p-5 hover:bg-muted/40">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
