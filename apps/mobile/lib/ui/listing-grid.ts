import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export const LISTING_GRID_PADDING = 12;
export const LISTING_GRID_GAP = 8;
/** Largura mínima alvo por card — mais colunas em telas largas (tablet). */
export const LISTING_GRID_MIN_CARD_WIDTH = 148;
/** Celular fica em 2 colunas; 3+ só em telas mais largas (tablet). */
const TABLET_MIN_WIDTH = 520;

export function getListingGridColumns(screenWidth: number): number {
  if (screenWidth < TABLET_MIN_WIDTH) return 2;

  const available = screenWidth - LISTING_GRID_PADDING * 2;
  return Math.max(
    2,
    Math.floor((available + LISTING_GRID_GAP) / (LISTING_GRID_MIN_CARD_WIDTH + LISTING_GRID_GAP)),
  );
}

export function useListingGridColumns(): number {
  const { width } = useWindowDimensions();
  return useMemo(() => getListingGridColumns(width), [width]);
}
