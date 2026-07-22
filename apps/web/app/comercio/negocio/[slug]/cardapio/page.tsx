import { notFound } from 'next/navigation'
import { AppFrame } from '@/components/carmo'
import { CatalogShell } from '@/components/public/businesses/catalog'
import { getBusinessBySlug } from '@/lib/businesses'
import { getCatalogWithItems, getDeliverySettings } from '@/lib/delivery/catalog'
import { getDeliveryPlan } from '@/lib/delivery/plan'
import { MOCK_CATALOG, MOCK_DELIVERY } from '@/lib/businesses/mock-catalog'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const business = await getBusinessBySlug(slug)
  if (!business || !business.orderingEnabled) return { title: 'Cardápio não encontrado' }

  return {
    title: `Cardápio — ${business.name} · Portal Carmelitano`,
    description: `Veja o cardápio completo e faça seu pedido em ${business.name}.`,
  }
}

export default async function CatalogPage({ params }: PageProps) {
  const { slug } = await params
  const business = await getBusinessBySlug(slug)
  if (!business || !business.orderingEnabled) notFound()

  const backHref = `/comercio/negocio/${slug}`

  // Catálogo real do Supabase; se ainda não houver (schema não aplicado ou negócio
  // sem itens cadastrados), cai no mock para a página não quebrar.
  let catalog = MOCK_CATALOG
  let delivery = MOCK_DELIVERY
  let isPro = false
  try {
    const [realCatalog, realDelivery, plan] = await Promise.all([
      getCatalogWithItems(business.id),
      getDeliverySettings(business.id),
      getDeliveryPlan(business.id),
    ])
    if (realCatalog && realCatalog.sections.length > 0) {
      catalog = realCatalog
      delivery = realDelivery
    }
    isPro = plan.isPro
  } catch {
    // mantém o mock — schema de delivery ainda não aplicado
  }

  return (
    <AppFrame>
      <CatalogShell business={business} catalog={catalog} delivery={delivery} backHref={backHref} isPro={isPro} />
    </AppFrame>
  )
}
