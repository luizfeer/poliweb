import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type {
  CartItem,
  CheckoutFormData,
  DeliverySettings,
  PaymentChoice,
} from '@/lib/businesses/catalog-types';
import { palette, radius, shadows } from '@/lib/theme/tokens';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function buildWhatsAppMessage(
  businessName: string,
  items: CartItem[],
  form: CheckoutFormData,
  delivery: DeliverySettings,
): string {
  const fee = form.orderType === 'delivery' ? (delivery.deliveryFee ?? 0) : 0;
  const itemsTotal = items.reduce((s, i) => s + i.subtotal, 0);
  const total = itemsTotal + fee;

  const lines: string[] = [
    `*Pedido via Portal Carmelitano — ${businessName}*`,
    '',
  ];

  for (const item of items) {
    lines.push(`${item.qty}× ${item.name}`);
    for (const opt of item.options) {
      lines.push(opt.priceAdd > 0
        ? `   ${opt.groupName}: ${opt.valueName} (+${brl.format(opt.priceAdd)})`
        : `   ${opt.groupName}: ${opt.valueName}`);
    }
    if (item.notes) lines.push(`   Obs.: ${item.notes}`);
    lines.push(`   ${brl.format(item.subtotal)}`);
    lines.push('');
  }

  lines.push('----------------------------');
  lines.push(`Subtotal: ${brl.format(itemsTotal)}`);
  if (fee > 0) lines.push(`Frete: ${brl.format(fee)}`);
  lines.push(`*Total: ${brl.format(total)}*`);
  lines.push('');
  lines.push(`Tipo: ${form.orderType === 'delivery' ? 'Delivery' : 'Retirada no local'}`);
  if (form.orderType === 'delivery' && form.address) {
    lines.push(`Endereço: ${form.address}`);
  }

  const paymentLabel =
    form.paymentChoice === 'pix'
      ? `PIX${delivery.pixKey ? ` (chave: ${delivery.pixKey})` : ''}`
      : form.paymentChoice === 'dinheiro'
        ? 'Dinheiro'
        : 'Cartão na entrega';
  lines.push(`Pagamento: ${paymentLabel}`);
  if (form.paymentChoice === 'dinheiro' && form.changeFor) {
    lines.push(`Troco para: R$ ${form.changeFor}`);
  }

  if (form.notes) lines.push(`\nObs. gerais: ${form.notes}`);
  lines.push('\n_Enviado pelo Portal Carmelitano_');

  return lines.join('\n');
}

function RadioRow({
  checked,
  onPress,
  label,
  description,
  icon,
}: {
  checked: boolean;
  onPress: () => void;
  label: string;
  description?: string;
  icon: React.ReactNode;
}) {
  return (
    <Pressable style={[styles.radioRow, checked && styles.radioRowChecked]} onPress={onPress}>
      <View style={[styles.radioCircle, checked && styles.radioCircleChecked]}>
        {checked ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.radioIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.radioLabel}>{label}</Text>
        {description ? <Text style={styles.radioDesc}>{description}</Text> : null}
      </View>
    </Pressable>
  );
}

type Props = {
  visible: boolean;
  items: CartItem[];
  delivery: DeliverySettings;
  businessName: string;
  businessWhatsapp: string;
  onClose: () => void;
  onSent: () => void;
};

