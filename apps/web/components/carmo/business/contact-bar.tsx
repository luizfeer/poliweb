'use client';

import { MapPin, MessageCircle, Phone, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { himetricaTrack } from '@/lib/analytics/himetrica';
import { HI_METRICA_EVENTS } from '@/lib/analytics/himetrica-events';
import { useBusinessTracker } from '@/lib/analytics/use-tracker';

type ContactBarProps = {
  phone?: string;
  whatsapp?: string;
  googleMapsUrl?: string;
  shareUrl?: string;
  /** Quando `compact`, esconde labels e usa só ícones (lista). */
  variant?: 'compact' | 'full';
  className?: string;
  /** Se informado, dispara analytics nos cliques. */
  businessId?: string;
  cityId?: string;
  /** Slug público da ficha (Himetrica / segmentação). */
  businessSlug?: string;
};

function whatsappLink(num: string, text?: string): string {
  const digits = num.replace(/\D/g, '');
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${q}`;
}

function ShareButton({
  shareUrl,
  onClick,
}: {
  shareUrl: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={() => {
        onClick?.();
        if (navigator.share) {
          navigator.share({ url: shareUrl, title: document.title });
        } else {
          navigator.clipboard.writeText(shareUrl);
        }
      }}
      className="flex items-center justify-center gap-2 bg-white text-ink-900 font-semibold rounded-md py-3 border border-ink-200 hover:bg-paper-tint transition-colors"
    >
      <Share2 size={18} strokeWidth={2.4} />
      Compartilhar
    </button>
  );
}

/**
 * Barra de contato do negócio — CTAs grandes mobile-friendly.
 * Usado na ficha (`full`) e na lista (`compact`, só ícones inline).
 */
export function ContactBar({
  phone,
  whatsapp,
  googleMapsUrl,
  shareUrl,
  variant = 'full',
  className,
  businessId,
  cityId,
  businessSlug,
}: ContactBarProps) {
  const { track } = useBusinessTracker(businessId ?? '', cityId ?? '');
  const shouldTrack = Boolean(businessId && cityId);

  function hiBusinessPayload() {
    if (!businessId) return null;
    return {
      entity_type: 'business',
      entity_id: businessId,
      ...(businessSlug ? { entity_slug: businessSlug } : {}),
    };
  }

  function trackWhatsapp() {
    const p = hiBusinessPayload();
    if (p) himetricaTrack(HI_METRICA_EVENTS.contact_whatsapp_click, p);
  }

  function trackPhone() {
    const p = hiBusinessPayload();
    if (p) himetricaTrack(HI_METRICA_EVENTS.contact_phone_click, p);
  }

  function trackDirections() {
    const p = hiBusinessPayload();
    if (p) himetricaTrack(HI_METRICA_EVENTS.directions_click, p);
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2 shrink-0', className)}>
        {whatsapp && (
          <a
            href={whatsappLink(whatsapp)}
            aria-label={`WhatsApp ${whatsapp}`}
            className="w-9 h-9 rounded-full bg-cerrado-500 text-white flex items-center justify-center"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackWhatsapp();
              if (shouldTrack) track('whatsapp_click');
            }}
          >
            <MessageCircle size={18} strokeWidth={2.2} />
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone.replace(/\D/g, '')}`}
            aria-label={`Ligar ${phone}`}
            className="w-9 h-9 rounded-full bg-clay-500 text-white flex items-center justify-center"
            onClick={() => {
              trackPhone();
              if (shouldTrack) track('phone_click');
            }}
          >
            <Phone size={18} strokeWidth={2.2} />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 gap-2 px-4 md:px-6 lg:px-8', className)}>
      {whatsapp && (
        <a
          href={whatsappLink(whatsapp, 'Olá! Vi seu contato no Portal Carmelitano e gostaria de mais informações.')}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-cerrado-500 text-white font-semibold rounded-md py-3 hover:bg-cerrado-700 transition-colors"
          onClick={() => {
            trackWhatsapp();
            if (shouldTrack) track('whatsapp_click');
          }}
        >
          <MessageCircle size={18} strokeWidth={2.4} />
          WhatsApp
        </a>
      )}
      {phone && (
        <a
          href={`tel:${phone.replace(/\D/g, '')}`}
          className="flex items-center justify-center gap-2 bg-clay-500 text-white font-semibold rounded-md py-3 hover:bg-clay-600 transition-colors"
          onClick={() => {
            trackPhone();
            if (shouldTrack) track('phone_click');
          }}
        >
          <Phone size={18} strokeWidth={2.4} />
          Ligar
        </a>
      )}
      {googleMapsUrl && (
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-white text-ink-900 font-semibold rounded-md py-3 border border-ink-200 hover:bg-paper-tint transition-colors"
          onClick={() => {
            trackDirections();
            if (shouldTrack) track('directions_click');
          }}
        >
          <MapPin size={18} strokeWidth={2.4} />
          Como chegar
        </a>
      )}
      {shareUrl && (
        <ShareButton
          shareUrl={shareUrl}
          onClick={() => {
            if (shouldTrack) track('share');
          }}
        />
      )}
    </div>
  );
}
