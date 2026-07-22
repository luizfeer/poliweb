import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Callout, CalloutSubview } from 'react-native-maps';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { palette, shadows } from '@/lib/theme/tokens';

type Props = {
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  accentColor: string;
  onOpen: () => void;
  onDirections: () => void;
};

export function MapPinCallout({
  title,
  subtitle,
  imageUrl,
  accentColor,
  onOpen,
  onDirections,
}: Props) {
  return (
    <Callout tooltip onPress={onOpen}>
      <View style={styles.wrap}>
        <View style={styles.bubble}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={[styles.imageFallback, { backgroundColor: accentColor }]}>
              <Ionicons name="location" size={18} color={palette.white} />
            </View>
          )}

          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>

          {Platform.OS === 'ios' ? (
            <View style={styles.actions}>
              <CalloutSubview onPress={onDirections} style={styles.action}>
                <Ionicons name="navigate" size={16} color={stylesConstants.iosBlue} />
              </CalloutSubview>
              <CalloutSubview onPress={onOpen} style={styles.action}>
                <Ionicons name="chevron-forward" size={18} color={stylesConstants.iosBlue} />
              </CalloutSubview>
            </View>
          ) : (
            <View style={styles.actions}>
              <View style={styles.action}>
                <Ionicons name="chevron-forward" size={18} color={stylesConstants.iosBlue} />
              </View>
            </View>
          )}
        </View>
        <View style={styles.arrow} />
      </View>
    </Callout>
  );
}

const stylesConstants = {
  iosBlue: '#007AFF',
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: 238,
  },
  bubble: {
    width: 238,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.18)',
    ...shadows.card,
  },
  image: {
    width: 44,
    height: 44,
    borderRadius: 9,
    backgroundColor: palette.ink100,
  },
  imageFallback: {
    width: 44,
    height: 44,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: '700', color: palette.ink900 },
  subtitle: { marginTop: 1, fontSize: 12, fontWeight: '500', color: palette.ink600 },
  actions: {
    flexDirection: 'row',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(60,60,67,0.18)',
  },
  action: {
    width: 32,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    width: 12,
    height: 12,
    marginTop: -6,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.18)',
    backgroundColor: 'rgba(255,255,255,0.96)',
    transform: [{ rotate: '45deg' }],
  },
});
