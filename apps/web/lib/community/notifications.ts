import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/service';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';

type PendingCommunityReviewNotificationInput = {
  cityId: string;
  cityName: string;
  entityType: 'community_group' | 'community_group_post';
  entityTitle: string;
  reviewPath: string;
};

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

async function sendTransactionalEmail(input: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const from = process.env.RESEND_FROM_EMAIL ?? 'Carmo Local <newsletter@carmolocal.com.br>';
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
    }),
  });

  if (!response.ok) {
    throw new Error('Falha ao enviar email transacional.');
  }
}

async function listCityManagerEmails(cityId: string): Promise<string[]> {
  const supabase = createServiceRoleClient();
  const { data: roles, error } = await supabase
    .from('profile_roles')
    .select('profile_id, role')
    .eq('city_id', cityId)
    .in('role', ['moderator', 'city_admin']);

  if (error || !roles || roles.length === 0) return [];

  const emails = await Promise.all(
    roles.map(async (role) => {
      const { data } = await supabase.auth.admin.getUserById(role.profile_id);
      return data.user?.email?.trim().toLowerCase() ?? null;
    }),
  );

  return [...new Set(emails.filter((email): email is string => Boolean(email)))];
}

export async function notifyPendingCommunityReview(
  input: PendingCommunityReviewNotificationInput,
): Promise<void> {
  const emails = await listCityManagerEmails(input.cityId);
  if (emails.length === 0) return;

  const siteUrl = resolvePublicSiteOrigin();
  const reviewUrl = new URL(input.reviewPath, siteUrl).toString();
  const label =
    input.entityType === 'community_group' ? 'grupo/coletivo' : 'postagem de grupo';

  await Promise.all(
    emails.map((email) =>
      sendTransactionalEmail({
        to: email,
        subject: `[${input.cityName}] Novo ${label} pendente`,
        html: `
          <h1>Novo item aguardando aprovação</h1>
          <p><strong>Cidade:</strong> ${input.cityName}</p>
          <p><strong>Tipo:</strong> ${label}</p>
          <p><strong>Título:</strong> ${input.entityTitle}</p>
          <p><a href="${reviewUrl}">Abrir painel de revisão</a></p>
        `,
      }),
    ),
  );
}
