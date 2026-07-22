import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getInboxFeature } from '@/lib/inbox/catalog';
import type { InboxThread, InboxThreadKind } from '@/lib/inbox/types';
import { palette, radius, shadows } from '@/lib/theme/tokens';

type KindStyle = {
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  color: string;
};

const KIND_STYLES: Record<InboxThreadKind, KindStyle> = {
  ai: { icon: 'sparkles', bg: palette.cerrado100, color: palette.cerrado700 },
  merchant: { icon: 'storefront', bg: '#F4E7DE', color: palette.clay600 },
  order: { icon: getInboxFeature('order').icon, bg: palette.clay50, color: palette.clay600 },
  system: { icon: 'notifications', bg: palette.sky100, color: palette.sky700 },
  promotion: { icon: 'pricetag', bg: '#FFE7EF', color: palette.discount },
};

function formatWhen(ts: number): string {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) {
    return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 2 * day) return 'Ontem';
  if (diff < 7 * day) {
    return new Date(ts).toLocaleDateString('pt-BR', { weekday: 'short' });
  }
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

type Props = {
  thread: InboxThread;
  onPress: (thread: InboxThread) => void;
  onLongPress?: (thread: InboxThread) => void;
};

export function InboxRow({ thread, onPress, onLongPress }: Props) {
  const kind = KIND_STYLES[thread.kind];
  const isComingSoon = thread.comingSoon === true;

  return (
    <Pressable
      onPress={() => onPress(thread)}
      onLongPress={onLongPress ? () => onLongPress(thread) : undefined}
      style={({ pressed }) => [
        styles.row,
        shadows.card,
        thread.pinned && styles.rowPinned,
        isComingSoon && styles.rowSoon,
        { opacity: pressed ? 0.85 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${thread.title}, ${thread.subtitle}`}
    >
      <View style={[styles.avatar, { backgroundColor: kind.bg }]}>
        <Ionicons name={kind.icon} size={22} color={kind.color} />
        {thread.pinned ? (
          <View style={styles.pinDot}>
            <Ionicons name="star" size={9} color={palette.white} />
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={styles.title}>
            {thread.title}
          </Text>
          {!isComingSoon && thread.updatedAt > 0 ? (
            <Text style={styles.when}>{formatWhen(thread.updatedAt)}</Text>
          ) : null}
        </View>
        <View style={styles.subRow}>
          <Text numberOfLines={1} style={[styles.subtitle, isComingSoon && styles.subtitleSoon]}>
            {thread.subtitle}
          </Text>
          {thread.unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{thread.unreadCount}</Text>
            </View>
          ) : isComingSoon ? (
            <View style={styles.soonPill}>
              <Text style={styles.soonPillText}>prévia</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  rowPinned: { borderColor: palette.cerrado500, backgroundColor: '#F7FCF4' },
  rowSoon: {
    backgroundColor: palette.white,
    borderStyle: 'dashed',
    borderColor: palette.ink400,
    borderWidth: 1.5,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.cerrado700,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.white,
  },
  body: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 15, fontWeight: '800', color: palette.ink900, flexShrink: 1 },
  when: { fontSize: 11, color: palette.ink400, fontWeight: '600' },
  subRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  subtitle: { fontSize: 13, color: palette.ink600, flex: 1 },
  subtitleSoon: { color: palette.ink600 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: palette.clay500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: palette.white, fontSize: 11, fontWeight: '800' },
  soonPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: palette.sun100,
    borderWidth: 1,
    borderColor: palette.sun500,
  },
  soonPillText: {
    color: palette.clay600,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
