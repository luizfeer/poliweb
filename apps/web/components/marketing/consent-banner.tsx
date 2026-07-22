'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { himetricaTrack } from '@/lib/analytics/himetrica';
import { HI_METRICA_EVENTS } from '@/lib/analytics/himetrica-events';
import {
  emptyConsentPreferences,
  getConsentPreferences,
  saveConsentPreferences,
  type ConsentPreferences,
} from '@/lib/privacy/client-consent';

function preselectedPreferences(): ConsentPreferences {
  return {
    ...emptyConsentPreferences(),
    analytics: true,
    ads_measurement: true,
    marketing_email: true,
    ai_processing: true,
    public_listing: true,
  };
}

export function ConsentBanner() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<ConsentPreferences>(() => preselectedPreferences());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = requestAnimationFrame(() => {
      const stored = getConsentPreferences();
      if (stored) {
        setPrefs(stored);
        return;
      }
      setOpen(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  if (
    pathname?.startsWith('/assistente') ||
    pathname === '/mapa' ||
    pathname === '/turismo/onde-ficar'
  ) return null;

  if (!open) return null;

  const decide = (next: ConsentPreferences) => {
    try {
      const saved = saveConsentPreferences(next);
      setPrefs(saved);
      himetricaTrack(HI_METRICA_EVENTS.consent_updated, {
        analytics: saved.analytics,
        ads_measurement: saved.ads_measurement,
        marketing_email: saved.marketing_email,
      });
    } catch {}
    setOpen(false);
  };

  const acceptAll = () => decide(preselectedPreferences());
  const saveSelected = () => decide(prefs);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bem-vindo ao Carmo Local"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
        <p className="text-lg font-semibold">Bem-vindo ao Carmo Local 👋</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pra te mostrar o que rola perto de você — eventos, comércios e dicas da região — a gente usa alguns cookies. Nada de assustador: dá pra ajustar quando quiser no seu painel.
        </p>

        {expanded && (
          <div className="mt-4 space-y-2 rounded-lg border bg-muted/30 p-3">
            <ConsentToggle
              checked={prefs.analytics}
              label="Análise de audiência"
              onChange={(checked) => setPrefs((current) => ({ ...current, analytics: checked }))}
            />
            <ConsentToggle
              checked={prefs.ads_measurement}
              label="Publicidade e conversão local"
              onChange={(checked) =>
                setPrefs((current) => ({ ...current, ads_measurement: checked }))
              }
            />
            <ConsentToggle
              checked={prefs.marketing_email}
              label="Newsletter e comunicados"
              onChange={(checked) =>
                setPrefs((current) => ({ ...current, marketing_email: checked }))
              }
            />
            <ConsentToggle
              checked={prefs.ai_processing}
              label="Resumos por IA"
              onChange={(checked) =>
                setPrefs((current) => ({ ...current, ai_processing: checked }))
              }
            />
            <ConsentToggle
              checked={prefs.public_listing}
              label="Aparecer em listagens públicas"
              onChange={(checked) =>
                setPrefs((current) => ({ ...current, public_listing: checked }))
              }
            />
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <Button
            size="lg"
            className="h-11 w-full text-base font-semibold"
            onClick={expanded ? saveSelected : acceptAll}
          >
            Continuar
          </Button>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              {expanded ? 'Ocultar opções' : 'Personalizar'}
            </button>
            <Link href="/privacidade" className="underline-offset-4 hover:text-foreground hover:underline">
              Política de privacidade
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsentToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="size-4 accent-clay-500"
      />
      <span>{label}</span>
    </label>
  );
}
