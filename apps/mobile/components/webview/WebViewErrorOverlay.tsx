import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, radius, spacing } from '@/lib/theme/tokens';

type Props = {
  status: number | null;
  message?: string | null;
  onRetry: () => void;
  onBack?: () => void;
};

type QuickLink = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: string;
  toneFg: string;
  onPress: () => void;
};

const QUICK_LINKS: QuickLink[] = [
  {
    title: 'Buscar no portal',
    subtitle: 'Comércio, turismo, serviços e comunidade',
    icon: 'search',
    tone: '#FBE5DA',
    toneFg: palette.clay600,
    onPress: () => router.push('/buscar-nativo' as never),
  },
  {
    title: 'Perguntar ao assistente',
    subtitle: 'Descreva o que você procura em linguagem natural',
    icon: 'sparkles',
    tone: '#DBEDF7',
    toneFg: palette.sky500,
    onPress: () => router.push('/assistente' as never),
  },
  {
    title: 'Explorar no mapa',
    subtitle: 'Pousadas, atrações e comércios pertinho',
    icon: 'map',
    tone: '#E1EDDB',
    toneFg: palette.cerrado700,
    onPress: () => router.push('/(tabs)/explorar' as never),
  },
  {
    title: 'Voltar ao início',
    subtitle: 'Tudo que está rolando em Carmo',
    icon: 'home',
    tone: palette.paper,
    toneFg: palette.ink900,
    onPress: () => router.replace('/(tabs)' as never),
  },
];

function statusInfo(status: number | null): { eyebrow: string; title: string; subtitle: string } {
  if (status === 404) {
    return {
      eyebrow: 'Página não encontrada',
      title: 'Esse caminho saiu da rota.',
      subtitle:
        'O conteúdo pode ter mudado de endereço, ainda não ter sido publicado, ou o link pode estar incompleto.',
    };
  }
  if (status && status >= 500) {
    return {
      eyebrow: `Erro ${status}`,
      title: 'O servidor demorou pra responder.',
      subtitle: 'Estamos cientes. Tente recarregar em alguns segundos.',
    };
  }
  if (status && status >= 400) {
    return {
      eyebrow: `Erro ${status}`,
      title: 'Não foi possível abrir essa página.',
      subtitle: 'Verifique se você tem permissão pra ver esse conteúdo.',
    };
  }
  return {
    eyebrow: 'Sem conexão',
    title: 'Falha ao carregar.',
    subtitle:
      'Pode ser a internet do celular ou um problema momentâneo do portal. Tente novamente.',
  };
}

export function WebViewErrorOverlay({ status, message, onRetry, onBack }: Props) {
  const info = statusInfo(status);
  const handleBack =
    onBack ??
    (() => {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)' as never);
    });
  return (
    <View style={styles.cover}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={handleBack}
            hitSlop={10}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="chevron-back" size={22} color={palette.white} />
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.eyebrowRow}>
              <Ionicons name="alert-circle" size={14} color={palette.white} />
              <Text style={styles.eyebrow}>{info.eyebrow}</Text>
            </View>
            <Text style={styles.title}>{info.title}</Text>
            <Text style={styles.subtitle}>{info.subtitle}</Text>
            {message ? <Text style={styles.detail}>{message}</Text> : null}

            <View style={styles.heroActions}>
              <Pressable
                onPress={onRetry}
                style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.85 }]}
              >
                <Ionicons name="refresh" size={16} color={palette.white} />
                <Text style={styles.btnPrimaryText}>Tentar de novo</Text>
              </Pressable>
              <Pressable
                onPress={() => router.replace('/(tabs)' as never)}
                style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.85 }]}
              >
                <Ionicons name="home" size={16} color={palette.ink900} />
                <Text style={styles.btnGhostText}>Início</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Talvez você queira</Text>

          <View style={styles.linksGrid}>
            {QUICK_LINKS.map((link) => (
              <Pressable
                key={link.title}
                onPress={link.onPress}
                style={({ pressed }) => [styles.linkCard, pressed && styles.linkCardPressed]}
              >
                <View style={[styles.linkIcon, { backgroundColor: link.tone }]}>
                  <Ionicons name={link.icon} size={20} color={link.toneFg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkTitle}>{link.title}</Text>
                  <Text style={styles.linkSubtitle}>{link.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={palette.ink400} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.paper,
    zIndex: 10,
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  topBar: {
    backgroundColor: palette.ink900,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  backText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '800',
  },
  hero: {
    backgroundColor: palette.ink900,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  eyebrow: { color: palette.white, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  title: {
    color: palette.white,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
    marginTop: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    lineHeight: 20,
  },
  detail: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  heroActions: { flexDirection: 'row', gap: 8, marginTop: spacing.md, flexWrap: 'wrap' },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: radius.md,
    backgroundColor: palette.clay500,
  },
  btnPrimaryText: { color: palette.white, fontSize: 13, fontWeight: '900' },
  btnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: radius.md,
    backgroundColor: palette.white,
  },
  btnGhostText: { color: palette.ink900, fontSize: 13, fontWeight: '900' },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: palette.ink600,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  linksGrid: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.white,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  linkCardPressed: { opacity: 0.7 },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: { fontSize: 14, fontWeight: '800', color: palette.ink900 },
  linkSubtitle: { fontSize: 12, color: palette.ink600, marginTop: 2 },
});
