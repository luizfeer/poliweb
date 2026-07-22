import { Link } from '@/components/navigation/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Save, Truck } from 'lucide-react';
import { getCurrentCity } from '@/lib/cities';
import { hasRole, requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { updateBusinessOrderingAction } from '../../actions';
import { CommerceOrderingDraftFields, type DraftOffering } from '../commerce-ordering-draft-fields';
import { BusinessTabs } from '../business-tabs';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BusinessOrderingPage({ params }: PageProps) {
  const [{ id }, city] = await Promise.all([params, getCurrentCity()]);
  if (!city) return null;

  const auth = await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const supabase = await createClient();
  const canManageAll = hasRole(auth.roles, ['city_admin', 'super_admin'], city.id);

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, owner_profile_id, ordering_enabled, import_source')
    .eq('id', id)
    .eq('city_id', city.id)
    .single();
  if (!business) notFound();

  if (!canManageAll && business.owner_profile_id !== auth.profile.id) {
    const { data: manager } = await supabase
      .from('entity_managers')
      .select('id')
      .eq('profile_id', auth.profile.id)
      .eq('entity_type', 'business')
      .eq('entity_id', business.id)
      .maybeSingle();
    if (!manager) notFound();
  }

  const panelDraft = getPanelDraft(business.import_source);
  const hasOrderingConfig = panelDraft.offerings.some((offering) => offering.name.trim().length > 0);

  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-ink-100 bg-card p-4 shadow-card md:p-5">
        <Link
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-clay-700 hover:no-underline"
          href={`/painel/comercio/${business.id}`}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para ficha
        </Link>
        <h1 className="mt-3 text-2xl font-bold leading-tight md:text-3xl">Pedidos, produtos e serviços</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Configure formas de entrega, retirada e o catálogo de produtos ou serviços de {business.name}.
        </p>
      </header>

      <BusinessTabs businessId={business.id} active="pedidos" />

      <form
        action={updateBusinessOrderingAction}
        className="grid gap-4 rounded-xl border border-ink-100 bg-card p-4 shadow-card md:p-5"
      >
        <input type="hidden" name="business_id" value={business.id} />

        {canManageAll && hasOrderingConfig ? (
          <label className="flex items-start gap-3 rounded-xl border border-ink-100 bg-white p-3 text-sm">
            <input
              type="checkbox"
              name="ordering_enabled"
              defaultChecked={business.ordering_enabled ?? false}
              className="mt-1"
            />
            <span>
              <span className="block font-semibold">Ativar pedidos pelo portal</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Só aparece para o público quando já existe configuração salva de pedidos, produtos ou serviços.
              </span>
            </span>
          </label>
        ) : canManageAll ? (
          <div className="rounded-xl border border-dashed border-ink-200 bg-paper p-3 text-sm text-muted-foreground">
            Adicione pelo menos um produto ou serviço e salve. Depois disso, a opção de ativar pedidos fica liberada.
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-ink-200 bg-paper p-3 text-sm text-muted-foreground">
            Deixe os itens prontos aqui. A ativação pública dos pedidos fica com a administração.
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium">
            <span className="inline-flex items-center gap-2">
              <Truck className="size-4 text-clay-700" aria-hidden="true" />
              Entrega
            </span>
            <select className="rounded-lg border border-ink-200 bg-white px-3 py-2" name="delivery_enabled" defaultValue={panelDraft.delivery.deliveryEnabled ? 'on' : 'off'}>
              <option value="off">Desligada</option>
              <option value="on">Ligada</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Retirada
            <select className="rounded-lg border border-ink-200 bg-white px-3 py-2" name="pickup_enabled" defaultValue={panelDraft.delivery.pickupEnabled ? 'on' : 'off'}>
              <option value="off">Desligada</option>
              <option value="on">Ligada</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Taxa de entrega
            <input className="rounded-lg border border-ink-200 bg-white px-3 py-2" name="delivery_fee" defaultValue={panelDraft.delivery.deliveryFee} placeholder="R$" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Pedido mínimo
            <input className="rounded-lg border border-ink-200 bg-white px-3 py-2" name="delivery_min_order" defaultValue={panelDraft.delivery.deliveryMinOrder} placeholder="R$" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Tempo de entrega
            <input className="rounded-lg border border-ink-200 bg-white px-3 py-2" name="delivery_time_min" defaultValue={panelDraft.delivery.deliveryTimeMin} placeholder="min" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Chave Pix
            <input className="rounded-lg border border-ink-200 bg-white px-3 py-2" name="pix_key" defaultValue={panelDraft.delivery.pixKey} />
          </label>
          <label className="grid gap-2 text-sm font-medium md:col-span-3">
            Instruções do pedido
            <textarea
              className="min-h-20 rounded-lg border border-ink-200 bg-white px-3 py-2"
              name="order_instructions"
              defaultValue={panelDraft.delivery.orderInstructions}
            />
          </label>
        </div>

        <div className="grid gap-2">
          <p className="text-sm font-semibold">Produtos ou serviços</p>
          <CommerceOrderingDraftFields offerings={panelDraft.offerings} />
        </div>

        <div>
          <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-clay-600" type="submit">
            <Save className="size-4" aria-hidden="true" />
            Salvar pedidos
          </button>
        </div>
      </form>
    </div>
  );
}

type PanelDraft = {
  delivery: {
    deliveryEnabled: boolean;
    pickupEnabled: boolean;
    deliveryFee: string;
    deliveryMinOrder: string;
    deliveryTimeMin: string;
    pixKey: string;
    orderInstructions: string;
  };
  offerings: DraftOffering[];
};

function getPanelDraft(value: unknown): PanelDraft {
  const empty: PanelDraft = {
    delivery: {
      deliveryEnabled: false,
      pickupEnabled: true,
      deliveryFee: '',
      deliveryMinOrder: '',
      deliveryTimeMin: '',
      pixKey: '',
      orderInstructions: '',
    },
    offerings: [],
  };

  if (!value || typeof value !== 'object' || Array.isArray(value)) return empty;
  const draft = (value as { panel_draft?: unknown }).panel_draft;
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return empty;

  const delivery = (draft as { delivery?: unknown }).delivery;
  const deliveryObject = delivery && typeof delivery === 'object' && !Array.isArray(delivery) ? delivery as Record<string, unknown> : {};
  const offerings = (draft as { offerings?: unknown }).offerings;

  return {
    delivery: {
      deliveryEnabled: deliveryObject.deliveryEnabled === true,
      pickupEnabled: deliveryObject.pickupEnabled !== false,
      deliveryFee: stringValue(deliveryObject.deliveryFee),
      deliveryMinOrder: stringValue(deliveryObject.deliveryMinOrder),
      deliveryTimeMin: stringValue(deliveryObject.deliveryTimeMin),
      pixKey: stringValue(deliveryObject.pixKey),
      orderInstructions: stringValue(deliveryObject.orderInstructions),
    },
    offerings: Array.isArray(offerings) ? offerings.map(toDraftOffering).filter((item): item is DraftOffering => Boolean(item)) : [],
  };
}

function toDraftOffering(value: unknown): DraftOffering | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const object = value as Record<string, unknown>;
  const kind = object.kind === 'service' ? 'service' : 'product';
  return {
    kind,
    name: stringValue(object.name),
    description: stringValue(object.description),
    price: stringValue(object.price),
  };
}

function stringValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}
