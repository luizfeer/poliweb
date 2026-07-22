import { Stack, useLocalSearchParams } from 'expo-router';

import { CatalogScreen } from '@/components/businesses/catalog/CatalogScreen';

/** Cardápio nativo — /comercio/{slug}/cardapio. */
export default function CatalogRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <CatalogScreen slug={slug ?? ''} />
    </>
  );
}
