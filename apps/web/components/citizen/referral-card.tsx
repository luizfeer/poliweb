'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Copy, Gift, QrCode, Send, Trophy, Users } from 'lucide-react';

type Props = {
  code: string;
  shareUrl: string;
  qrCodeDataUrl: string;
  referralCount: number;
  pointsBalance: number;
  cityName: string;
};

export function ReferralCard({
  code,
  shareUrl,
  qrCodeDataUrl,
  referralCount,
  pointsBalance,
  cityName,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked by the browser.
    }
  };

  const whatsappText = encodeURIComponent(
    [
      `Convite para conhecer o Portal Carmelitano`,
      '',
      `Eu te convidei para entrar no portal de ${cityName}: notícias úteis, comércio local, eventos, sorteios e serviços da cidade em um só lugar.`,
      '',
      `Cadastre-se pelo meu convite: ${shareUrl}`,
    ].join('\n'),
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

  return (
    <section className="overflow-hidden rounded-2xl border border-cerrado-200 bg-cerrado-50 shadow-card">
      <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5 p-5 md:p-6">
          <div className="inline-flex items-center gap-2 rounded-pill border border-cerrado-500/20 bg-white px-3 py-1 text-xs font-semibold text-cerrado-700">
            <Gift className="size-3.5" aria-hidden="true" />
            Ganhe pontos por indicação
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Seu código
            </p>
            <p className="font-mono text-4xl font-black tracking-wider text-foreground">{code}</p>
            <p className="max-w-xl text-sm text-muted-foreground">
              Mostre o QR code ou envie o link. Quando a pessoa se cadastrar por ele, os pontos
              entram automaticamente.
            </p>
          </div>

          <div className="rounded-xl border bg-white p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Link de indicação
            </p>
            <code className="block break-all rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
              {shareUrl}
            </code>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyToClipboard}
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
              >
                <Copy className="size-4" aria-hidden="true" />
                {copied ? 'Copiado' : 'Copiar link'}
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <Send className="size-4" aria-hidden="true" />
                WhatsApp
              </a>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-white p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <Users className="size-4" aria-hidden="true" />
                Indicações
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
                {referralCount}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <Trophy className="size-4" aria-hidden="true" />
                Saldo de pontos
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
                {pointsBalance}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center border-t border-cerrado-200 bg-white p-5 lg:border-l lg:border-t-0">
          <div className="w-full max-w-56 text-center">
            <div className="mx-auto rounded-2xl border bg-white p-3 shadow-sm">
              <Image
                src={qrCodeDataUrl}
                alt={`QR code do convite para ${cityName}`}
                width={224}
                height={224}
                unoptimized
                className="aspect-square w-full rounded-lg"
              />
            </div>
            <p className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
              <QrCode className="size-4 text-cerrado-700" aria-hidden="true" />
              Convite por QR code
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Ideal para mostrar no balcão, em grupos ou para quem está do seu lado.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
