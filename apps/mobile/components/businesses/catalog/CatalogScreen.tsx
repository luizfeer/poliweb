import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getBusinessDetail } from '@/lib/api/business-detail';
import { getBusinessMenu, getDeliverySettings } from '@/lib/api/business-menu';
import type { CartItem, CatalogItem, DeliverySettings } from '@/lib/businesses/catalog-types';
import type { Catalog } from '@/lib/businesses/catalog-types';
import type { Business } from '@/lib/businesses/types';
import { whatsappDigits } from '@/lib/businesses/labels';
import { palette, radius, shadows } from '@/lib/theme/tokens';
import { CheckoutSheet } from './CheckoutSheet';
import { ItemDetailSheet } from './ItemDetailSheet';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

type Props = { slug: string };

export function CatalogScreen({ slug }: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const anchorsRef = useRef<Record<string, number>>({});

  const [business, setBusiness] = useState<Business | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [delivery, setDelivery] = useState<DeliverySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const detail = await getBusinessDetail(slug);
      if (cancelled) return;
      setBusiness(detail?.business ?? null);
      if (detail?.business) {
        const [menu, del] = await Promise.all([
          getBusinessMenu(detail.business.id),
          getDeliverySettings(detail.business.id),
        ]);
        if (!cancelled) {
          setCatalog(menu);
          setDelivery(del);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const totals = useMemo(() => {
    const count = items.reduce((s, l) => s + l.qty, 0);
    const amount = items.reduce((s, l) => s + l.subtotal, 0);
    return { count, amount };
  }, [items]);

  function addCartItem(cartItem: CartItem) {
    setItems((prev) => {
      // Para itens sem opções, agrupa pelo catalogItemId
      if (cartItem.options.length === 0) {
        const existing = prev.find(
          (l) => l.catalogItemId === cartItem.catalogItemId && l.options.length === 0,
        );
        if (existing) {
          return prev.map((l) =>
            l.cartItemId === existing.cartItemId
              ? { ...l, qty: l.qty + cartItem.qty, subtotal: (l.qty + cartItem.qty) * l.unitPrice }
              : l,
          );
        }
      }
      return [...prev, cartItem];
    });
  }

  function changeQty(cartItemId: string, delta: number) {
    setItems((prev) =>
      prev
        .map((l) =>
          l.cartItemId === cartItemId
            ? { ...l, qty: l.qty + delta, subtotal: (l.qty + delta) * l.unitPrice }
            : l,
        )
        .filter((l) => l.qty > 0),
    );
  }

  function handleItemPress(item: CatalogItem) {
    if (!item.available) return;
    if (item.optionGroups.length > 0) {
      setSelectedItem(item);
    } else {
      // Sem opções: adiciona direto com qty 1
      const unitPrice = item.promotionalPrice ?? item.price;
      addCartItem({
        cartItemId: `${item.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        catalogItemId: item.id,
        name: item.name,
        unitPrice,
        qty: 1,
        options: [],
        subtotal: unitPrice,
        photoUrl: item.photoUrl,
      });
    }
  }

  const captureAnchor = (sectionId: string) => (event: LayoutChangeEvent) => {
    anchorsRef.current[sectionId] = event.nativeEvent.layout.y;
  };

  const jumpTo = (sectionId: string) => {
    const y = anchorsRef.current[sectionId];
    if (typeof y === 'number') scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={palette.clay500} />
      </View>
    );
  }

  if (!business || !business.orderingEnabled || !catalog || catalog.sections.length === 0) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="restaurant-outline" size={40} color={palette.ink400} />
        <Text style={styles.emptyTitle}>Cardápio em breve</Text>
        <Text style={styles.emptyBody}>Este negócio ainda não publicou o cardápio.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const effectiveDelivery: DeliverySettings = delivery ?? {
    deliveryEnabled: false,
    pickupEnabled: true,
    tableServiceEnabled: false,
    acceptsCardOnDelivery: false,
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()} hitSlop={8} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={24} color={palette.ink900} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>Cardápio</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{business.name}</Text>
        </View>
      </View>

      {/* Delivery banner */}
      {(effectiveDelivery.deliveryEnabled || effectiveDelivery.pickupEnabled) && (
        <View style={styles.deliveryBanner}>
          {effectiveDelivery.deliveryEnabled && (
            <View style={styles.deliveryChip}>
              <Ionicons name="bicycle-outline" size={13} color={palette.clay600} />
              <Text style={styles.deliveryChipText}>
                Delivery
                {effectiveDelivery.deliveryTimeMin ? ` ~${effectiveDelivery.deliveryTimeMin}min` : ''}
                {effectiveDelivery.deliveryFee ? ` · ${brl.format(effectiveDelivery.deliveryFee)}` : ''}
              </Text>
            </View>
          )}
          {effectiveDelivery.pickupEnabled && (
            <View style={styles.deliveryChip}>
              <Ionicons name="bag-handle-outline" size={13} color={palette.cerrado700} />
              <Text style={[styles.deliveryChipText, { color: palette.cerrado700 }]}>
                Retirada
                {effectiveDelivery.pickupTimeMin ? ` ~${effectiveDelivery.pickupTimeMin}min` : ''}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Section nav */}
      <View style={styles.navBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navRow}>
          {catalog.sections.map((section) => (
            <Pressable key={section.id} onPress={() => jumpTo(section.id)} style={styles.navChip}>
              <Text style={styles.navChipText}>{section.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: totals.count > 0 ? 96 : insets.bottom + 24 }}
      >
        {catalog.sections.map((section) => (
          <View key={section.id} onLayout={captureAnchor(section.id)} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.name}</Text>
            {section.description ? <Text style={styles.sectionDesc}>{section.description}</Text> : null}
            <View style={{ marginTop: 10, gap: 10 }}>
              {section.items.map((item) => (
                <ItemRow key={item.id} item={item} onPress={() => handleItemPress(item)} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Cart bar */}
      {totals.count > 0 ? (
        <Pressable
          style={[styles.cartBar, { paddingBottom: insets.bottom + 12 }]}
          onPress={() => setCartOpen(true)}
        >
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{totals.count}</Text>
          </View>
          <Text style={styles.cartBarText}>Ver carrinho</Text>
          <Text style={styles.cartBarTotal}>{brl.format(totals.amount)}</Text>
        </Pressable>
      ) : null}

      {/* Item detail sheet */}
      <ItemDetailSheet
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onAdd={(cartItem) => { addCartItem(cartItem); setSelectedItem(null); }}
      />

      {/* Cart sheet */}
      <CartSheet
        visible={cartOpen}
        items={items}
        total={totals.amount}
        onClose={() => setCartOpen(false)}
        onChangeQty={changeQty}
        onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
      />

      {/* Checkout sheet */}
      <CheckoutSheet
        visible={checkoutOpen}
        items={items}
        delivery={effectiveDelivery}
        businessName={business.name}
        businessWhatsapp={whatsappDigits(business.whatsapp) ?? ''}
        onClose={() => setCheckoutOpen(false)}
        onSent={() => setItems([])}
      />
    </View>
  );
}

function ItemRow({ item, onPress }: { item: CatalogItem; onPress: () => void }) {
  const hasOptions = item.optionGroups.length > 0;
  const unitPrice = item.promotionalPrice ?? item.price;

  return (
    <Pressable
      style={[styles.itemRow, !item.available && styles.itemUnavailable]}
      onPress={onPress}
      disabled={!item.available}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.itemPriceRow}>
          {item.promotionalPrice !== undefined ? (
            <Text style={styles.itemPriceStrike}>{brl.format(item.price)}</Text>
          ) : null}
          <Text style={styles.itemPrice}>{brl.format(unitPrice)}</Text>
        </View>
        {item.serves ? <Text style={styles.itemServes}>{item.serves}</Text> : null}
      </View>
      <View style={styles.itemRight}>
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.itemImage} contentFit="cover" />
        ) : null}
        <View style={[styles.addBtn, !item.available && styles.addBtnDisabled]}>
          {hasOptions ? (
            <Ionicons name="add" size={18} color={palette.white} />
          ) : (
            <Ionicons name={item.available ? 'add' : 'close'} size={18} color={palette.white} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

function CartSheet({
  visible,
  items,
  total,
  onClose,
  onChangeQty,
  onCheckout,
}: {
  visible: boolean;
  items: CartItem[];
  total: number;
  onClose: () => void;
  onChangeQty: (cartItemId: string, delta: number) => void;
  onCheckout: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Seu carrinho</Text>
        <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 10, paddingVertical: 8 }}>
          {items.map((line) => (
            <View key={line.cartItemId} style={styles.cartLine}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cartLineName} numberOfLines={1}>{line.name}</Text>
                {line.options.length > 0 && (
                  <Text style={styles.cartLineOpts} numberOfLines={1}>
                    {line.options.map((o) => o.valueName).join(', ')}
                  </Text>
                )}
              </View>
              <View style={styles.qtyControl}>
                <Pressable style={styles.qtyBtn} onPress={() => onChangeQty(line.cartItemId, -1)} hitSlop={6}>
                  <Ionicons name="remove" size={14} color={palette.ink900} />
                </Pressable>
                <Text style={styles.qtyText}>{line.qty}</Text>
                <Pressable style={styles.qtyBtn} onPress={() => onChangeQty(line.cartItemId, 1)} hitSlop={6}>
                  <Ionicons name="add" size={14} color={palette.ink900} />
                </Pressable>
              </View>
              <Text style={styles.cartLinePrice}>{brl.format(line.subtotal)}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.cartTotalRow}>
          <Text style={styles.cartTotalLabel}>Total</Text>
          <Text style={styles.cartTotalValue}>{brl.format(total)}</Text>
        </View>
        <Pressable style={styles.checkoutBtn} onPress={onCheckout}>
          <Text style={styles.checkoutBtnText}>Finalizar pedido</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.paper },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: palette.paper, padding: 24 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: palette.ink900 },
  emptyBody: { fontSize: 13, color: palette.ink600, textAlign: 'center' },
  primaryBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 11, borderRadius: radius.pill, backgroundColor: palette.clay500 },
  primaryBtnText: { color: palette.white, fontWeight: '800' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: palette.paper,
  },
  headerBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: palette.ink900 },
  headerSubtitle: { fontSize: 12, fontWeight: '600', color: palette.ink600 },

  deliveryBanner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: palette.paperDeep,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.ink100,
  },
  deliveryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: '#FFF5F1',
    borderWidth: 1,
    borderColor: '#FBD5C5',
  },
  deliveryChipText: { fontSize: 12, fontWeight: '700', color: palette.clay600 },

  navBar: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.ink100 },
  navRow: { gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  navChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.ink100 },
  navChipText: { fontSize: 13, fontWeight: '800', color: palette.ink900 },

  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: palette.ink900 },
  sectionDesc: { fontSize: 13, color: palette.ink600, marginTop: 2 },

  itemRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  itemUnavailable: { opacity: 0.5 },
  itemName: { fontSize: 14, fontWeight: '800', color: palette.ink900 },
  itemDesc: { fontSize: 12, lineHeight: 17, color: palette.ink600 },
  itemPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 },
  itemPriceStrike: { fontSize: 11, color: palette.ink400, textDecorationLine: 'line-through' },
  itemPrice: { fontSize: 14, fontWeight: '900', color: palette.cerrado700 },
  itemServes: { fontSize: 11, color: palette.ink600, marginTop: 1 },
  itemRight: { alignItems: 'flex-end', justifyContent: 'space-between', gap: 6 },
  itemImage: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: palette.paperDeep },
  addBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: palette.clay500, alignItems: 'center', justifyContent: 'center' },
  addBtnDisabled: { backgroundColor: palette.ink400 },

  cartBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: palette.clay500,
  },
  cartBadge: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  cartBadgeText: { color: palette.white, fontSize: 13, fontWeight: '900' },
  cartBarText: { flex: 1, color: palette.white, fontSize: 15, fontWeight: '900' },
  cartBarTotal: { color: palette.white, fontSize: 15, fontWeight: '900' },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: palette.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    ...shadows.pop,
  },
  sheetHandle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: palette.ink100, marginBottom: 12 },
  sheetTitle: { fontSize: 17, fontWeight: '900', color: palette.ink900, marginBottom: 4 },

  cartLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cartLineName: { fontSize: 14, fontWeight: '700', color: palette.ink900 },
  cartLineOpts: { fontSize: 11, color: palette.ink600, marginTop: 1 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: palette.paperDeep, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 14, fontWeight: '900', color: palette.ink900, minWidth: 16, textAlign: 'center' },
  cartLinePrice: { fontSize: 13, fontWeight: '800', color: palette.ink900, minWidth: 68, textAlign: 'right' },

  cartTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 12 },
  cartTotalLabel: { fontSize: 14, fontWeight: '700', color: palette.ink700 },
  cartTotalValue: { fontSize: 18, fontWeight: '900', color: palette.ink900 },
  checkoutBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: palette.cerrado500,
  },
  checkoutBtnText: { color: palette.white, fontSize: 15, fontWeight: '900' },
});
