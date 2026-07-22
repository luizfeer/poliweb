import { View } from 'react-native';

import { HomeBlockView } from './HomeBlockView';
import type { HomeBlockDataBag } from '@/lib/home/block-data';
import type { HomeCity } from '@/lib/home/fetch-home-screen';
import type { HomeLayout } from '@/lib/home/types';
import { palette } from '@/lib/theme/tokens';

type Props = {
  layout: HomeLayout;
  city: HomeCity;
  data: HomeBlockDataBag;
  greeting?: string;
};

function HomeDivider() {
  return <View style={{ height: 8, backgroundColor: palette.paper }} />;
}

export function HomeRenderer({ layout, city, data, greeting }: Props) {
  if (layout.blocks.length === 0) return null;

  return (
    <>
      {layout.blocks.map((block, index) => (
        <View key={block.id}>
          {index > 0 ? <HomeDivider /> : null}
          <HomeBlockView block={block} city={city} data={data} greeting={greeting} />
        </View>
      ))}
    </>
  );
}
