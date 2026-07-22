import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SearchHitResult } from '@/lib/api/search';
import { smartNavigate } from '@/lib/navigation/smart-route';
import { ENTITY_ICONS, ENTITY_LABELS } from '@/lib/search/constants';
import { palette, radius, shadows } from '@/lib/theme/tokens';

const THUMB_WIDTH = 108;
const ACTION_WIDTH = 44;
const ROW_MIN_HEIGHT = 104;

type Props = {
  hit: SearchHitResult;
  onPress?: () => void;
};

export function SearchResultCard({ hit, onPress }: Props) {
  const iconName = (ENTITY_ICONS[hit.entityType] ?? 'search') as keyof typeof Ionicons.glyphMap;
  const typeLabel = ENTITY_LABELS[hit.entityType] ?? 'Resultado';
  const hasContact = hit.entityType === 'business' && (hit.phone || hit.whatsapp);
  const hasCover = Boolean(hit.coverUrl);
  const handleOpen = onPress ?? (() => smartNavigate(hit.url));

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Pressable
          onPress={handleOpen}
          style={({ pressed }) => [styles.mainPress, { opacity: pressed ? 0.94 : 1 }]}
        >
          <View style={styles.mediaCol}>
            {hasCover ? (
              <Image
                source={{ uri: hit.coverUrl! }}
                style={styles.thumbImage}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View style={styles.thumbFallback}>
                <Ionicons name={iconName} size={28} color={palette.clay500} />
              </View>
            )}
          </View>

          <View style={styles.contentCol}>
            <Text style={styles.title} numberOfLines={2}>
              {hit.title}
            </Text>

            {hit.subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {hit.subtitle}
              </Text>
            ) : null}

            <View style={styles.metaRow}>
              <Text style={styles.typeChip}>{typeLabel}</Text>
              {hit.source === 'semantic' ? (
                <Text style={styles.scoreText}>{Math.round(hit.score * 100)}%</Text>
              ) : null}
            </View>

            {hit.description && !hasCover ? (
              <Text style={styles.description} numberOfLines={2}>
                {hit.description}
              </Text>
            ) : null}
          </View>

          {!hasContact ? (
            <View style={styles.chevronCol}>
              <Ionicons name="chevron-forward" size={18} color={palette.ink400} />
            </View>
          ) : null}
        </Pressable>

        {hasContact ? (
          <View style={styles.actionsCol}>
            {hit.whatsapp ? (
              <Pressable
                onPress={() => {
                  const digits = hit.whatsapp!.replace(/\D/g, '');
                  Linking.openURL(`https://wa.me/55${digits}`).catch(() => undefined);
                }}
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.whatsappBtn,
                  { opacity: pressed ? 0.88 : 1 },
                ]}
                accessibilityLabel="WhatsApp"
              >
                <Ionicons name="logo-whatsapp" size={22} color={palette.white} />
              </Pressable>
            ) : null}
            {hit.phone ? (
              <Pressable
                onPress={() => {
                  Linking.openURL(`tel:${hit.phone!.replace(/\D/g, '')}`).catch(() => undefined);
                }}
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.phoneBtn,
                  { opacity: pressed ? 0.88 : 1 },
                ]}
                accessibilityLabel="Ligar"
              >
                <Ionicons name="call" size={20} color={palette.white} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
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
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: ROW_MIN_HEIGHT,
  },
  mainPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    minWidth: 0,
  },
  mediaCol: {
    width: THUMB_WIDTH,
    alignSelf: 'stretch',
    minHeight: ROW_MIN_HEIGHT,
    backgroundColor: palette.paperDeep,
  },
  thumbImage: {
    ...StyleSheet.absoluteFillObject,
  },
  thumbFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.clay50,
  },
  contentCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 6,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.ink900,
    lineHeight: 19,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.ink600,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  typeChip: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.clay600,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.white,
    backgroundColor: palette.clay500,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    overflow: 'hidden',
  },
  description: {
    fontSize: 12,
    color: palette.ink600,
    lineHeight: 16,
    marginTop: 2,
  },
  chevronCol: {
    justifyContent: 'center',
    paddingRight: 10,
    paddingLeft: 2,
  },
  actionsCol: {
    width: ACTION_WIDTH,
    paddingVertical: 8,
    paddingRight: 8,
    paddingLeft: 4,
    justifyContent: 'center',
    gap: 6,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: palette.ink100,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappBtn: { backgroundColor: palette.cerrado500 },
  phoneBtn: { backgroundColor: palette.clay500 },
});
