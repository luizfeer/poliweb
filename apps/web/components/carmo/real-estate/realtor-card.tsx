import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Building2, Phone } from 'lucide-react';
import type { Realtor } from '@/lib/real-estate';

export function RealtorCard({ realtor }: { realtor: Realtor }) {
  return (
    <Link href={`/imobiliarias/${realtor.slug}`} className="block rounded-md border border-ink-100 bg-white p-3 no-underline shadow-card">
      <div className="flex items-start gap-3">
        <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-clay-50">
          {realtor.logoUrl ? (
            <Image src={realtor.logoUrl} alt="" fill className="object-cover" sizes="56px" />
          ) : (
            <Building2 size={26} className="text-clay-600" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h2 className="m-0 truncate text-[15px] font-extrabold text-ink-900">{realtor.name}</h2>
            {realtor.verified && <BadgeCheck size={15} className="shrink-0 text-sky-700" />}
          </div>
          <p className="m-0 mt-1 text-[12px] text-ink-600">
            {realtor.creci ? `CRECI ${realtor.creci}` : 'Imobiliária local'}
          </p>
          {(realtor.whatsapp || realtor.phone) && (
            <p className="m-0 mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-clay-600">
              <Phone size={13} />
              {realtor.whatsapp ?? realtor.phone}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
