import { Stack, useLocalSearchParams } from 'expo-router';

import { BusinessDetailScreen } from '@/components/businesses/BusinessDetailScreen';

/** Detalhe nativo do comércio/pousada — /comercio/{slug}. */
export default function BusinessDetailRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <BusinessDetailScreen slug={slug ?? ''} />
    </>
  );
}
