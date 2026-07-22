import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AmenitiesPicker({ name = 'amenities', label = 'Comodidades / itens' }: { name?: string; label?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} placeholder="wifi, cafe_da_manha, estacionamento" />
    </div>
  );
}
