import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { THEME_COLOR } from "./config";

const logoSource = require("../assets/splash-icon.png");

type Props = {
  onRetry: () => void;
};

export function OfflineScreen({ onRetry }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Image source={logoSource} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Sem conexão</Text>
      <Text style={styles.body}>
        Não foi possível abrir o Poliweb. Confira sua internet e tente de novo.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonLabel}>Tentar de novo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    zIndex: 15,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: "#475569",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: THEME_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
