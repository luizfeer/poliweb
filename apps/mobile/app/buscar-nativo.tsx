import { Stack, useLocalSearchParams } from 'expo-router';

import { SearchScreen } from '@/components/search/SearchScreen';
import { palette } from '@/lib/theme/tokens';

export default function BuscarNativoScreen() {
  const params = useLocalSearchParams<{ q?: string | string[] }>();
  const raw = params.q;
  const initialQuery = typeof raw === 'string' ? raw : Array.isArray(raw) ? (raw[0] ?? '') : '';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: palette.clay500 },
        }}
      />
      <SearchScreen initialQuery={initialQuery} />
    </>
  );
}
