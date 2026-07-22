type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  tags?: string[];
  fromEmail: string;
  fromName: string;
  apiKey: string;
};

type BrevoResponse = {
  messageId?: string;
};

type BrevoError = {
  code?: string;
  message?: string;
};

/**
 * Brevo Transactional API.
 * Docs: https://developers.brevo.com/reference/sendtransacemail
 */
export async function sendBrevoEmail(args: SendArgs): Promise<{ messageId: string }> {
  const payload = {
    sender: { name: args.fromName, email: args.fromEmail },
    to: [{ email: args.to }],
    subject: args.subject,
    htmlContent: args.html,
    textContent: args.text,
    tags: args.tags,
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': args.apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail: BrevoError | null = null;
    try {
      detail = (await response.json()) as BrevoError;
    } catch {
      // ignora
    }
    const msg = detail?.message ?? response.statusText;
    throw new Error(`Brevo ${response.status}: ${msg}`);
  }

  const data = (await response.json()) as BrevoResponse;
  return { messageId: data.messageId ?? 'unknown' };
}
