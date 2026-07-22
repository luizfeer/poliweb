import { notFound } from 'next/navigation';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { calculateFee, validityDaysForType } from '@/lib/classifieds/pricing';
import { getClassifiedsConfig } from '@/lib/classifieds/queries';
import { PaywallNotice } from '@/components/public/classifieds/cards';
import { PostingTip } from '@/components/public/forms/posting-tip';
import { ClassifiedDraftForm } from './classified-draft-form';

export const metadata = { title: 'Novo classificado - Carmo Local' };

export default async function NewClassifiedPage() {
  await requireProfile();
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('classifieds')) notFound();
  const config = await getClassifiedsConfig(city.id);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="bg-card rounded-xl border p-5 shadow-sm">
        <p className="text-muted-foreground text-sm">Cidadão</p>
        <h1 className="text-3xl font-bold">Novo classificado</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Escolha o tipo e preencha só os campos relevantes. A cidade revisa antes de publicar.
        </p>
      </header>

      <PaywallNotice
        amountCents={calculateFee('item', config)}
        days={validityDaysForType('item')}
      />
      <PostingTip title="O que é um classificado">
        <p>
          É um anúncio curto para vender, doar, contratar ou oferecer serviço na cidade. Escolha o
          tipo certo para liberar só os campos necessários e use a descrição para tirar dúvidas que
          o interessado perguntaria no WhatsApp.
        </p>
      </PostingTip>

      <ClassifiedDraftForm cityId={city.id} />
    </main>
  );
}
