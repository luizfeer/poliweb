import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { FaqAdmin } from './faq-admin';

export const metadata = { title: 'FAQ do Assistente - Portal Carmelitano' };

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  is_active: boolean;
  created_at: string;
};

type UntypedClient = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        order: (col: string, opts: { ascending: boolean }) => Promise<{ data: unknown; error: { message: string } | null }>;
      };
    };
  };
};

export default async function FaqAdminPage() {
  const city = await getCurrentCity();
  if (!city) notFound();
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const sb = createServiceRoleClient() as unknown as UntypedClient;
  const { data } = await sb
    .from('city_faqs')
    .select('id,question,answer,is_active,created_at')
    .eq('city_id', city.id)
    .order('created_at', { ascending: false });

  const faqs = Array.isArray(data) ? (data as FaqRow[]) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">FAQ do Assistente</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Perguntas e respostas que o assistente usa como fonte direta. Cada entrada é indexada por embedding.
        </p>
      </div>
      <FaqAdmin faqs={faqs} />
    </div>
  );
}
