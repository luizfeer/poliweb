import { MapPin, Phone } from 'lucide-react';
import type { Pharmacy } from '@/lib/utilities/types';

export function PharmacyDutyBanner({ pharmacies }: { pharmacies: Pharmacy[] }) {
  const duty = pharmacies[0];

  if (!duty) {
    return (
      <section className="mx-3.5 rounded-md border border-sun-300 bg-sun-100 p-3">
        <p className="m-0 text-[12px] font-bold uppercase">Plantão hoje</p>
        <h2 className="m-0 mt-1 font-sans text-[17px] font-extrabold">Escala não informada</h2>
        <p className="m-0 mt-1 text-[13px] text-ink-700">Consulte os telefones úteis em caso de urgência.</p>
      </section>
    );
  }

  return (
    <section className="mx-3.5 rounded-md border border-cerrado-300 bg-cerrado-50 p-3">
      <p className="m-0 text-[12px] font-bold uppercase text-cerrado-700">Plantão hoje</p>
      <h2 className="m-0 mt-1 font-sans text-[18px] font-extrabold">{duty.name}</h2>
      {duty.address && (
        <p className="m-0 mt-1 flex items-center gap-1.5 text-[13px] text-ink-700">
          <MapPin size={15} />
          {duty.address}
        </p>
      )}
      {duty.phone && (
        <a
          href={`tel:${duty.phone.replace(/\D/g, '')}`}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-cerrado-700 px-3 py-2 text-[13px] font-bold text-white no-underline"
        >
          <Phone size={16} />
          Ligar agora
        </a>
      )}
    </section>
  );
}