export function CheckoutSheet({ visible, items, delivery, businessName, businessWhatsapp, onClose, onSent }: Props) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<CheckoutFormData>({
    orderType: delivery.deliveryEnabled ? 'delivery' : 'pickup',
    address: '',
    paymentChoice: 'pix',
    changeFor: '',
    notes: '',
  });
  const [sent, setSent] = useState(false);

  function setField<K extends keyof CheckoutFormData>(key: K, value: CheckoutFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const fee = form.orderType === 'delivery' ? (delivery.deliveryFee ?? 0) : 0;
  const itemsTotal = items.reduce((s, i) => s + i.subtotal, 0);
  const total = itemsTotal + fee;

  const canSend =
    items.length > 0 &&
    (form.orderType === 'pickup' || (form.orderType === 'delivery' && form.address.trim().length > 5)) &&
    Boolean(businessWhatsapp);

  function handleSend() {
    if (!canSend) return;
    const phone = businessWhatsapp.replace(/\D/g, '');
    const message = buildWhatsAppMessage(businessName, items, form, delivery);
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onSent();
      onClose();
    }, 1200);
  }

  function handleClose() {
    setSent(false);
    onClose();
  }

  const hasDelivery = delivery.deliveryEnabled;
  const hasPickup = delivery.pickupEnabled;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.root}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.backBtn} onPress={handleClose} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={palette.ink900} />
          </Pressable>
          <Text style={styles.headerTitle}>Finalizar pedido</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Order type */}
          {(hasDelivery || hasPickup) && (hasDelivery && hasPickup) && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TIPO DE PEDIDO</Text>
              {hasDelivery && (
                <RadioRow
                  checked={form.orderType === 'delivery'}
                  onPress={() => setField('orderType', 'delivery')}
                  label="Delivery"
                  description={delivery.deliveryTimeMin
                    ? `~${delivery.deliveryTimeMin} min · ${fee > 0 ? brl.format(fee) + ' de frete' : 'frete grátis'}`
                    : undefined}
                  icon={<Ionicons name="bicycle-outline" size={18} color={palette.clay600} />}
                />
              )}
              {hasPickup && (
                <RadioRow
                  checked={form.orderType === 'pickup'}
                  onPress={() => setField('orderType', 'pickup')}
                  label="Retirada no local"
                  description={delivery.pickupTimeMin ? `~${delivery.pickupTimeMin} min · sem frete` : undefined}
                  icon={<Ionicons name="bag-handle-outline" size={18} color={palette.clay600} />}
                />
              )}
            </View>
          )}

          {/* Address */}
          {form.orderType === 'delivery' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ENDEREÇO DE ENTREGA</Text>
              <TextInput
                style={styles.textArea}
                value={form.address}
                onChangeText={(v) => setField('address', v)}
                placeholder="Rua, número, bairro, ponto de referência"
                placeholderTextColor={palette.ink400}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              {form.address.trim().length > 0 && form.address.trim().length <= 5 && (
                <Text style={styles.fieldError}>Informe o endereço completo.</Text>
              )}
            </View>
          )}

          {/* Payment */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>FORMA DE PAGAMENTO</Text>
            <RadioRow
              checked={form.paymentChoice === 'pix'}
              onPress={() => setField('paymentChoice', 'pix' as PaymentChoice)}
              label="PIX"
              description={delivery.pixKey ? `Chave: ${delivery.pixKey}` : undefined}
              icon={<Ionicons name="qr-code-outline" size={18} color={palette.clay600} />}
            />
            <RadioRow
              checked={form.paymentChoice === 'dinheiro'}
              onPress={() => setField('paymentChoice', 'dinheiro' as PaymentChoice)}
              label="Dinheiro"
              description="Pagamento na entrega"
              icon={<Ionicons name="cash-outline" size={18} color={palette.clay600} />}
            />
            {delivery.acceptsCardOnDelivery && (
              <RadioRow
                checked={form.paymentChoice === 'cartao_entrega'}
                onPress={() => setField('paymentChoice', 'cartao_entrega' as PaymentChoice)}
                label="Cartão na entrega"
                description="Débito ou crédito"
                icon={<Ionicons name="card-outline" size={18} color={palette.clay600} />}
              />
            )}
          </View>

          {/* Change */}
          {form.paymentChoice === 'dinheiro' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TROCO PARA QUANTO? (opcional)</Text>
              <TextInput
                style={styles.input}
                value={form.changeFor}
                onChangeText={(v) => setField('changeFor', v)}
                placeholder={`Ex.: ${Math.ceil(total / 10) * 10},00`}
                placeholderTextColor={palette.ink400}
                keyboardType="numeric"
              />
            </View>
          )}

          {/* General notes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>OBSERVAÇÕES GERAIS</Text>
            <TextInput
              style={styles.textArea}
              value={form.notes}
              onChangeText={(v) => setField('notes', v)}
              placeholder="Sem glúten, alergia, portão azul…"
              placeholderTextColor={palette.ink400}
              multiline
              numberOfLines={2}
              maxLength={300}
              textAlignVertical="top"
            />
          </View>

          {/* Summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Resumo</Text>
            {items.map((item) => (
              <View key={item.cartItemId} style={styles.summaryRow}>
                <Text style={styles.summaryItemName} numberOfLines={1}>
                  {item.qty}× {item.name}
                </Text>
                <Text style={styles.summaryItemPrice}>{brl.format(item.subtotal)}</Text>
              </View>
            ))}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summarySubLabel}>Subtotal</Text>
              <Text style={styles.summarySubValue}>{brl.format(itemsTotal)}</Text>
            </View>
            {fee > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summarySubLabel}>Frete</Text>
                <Text style={styles.summarySubValue}>{brl.format(fee)}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, { marginTop: 4 }]}>
              <Text style={styles.summaryTotal}>Total</Text>
              <Text style={styles.summaryTotalValue}>{brl.format(total)}</Text>
            </View>
          </View>

          {delivery.orderInstructions ? (
            <Text style={styles.instructions}>{delivery.orderInstructions}</Text>
          ) : null}
        </ScrollView>

        {/* CTA */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          {!businessWhatsapp && (
            <Text style={styles.noWhatsapp}>
              Este negócio não cadastrou WhatsApp para pedidos.
            </Text>
          )}
          <Pressable
            style={[styles.sendBtn, (!canSend || sent) && styles.sendBtnDisabled]}
            onPress={sent ? undefined : handleSend}
            disabled={!canSend}
          >
            <Ionicons
              name={sent ? 'checkmark-circle' : 'logo-whatsapp'}
              size={20}
              color={palette.white}
            />
            <Text style={styles.sendBtnText}>
              {sent ? 'Pedido enviado!' : 'Enviar pelo WhatsApp'}
            </Text>
            {!sent && <Text style={styles.sendBtnTotal}>{brl.format(total)}</Text>}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.paper },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: palette.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.ink100,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: palette.paperDeep,
  },
  headerTitle: { fontSize: 17, fontWeight: '900', color: palette.ink900 },

  section: { paddingHorizontal: 16, paddingTop: 20, gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.ink600,
    letterSpacing: 0.6,
    marginBottom: 4,
  },

  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: palette.ink100,
    backgroundColor: palette.white,
  },
  radioRowChecked: { borderColor: palette.clay500, backgroundColor: '#FFF5F1' },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.ink400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleChecked: { borderColor: palette.clay500, backgroundColor: palette.clay500 },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.white },
  radioIcon: { width: 24, alignItems: 'center' },
  radioLabel: { fontSize: 14, fontWeight: '700', color: palette.ink900 },
  radioDesc: { fontSize: 12, color: palette.ink600, marginTop: 1 },

  textArea: {
    borderWidth: 1,
    borderColor: palette.ink100,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: palette.ink900,
    minHeight: 72,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.ink100,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: palette.ink900,
  },
  fieldError: { fontSize: 12, color: '#C0392B', marginTop: 4 },

  summary: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.ink100,
    backgroundColor: palette.white,
    overflow: 'hidden',
    padding: 14,
    gap: 8,
  },
  summaryTitle: { fontSize: 13, fontWeight: '900', color: palette.ink900, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryItemName: { flex: 1, fontSize: 13, color: palette.ink700 },
  summaryItemPrice: { fontSize: 13, fontWeight: '700', color: palette.ink900 },
  summaryDivider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.ink100, marginVertical: 4 },
  summarySubLabel: { fontSize: 13, color: palette.ink600 },
  summarySubValue: { fontSize: 13, color: palette.ink900 },
  summaryTotal: { fontSize: 15, fontWeight: '900', color: palette.ink900 },
  summaryTotalValue: { fontSize: 17, fontWeight: '900', color: palette.clay600 },

  instructions: {
    marginHorizontal: 16,
    marginTop: 12,
    fontSize: 12,
    color: palette.ink600,
    lineHeight: 18,
  },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.ink100,
    backgroundColor: palette.white,
    gap: 8,
  },
  noWhatsapp: { fontSize: 12, color: '#C0392B', textAlign: 'center' },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.cerrado500,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 15,
    gap: 8,
  },
  sendBtnDisabled: { backgroundColor: palette.ink400 },
  sendBtnText: { flex: 1, fontSize: 15, fontWeight: '900', color: palette.white },
  sendBtnTotal: { fontSize: 15, fontWeight: '900', color: palette.white },
});
