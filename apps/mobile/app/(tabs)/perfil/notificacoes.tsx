import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  fetchPushState,
  revokePushDevice,
  updatePushPreference,
  type PushCategory,
  type PushDevice,
  type PushState,
} from '@/lib/push/preferences';
import { registerForPush, syncPushTokenWithBackend } from '@/lib/push/notifications';
import { useAuth } from '@/lib/auth/AuthProvider';
import { palette } from '@/lib/theme/tokens';

export default function NotificacoesScreen() {
  const { session } = useAuth();
  const [state, setState] = useState<PushState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registering, setRegistering] = useState(false);

  const load = useCallback(async () => {
    const next = await fetchPushState(session?.access_token ?? null);
    setState(next);
  }, [session?.access_token]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  async function togglePush(cat: PushCategory, value: boolean) {
    setState((prev) =>
      prev
        ? {
            ...prev,
            categories: prev.categories.map((c) =>
              c.type === cat.type ? { ...c, pushEnabled: value } : c,
            ),
          }
        : prev,
    );
    const ok = await updatePushPreference(
      { type: cat.type, pushEnabled: value },
      session?.access_token ?? null,
    );
    if (!ok) await load();
  }

  async function toggleEmail(cat: PushCategory, value: boolean) {
    setState((prev) =>
      prev
        ? {
            ...prev,
            categories: prev.categories.map((c) =>
              c.type === cat.type ? { ...c, emailEnabled: value } : c,
            ),
          }
        : prev,
    );
    const ok = await updatePushPreference(
      { type: cat.type, emailEnabled: value },
      session?.access_token ?? null,
    );
    if (!ok) await load();
  }

  async function revoke(device: PushDevice) {
    Alert.alert(
      'Remover dispositivo',
      `Deixar de receber notificações neste ${labelForPlatform(device.platform)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const ok = await revokePushDevice(device.id, session?.access_token ?? null);
            if (ok) await load();
          },
        },
      ],
    );
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleRegisterThisDevice() {
    setRegistering(true);
    try {
      const reg = await registerForPush();
      if (!reg.ok) {
        Alert.alert(
          'Não foi possível ativar',
          reasonMessage(reg.reason) + ('message' in reg && reg.message ? `\n\n${reg.message}` : ''),
        );
        return;
      }
      const sync = await syncPushTokenWithBackend(reg.token, session?.access_token ?? null);
      if (!sync.ok) {
        Alert.alert(
          'Falha ao registrar no servidor',
          `${sync.reason}${sync.status ? ` (HTTP ${sync.status})` : ''}\n\nToken obtido: ${reg.token.slice(0, 32)}…`,
        );
        return;
      }
      Alert.alert('Pronto!', 'Notificações ativadas neste dispositivo.');
      await load();
    } finally {
      setRegistering(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={palette.ink900} />
        </Pressable>
        <Text style={styles.title}>Notificações</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Pressable
            onPress={handleRegisterThisDevice}
            disabled={registering}
            style={[styles.primaryBtn, registering && { opacity: 0.6 }]}
          >
            {registering ? (
              <ActivityIndicator color={palette.white} />
            ) : (
              <>
                <Ionicons name="notifications" size={18} color={palette.white} />
                <Text style={styles.primaryBtnText}>
                  {state?.devices.length ? 'Reativar neste dispositivo' : 'Ativar neste dispositivo'}
                </Text>
              </>
            )}
          </Pressable>

          <Text style={styles.sectionTitle}>Dispositivos</Text>
          <Text style={styles.hint}>
            Dispositivos onde você ativou as notificações deste app.
          </Text>
          <View style={styles.card}>
            {state?.devices.length ? (
              state.devices.map((d, idx) => (
                <View
                  key={d.id}
                  style={[styles.deviceRow, idx > 0 && styles.divider]}
                >
                  <Ionicons
                    name={iconForPlatform(d.platform)}
                    size={22}
                    color={palette.ink600}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deviceName}>
                      {d.device_name ?? labelForPlatform(d.platform)}
                    </Text>
                    <Text style={styles.deviceMeta}>
                      Visto {formatDate(d.last_seen_at)}
                      {d.app_version ? ` · v${d.app_version}` : ''}
                    </Text>
                  </View>
                  <Pressable onPress={() => revoke(d)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color={palette.clay600} />
                  </Pressable>
                </View>
              ))
            ) : (
              <Text style={styles.empty}>Nenhum dispositivo registrado.</Text>
            )}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Preferências</Text>
          <Text style={styles.hint}>
            Escolha o que receber por push (no celular) e por e-mail.
          </Text>
          <View style={styles.card}>
            {state?.categories.map((cat, idx) => (
              <View key={cat.type} style={[styles.catRow, idx > 0 && styles.divider]}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.catLabel}>{cat.label}</Text>
                  <Text style={styles.catDesc}>{cat.description}</Text>
                </View>
                <View style={styles.togglesCol}>
                  <View style={styles.toggleItem}>
                    <Text style={styles.toggleLbl}>Push</Text>
                    <Switch
                      value={cat.pushEnabled}
                      onValueChange={(v) => togglePush(cat, v)}
                    />
                  </View>
                  <View style={styles.toggleItem}>
                    <Text style={styles.toggleLbl}>E-mail</Text>
                    <Switch
                      value={cat.emailEnabled}
                      onValueChange={(v) => toggleEmail(cat, v)}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function reasonMessage(reason: string): string {
  switch (reason) {
    case 'permission_denied':
      return 'Permissão negada. Abra as Configurações do sistema e ative notificações para este app.';
    case 'not_a_device':
      return 'Notificações push só funcionam em dispositivo físico (simulador/emulador não recebe).';
    case 'no_project_id':
      return 'Build do app sem projectId do Expo configurado. Faça um eas build novo.';
    default:
      return 'Não foi possível obter o token de push.';
  }
}

function iconForPlatform(p: string): keyof typeof Ionicons.glyphMap {
  if (p === 'ios') return 'logo-apple';
  if (p === 'android') return 'logo-android';
  return 'globe-outline';
}

function labelForPlatform(p: string) {
  if (p === 'ios') return 'iPhone / iPad';
  if (p === 'android') return 'Android';
  return 'Navegador';
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: '800', color: palette.ink900 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: palette.ink600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
  },
  hint: { fontSize: 12, color: palette.ink600, marginTop: 4, marginBottom: 10 },
  card: {
    backgroundColor: palette.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  deviceName: { fontSize: 14, fontWeight: '700', color: palette.ink900 },
  deviceMeta: { fontSize: 12, color: palette.ink600, marginTop: 2 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.ink100 },
  empty: { padding: 16, color: palette.ink600, fontSize: 13, textAlign: 'center' },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  catLabel: { fontSize: 14, fontWeight: '700', color: palette.ink900 },
  catDesc: { fontSize: 12, color: palette.ink600, marginTop: 2 },
  togglesCol: { gap: 6, alignItems: 'flex-end' },
  toggleItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleLbl: { fontSize: 11, color: palette.ink600, width: 36 },
  primaryBtn: {
    backgroundColor: palette.cerrado700,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  primaryBtnText: { color: palette.white, fontSize: 15, fontWeight: '800' },
});
