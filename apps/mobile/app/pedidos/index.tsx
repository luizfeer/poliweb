import { Ionicons } from '@expo/vector-icons'
import { router, type Href } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAuth } from '@/lib/auth/AuthProvider'
import {
  brl,
  fetchMyOrders,
  ORDER_STATUS_LABEL,
  type OrderListItem,
  type OrderStatus,
} from '@/lib/orders/feed'
import { palette, radius } from '@/lib/theme/tokens'

const STATUS_TONE: Record<OrderStatus, { bg: string; fg: string }> = {
  pending: { bg: palette.sun100, fg: '#8A6A12' },
  confirmed: { bg: palette.sky100, fg: palette.sky700 },
  preparing: { bg: palette.sky100, fg: palette.sky700 },
  ready: { bg: palette.cerrado100, fg: palette.cerrado700 },
  dispatched: { bg: palette.cerrado100, fg: palette.cerrado700 },
  delivered: { bg: palette.cerrado100, fg: palette.cerrado700 },
  cancelled: { bg: palette.ink100, fg: palette.ink600 },
  rejected: { bg: palette.ink100, fg: palette.ink600 },
}

function typeIcon(type: OrderListItem['orderType']): keyof typeof Ionicons.glyphMap {
  if (type === 'delivery') return 'bicycle'
  if (type === 'pickup') return 'bag-handle'
  return 'restaurant'
}

export default function OrdersScreen() {
  const { session } = useAuth()
  const userId = session?.user?.id ?? null

  const [items, setItems] = useState<OrderListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const seq = useRef(0)

  const load = useCallback(async () => {
    const mine = ++seq.current
    const data = await fetchMyOrders()
    if (mine !== seq.current) return
    setItems(data)
  }, [])

  useEffect(() => {
    seq.current += 1
    setItems([])
    if (!userId) {
      setLoading(false)
      return
    }
    ;(async () => {
      setLoading(true)
      await load()
      setLoading(false)
    })()
  }, [userId, load])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={palette.ink900} />
        </Pressable>
        <Text style={styles.title}>Meus pedidos</Text>
      </View>

      {!userId ? (
        <Empty icon="lock-closed-outline" text="Entre na sua conta para ver seus pedidos." />
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={palette.clay500} />
        </View>
      ) : items.length === 0 ? (
        <Empty icon="receipt-outline" text="Você ainda não fez pedidos pelo app." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.clay500} />}
          renderItem={({ item }) => <OrderRow item={item} />}
        />
      )}
    </SafeAreaView>
  )
}

function OrderRow({ item }: { item: OrderListItem }) {
  const tone = STATUS_TONE[item.status]
  const when = new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  return (
    <Pressable
      onPress={() => router.push(`/pedidos/${item.id}` as Href)}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.75 : 1 }]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={typeIcon(item.orderType)} size={20} color={palette.clay600} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle}>
            {item.businessName ?? 'Pedido'} {item.code ? `· #${item.code}` : ''}
          </Text>
          <Text style={styles.rowTotal}>{brl(item.total)}</Text>
        </View>
        <View style={styles.rowBottom}>
          <View style={[styles.badge, { backgroundColor: tone.bg }]}>
            <Text style={[styles.badgeText, { color: tone.fg }]}>{ORDER_STATUS_LABEL[item.status]}</Text>
          </View>
          <Text style={styles.when}>{when}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={palette.ink400} />
    </Pressable>
  )
}

function Empty({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={40} color={palette.ink400} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.paper },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 10 },
  iconBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '800', color: palette.ink900 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyText: { color: palette.ink600, fontSize: 14, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.ink100,
    padding: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: palette.clay50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  rowTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: palette.ink900 },
  rowTotal: { fontSize: 14, fontWeight: '800', color: palette.clay600 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: '700' },
  when: { fontSize: 11, color: palette.ink400 },
})
