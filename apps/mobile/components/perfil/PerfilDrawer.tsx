import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  fetchPainelMenu,
  hrefToWebViewRoute,
  type PainelMenuIcon,
  type PainelMenuResponse,
} from '@/lib/perfil/menu';
import { palette, spacing } from '@/lib/theme/tokens';
import { useAuth } from '@/lib/auth/AuthProvider';
import { getUserDisplayProfile } from '@/lib/auth/profile-display';

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.85, 340);

const ICON_MAP: Record<PainelMenuIcon, keyof typeof Ionicons.glyphMap> = {
  dashboard: 'grid-outline',
  bell: 'notifications-outline',
  heart: 'heart-outline',
  user: 'person-outline',
  users: 'people-outline',
  handshake: 'people-circle-outline',
  coins: 'cash-outline',
  ticket: 'ticket-outline',
  store: 'storefront-outline',
  landmark: 'business-outline',
  'shield-check': 'shield-checkmark-outline',
  'shield-alert': 'warning-outline',
  building: 'business-outline',
  clipboard: 'clipboard-outline',
  map: 'map-outline',
  gift: 'gift-outline',
  chart: 'bar-chart-outline',
  blocks: 'apps-outline',
  network: 'git-network-outline',
  flag: 'flag-outline',
  logout: 'log-out-outline',
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function PerfilDrawer({ open, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [menu, setMenu] = useState<PainelMenuResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const translate = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const { signOut, session, user } = useAuth();
  const authProfile = getUserDisplayProfile(user);
  const displayName = menu?.profile.name ?? authProfile.name ?? 'Painel';
  const avatarUrl = menu?.profile.avatarUrl ?? authProfile.avatarUrl;
  const initial = (displayName || authProfile.initial || 'P').charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchPainelMenu(session)
      .then((data) => setMenu(data))
      .finally(() => setLoading(false));
  }, [open, session]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translate, {
        toValue: open ? 0 : -DRAWER_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: open ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [open, translate, fade]);

  function handleNavigate(href: string) {
    onClose();
    const route = hrefToWebViewRoute(href);
    setTimeout(() => router.push(route as never), 180);
  }

  async function handleLogout() {
    onClose();
    await signOut();
  }

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[styles.drawer, { transform: [{ translateX: translate }] }]}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
          <View style={[styles.header, { paddingTop: Math.max(insets.top + 12, spacing.lg) }]}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImg}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>
                  {initial}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.city} numberOfLines={1}>
                {menu ? `${menu.city.name}/${menu.city.state}` : ' '}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={palette.ink600} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scroll}>
            {loading && !menu ? <Text style={styles.empty}>Carregando…</Text> : null}
            {!loading && !menu ? (
              <Text style={styles.empty}>
                Não consegui carregar o menu. Verifique sua conexão e tente novamente.
              </Text>
            ) : null}
            {!loading && menu && menu.groups.length === 0 ? (
              <Text style={styles.empty}>Sem itens disponíveis para seu perfil.</Text>
            ) : null}

            {menu?.groups.map((group) => (
              <View key={group.title} style={styles.group}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                {group.items.map((item) => (
                  <Pressable
                    key={item.href}
                    onPress={() => handleNavigate(item.href)}
                    style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                  >
                    <View style={styles.itemIcon}>
                      <Ionicons
                        name={ICON_MAP[item.icon] ?? 'ellipse-outline'}
                        size={18}
                        color={palette.cerrado700}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemLabel}>{item.label}</Text>
                      <Text style={styles.itemEyebrow}>{item.eyebrow}</Text>
                    </View>
                    {item.badge ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            ))}

            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [styles.logout, pressed && styles.itemPressed]}
            >
              <Ionicons name="log-out-outline" size={18} color={palette.clay600} />
              <Text style={styles.logoutText}>Sair</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: palette.white,
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 2, height: 0 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.ink100,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.cerrado700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: palette.white, fontSize: 18, fontWeight: '900' },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.ink100,
  },
  name: { fontSize: 16, fontWeight: '900', color: palette.ink900 },
  city: { fontSize: 12, color: palette.ink600 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  empty: { color: palette.ink600, fontSize: 13, textAlign: 'center', padding: spacing.md },
  group: { marginBottom: spacing.lg },
  groupTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: palette.ink600,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  itemPressed: { backgroundColor: palette.paper },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: palette.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { fontSize: 14, fontWeight: '700', color: palette.ink900 },
  itemEyebrow: { fontSize: 11, color: palette.ink600 },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: palette.clay500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: palette.white, fontSize: 11, fontWeight: '900' },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: palette.ink100,
    marginTop: spacing.sm,
  },
  logoutText: { fontSize: 14, fontWeight: '800', color: palette.clay600 },
});
