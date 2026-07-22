import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth/AuthProvider';
import { getUserDisplayProfile } from '@/lib/auth/profile-display';
import { palette } from '@/lib/theme/tokens';

export const HERO_HEIGHT = 280;

type Props = {
  scrollY: SharedValue<number>;
  cityName: string;
  greeting: string;
  weather?: { temperature: number | null; description: string | null } | null;
  backgroundUrl?: string | null;
};

/**
 * Hero parallax com:
 * - Imagem de fundo que desliza 0.5x da velocidade do scroll
 * - Gradient overlay
 * - Header em blur que aparece progressivamente ao rolar
 * - Greeting + cidade + chip de clima
 */
export function ParallaxHero({
  scrollY,
  cityName,
  greeting,
  weather,
  backgroundUrl,
}: Props) {
  const { session, user } = useAuth();
  const profile = getUserDisplayProfile(user);

  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollY.value, [-HERO_HEIGHT, 0, HERO_HEIGHT], [-HERO_HEIGHT / 2, 0, HERO_HEIGHT * 0.4]),
      },
      {
        scale: interpolate(scrollY.value, [-HERO_HEIGHT, 0], [1.4, 1], 'clamp'),
      },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HERO_HEIGHT * 0.6], [1, 0], 'clamp'),
    transform: [
      { translateY: interpolate(scrollY.value, [0, HERO_HEIGHT], [0, -40], 'clamp') },
    ],
  }));

  const stickyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [HERO_HEIGHT * 0.3, HERO_HEIGHT * 0.55], [0, 1], 'clamp'),
  }));

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Animated.View style={[styles.bg, heroStyle]}>
        {backgroundUrl ? (
          <Image source={{ uri: backgroundUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <LinearGradient
            colors={[palette.clay600, palette.clay500, '#F08A4E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)', 'rgba(250,247,240,1)']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[styles.stickyBar, stickyStyle]} pointerEvents="none">
        <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
      </Animated.View>

      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting}</Text>
            <View style={styles.cityRow}>
              <Ionicons name="location" size={14} color={palette.white} />
              <Text style={styles.cityText}>{cityName}</Text>
            </View>
          </View>
          <Pressable
            hitSlop={10}
            onPress={() => router.push('/buscar-nativo')}
            style={styles.iconBtn}
            accessibilityLabel="Buscar"
          >
            <Ionicons name="search" size={20} color={palette.white} />
          </Pressable>
          <Pressable
            hitSlop={10}
            onPress={() => router.push(session ? '/(tabs)/perfil' : '/(auth)/entrar')}
            style={styles.iconBtn}
            accessibilityLabel="Perfil"
          >
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.profileAvatar} contentFit="cover" />
            ) : (
              <Ionicons name="person" size={18} color={palette.white} />
            )}
          </Pressable>
        </View>

        <Animated.View style={[styles.contentBlock, contentStyle]} pointerEvents="box-none">
          <Text style={styles.welcome}>Tudo da cidade na palma da mão</Text>
          <Text style={styles.tagline}>
            Comércio, turismo, eventos, serviços públicos e comunidade.
          </Text>

          {weather && weather.temperature != null ? (
            <Pressable
              onPress={() => router.push('/webview/servicos-clima' as never)}
              style={styles.weatherChip}
            >
              <Ionicons name="partly-sunny" size={16} color={palette.white} />
              <Text style={styles.weatherText}>
                {Math.round(weather.temperature)}°C · {weather.description ?? 'Agora'}
              </Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
    overflow: 'hidden',
  },
  bg: { ...StyleSheet.absoluteFillObject, height: HERO_HEIGHT * 1.2 },
  safe: { flex: 1, paddingHorizontal: 16 },
  stickyBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 96,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 12,
    gap: 8,
  },
  greeting: { color: palette.white, fontSize: 13, fontWeight: '700', opacity: 0.85 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cityText: { color: palette.white, fontSize: 15, fontWeight: '800' },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  contentBlock: { marginTop: 14, gap: 6 },
  welcome: { color: palette.white, fontSize: 24, fontWeight: '900', letterSpacing: -0.5, lineHeight: 28 },
  tagline: { color: 'rgba(255,255,255,0.88)', fontSize: 13, fontWeight: '600' },
  weatherChip: {
    alignSelf: 'flex-start',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  weatherText: { color: palette.white, fontSize: 12, fontWeight: '800' },
});
