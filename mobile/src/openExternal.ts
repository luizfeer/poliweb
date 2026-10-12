import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import type { NavigationDecision } from "./navigationPolicy";
import { THEME_COLOR } from "./config";

let lastUrl = "";
let lastAt = 0;

function normalizeIntent(url: string): string {
  if (!url.toLowerCase().startsWith("intent:")) return url;
  const fallback = url.match(/S\.browser_fallback_url=([^;]+)/);
  if (fallback?.[1]) {
    try {
      return decodeURIComponent(fallback[1]);
    } catch {
      return fallback[1];
    }
  }
  return url;
}

export async function openExternal(
  rawUrl: string,
  kind: Exclude<NavigationDecision, "allow">,
): Promise<void> {
  const url = normalizeIntent(rawUrl.trim());
  const now = Date.now();
  if (url === lastUrl && now - lastAt < 800) return;
  lastUrl = url;
  lastAt = now;

  try {
    if (kind === "system") {
      await Linking.openURL(url);
      return;
    }
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      toolbarColor: THEME_COLOR,
      controlsColor: "#ffffff",
      enableBarCollapsing: true,
      showTitle: true,
    });
  } catch {
    try {
      await Linking.openURL(url);
    } catch {
      // O sistema recusou o esquema. Não há outro destino seguro.
    }
  }
}
