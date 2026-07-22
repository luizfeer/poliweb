import Image from 'next/image';
import Link from 'next/link';
import { Bath, BedDouble, Car, Heart, Home, MapPin, Ruler } from 'lucide-react';
import {
  LISTING_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  formatCentsAsCurrency,
  type Property,
} from '@/lib/real-estate';
import { cn } from '@/lib/utils';

type PropertyCardProps = {
  property: Property;
  compact?: boolean;
  className?: string;
};

export function PropertyCard({ property, compact = false, className }: PropertyCardProps) {
  const price = formatPropertyPrice(property);

  return (
    <Link href={`/imoveis/${property.slug}`} className="block no-underline">
      <article
        className={cn(
          'overflow-hidden rounded-md border border-ink-100 bg-white shadow-card transition-shadow hover:shadow-pop',
          className,
        )}
      >
        <div className={cn('relative bg-cerrado-100', compact ? 'h-[120px]' : 'h-[170px]')}>
          {property.coverUrl ? (
            <Image src={property.coverUrl} alt="" fill className="object-cover" sizes="360px" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Home size={42} className="text-cerrado-700/50" strokeWidth={1.6} />
            </div>
          )}

          <div className="absolute left-2 top-2 rounded-xs bg-clay-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            {LISTING_TYPE_LABELS[property.listingType]}
          </div>

          {property.featured && (
            <div className="absolute right-2 top-2 rounded-xs bg-sun-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-900">
              Destaque
            </div>
          )}

          <div className="absolute bottom-2 right-2 rounded-full bg-white/90 p-2 text-clay-600 shadow-card">
            <Heart size={16} />
          </div>
        </div>

        <div className="space-y-2 p-3">
          <div>
            <p className="m-0 text-[17px] font-extrabold text-ink-900">
              {price ?? 'Preço sob consulta'}
            </p>
            <h2 className="m-0 mt-1 line-clamp-2 text-[15px] font-bold leading-snug text-ink-900">
              {property.title}
            </h2>
            <p className="m-0 mt-1 text-[12px] font-medium text-clay-600">
              {PROPERTY_TYPE_LABELS[property.propertyType]}
            </p>
          </div>

          {property.districtName && (
            <p className="m-0 flex items-center gap-1 text-[12px] text-ink-600">
              <MapPin size={13} />
              {property.districtName}
            </p>
          )}

          <div className="grid grid-cols-4 gap-2 text-[11px] text-ink-700">
            <Metric icon={<Ruler size={13} />} value={formatArea(property.areaUsefulM2 ?? property.areaTotalM2)} />
            <Metric icon={<BedDouble size={13} />} value={formatCount(property.bedrooms)} />
            <Metric icon={<Bath size={13} />} value={formatCount(property.bathrooms)} />
            <Metric icon={<Car size={13} />} value={formatCount(property.parkingSpaces)} />
          </div>
        </div>
      </article>
    </Link>
  );
}

function Metric({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-xs bg-paper px-1.5 py-1">
      {icon}
      {value}
    </span>
  );
}

function formatPropertyPrice(property: Property): string | null {
  const value = property.listingType === 'sale' ? property.price : property.rentPrice ?? property.price;
  if (value === null) return null;

  const suffix = property.listingType === 'sale' ? '' : property.listingType === 'temporary' ? '/dia' : '/mês';
  return `${formatCentsAsCurrency(Math.round(value * 100))}${suffix}`;
}

function formatArea(value: number | null): string {
  return value === null ? '-' : `${Math.round(value)} m²`;
}

function formatCount(value: number | null): string {
  return value === null ? '-' : String(value);
}
