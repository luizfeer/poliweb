import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import {
  brl,
  fetchOrderDetail,
  ORDER_FLOW,
  ORDER_STATUS_LABEL,
  subscribeOrder,
  type OrderDetail,
  type OrderStatus,
} from '@/lib/orders/feed'
import { palette, radius } from '@/lib/theme/tokens'

const TYPE_LABEL: Record<OrderDetail['orderType'], string> = {
  delivery: 'Entrega',
  pickup: 'Retirada no local',
  table: 'Mesa',
}

const PAYMENT_LABEL: Record<string, string> = {
  pix: 'PIX',
  cash: 'Dinheiro',
  card_on_delivery: 'Cartão na entrega',
  whatsapp: 'Combinar pelo WhatsApp',
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!id) return
    const data = await fetchOrderDetail(id)
    setOrder(data)
  }, [id])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await load()
      setLoading(false)
    })()
  }, [load])

  // Realtime: atualiza o status sem precisar recarregar.
  useEffect(() => {
    if (!id) return
    return subscribeOrder(id, (status) => {
      setOrder((prev) => (prev ? { ...prev, status } : prev))
    })
  }, [id])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={palette.ink900} />
        </Pressable>
        <Text style={styles.title}>{order?.code ? `Pedido #${order.code}` : 'Pedido'}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={palette.clay500} />
        </View>
      ) : !order ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={palette.ink400} />
          <Text style={styles.muted}>Pedido não encontrado.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <View>
            <Text style={styles.business}>{order.businessName ?? 'Pedido'}</Text>
            <Text style={styles.muted}>{TYPE_LABEL[order.orderType]}</Text>
          </View>

          <StatusTracker status={order.status} />

          <Section title="Itens">
            {order.items.map((it) => (
              <View key={it.id} style={styles.itemRow}>
                <Text style={styles.itemQty}>{it.qty}×</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{it.name}</Text>
                  {it.optionsSnapshot.map((opt, idx) => (
                    <Text key={idx} style={styles.itemOpt}>
                      {opt.group}: {opt.value}
                      {opt.price_add > 0 ? ` (+${brl(opt.price_add)})` : ''}
                    </Text>
                  ))}
                  {it.notes ? <Text style={styles.itemOpt}>Obs.: {it.notes}</Text> : null}
                </View>
                <Text style={styles.itemSubtotal}>{brl(it.subtotal)}</Text>
              </View>
            ))}
          </Section>

          <Section title="Pagamento">
            <Line label="Subtotal" value={brl(order.totalItems)} />
            {order.deliveryFee > 0 ? <Line label="Frete" value={brl(order.deliveryFee)} /> : null}
            <Line label="Total" value={brl(order.total)} strong />
            {order.paymentMethod ? (
              <Line label="Forma" value={PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod} />
            ) : null}
          </Section>

          {order.deliveryAddress?.text ? (
            <Section title="Entrega">
              <Text style={styles.muted}>{order.deliveryAddress.text}</Text>
            </Section>
          ) : null}

          {order.merchantNotes && (order.status === 'rejected' || order.status === 'cancelled') ? (
            <Section title="Mensagem do estabelecimento">
              <Text style={styles.muted}>{order.merchantNotes}</Text>
            </Section>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function StatusTracker({ status }: { status: OrderStatus }) {
  if (status === 'rejected' || status === 'cancelled') {
    return (
      <View style={[styles.banner, { backgroundColor: palette.ink100 }]}>
        <Ionicons name="close-circle" size={20} color={palette.ink600} />
        <Text style={[styles.bannerText, { color: palette.ink700 }]}>{ORDER_STATUS_LABEL[status]}</Text>
      </View>
    )
  }

  const currentIndex = ORDER_FLOW.indexOf(status)

  return (
    <View style={styles.tracker}>
      {ORDER_FLOW.map((step, idx) => {
        const done = idx <= currentIndex
        const isCurrent = idx === currentIndex
        return (
          <View key={step} style={styles.step}>
            <View style={styles.stepLeft}>
              <View
                style={[
                  styles.dot,
                  done ? { backgroundColor: palette.clay500, borderColor: palette.clay500 } : null,
                  isCurrent ? styles.dotCurrent : null,
                ]}
              >
                {done ? <Ionicons name="checkmark" size={12} color={palette.white} /> : null}
              </View>
              {idx < ORDER_FLOW.length - 1 ? (
                <View style={[styles.connector, done ? { backgroundColor: palette.clay500 } : null]} />
              ) : null}
            </View>
            <Text style={[styles.stepLabel, isCurrent ? styles.stepLabelCurrent : null]}>
              {ORDER_STATUS_LABEL[step]}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, strong ? styles.lineStrong : null]}>{label}</Text>
      <Text style={[styles.lineValue, strong ? styles.lineStrong : null]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.paper },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 10 },
  iconBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '800', color: palette.ink900 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  muted: { color: palette.ink600, fontSize: 14 },
  business: { fontSize: 20, fontWeight: '800', color: palette.ink900 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: radius.lg },
  bannerText: { fontSize: 15, fontWeight: '700' },
  tracker: { backgroundColor: palette.white, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.ink100, padding: 16 },
  step: { flexDirection: 'row', gap: 12 },
  stepLeft: { alignItems: 'center', width: 22 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: palette.ink100,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCurrent: { transform: [{ scale: 1.1 }] },
  connector: { width: 2, flex: 1, minHeight: 18, backgroundColor: palette.ink100, marginVertical: 2 },
  stepLabel: { fontSize: 14, color: palette.ink400, paddingBottom: 14, paddingTop: 1 },
  stepLabelCurrent: { color: palette.ink900, fontWeight: '700' },
  section: { backgroundColor: palette.white, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.ink100, padding: 14, gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: palette.ink600, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemRow: { flexDirection: 'row', gap: 8 },
  itemQty: { fontSize: 14, fontWeight: '700', color: palette.clay600 },
  itemName: { fontSize: 14, fontWeight: '600', color: palette.ink900 },
  itemOpt: { fontSize: 12, color: palette.ink600, marginTop: 1 },
  itemSubtotal: { fontSize: 14, fontWeight: '700', color: palette.ink900 },
  line: { flexDirection: 'row', justifyContent: 'space-between' },
  lineLabel: { fontSize: 14, color: palette.ink600 },
  lineValue: { fontSize: 14, color: palette.ink900 },
  lineStrong: { fontWeight: '800', color: palette.ink900 },
})
