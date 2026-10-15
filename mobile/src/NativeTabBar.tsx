import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { THEME_COLOR } from "./config";
import type { TabId } from "./navigationPolicy";

type IoniconName = keyof typeof Ionicons.glyphMap;

type Tab = {
  id: TabId;
  label: string;
  path: string;
  icon: IoniconName;
  iconActive: IoniconName;
};

export const TABS: readonly Tab[] = [
  { id: "home", label: "Início", path: "/", icon: "home-outline", iconActive: "home" },
  {
    id: "categories",
    label: "Categorias",
    path: "/encontre",
    icon: "grid-outline",
    iconActive: "grid",
  },
  {
    id: "cities",
    label: "Cidades",
    path: "/cidades",
    icon: "business-outline",
    iconActive: "business",
  },
  {
    id: "search",
    label: "Buscar",
    path: "/buscar",
    icon: "search-outline",
    iconActive: "search",
  },
  {
    id: "profile",
    label: "Perfil",
    path: "/perfil",
    icon: "person-outline",
    iconActive: "person",
  },
];

type Props = {
  active: TabId | null;
  onPress: (path: string) => void;
};

export function NativeTabBar({ active, onPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const selected = tab.id === active;
        const color = selected ? THEME_COLOR : "#6b7280";
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tab.label}
            onPress={() => onPress(tab.path)}
            style={styles.item}
          >
            <Ionicons
              name={selected ? tab.iconActive : tab.icon}
              size={23}
              color={color}
            />
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#d6dbe3",
    paddingTop: 6,
  },
  item: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
  },
});
