import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectRef = process.env.SUPABASE_PROJECT_REF ?? 'szdzoxfvugxcrpfsabbv';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!accessToken) {
  console.error('Defina SUPABASE_ACCESS_TOKEN antes de publicar os templates.');
  process.exit(1);
}

const root = resolve(import.meta.dirname, '..');
const templatePath = (file) => resolve(root, 'supabase', 'templates', file);
const readTemplate = (file) => readFile(templatePath(file), 'utf8');

const payload = {
  mailer_subjects_invite: 'Convite para acessar o Portal Carmelitano',
  mailer_templates_invite_content: await readTemplate('invite.html'),
  mailer_subjects_confirmation: 'Confirme seu cadastro no Portal Carmelitano',
  mailer_templates_confirmation_content: await readTemplate('confirmation.html'),
  mailer_subjects_recovery: 'Recupere sua senha do Portal Carmelitano',
  mailer_templates_recovery_content: await readTemplate('recovery.html'),
  mailer_subjects_magic_link: 'Seu link de acesso ao Portal Carmelitano',
  mailer_templates_magic_link_content: await readTemplate('magic_link.html'),
  mailer_subjects_email_change: 'Confirme a troca de email no Portal Carmelitano',
  mailer_templates_email_change_content: await readTemplate('email_change.html'),
  mailer_subjects_reauthentication: 'Confirme que é você no Portal Carmelitano',
  mailer_templates_reauthentication_content: await readTemplate('reauthentication.html'),
  mailer_notifications_password_changed_enabled: true,
  mailer_subjects_password_changed_notification: 'Sua senha do Portal Carmelitano foi alterada',
  mailer_templates_password_changed_notification_content: await readTemplate(
    'password_changed_notification.html',
  ),
  mailer_notifications_email_changed_enabled: true,
  mailer_subjects_email_changed_notification: 'Seu email do Portal Carmelitano foi alterado',
  mailer_templates_email_changed_notification_content: await readTemplate(
    'email_changed_notification.html',
  ),
};

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: {
    authorization: `Bearer ${accessToken}`,
    'content-type': 'application/json',
  },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  const body = await response.text();
  console.error(`Falha ao atualizar auth templates (${response.status}): ${body}`);
  process.exit(1);
}

console.log(`Templates de auth atualizados no projeto Supabase ${projectRef}.`);
