import 'server-only';

import type { RaffleSummary } from './queries';

type NotifyArgs = {
  to: string;
  winnerName: string;
  raffle: RaffleSummary;
  cityName: string;
  appUrl: string;
};

export async function notifyRaffleWinner(args: NotifyArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // best-effort

  const from = process.env.RESEND_FROM_EMAIL ?? 'Portal Carmelitano <contato@carmolocal.com.br>';
  const raffleUrl = `${args.appUrl.replace(/\/$/, '')}/sorteios/${args.raffle.slug}`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <body style="font-family: -apple-system, system-ui, sans-serif; background:#fff8f0; padding:32px; color:#1f1715;">
        <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.05);">
          <div style="padding:32px; background:linear-gradient(135deg,#fef3c7,#fed7aa,#fecaca);">
            <h1 style="margin:0 0 8px; font-size:28px;">🎉 Você ganhou!</h1>
            <p style="margin:0; color:#7c2d12; font-size:16px;">Olá, ${escapeHtml(args.winnerName)}.</p>
          </div>
          <div style="padding:32px;">
            <p style="font-size:18px; line-height:1.5;">
              Você foi sorteado(a) no sorteio <strong>${escapeHtml(args.raffle.title)}</strong> em ${escapeHtml(args.cityName)}.
            </p>
            <div style="background:#fff8f0; border-radius:12px; padding:20px; margin:24px 0;">
              <p style="margin:0 0 6px; color:#7c2d12; font-size:14px; text-transform:uppercase; letter-spacing:.05em;">Prêmio</p>
              <p style="margin:0; font-size:18px; font-weight:600;">🎁 ${escapeHtml(args.raffle.prizeDescription)}</p>
            </div>
            <p style="font-size:14px; color:#52525b; line-height:1.6;">
              A equipe da prefeitura entrará em contato para combinar a entrega do prêmio.
              Mantenha seus dados de contato atualizados no painel.
            </p>
            <p style="margin-top:32px;">
              <a href="${raffleUrl}" style="display:inline-block; background:#d97706; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">
                Ver detalhes do sorteio
              </a>
            </p>
          </div>
          <div style="padding:16px 32px; background:#fafaf9; font-size:12px; color:#78716c; text-align:center;">
            Portal Carmelitano — portal hiperlocal
          </div>
        </div>
      </body>
    </html>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: args.to,
      subject: `🎉 Você ganhou no sorteio "${args.raffle.title}"!`,
      html,
    }),
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
