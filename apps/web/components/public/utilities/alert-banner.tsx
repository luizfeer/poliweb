import Link from 'next/link';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceAlert } from '@/lib/utilities/types';

type AlertBannerProps = {
  alert: ServiceAlert;
  compact?: boolean;
};

const SEVERITY = {
  info: {
    icon: Info,
    className: 'border-sky-100 bg-sky-100 text-sky-700',
    label: 'Informativo',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-sun-300 bg-sun-100 text-ink-900',
    label: 'Atenção',
  },
  critical: {
    icon: ShieldAlert,
    className: 'border-destructive bg-red-50 text-ink-900',
    label: 'Urgente',
  },
} satisfies Record<ServiceAlert['severity'], { icon: typeof Info; className: string; label: string }>;

export function AlertBanner({ alert, compact = false }: AlertBannerProps) {
  const config = SEVERITY[alert.severity];
  const Icon = config.icon;

  return (
    <Link
      href="/servicos/alertas"
      className={cn(
        'block border px-3.5 py-3 no-underline',
        compact ? 'rounded-md' : 'rounded-none',
        config.className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <Icon size={20} className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="m-0 text-[12px] font-bold uppercase">{config.label}</p>
          <h2 className="m-0 mt-0.5 font-sans text-[15px] font-extrabold leading-snug">{alert.title}</h2>
          {!compact && alert.description && (
            <p className="m-0 mt-1 text-[13px] leading-snug">{alert.description}</p>
          )}
          {alert.affectedArea && <p className="m-0 mt-1 text-[12px]">Área: {alert.affectedArea}</p>}
        </div>
      </div>
    </Link>
  );
}
