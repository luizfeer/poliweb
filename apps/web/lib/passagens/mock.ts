export type Operator = {
  slug: string;
  name: string;
  badge: string;
  color: string;
};

export const SUL_MINAS: Operator = {
  slug: 'sul-minas',
  name: 'Sul Minas',
  badge: 'ex-Santa Cruz',
  color: 'cerrado',
};

export const CRISTO_REI: Operator = {
  slug: 'cristo-rei',
  name: 'Cristo Rei',
  badge: 'parceira',
  color: 'sky',
};

export type Destination = {
  slug: string;
  city: string;
  uf: 'MG' | 'SP';
  durationMin: number;
  fromPrice: number;
  schedulesPerDay: number;
  illo: string;
  highlight?: string;
};

export const DESTINATIONS: Destination[] = [
  { slug: 'alfenas', city: 'Alfenas', uf: 'MG', durationMin: 120, fromPrice: 28.5, schedulesPerDay: 6, illo: '🏥', highlight: 'Hospital regional' },
  { slug: 'passos', city: 'Passos', uf: 'MG', durationMin: 95, fromPrice: 24.9, schedulesPerDay: 5, illo: '🛍️' },
  { slug: 'pocos-de-caldas', city: 'Poços de Caldas', uf: 'MG', durationMin: 210, fromPrice: 58.0, schedulesPerDay: 3, illo: '♨️', highlight: 'Águas termais' },
  { slug: 'varginha', city: 'Varginha', uf: 'MG', durationMin: 240, fromPrice: 64.0, schedulesPerDay: 2, illo: '☕' },
  { slug: 'belo-horizonte', city: 'Belo Horizonte', uf: 'MG', durationMin: 480, fromPrice: 142.0, schedulesPerDay: 2, illo: '🏙️', highlight: 'Capital' },
  { slug: 'sao-paulo', city: 'São Paulo', uf: 'SP', durationMin: 540, fromPrice: 168.0, schedulesPerDay: 1, illo: '🌆', highlight: 'Tietê' },
  { slug: 'capitolio', city: 'Capitólio', uf: 'MG', durationMin: 75, fromPrice: 18.0, schedulesPerDay: 4, illo: '⛵' },
  { slug: 'guape', city: 'Guapé', uf: 'MG', durationMin: 50, fromPrice: 14.5, schedulesPerDay: 3, illo: '🌳' },
];

export type Schedule = {
  id: string;
  operator: Operator;
  departure: string;
  arrival: string;
  durationMin: number;
  price: number;
  vehicleClass: 'Convencional' | 'Executivo' | 'Semi-leito';
  amenities: string[];
  seatsLeft: number;
  origin: string;
  destination: string;
  destinationSlug: string;
};

export function listSchedulesFor(destinationSlug: string): Schedule[] {
  const dest = DESTINATIONS.find((d) => d.slug === destinationSlug);
  if (!dest) return [];

  const base: Omit<Schedule, 'id' | 'destination' | 'destinationSlug' | 'origin' | 'durationMin'>[] = [
    { operator: SUL_MINAS, departure: '06:15', arrival: addMin('06:15', dest.durationMin), price: dest.fromPrice, vehicleClass: 'Convencional' as const, amenities: ['Wi-Fi', 'Ar'], seatsLeft: 18 },
    { operator: SUL_MINAS, departure: '09:40', arrival: addMin('09:40', dest.durationMin), price: dest.fromPrice + 4, vehicleClass: 'Executivo' as const, amenities: ['Wi-Fi', 'Ar', 'Tomada'], seatsLeft: 9 },
    { operator: SUL_MINAS, departure: '13:20', arrival: addMin('13:20', dest.durationMin), price: dest.fromPrice + 6, vehicleClass: 'Executivo' as const, amenities: ['Wi-Fi', 'Ar', 'Tomada'], seatsLeft: 22 },
    { operator: CRISTO_REI, departure: '15:55', arrival: addMin('15:55', dest.durationMin), price: dest.fromPrice + 2, vehicleClass: 'Convencional' as const, amenities: ['Ar'], seatsLeft: 30 },
    { operator: SUL_MINAS, departure: '19:10', arrival: addMin('19:10', dest.durationMin), price: dest.fromPrice + 8, vehicleClass: 'Semi-leito' as const, amenities: ['Wi-Fi', 'Ar', 'Tomada', 'Manta'], seatsLeft: 4 },
    { operator: SUL_MINAS, departure: '23:30', arrival: addMin('23:30', dest.durationMin), price: dest.fromPrice + 10, vehicleClass: 'Semi-leito' as const, amenities: ['Wi-Fi', 'Ar', 'Manta'], seatsLeft: 12 },
  ].slice(0, dest.schedulesPerDay + 1);

  return base.map((s, i) => ({
    ...s,
    id: `${dest.slug}-${i}`,
    durationMin: dest.durationMin,
    origin: 'Carmo do Rio Claro',
    destination: `${dest.city}/${dest.uf}`,
    destinationSlug: dest.slug,
  }));
}

export function getScheduleById(id: string): Schedule | null {
  for (const dest of DESTINATIONS) {
    const found = listSchedulesFor(dest.slug).find((s) => s.id === id);
    if (found) return found;
  }
  return null;
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function addMin(time: string, minutesToAdd: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutesToAdd;
  const finalH = Math.floor((total % (24 * 60)) / 60);
  const finalM = total % 60;
  const overnight = total >= 24 * 60 ? '+1' : '';
  return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}${overnight}`;
}

export const CONVENIENCE_FEE = 3.9;
