import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth/AuthProvider';
import {
  fetchNotificationsFeed,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '@/lib/inbox/notifications-feed';
import { notifyUnreadChanged } from '@/lib/inbox/use-unread';
import { smartNavigate } from '@/lib/navigation/smart-route';
import { palette } from '@/lib/theme/tokens';

export default function NotificationsInboxScreen() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestSeq = useRef(0);

  const load = useCallback(
    async (replace: boolean) => {
      const requestUserId = userId;
      const seq = ++requestSeq.current;
      if (!requestUserId) {
        setItems([]);
        setCursor(null);
        setUnreadCount(0);
        return;
      }
      const page = await fetchNotificationsFeed({ cursor: replace ? null : cursor });
      if (!page) return;
      if (seq !== requestSeq.current || requestUserId !== userId) return;
      setItems((prev) => (replace ? page.items : [...prev, ...page.items]));
      setCursor(page.nextCursor);
      setUnreadCount(page.unreadCount);
    },
    [cursor, userId],
  );

  useEffect(() => {
    requestSeq.current += 1;
    setItems([]);
    setCursor(null);
    setUnreadCount(0);
    (async () => {
      setLoading(true);
      await load(true);
      setLoading(false);
    })();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onRefresh() {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }

  async function onEndReached() {
    if (loadingMore || !cursor) return;
    setLoadingMore(true);
    await load(false);
    setLoadingMore(false);
  }

  async function onPressItem(item: NotificationItem) {
    if (!item.read_at) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, read_at: new Date().toISOString() } : it,
        ),
      );
      setUnreadCount((n) => Math.max(0, n - 1));
      await markNotificationRead(item.id);
      notifyUnreadChanged();
    }
    smartNavigate(item.target_url);
  }

  async function onMarkAllRead() {
    setItems((prev) =>
      prev.map((it) => (it.read_at ? it : { ...it, read_at: new Date().toISOString() })),
    );
    setUnreadCount(0);
    await markAllNotificationsRead();
    notifyUnreadChanged();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={palette.ink900} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Avisos</Text>
          {unreadCount > 0 ? (
            <Text style={styles.subtitle}>{unreadCount} não lidos</Text>
          ) : null}
        </View>
        {unreadCount > 0 ? (
          <Pressable onPress={onMarkAllRead} hitSlop={8}>
            <Text style={styles.markAll}>Marcar tudo</Text>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={items.length === 0 ? styles.emptyWrap : { padding: 12 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={42} color={palette.ink400} />
              <Text style={styles.emptyTitle}>Nenhum aviso ainda</Text>
              <Text style={styles.emptySub}>
                Quando você receber notificações, elas aparecem aqui.
              </Text>
            </View>
          }
          renderItem={({ item }) => <Row item={item} onPress={() => onPressItem(item)} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 16 }}>
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function Row({ item, onPress }: { item: NotificationItem; onPress: () => void }) {
  const unread = !item.read_at;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.7 : 1 },
        unread && styles.rowUnread,
      ]}
    >
      <View style={[styles.dot, unread ? styles.dotOn : styles.dotOff]} />
      <View style={[styles.iconWrap, { backgroundColor: colorForPriority(item.priority).bg }]}>
        <Ionicons
          name={iconForType(item.type)}
          size={20}
          color={colorForPriority(item.priority).fg}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, unread && styles.rowTitleUnread]} numberOfLines={1}>
          {item.title}
        </Text>
        {item.body ? (
          <Text style={styles.rowBody} numberOfLines={2}>
            {item.body}
          </Text>
        ) : null}
        <Text style={styles.rowTime}>{formatRelative(item.created_at)}</Text>
      </View>
    </Pressable>
  );
}

function iconForType(type: string): keyof typeof import('@expo/vector-icons').Ionicons.glyphMap {
  if (type.startsWith('lead.')) return 'mail-unread-outline';
  if (type.startsWith('business.')) return 'storefront-outline';
  if (type.startsWith('city.')) return 'megaphone-outline';
  if (type.startsWith('events.')) return 'calendar-outline';
  if (type.startsWith('classifieds.')) return 'pricetag-outline';
  return 'notifications-outline';
}

function colorForPriority(p: NotificationItem['priority']): { bg: string; fg: string } {
  if (p === 'urgent') return { bg: '#FEE2E2', fg: '#B91C1C' };
  if (p === 'high') return { bg: palette.clay50, fg: palette.clay600 };
  return { bg: palette.sky100, fg: palette.sky700 };
}

function formatRelative(iso: string): string {
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'agora';
    if (min < 60) return `${min}min`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d`;
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(d);
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  iconBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: '800', color: palette.ink900 },
  subtitle: { fontSize: 11, color: palette.ink600 },
  markAll: { fontSize: 13, color: palette.cerrado700, fontWeight: '700' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    backgroundColor: palette.white,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  rowUnread: { backgroundColor: palette.sky100 + '33' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  dotOn: { backgroundColor: palette.cerrado500 },
  dotOff: { backgroundColor: 'transparent' },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 14, color: palette.ink900, fontWeight: '600' },
  rowTitleUnread: { fontWeight: '800' },
  rowBody: { fontSize: 12, color: palette.ink600, marginTop: 2 },
  rowTime: { fontSize: 11, color: palette.ink400, marginTop: 4 },
  emptyWrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  empty: { alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: palette.ink900, marginTop: 8 },
  emptySub: { fontSize: 12, color: palette.ink600, textAlign: 'center' },
});
