import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type MapView from 'react-native-maps';

/**
 * Solicita permissão When In Use ao montar o mapa e habilita showsUserLocation.
 */
export function useMapUserLocation() {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function ensurePermission() {
      const existing = await Location.getForegroundPermissionsAsync();
      if (existing.status === 'granted') {
        if (!cancelled) setGranted(true);
        return;
      }

      const requested = await Location.requestForegroundPermissionsAsync();
      if (!cancelled) setGranted(requested.status === 'granted');
    }

    void ensurePermission();

    return () => {
      cancelled = true;
    };
  }, []);

  const centerMapOnUser = useCallback(async (mapRef: RefObject<MapView | null>) => {
    let permission = await Location.getForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      permission = await Location.requestForegroundPermissionsAsync();
    }
    const allowed = permission.status === 'granted';
    setGranted(allowed);
    if (!allowed) return false;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    mapRef.current?.animateToRegion(
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      350,
    );
    return true;
  }, []);

  return { granted, setGranted, centerMapOnUser };
}
