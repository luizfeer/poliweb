import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  BarChart3,
  Clock,
  DollarSign,
  Receipt,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

import { Link } from '@/components/navigation/link'
import { requireRole } from '@/lib/auth'
import { getCurrentCity } from '@/lib/cities'
import { getDeliveryPlan } from '@/lib/delivery/plan'
import { getDeliveryReport } from '@/lib/delivery/reports'
import { createClient } from '@/lib/supabase/server'

import { BusinessTabs } from '../business-tabs'
import { startDeliveryTrialAction } from '../delivery/actions'

type PageProps = { params: Promise<{ id: string }> }

const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const pct = (v: number) => `${Math.round(v * 100)}%`

export default async function BusinessReportsPage({ params }: PageProps) {
  const [{ id }, city] = await Promise.all([params, getCurrentCity()])
  if (!city) return null

  await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] })
  const supabase = await createClient()
  const { data: can } = await supabase.rpc('manages_business', { p_business_id: id })

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('id', id)
    .eq('city_id', city.id)
    .single()
  if (!business || !can) notFound()

  const plan = await getDeliveryPlan(business.id)

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
        <h1 className="mt-3 text-2xl font-bold leading-tight md:text-3xl">Relatórios de vendas</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Faturamento, ticket médio, itens campeões e horários de pico de {business.name}.
        </p>
      </header>

      <BusinessTabs businessId={business.id} active="relatorios" />

      {plan.inTrial ? (
        <p className="rounded-lg border border-clay-200 bg-clay-50 px-4 py-2 text-sm font-medium text-clay-700">
          🎁 Teste do Pro ativo — {plan.trialDaysLeft} dia(s) restante(s).
        </p>
      ) : null}

      {plan.isPro ? (
        <ReportDashboard businessId={business.id} />
      ) : (
        <UpgradeTeaser businessId={business.id} trialUsed={plan.trialUsed} />
      )}
    </div>
  )
}

