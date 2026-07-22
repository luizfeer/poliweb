import { Check } from 'lucide-react';
import { formatTourismAmenityLabel } from '@/lib/tourism/amenity-labels';

export function AmenitiesGrid({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div key={item} className="flex items-center gap-2 rounded-md bg-paper px-3 py-2 text-[13px]">
          <Check size={15} className="text-cerrado-700" />
          {formatTourismAmenityLabel(item)}
        </div>
      ))}
    </div>
  );
}
