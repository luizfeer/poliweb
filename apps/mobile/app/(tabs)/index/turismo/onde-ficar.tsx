import { ExploreMapScreen } from '@/components/explore/ExploreMapScreen';

/** Android e iOS usam o mesmo mapa nativo (antes o Android caía no WebView). */
export default function OndeFicarScreen() {
  return <ExploreMapScreen initialCategory="onde-ficar" />;
}