async function ReportDashboard({ businessId }: { businessId: string }) {
  const report = await getDeliveryReport(businessId, 30)

  if (report.totalOrders === 0) {
    return (
      <div className="rounded-xl border border-dashed border-ink-200 bg-paper p-8 text-center">
        <BarChart3 className="mx-auto size-8 text-ink-300" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-ink-700">Ainda sem pedidos nos últimos 30 dias.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Abra sua loja e compartilhe o cardápio — os números aparecem aqui automaticamente.
        </p>
      </div>
    )
  }

  const maxDay = Math.max(...report.byDay.map((d) => d.orders), 1)
  const maxHour = Math.max(...report.byHour.map((h) => h.orders), 1)

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">Últimos {report.rangeDays} dias</p>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={DollarSign} label="Faturamento" value={brl(report.revenue)} tone="green" />
        <Kpi icon={Receipt} label="Ticket médio" value={brl(report.avgTicket)} />
        <Kpi icon={ShoppingBag} label="Pedidos" value={String(report.totalOrders)} />
        <Kpi
          icon={Clock}
          label="Preparo médio"
          value={report.avgPrepMinutes != null ? `${report.avgPrepMinutes} min` : '—'}
        />
        <Kpi icon={TrendingUp} label="Taxa de aceite" value={pct(report.acceptRate)} />
        <Kpi icon={ShoppingBag} label="Entregues" value={String(report.deliveredOrders)} />
        <Kpi icon={TrendingUp} label="Cancelamento" value={pct(report.cancelRate)} tone="red" />
        <Kpi
          icon={ShoppingBag}
          label="Delivery / Retirada"
          value={`${report.byType.delivery} / ${report.byType.pickup}`}
        />
      </div>

      {/* Pedidos por dia */}
      <Card title="Pedidos por dia">
        <div className="flex items-end gap-1.5" style={{ height: 140 }}>
          {report.byDay.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center justify-end gap-1">
              <div
                className="w-full rounded-t bg-clay-400"
                style={{ height: `${(d.orders / maxDay) * 110}px` }}
                title={`${d.orders} pedido(s) · ${brl(d.revenue)}`}
              />
              <span className="text-[9px] text-ink-400">{d.day.slice(8, 10)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Horário de pico */}
      <Card title="Horário de pico">
        <div className="flex items-end gap-1" style={{ height: 100 }}>
          {report.byHour.map((h) => (
            <div key={h.hour} className="flex flex-1 flex-col items-center justify-end gap-1">
              <div
                className="w-full rounded-t bg-sky-400"
                style={{ height: `${(h.orders / maxHour) * 76}px` }}
                title={`${h.orders} pedido(s)`}
              />
              <span className="text-[9px] text-ink-400">{h.hour}h</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Itens mais pedidos */}
      <Card title="Itens mais pedidos">
        <div className="grid gap-2">
          {report.topItems.map((it, idx) => (
            <div key={it.name} className="flex items-center gap-3">
              <span className="w-5 text-right text-sm font-bold text-ink-400">{idx + 1}</span>
              <span className="flex-1 truncate text-sm">{it.name}</span>
              <span className="text-sm font-semibold">{it.qty}×</span>
              <span className="w-20 text-right text-xs text-muted-foreground">{brl(it.revenue)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Pagamento */}
      <Card title="Formas de pagamento">
        <div className="grid gap-2">
          {report.byPayment.map((p) => (
            <div key={p.method} className="flex items-center justify-between text-sm">
              <span>{p.method}</span>
              <span className="font-semibold">{p.orders}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function UpgradeTeaser({ businessId, trialUsed }: { businessId: string; trialUsed: boolean }) {
  const FEATURES = [
    'Faturamento, ticket médio e total de pedidos',
    'Itens campeões de venda e horários de pico',
    'Tempo de preparo e taxa de aceite/cancelamento',
    'Pedidos chegam no seu WhatsApp com botões (aceitar, pronto, saiu)',
    'Acompanhamento ao vivo no painel e no app do cliente',
  ]
  return (
    <div className="overflow-hidden rounded-xl border border-clay-200 bg-card shadow-card">
      <div className="bg-gradient-to-br from-clay-500 to-clay-700 p-5 text-white">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">
          <Sparkles className="size-3.5" aria-hidden="true" /> Recurso Pro
        </span>
        <h2 className="mt-3 text-xl font-bold">Veja suas vendas de verdade</h2>
        <p className="mt-1 text-sm text-white/90">
          No plano grátis o pedido vai pelo WhatsApp e some. No Pro tudo fica registrado e vira relatório.
        </p>
      </div>
      <div className="p-5">
        <ul className="grid gap-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 text-clay-600">✓</span>
              {f}
            </li>
          ))}
        </ul>

        {trialUsed ? (
          <div className="mt-5 rounded-lg border border-ink-100 bg-paper p-4 text-sm text-muted-foreground">
            Seu teste grátis já foi usado. Fale com a administração para ativar o Pro.
          </div>
        ) : (
          <form action={startDeliveryTrialAction} className="mt-5">
            <input type="hidden" name="business_id" value={businessId} />
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-clay-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-clay-700"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Ativar 1 mês grátis de teste
            </button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Sem cobrança agora. Você testa por 30 dias e decide depois.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof DollarSign
  label: string
  value: string
  tone?: 'green' | 'red'
}) {
  const color = tone === 'green' ? 'text-green-600' : tone === 'red' ? 'text-red-600' : 'text-ink-900'
  return (
    <div className="rounded-xl border border-ink-100 bg-card p-3 shadow-card">
      <Icon className="size-4 text-ink-400" aria-hidden="true" />
      <p className={`mt-2 text-lg font-bold leading-none ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-ink-100 bg-card p-4 shadow-card">
      <h3 className="mb-3 text-sm font-bold text-ink-700">{title}</h3>
      {children}
    </section>
  )
}
