import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getInboxFeature } from '@/lib/inbox/catalog';
import type { InboxFeatureId } from '@/lib/inbox/types';
import { palette, radius, spacing, shadows } from '@/lib/theme/tokens';

function normalizeFeatureId(value: string | string[] | undefined): InboxFeatureId {
  const id = Array.isArray(value) ? value[0] : value;
  if (
    id === 'assistant' ||
    id === 'merchant' ||
    id === 'order' ||
    id === 'notifications' ||
    id === 'promotions'
  ) {
    return id;
  }
  return 'assistant';
}

export function InboxFeatureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ featureId?: string }>();
  const feature = getInboxFeature(normalizeFeatureId(params.featureId));

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[feature.background, palette.paper]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.75 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="chevron-back" size={22} color={palette.ink900} />
          </Pressable>

          <View style={[styles.headerAvatar, { backgroundColor: feature.background }]}>
            <Ionicons name={feature.icon} size={24} color={feature.accent} />
          </View>

          <View style={styles.headerText}>
            <Text numberOfLines={1} style={styles.title}>
              {feature.title}
            </Text>
            <Text numberOfLines={1} style={styles.subtitle}>
              {feature.status === 'live' ? 'Disponível agora' : 'Prévia do canal'}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={[styles.heroIcon, { backgroundColor: feature.background }]}>
              <Ionicons name={feature.icon} size={34} color={feature.accent} />
            </View>
            <Text style={styles.heroTitle}>{feature.title}</Text>
            <Text style={styles.heroText}>{feature.description}</Text>
            <View style={[styles.statusPill, { backgroundColor: feature.accent }]}>
              <Text style={styles.statusText}>
                {feature.status === 'live' ? 'ativo' : 'em breve'}
              </Text>
            </View>
          </View>

          <View style={styles.chatStack}>
            <View style={styles.incomingBubble}>
              <Text style={styles.bubbleName}>{feature.title}</Text>
              <Text style={styles.bubbleText}>
                Este espaço vai funcionar como uma conversa, com atualizações rápidas e ações direto no chat.
              </Text>
            </View>

            <View style={styles.outgoingBubble}>
              <Text style={styles.outgoingText}>Quero acompanhar por aqui.</Text>
            </View>

            <View style={styles.incomingBubble}>
              <Text style={styles.bubbleName}>Carmo Local</Text>
              <Text style={styles.bubbleText}>
                Quando a integração estiver liberada, você recebe os avisos sem precisar procurar no app.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Como vai ser</Text>
            {feature.bullets.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <View style={[styles.bulletIcon, { backgroundColor: feature.background }]}>
                  <Ionicons name="checkmark" size={14} color={feature.accent} />
                </View>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>

          {feature.status === 'live' ? (
            <Pressable
              onPress={() => router.push(feature.route as never)}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: feature.accent, opacity: pressed ? 0.85 : 1 },
              ]}
              accessibilityRole="button"
            >
              <Ionicons name="chatbubble-ellipses" size={18} color={palette.white} />
              <Text style={styles.primaryButtonText}>Abrir conversa</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.paper },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.white,
  },
  headerText: { flex: 1 },
  title: { color: palette.ink900, fontSize: 18, fontWeight: '900' },
  subtitle: { color: palette.ink600, fontSize: 12, fontWeight: '700', marginTop: 2 },
  content: {
    paddingHorizontal: 16,
    paddingBottom: spacing.xxl,
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.white,
    ...shadows.card,
  },
  heroIcon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: { color: palette.ink900, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  heroText: {
    color: palette.ink600,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  statusPill: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 14,
  },
  statusText: {
    color: palette.white,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  chatStack: { gap: 10 },
  incomingBubble: {
    alignSelf: 'flex-start',
    maxWidth: '86%',
    backgroundColor: palette.white,
    borderRadius: 18,
    borderTopLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    ...shadows.card,
  },
  outgoingBubble: {
    alignSelf: 'flex-end',
    maxWidth: '78%',
    backgroundColor: palette.cerrado700,
    borderRadius: 18,
    borderTopRightRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  bubbleName: { color: palette.ink900, fontSize: 12, fontWeight: '900', marginBottom: 4 },
  bubbleText: { color: palette.ink700, fontSize: 14, lineHeight: 20 },
  outgoingText: { color: palette.white, fontSize: 14, fontWeight: '700' },
  card: {
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.ink100,
    padding: 14,
    gap: 12,
    ...shadows.card,
  },
  cardTitle: { color: palette.ink900, fontSize: 16, fontWeight: '900' },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bulletIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: { color: palette.ink700, fontSize: 14, fontWeight: '700', flex: 1 },
  primaryButton: {
    minHeight: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...shadows.banner,
  },
  primaryButtonText: { color: palette.white, fontSize: 15, fontWeight: '900' },
});
