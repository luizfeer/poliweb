import 'server-only';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  headers?: Record<string, string>;
};

export async function sendNewsletterEmail(input: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const from = process.env.RESEND_FROM_EMAIL ?? 'Portal Carmelitano <newsletter@carmolocal.com.br>';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      headers: input.headers,
    }),
  });

  if (!response.ok) {
    throw new Error('Falha ao enviar email de newsletter.');
  }
}
