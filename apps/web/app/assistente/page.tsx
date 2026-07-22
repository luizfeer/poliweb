import type { Metadata } from 'next';
import { getCurrentCity } from '@/lib/cities';
import { ChatApp } from '@/components/chat/chat-app';
import { ChatPageLayoutFix } from '@/components/chat/chat-page-layout-fix';

export const metadata: Metadata = {
  title: 'Assistente | Portal Carmelitano',
  description: 'Pergunte qualquer coisa sobre Carmo do Rio Claro.',
};

export default async function AssistentePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; id?: string }>;
}) {
  const params = await searchParams;
  const city = await getCurrentCity();
  const initialQuery = params.q?.trim() ?? '';
  const initialSessionId = params.id?.trim() ?? null;

  return (
    <>
      <ChatPageLayoutFix />
      <main className="fixed inset-x-0 bottom-0 top-0 z-10 flex h-[100dvh] flex-col sm:static sm:h-[100svh] sm:max-h-[100svh]">
        <ChatApp
          cityName={city?.name ?? 'Portal Carmelitano'}
          initialQuery={initialQuery.length >= 2 ? initialQuery : undefined}
          initialSessionId={initialSessionId}
        />
      </main>
    </>
  );
}
