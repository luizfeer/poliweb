import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { HomeChurchEvent } from '@/lib/api/home';
import { palette, radius } from '@/lib/theme/tokens';

type Props = { events: HomeChurchEvent[] };

export function ChurchScheduleCard({ events }: Props) {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <View style={styles.card}>
        {events.length === 0 ? (
          <Pressable
            onPress={() => router.push('/webview/comunidade-igrejas' as never)}
            style={styles.empty}
          >
            <View style={[styles.iconWrap, { backgroundColor: palette.cerrado100 }]}>
              <Ionicons name="business" size={20} color={palette.cerrado700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Sem horários publicados hoje</Text>
              <Text style={styles.sub}>Toque para ver a programação da semana</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.ink400} />
          </Pressable>
        ) : (
          events.map((event, i) => (
            <Pressable
              key={event.id}
              onPress={() => router.push(`/webview/comunidade-igrejas-${event.churchSlug}` as never)}
              style={({ pressed }) => [
                styles.row,
                {
                  opacity: pressed ? 0.7 : 1,
                  borderBottomWidth: i < events.length - 1 ? StyleSheet.hairlineWidth : 0,
                },
              ]}
            >
              <View style={styles.timeBlock}>
                <Text style={styles.time}>{event.time}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {event.title}
                </Text>
                {event.churchName ? (
                  <Text style={styles.sub} numberOfLines={1}>
                    {event.churchName}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={palette.ink400} />
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.ink100,
    overflow: 'hidden',
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomColor: palette.ink100,
  },
  timeBlock: {
    width: 56,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: palette.cerrado100,
    alignItems: 'center',
  },
  time: { color: palette.cerrado700, fontSize: 13, fontWeight: '900' },
  title: { color: palette.ink900, fontSize: 14, fontWeight: '800' },
  sub: { color: palette.ink600, fontSize: 12, fontWeight: '600', marginTop: 2 },
});
