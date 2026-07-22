import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadows } from '@/lib/theme/tokens';

type Props = {
  greeting?: string;
  href?: string;
};

/**
 * Banner promocional clay + diagonal cerrado, espelhando BusinessPromoHero do web.
 */
export function BusinessPromoHero({ greeting, href = '/webview/comercio-cadastro' }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => router.push(href as never)}
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.96 : 1 }]}
        accessibilityLabel="Cadastre seu comércio e ganhe 1 mês grátis"
      >
        <LinearGradient
          colors={['#C84810', '#E0561B', '#F08A4E', '#C84810']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.cerradoDiagonal} pointerEvents="none" />

        <View style={styles.content}>
          {greeting ? <Text style={styles.greeting}>{greeting}</Text> : null}
          <View style={styles.tag}>
            <Ionicons name="sparkles" size={12} color={palette.clay600} />
            <Text style={styles.tagText}>1 mês grátis</Text>
          </View>
          <Text style={styles.kicker}>Pro seu comércio</Text>
          <Text style={styles.title}>Apareça na home de Carmo</Text>
          <Text style={styles.subtitle}>
            Cadastre pizzaria, pousada, oficina ou loja e ganhe vitrine no portal.
          </Text>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Cadastrar meu negócio</Text>
            <Ionicons name="arrow-forward" size={16} color={palette.ink900} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingTop: 10 },
  card: {
    borderRadius: radius.md,
    overflow: 'hidden',
    minHeight: 200,
    ...shadows.banner,
  },
  cerradoDiagonal: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '55%',
    height: '100%',
    backgroundColor: palette.cerrado700,
    opacity: 0.92,
    transform: [{ skewX: '-12deg' }, { translateX: 24 }],
  },
  content: {
    padding: 16,
    gap: 4,
    maxWidth: '78%',
  },
  greeting: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  tag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  tagText: {
    color: palette.clay600,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  kicker: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  title: {
    color: palette.white,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 4,
  },
  cta: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  ctaText: {
    color: palette.ink900,
    fontSize: 13,
    fontWeight: '800',
  },
});
