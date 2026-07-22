import { Linking, Platform } from 'react-native';

export type MapDestination = {
  lat: number;
  lng: number;
  name: string;
};

function mapsUrlForDestination(destination: MapDestination): string {
  const label = encodeURIComponent(destination.name);
  const coords = `${destination.lat},${destination.lng}`;

  if (Platform.OS === 'ios') {
    return `http://maps.apple.com/?daddr=${coords}&q=${label}`;
  }

  return `google.navigation:q=${coords}`;
}

export async function openDirections(destination: MapDestination) {
  const primaryUrl = mapsUrlForDestination(destination);
  const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;

  try {
    const canOpenPrimary = await Linking.canOpenURL(primaryUrl);
    await Linking.openURL(canOpenPrimary ? primaryUrl : fallbackUrl);
  } catch {
    await Linking.openURL(fallbackUrl);
  }
}

export type MapProvider = 'google' | 'waze' | 'apple';

/** Apps de mapa disponíveis pra escolher rota (Apple só no iOS). */
export const MAP_PROVIDERS: { id: MapProvider; label: string }[] = [
  { id: 'google', label: 'Google Maps' },
  { id: 'waze', label: 'Waze' },
  ...(Platform.OS === 'ios' ? ([{ id: 'apple', label: 'Apple Maps' }] as const) : []),
];

function providerUrls(provider: MapProvider, d: MapDestination): { app: string; web: string } {
  const coords = `${d.lat},${d.lng}`;
  if (provider === 'waze') {
    return {
      app: `waze://?ll=${coords}&navigate=yes`,
      web: `https://waze.com/ul?ll=${coords}&navigate=yes`,
    };
  }
  if (provider === 'apple') {
    const url = `http://maps.apple.com/?daddr=${coords}&q=${encodeURIComponent(d.name)}`;
    return { app: url, web: url };
  }
  return {
    app: `comgooglemaps://?daddr=${coords}&directionsmode=driving`,
    web: `https://www.google.com/maps/dir/?api=1&destination=${coords}&travelmode=driving`,
  };
}

/** Abre a rota num app específico, com fallback pro link web. */
export async function openDirectionsWith(provider: MapProvider, destination: MapDestination) {
  const { app, web } = providerUrls(provider, destination);
  try {
    const canOpenApp = await Linking.canOpenURL(app);
    await Linking.openURL(canOpenApp ? app : web);
  } catch {
    await Linking.openURL(web).catch(() => undefined);
  }
}
