import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/lib/theme/tokens';

const MODULES: Array<{ icon: keyof typeof Ionicons.glyphMap; label: string; color: string; bg: string }> = [
  { icon: 'calendar', label: 'Eventos', color: palette.sky700, bg: palette.sky100 },
  { icon: 'storefront', label: 'Comércios', color: palette.clay600, bg: palette.clay50 },
  { icon: 'leaf', label: 'Turismo', color: palette.cerrado700, bg: palette.cerrado100 },
  { icon: 'newspaper', label: 'Notícias', color: '#7A4B16', bg: palette.sun100 },
];

export function WelcomeMock() {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[palette.cerrado500, palette.cerrado700]}
        style={styles.banner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.bannerHeader}>
          <View style={styles.logo}>
            <Text style={styles.logoMark}>C</Text>
          </View>
          <Text style={styles.bannerBrand}>Carmelitano</Text>
        </View>
        <Text style={styles.bannerTitle}>Olá, Carmelitano! 👋</Text>
        <Text style={styles.bannerSub}>Tudo da cidade em um lugar só.</Text>
      </LinearGradient>

      <Text style={styles.sectionTitle}>O que tem por aqui</Text>

      <View style={styles.grid}>
        {MODULES.map((m) => (
          <View key={m.label} style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: m.bg }]}>
              <Ionicons name={m.icon} size={14} color={m.color} />
            </View>
            <Text style={styles.tileLabel}>{m.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, gap: 10 },
  banner: {
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  bannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  logo: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: { fontSize: 10, fontWeight: '900', color: palette.cerrado700 },
  bannerBrand: { fontSize: 10, fontWeight: '900', color: palette.white, letterSpacing: 0.3 },
  bannerTitle: { fontSize: 14, fontWeight: '900', color: palette.white, letterSpacing: -0.3 },
  bannerSub: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: palette.ink400,
    letterSpacing: 0.6,
    marginTop: 4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.white,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  tileIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: { fontSize: 10, fontWeight: '800', color: palette.ink900 },
});
