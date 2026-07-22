import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InboxRow } from '@/components/inbox/InboxRow';
import { TabsScreen } from '@/components/ui/TabsScreen';
import { fetchHome } from '@/lib/api/home';
import { getAllSessions, setLastSessionId } from '@/lib/chat/storage';
import type { ChatSession } from '@/lib/chat/types';
import { buildInboxThreads } from '@/lib/inbox/build-threads';
import { INBOX_FEATURES } from '@/lib/inbox/catalog';
import type { InboxFeature, InboxThread } from '@/lib/inbox/types';
import { useUnreadNotifications } from '@/lib/inbox/use-unread';
import { palette, radius, shadows } from '@/lib/theme/tokens';
import { useTabBarScrollPadding } from '@/lib/ui/tab-bar-inset';

const FILTERS: Array<{ id: 'all' | 'ai' | 'merchant' | 'order' | 'system' | 'promotion'; label: string }> = [
  { id: 'all', label: 'Tudo' },
  { id: 'ai', label: 'IA' },
  { id: 'merchant', label: 'Comércio' },
  { id: 'order', label: 'Pedidos' },
  { id: 'system', label: 'Avisos' },
  { id: 'promotion', label: 'Ofertas' },
];

type StoryProps = {
  feature: InboxFeature;
  onPress: (feature: InboxFeature) => void;
  unreadBadge?: number;
};

function InboxStory({ feature, onPress, unreadBadge }: StoryProps) {
  const badgeText =
    unreadBadge && unreadBadge > 0 ? (unreadBadge > 99 ? '99+' : String(unreadBadge)) : null;
  return (
    <Pressable
      onPress={() => onPress(feature)}
      style={({ pressed }) => [styles.story, { opacity: pressed ? 0.82 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${feature.title}${badgeText ? `, ${badgeText} não lidos` : ''}`}
    >
      <LinearGradient
        colors={[feature.accent, feature.background, feature.accent]}
        style={styles.storyRing}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.storyAvatar, { backgroundColor: feature.background }]}>
          <Ionicons name={feature.icon} size={25} color={feature.accent} />
        </View>
      </LinearGradient>
      <Text numberOfLines={1} style={styles.storyLabel}>
        {feature.storyLabel}
      </Text>
      {feature.status === 'soon' ? <View style={styles.storyDot} /> : null}
      {badgeText ? (
        <View style={styles.storyBadge}>
          <Text style={styles.storyBadgeText} numberOfLines={1}>
            {badgeText}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function InboxScreen() {
  const tabBarPad = useTabBarScrollPadding();
  const router = useRouter();
  const { count: unreadNotifications } = useUnreadNotifications();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [cityName, setCityName] = useState('Carmo do Rio Claro');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadSessions = useCallback(async () => {
    const all = await getAllSessions();
    setSessions(all);
  }, []);

  useEffect(() => {
    fetchHome().then((home) => {
      if (home.city?.name) setCityName(home.city.name);
    });
    void loadSessions();
  }, [loadSessions]);

  useFocusEffect(
    useCallback(() => {
      void loadSessions();
    }, [loadSessions]),
  );

  const allThreads = useMemo(
    () => buildInboxThreads({ sessions, cityName }),
    [sessions, cityName],
  );

  const visibleThreads = useMemo(() => {
    if (filter === 'all') return allThreads;
    return allThreads.filter((t) => t.kind === filter);
  }, [allThreads, filter]);

  const openFeature = useCallback(
    (feature: InboxFeature) => {
      router.push(feature.route as never);
    },
    [router],
  );

  const handleOpen = useCallback(
    (thread: InboxThread) => {
      if (thread.featureId) {
        const feature = INBOX_FEATURES.find((item) => item.id === thread.featureId);
        if (feature) {
          openFeature(feature);
          return;
        }
      }

      if (thread.kind === 'ai' && thread.payload?.kind === 'ai') {
        const sessionId = thread.payload.sessionId;
        if (sessionId) {
          void setLastSessionId(sessionId);
        }
        router.push('/assistente');
      }
    },
    [openFeature, router],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadSessions();
    } finally {
      setRefreshing(false);
    }
  }, [loadSessions]);

  return (
    <TabsScreen style={styles.root}>
      <LinearGradient
        colors={['#F7F2EA', '#EFEAE2']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Mensagens</Text>
            <Text style={styles.headerSubtitle}>Conversas, pedidos e novidades locais</Text>
          </View>
          <Pressable
            onPress={() => router.push('/assistente')}
            style={({ pressed }) => [styles.composeBtn, { opacity: pressed ? 0.85 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Nova conversa com TormentaIA"
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={18} color={palette.white} />
            <Text style={styles.composeText}>Perguntar</Text>
          </Pressable>
        </View>

        <View style={styles.storiesWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesContent}
          >
            {INBOX_FEATURES.map((feature) => (
              <InboxStory
                key={feature.id}
                feature={feature}
                onPress={openFeature}
                unreadBadge={feature.id === 'notifications' ? unreadNotifications : undefined}
              />
            ))}
          </ScrollView>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((f) => {
            const active = f.id === filter;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <FlatList
          data={visibleThreads}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => <InboxRow thread={item} onPress={handleOpen} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: tabBarPad }]}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={42} color={palette.ink400} />
              <Text style={styles.emptyTitle}>Sem mensagens por aqui</Text>
              <Text style={styles.emptyText}>
                Quando comércios, entregas ou avisos mandarem novidades, aparecem nessa caixa.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={palette.cerrado700}
            />
          }
        />
      </SafeAreaView>
    </TabsScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EFEAE2' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    gap: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: palette.ink900 },
  headerSubtitle: { color: palette.ink600, fontSize: 12, fontWeight: '700', marginTop: 2 },
  composeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.cerrado700,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  composeText: { color: palette.white, fontWeight: '800', fontSize: 13 },
  storiesWrap: { paddingBottom: 10 },
  storiesContent: { paddingHorizontal: 14, gap: 12 },
  story: {
    width: 74,
    alignItems: 'center',
    gap: 6,
  },
  storyRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.banner,
  },
  storyAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.white,
  },
  storyLabel: {
    color: palette.ink700,
    fontSize: 11,
    fontWeight: '800',
    maxWidth: 72,
  },
  storyDot: {
    position: 'absolute',
    right: 11,
    top: 47,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.sun500,
    borderWidth: 2,
    borderColor: palette.paper,
  },
  storyBadge: {
    position: 'absolute',
    right: 0,
    top: -2,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: palette.clay500,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.paper,
  },
  storyBadgeText: {
    color: palette.white,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
  },
  filtersScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  chip: {
    flexShrink: 0,
    alignSelf: 'flex-start',
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  chipActive: { backgroundColor: palette.ink900, borderColor: palette.ink900 },
  chipText: { fontSize: 12, fontWeight: '700', color: palette.ink700, flexShrink: 0 },
  chipTextActive: { color: palette.white },
  listContent: { paddingHorizontal: 12 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: palette.ink700, marginTop: 8 },
  emptyText: {
    fontSize: 13,
    color: palette.ink600,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
  },
});
