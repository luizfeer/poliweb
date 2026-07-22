/**
 * HTML base inspirado no UI do Portal Carmelitano:
 *  - paleta clay/paper/ink do Tailwind
 *  - card central com header colorido e CTA principal
 */

type RenderArgs = {
  brandName?: string;
  title: string;
  body?: string | null;
  ctaLabel?: string;
  ctaUrl?: string;
  footnote?: string | null;
};

const PALETTE = {
  paperDeep: '#fbf6ef',
  paperCard: '#ffffff',
  ink900: '#1f1715',
  ink600: '#52443c',
  ink400: '#8a7868',
  clay500: '#d97048',
  clay50: '#fef3ea',
  clay700: '#a04722',
  border: '#ecdfcf',
};

export function renderEmail(args: RenderArgs): { html: string; text: string } {
  const brandName = args.brandName ?? 'Portal Carmelitano';
  const cta =
    args.ctaUrl && args.ctaLabel
      ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0 0;">
          <tr>
            <td align="center" bgcolor="${PALETTE.clay500}" style="border-radius: 10px;">
              <a href="${escapeHtml(args.ctaUrl)}"
                 style="display: inline-block; padding: 12px 22px; font-family: -apple-system, system-ui, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 10px;">
                ${escapeHtml(args.ctaLabel)}
              </a>
            </td>
          </tr>
        </table>
      `
      : '';

  const body = args.body
    ? `<p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: ${PALETTE.ink600};">${escapeHtml(args.body).replace(/\n/g, '<br />')}</p>`
    : '';

  const footnote = args.footnote
    ? `<p style="margin: 24px 0 0; font-size: 12px; line-height: 1.5; color: ${PALETTE.ink400};">${escapeHtml(args.footnote)}</p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(args.title)}</title>
  </head>
  <body style="margin: 0; padding: 0; background: ${PALETTE.paperDeep}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; color: ${PALETTE.ink900};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: ${PALETTE.paperDeep};">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background: ${PALETTE.paperCard}; border: 1px solid ${PALETTE.border}; border-radius: 16px; overflow: hidden;">
            <tr>
              <td style="padding: 18px 24px; background: ${PALETTE.clay50}; border-bottom: 1px solid ${PALETTE.border};">
                <p style="margin: 0; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: ${PALETTE.clay700};">
                  ${escapeHtml(brandName)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 28px 24px 24px;">
                <h1 style="margin: 0 0 12px; font-size: 22px; line-height: 1.3; font-weight: 700; color: ${PALETTE.ink900};">
                  ${escapeHtml(args.title)}
                </h1>
                ${body}
                ${cta}
                ${footnote}
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 24px; background: ${PALETTE.paperDeep}; border-top: 1px solid ${PALETTE.border};">
                <p style="margin: 0; font-size: 11px; line-height: 1.5; color: ${PALETTE.ink400};">
                  Você está recebendo este email porque tem conta no ${escapeHtml(brandName)}.
                  Para gerenciar suas preferências, acesse o painel.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textParts = [args.title];
  if (args.body) textParts.push('', args.body);
  if (args.ctaUrl) textParts.push('', `${args.ctaLabel ?? 'Abrir'}: ${args.ctaUrl}`);
  if (args.footnote) textParts.push('', args.footnote);
  const text = textParts.join('\n');

  return { html, text };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
