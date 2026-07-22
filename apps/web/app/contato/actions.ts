'use server';

import { z } from 'zod';
import { getCurrentCity } from '@/lib/cities';
import { CONTACT_SUBMISSION_TYPES } from '@/lib/contact/types';
import { createClient } from '@/lib/supabase/server';

export type ContactActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<'tipo' | 'assunto' | 'contato' | 'mensagem', string>>;
};

const contactSchema = z.object({
  tipo: z.enum(CONTACT_SUBMISSION_TYPES),
  assunto: z.string().trim().min(3, 'Informe o assunto.').max(160, 'Assunto muito longo.'),
  pagina: z
    .string()
    .trim()
    .max(240)
    .optional()
    .transform((value) => value || null)
    .refine((value) => !value || (value.startsWith('/') && !value.startsWith('//')), 'Página inválida.'),
  contato: z
    .string()
    .trim()
    .max(160, 'Contato muito longo.')
    .optional()
    .transform((value) => value || null),
  mensagem: z.string().trim().min(10, 'Descreva o erro ou pedido com um pouco mais de detalhe.').max(2500, 'Mensagem muito longa.'),
});

export async function submitContactAction(
  _previousState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const parsed = contactSchema.safeParse({
    tipo: formData.get('tipo'),
    assunto: formData.get('assunto'),
    pagina: formData.get('pagina'),
    contato: formData.get('contato'),
    mensagem: formData.get('mensagem'),
  });

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    return {
      ok: false,
      message: 'Revise os campos destacados.',
      fieldErrors: {
        tipo: flattened.tipo?.[0],
        assunto: flattened.assunto?.[0],
        contato: flattened.contato?.[0],
        mensagem: flattened.mensagem?.[0],
      },
    };
  }

  const city = await getCurrentCity();
  if (!city) {
    return { ok: false, message: 'Não foi possível identificar a cidade atual.' };
  }

  const supabase = await createClient();
  const metadata = {
    user_message: parsed.data.mensagem,
    source: 'contact_page',
  };

  const { error } = await supabase.from('contact_submissions').insert({
    city_id: city.id,
    type: parsed.data.tipo,
    subject: parsed.data.assunto,
    related_page: parsed.data.pagina,
    contact: parsed.data.contato,
    message: parsed.data.mensagem,
    metadata,
  });

  if (error) {
    console.error('[contact_submissions] insert error', error);
    return {
      ok: false,
      message: 'Não rolou enviar agora. Tente novamente em alguns segundos.',
    };
  }

  return {
    ok: true,
    message: 'Mensagem enviada. A administração recebeu a notificação no painel.',
  };
}
