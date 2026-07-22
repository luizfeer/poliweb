'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Option = {
  id: string;
  name: string;
};

type ItineraryStop = {
  key: string;
  stop_order: number;
  attraction_id: string;
  business_id: string;
  custom_title: string;
  duration_minutes: string;
  notes: string;
};

type SerializedStop = {
  stop_order: number;
  attraction_id?: string;
  business_id?: string;
  custom_title?: string;
  duration_minutes?: number;
  notes?: string;
};

type ItineraryBuilderProps = {
  attractions: Option[];
  businesses: Option[];
  initialStops?: SerializedStop[];
};

function createStop(index: number, key: string, stop?: SerializedStop): ItineraryStop {
  return {
    key,
    stop_order: index + 1,
    attraction_id: stop?.attraction_id ?? '',
    business_id: stop?.business_id ?? '',
    custom_title: stop?.custom_title ?? '',
    duration_minutes: stop?.duration_minutes ? String(stop.duration_minutes) : '',
    notes: stop?.notes ?? '',
  };
}

function reorder(stops: ItineraryStop[]) {
  return stops.map((stop, index) => ({ ...stop, stop_order: index + 1 }));
}

export function ItineraryBuilder({ attractions, businesses, initialStops = [] }: ItineraryBuilderProps) {
  const nextKey = useRef(0);
  const [stops, setStops] = useState<ItineraryStop[]>(
    initialStops.length > 0 ? initialStops.map((stop, index) => createStop(index, `initial-${index}`, stop)) : [createStop(0, 'initial-0')],
  );

  const serialized = useMemo(() => {
    const payload: SerializedStop[] = stops.map((stop, index) => {
      const duration = Number(stop.duration_minutes);
      return {
        stop_order: index + 1,
        ...(stop.attraction_id ? { attraction_id: stop.attraction_id } : {}),
        ...(stop.business_id ? { business_id: stop.business_id } : {}),
        ...(stop.custom_title.trim() ? { custom_title: stop.custom_title.trim() } : {}),
        ...(Number.isFinite(duration) && duration > 0 ? { duration_minutes: duration } : {}),
        ...(stop.notes.trim() ? { notes: stop.notes.trim() } : {}),
      };
    });
    return JSON.stringify(payload);
  }, [stops]);

  function updateStop(key: string, patch: Partial<ItineraryStop>) {
    setStops((current) => current.map((stop) => (stop.key === key ? { ...stop, ...patch } : stop)));
  }

  function moveStop(key: string, direction: -1 | 1) {
    setStops((current) => {
      const index = current.findIndex((stop) => stop.key === key);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return reorder(next);
    });
  }

  function removeStop(key: string) {
    setStops((current) => {
      if (current.length === 1) return [createStop(0, `reset-${nextKey.current++}`)];
      return reorder(current.filter((stop) => stop.key !== key));
    });
  }

  return (
    <section className="grid gap-3 md:col-span-4">
      <input type="hidden" name="itinerary" value={serialized} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Label>Itinerário</Label>
          <p className="mt-1 text-sm text-muted-foreground">Adicione paradas com atrações, negócios ou pontos livres.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setStops((current) => reorder([...current, createStop(current.length, `new-${nextKey.current++}`)]))}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar parada
        </Button>
      </div>

      <div className="grid gap-3">
        {stops.map((stop, index) => (
          <article key={stop.key} className="grid gap-3 rounded-xl border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm">Parada {index + 1}</strong>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => moveStop(stop.key, -1)} disabled={index === 0} aria-label="Mover para cima">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => moveStop(stop.key, 1)} disabled={index === stops.length - 1} aria-label="Mover para baixo">
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => removeStop(stop.key)} aria-label="Remover parada">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`attraction-${stop.key}`}>Atração</Label>
                <select
                  id={`attraction-${stop.key}`}
                  className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                  value={stop.attraction_id}
                  onChange={(event) => {
                    const attraction = attractions.find((item) => item.id === event.target.value);
                    updateStop(stop.key, {
                      attraction_id: event.target.value,
                      business_id: '',
                      custom_title: attraction?.name ?? stop.custom_title,
                    });
                  }}
                >
                  <option value="">Sem atração vinculada</option>
                  {attractions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`business-${stop.key}`}>Negócio</Label>
                <select
                  id={`business-${stop.key}`}
                  className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                  value={stop.business_id}
                  onChange={(event) => {
                    const business = businesses.find((item) => item.id === event.target.value);
                    updateStop(stop.key, {
                      business_id: event.target.value,
                      attraction_id: '',
                      custom_title: business?.name ?? stop.custom_title,
                    });
                  }}
                >
                  <option value="">Sem negócio vinculado</option>
                  {businesses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`title-${stop.key}`}>Título da parada</Label>
                <Input id={`title-${stop.key}`} value={stop.custom_title} onChange={(event) => updateStop(stop.key, { custom_title: event.target.value })} placeholder="Ex: Almoço no centro" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`duration-${stop.key}`}>Duração em minutos</Label>
                <Input id={`duration-${stop.key}`} type="number" min="0" value={stop.duration_minutes} onChange={(event) => updateStop(stop.key, { duration_minutes: event.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`notes-${stop.key}`}>Notas</Label>
                <textarea id={`notes-${stop.key}`} rows={2} className="w-full rounded-lg border bg-card px-3 py-2 text-sm" value={stop.notes} onChange={(event) => updateStop(stop.key, { notes: event.target.value })} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
