import QRCode from 'qrcode';
import { Gift, Share2, Ticket, Trophy } from 'lucide-react';
import { ReferralCard } from '@/components/citizen/referral-card';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { countMyReferrals, getOrCreateMyReferralCode } from '@/lib/referral';
import { getMyBalance } from '@/lib/points';
import { POINTS } from '@/lib/points/economy';

export const dynamic = 'force-dynamic';

export default async function IndicarPage() {
  const auth = await requireProfile();
  const city = await getCurrentCity();
  if (!city) return null;

  const [code, referralCount, balance] = await Promise.all([
    getOrCreateMyReferralCode(auth.profile.id, city.id),
    countMyReferrals(auth.profile.id, city.id),
    getMyBalance(city.id),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://carmolocal.com.br';
  const shareUrl = `${appUrl.replace(/\/$/, '')}/r/${code}`;
  const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 260,
    color: {
      dark: '#2f5f3a',
      light: '#ffffff',
    },
  });

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-2xl border border-cerrado-200 bg-cerrado-50 shadow-card">
        <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
          <div className="space-y-4 p-6 md:p-7">
            <div className="inline-flex items-center gap-2 rounded-pill border border-cerrado-500/20 bg-white px-3 py-1 text-xs font-semibold text-cerrado-700">
              <Gift className="size-3.5" aria-hidden="true" />
              Convites para {city.name}
            </div>
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                Indique amigos e junte pontos
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Compartilhe seu link ou mostre o QR code. A cada amigo que se cadastrar, você ganha{' '}
                <strong className="text-foreground">{POINTS.referral_earned} pontos</strong> e ele
                começa com <strong className="text-foreground">{POINTS.referral_received}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center bg-cerrado-700 p-6 text-white">
            <div className="text-center">
              <Trophy className="mx-auto size-12" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold uppercase tracking-wide text-cerrado-100">
                Seu saldo
              </p>
              <p className="font-display text-4xl font-black tabular-nums">{balance.balance}</p>
              <p className="text-sm text-cerrado-100">pontos</p>
            </div>
          </div>
        </div>
      </header>

      <ReferralCard
        code={code}
        shareUrl={shareUrl}
        qrCodeDataUrl={qrCodeDataUrl}
        referralCount={referralCount}
        pointsBalance={balance.balance}
        cityName={city.name}
      />

      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <h2 className="font-display text-xl font-bold text-foreground">Como funciona</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border bg-background p-4">
            <Share2 className="size-5 text-cerrado-700" aria-hidden="true" />
            <h3 className="mt-3 font-semibold text-foreground">Compartilhe</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Envie o link, mande no WhatsApp ou mostre o QR code para quem mora em {city.name}.
            </p>
          </div>
          <div className="rounded-xl border bg-background p-4">
            <Gift className="size-5 text-cerrado-700" aria-hidden="true" />
            <h3 className="mt-3 font-semibold text-foreground">Os dois ganham</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Você recebe <strong>+{POINTS.referral_earned}</strong> pontos. Seu amigo recebe{' '}
              <strong>+{POINTS.referral_received}</strong> ao concluir o cadastro.
            </p>
          </div>
          <div className="rounded-xl border bg-background p-4">
            <Ticket className="size-5 text-cerrado-700" aria-hidden="true" />
            <h3 className="mt-3 font-semibold text-foreground">Use em sorteios</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Troque seus pontos por participações nos sorteios mensais com prêmios da cidade.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
