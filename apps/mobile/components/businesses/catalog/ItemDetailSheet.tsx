import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
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

import type { CartItem, CartItemOption, CatalogItem, OptionGroup } from '@/lib/businesses/catalog-types';
import { palette, radius, shadows } from '@/lib/theme/tokens';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

type Props = {
  item: CatalogItem | null;
  onClose: () => void;
  onAdd: (cartItem: CartItem) => void;
};

function OptionGroupRow({
  group,
  selected,
  onChange,
}: {
  group: OptionGroup;
  selected: Record<string, string[]>;
  onChange: (groupId: string, valueIds: string[]) => void;
}) {
  const isSingle = group.maxChoices === 1;
  const required = group.minChoices > 0;
  const current = selected[group.id] ?? [];

  function toggle(valueId: string) {
    if (isSingle) {
      onChange(group.id, [valueId]);
    } else {
      if (current.includes(valueId)) {
        onChange(group.id, current.filter((id) => id !== valueId));
      } else if (current.length < group.maxChoices) {
        onChange(group.id, [...current, valueId]);
      }
    }
  }

  return (
    <View style={styles.optionGroup}>
      <View style={styles.optionGroupHeader}>
        <Text style={styles.optionGroupName}>{group.name}</Text>
        <View style={[styles.optionBadge, required ? styles.optionBadgeRequired : styles.optionBadgeOptional]}>
          <Text style={[styles.optionBadgeText, required ? styles.optionBadgeTextRequired : styles.optionBadgeTextOptional]}>
            {required ? 'Obrigatório' : 'Opcional'}
          </Text>
        </View>
      </View>
      {group.description ? (
        <Text style={styles.optionGroupDesc}>{group.description}</Text>
      ) : null}
      {group.values.filter((v) => v.available).map((v, idx, arr) => {
        const isChecked = current.includes(v.id);
        return (
          <Pressable
            key={v.id}
            style={[styles.optionRow, idx < arr.length - 1 && styles.optionRowBorder]}
            onPress={() => toggle(v.id)}
          >
            <Text style={styles.optionValueName}>{v.name}</Text>
            <View style={styles.optionRight}>
              {v.priceAdd > 0 ? (
                <Text style={styles.optionPriceAdd}>+{brl.format(v.priceAdd)}</Text>
              ) : null}
              {isSingle ? (
                <View style={[styles.radio, isChecked && styles.radioChecked]}>
                  {isChecked ? <View style={styles.radioDot} /> : null}
                </View>
              ) : (
                <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                  {isChecked ? (
                    <Ionicons name="checkmark" size={12} color={palette.white} />
                  ) : null}
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ItemDetailSheet({ item, onClose, onAdd }: Props) {
  const insets = useSafeAreaInsets();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!item) return;
    const defaults: Record<string, string[]> = {};
    item.optionGroups.forEach((g) => {
      if (g.minChoices > 0 && g.values.length > 0) {
        const first = g.values.find((v) => v.available);
        if (first) defaults[g.id] = [first.id];
      }
    });
    setSelected(defaults);
    setQty(1);
    setNotes('');
  }, [item]);

  if (!item) return null;

  const unitPrice = item.promotionalPrice ?? item.price;
  const optionsExtra = Object.entries(selected).reduce((acc, [groupId, valueIds]) => {
    const group = item.optionGroups.find((g) => g.id === groupId);
    if (!group) return acc;
    return acc + valueIds.reduce((s, vid) => {
      const v = group.values.find((v) => v.id === vid);
      return s + (v?.priceAdd ?? 0);
    }, 0);
  }, 0);
  const lineTotal = (unitPrice + optionsExtra) * qty;

  const allRequired = item.optionGroups
    .filter((g) => g.minChoices > 0)
    .every((g) => (selected[g.id]?.length ?? 0) >= g.minChoices);

  function handleAdd() {
    if (!allRequired || !item) return;
    const options: CartItemOption[] = [];
    item.optionGroups.forEach((g) => {
      (selected[g.id] ?? []).forEach((vid) => {
        const v = g.values.find((v) => v.id === vid);
        if (v) {
          options.push({
            groupId: g.id,
            groupName: g.name,
            valueId: v.id,
            valueName: v.name,
            priceAdd: v.priceAdd,
          });
        }
      });
    });
    const effectiveUnitPrice = item.promotionalPrice ?? item.price;
    const extra = Object.entries(selected).reduce((acc, [groupId, valueIds]) => {
      const group = item.optionGroups.find((g) => g.id === groupId);
      if (!group) return acc;
      return acc + valueIds.reduce((s, vid) => {
        const v = group.values.find((vv) => vv.id === vid);
        return s + (v?.priceAdd ?? 0);
      }, 0);
    }, 0);
    const cartItem: CartItem = {
      cartItemId: `${item.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      catalogItemId: item.id,
      name: item.name,
      unitPrice: effectiveUnitPrice,
      qty,
      options,
      subtotal: (effectiveUnitPrice + extra) * qty,
      notes: notes.trim() || undefined,
      photoUrl: item.photoUrl,
    };
    onAdd(cartItem);
    onClose();
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.handle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          style={{ maxHeight: '80%' }}
        >
          {/* Photo */}
          {item.photoUrl ? (
            <Image source={{ uri: item.photoUrl }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]} />
          )}

          {/* Header */}
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.itemDesc}>{item.description}</Text>
            ) : null}
            <View style={styles.itemMeta}>
              {item.serves ? <Text style={styles.itemMetaText}>{item.serves}</Text> : null}
              {item.prepTimeMin ? <Text style={styles.itemMetaText}>~{item.prepTimeMin} min</Text> : null}
            </View>
            <View style={styles.priceRow}>
              {item.promotionalPrice !== undefined ? (
                <Text style={styles.priceStrike}>{brl.format(item.price)}</Text>
              ) : null}
              <Text style={styles.price}>{brl.format(unitPrice)}</Text>
            </View>
          </View>

          {/* Option groups */}
          {item.optionGroups.map((group) => (
            <OptionGroupRow
              key={group.id}
              group={group}
              selected={selected}
              onChange={(groupId, valueIds) =>
                setSelected((prev) => ({ ...prev, [groupId]: valueIds }))
              }
            />
          ))}

          {/* Notes */}
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Alguma observação?</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Ex.: sem cebola, ponto da carne…"
              placeholderTextColor={palette.ink400}
              multiline
              numberOfLines={2}
              maxLength={200}
            />
          </View>
        </ScrollView>

        {/* Footer: qty + add */}
        <View style={styles.footer}>
          <View style={styles.qtyControl}>
            <Pressable
              style={[styles.qtyBtn, qty <= 1 && styles.qtyBtnDisabled]}
              onPress={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              hitSlop={6}
            >
              <Ionicons name="remove" size={16} color={qty > 1 ? palette.ink900 : palette.ink400} />
            </Pressable>
            <Text style={styles.qtyText}>{qty}</Text>
            <Pressable style={styles.qtyBtn} onPress={() => setQty((q) => q + 1)} hitSlop={6}>
              <Ionicons name="add" size={16} color={palette.ink900} />
            </Pressable>
          </View>

          <Pressable
            style={[styles.addBtn, !allRequired && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={!allRequired}
          >
            <Text style={styles.addBtnLabel}>Adicionar</Text>
            <Text style={styles.addBtnPrice}>{brl.format(lineTotal)}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: palette.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...shadows.pop,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.ink100,
    marginTop: 10,
    marginBottom: 4,
  },
  photo: { width: '100%', height: 180, backgroundColor: palette.paperDeep },
  photoPlaceholder: { backgroundColor: palette.paperDeep },

  itemHeader: { padding: 16 },
  itemName: { fontSize: 20, fontWeight: '900', color: palette.ink900 },
  itemDesc: { fontSize: 14, lineHeight: 20, color: palette.ink600, marginTop: 6 },
  itemMeta: { flexDirection: 'row', gap: 12, marginTop: 8 },
  itemMetaText: { fontSize: 12, color: palette.ink600 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 },
  priceStrike: { fontSize: 13, color: palette.ink400, textDecorationLine: 'line-through' },
  price: { fontSize: 18, fontWeight: '900', color: palette.ink900 },

  optionGroup: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.ink100,
  },
  optionGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: palette.paperDeep,
  },
  optionGroupName: { fontSize: 14, fontWeight: '800', color: palette.ink900 },
  optionGroupDesc: { fontSize: 12, color: palette.ink600, paddingHorizontal: 16, marginBottom: 4 },
  optionBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  optionBadgeRequired: { backgroundColor: '#FEE9E1' },
  optionBadgeOptional: { backgroundColor: palette.ink100 },
  optionBadgeText: { fontSize: 11, fontWeight: '700' },
  optionBadgeTextRequired: { color: '#C44D1A' },
  optionBadgeTextOptional: { color: palette.ink600 },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: palette.white,
  },
  optionRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.ink100,
  },
  optionValueName: { flex: 1, fontSize: 14, color: palette.ink900 },
  optionRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionPriceAdd: { fontSize: 13, color: palette.ink600 },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.ink400,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioChecked: { borderColor: palette.clay500, backgroundColor: palette.clay500 },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.white },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: palette.ink400,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { borderColor: palette.clay500, backgroundColor: palette.clay500 },

  notesSection: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.ink100,
  },
  notesLabel: { fontSize: 13, fontWeight: '700', color: palette.ink700, marginBottom: 8 },
  notesInput: {
    borderWidth: 1,
    borderColor: palette.ink100,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: palette.ink900,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.ink100,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.paperDeep,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: { opacity: 0.35 },
  qtyText: { fontSize: 15, fontWeight: '900', color: palette.ink900, minWidth: 18, textAlign: 'center' },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.clay500,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  addBtnDisabled: { backgroundColor: palette.ink400 },
  addBtnLabel: { fontSize: 14, fontWeight: '900', color: palette.white },
  addBtnPrice: { fontSize: 14, fontWeight: '900', color: palette.white },
});
