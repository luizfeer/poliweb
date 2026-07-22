import type { CatalogItem, CatalogSection as CatalogSectionType } from '@/lib/businesses/catalog-types'
import { CatalogItemCard } from './CatalogItemCard'

type CatalogSectionProps = {
  section: CatalogSectionType
  onItemPress: (item: CatalogItem) => void
}

export function CatalogSection({ section, onItemPress }: CatalogSectionProps) {
  return (
    <section
      id={`sec-${section.id}`}
      data-section-id={section.id}
      className="scroll-mt-[100px]"
    >
      {/* Section header */}
      <div className="bg-paper-deep px-3.5 py-2.5 border-y border-ink-100">
        <h2 className="text-[15px] font-bold text-ink-900 m-0">{section.name}</h2>
        {section.description && (
          <p className="text-[12px] text-ink-500 m-0 mt-0.5 leading-snug">{section.description}</p>
        )}
      </div>

      {/* Items */}
      <div className="bg-white">
        {section.items.map((item) => (
          <CatalogItemCard key={item.id} item={item} onPress={onItemPress} />
        ))}
      </div>
    </section>
  )
}
