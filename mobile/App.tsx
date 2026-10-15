import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { PoliwebShell } from "./src/PoliwebShell";

export default function App() {
  const shell = (
    <SafeAreaProvider>
      <PoliwebShell />
    </SafeAreaProvider>
  );

  if (Platform.OS !== "web") return shell;

  return (
    <View style={styles.preview}>
      <View style={styles.phone}>{shell}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    flex: 1,
    backgroundColor: "#d9e2ec",
    alignItems: "center",
  },
  phone: {
    flex: 1,
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
  },
});
