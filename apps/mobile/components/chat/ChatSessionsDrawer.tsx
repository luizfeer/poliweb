import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ChatSession } from '@/lib/chat/types';
import { palette, radius, shadows } from '@/lib/theme/tokens';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = Math.min(320, SCREEN_WIDTH * 0.86);
const ANIM_MS = 220;

type Props = {
  open: boolean;
  sessions: ChatSession[];
  activeId: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
};

function formatWhen(ts: number): string {
  const diffMs = Date.now() - ts;
  const day = 24 * 60 * 60 * 1000;
  if (diffMs < day) return 'Hoje';
  if (diffMs < 2 * day) return 'Ontem';
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)} dias`;
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function ChatSessionsDrawer({
  open,
  sessions,
  activeId,
  onClose,
  onSelect,
  onNew,
  onDelete,
}: Props) {
  const translateX = useSharedValue(-DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withTiming(open ? 0 : -DRAWER_WIDTH, { duration: ANIM_MS });
    backdropOpacity.value = withTiming(open ? 1 : 0, { duration: ANIM_MS });
  }, [open, translateX, backdropOpacity]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    // Sem hit-testing quando invisível.
    pointerEvents: backdropOpacity.value > 0.05 ? ('auto' as const) : ('none' as const),
  }));

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .onUpdate((e) => {
      const next = Math.min(0, Math.max(-DRAWER_WIDTH, e.translationX));
      translateX.value = next;
      backdropOpacity.value = 1 + next / DRAWER_WIDTH;
    })
    .onEnd((e) => {
      const shouldClose = e.translationX < -DRAWER_WIDTH * 0.3 || e.velocityX < -500;
      if (shouldClose) {
        translateX.value = withTiming(-DRAWER_WIDTH, { duration: ANIM_MS });
        backdropOpacity.value = withTiming(0, { duration: ANIM_MS });
        runOnJS(onClose)();
      } else {
        translateX.value = withTiming(0, { duration: ANIM_MS });
        backdropOpacity.value = withTiming(1, { duration: ANIM_MS });
      }
    });

  const handleDelete = (session: ChatSession) => {
    Alert.alert(
      'Apagar conversa?',
      session.title,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Apagar', style: 'destructive', onPress: () => onDelete(session.id) },
      ],
      { cancelable: true },
    );
  };

  if (!open && translateX.value === -DRAWER_WIDTH) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={[styles.drawer, drawerStyle]}>
          <SafeAreaView style={styles.safe} edges={['top', 'left', 'bottom']}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Conversas</Text>
              <Pressable
                onPress={onNew}
                style={({ pressed }) => [styles.newBtn, { opacity: pressed ? 0.85 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Nova conversa"
              >
                <Ionicons name="add" size={18} color={palette.white} />
                <Text style={styles.newBtnText}>Nova</Text>
              </Pressable>
            </View>

            <FlatList
              data={sessions}
              keyExtractor={(s) => s.id}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <Text style={styles.empty}>Nenhuma conversa salva ainda.</Text>
              }
              renderItem={({ item }) => {
                const isActive = item.id === activeId;
                return (
                  <Pressable
                    onPress={() => onSelect(item.id)}
                    onLongPress={() => handleDelete(item)}
                    style={({ pressed }) => [
                      styles.item,
                      isActive && styles.itemActive,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={1}
                        style={[styles.itemTitle, isActive && styles.itemTitleActive]}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {formatWhen(item.updatedAt)} · {item.messages.length} msg
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleDelete(item)}
                      hitSlop={8}
                      style={styles.trashBtn}
                      accessibilityLabel="Apagar conversa"
                    >
                      <Ionicons name="trash-outline" size={16} color={palette.ink400} />
                    </Pressable>
                  </Pressable>
                );
              }}
            />
          </SafeAreaView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: palette.paper,
    ...shadows.pop,
  },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.ink100,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: palette.ink900 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.cerrado700,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  newBtnText: { color: palette.white, fontWeight: '800', fontSize: 13 },
  list: { padding: 12, gap: 6 },
  empty: { color: palette.ink400, textAlign: 'center', marginTop: 32 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.ink100,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  itemActive: {
    borderColor: palette.cerrado500,
    backgroundColor: '#F4FBF1',
  },
  itemTitle: { fontSize: 14, fontWeight: '700', color: palette.ink900 },
  itemTitleActive: { color: palette.cerrado700 },
  itemMeta: { fontSize: 11, color: palette.ink400, marginTop: 2 },
  trashBtn: { padding: 6 },
});
