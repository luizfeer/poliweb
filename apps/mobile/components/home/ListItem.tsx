import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { smartNavigate } from '@/lib/navigation/smart-route';
import { palette } from '@/lib/theme/tokens';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub?: string;
  href?: string;
  divider?: boolean;
  /** Fundo sólido (atalhos antigos). Preferir `iconColors` no service_list. */
  tone?: 'cerrado' | 'sky' | 'clay' | 'sun' | 'paper';
  /** Fundo suave + ícone colorido — igual ao web `iconBg` / `iconFg`. */
  iconColors?: { bg: string; fg: string };
};

const toneMap: Record<NonNullable<Props['tone']>, { bg: string; fg: string }> = {
  cerrado: { bg: palette.cerrado500, fg: palette.white },
  sky: { bg: palette.sky700, fg: palette.white },
  clay: { bg: palette.clay500, fg: palette.white },
  sun: { bg: palette.sun500, fg: palette.ink900 },
  paper: { bg: palette.paperDeep, fg: palette.ink900 },
};

export function ListItem({
  icon,
  title,
  sub,
  href,
  divider = true,
  tone = 'paper',
  iconColors,
}: Props) {
  const t = iconColors ?? toneMap[tone];
  return (
    <Pressable
      onPress={() => (href ? smartNavigate(href) : undefined)}
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.7 : 1, borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={20} color={t.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {sub ? (
          <Text style={styles.sub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
      {href ? <Ionicons name="chevron-forward" size={18} color={palette.ink400} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: palette.white,
    borderBottomColor: palette.ink100,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '700', color: palette.ink900, letterSpacing: -0.1 },
  sub: { fontSize: 12, color: palette.ink600, marginTop: 2 },
});
