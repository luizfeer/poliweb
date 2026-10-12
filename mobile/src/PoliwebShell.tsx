import { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import NetInfo from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  type WebViewMessageEvent,
  type WebViewNavigation,
} from "react-native-webview";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";

import { WebView } from "./AppWebView";

import {
  INTRO_FALLBACK_MS,
  MIN_INTRO_MS,
  ORIGIN,
  SPLASH_BACKGROUND,
  START_URL,
  THEME_COLOR,
} from "./config";
import { IntroOverlay } from "./IntroOverlay";
import { NativeTabBar } from "./NativeTabBar";
import { NATIVE_SHELL_SCRIPT } from "./nativeShellScript";
import { OfflineScreen } from "./OfflineScreen";
import { openExternal } from "./openExternal";
import {
  classifyNavigation,
  pathnameOf,
  tabForPath,
  type TabId,
} from "./navigationPolicy";

SystemUI.setBackgroundColorAsync(SPLASH_BACKGROUND).catch(() => {});

function isOfflineState(state: {
  isConnected?: boolean | null;
  isInternetReachable?: boolean | null;
}): boolean {
  return state.isConnected === false || state.isInternetReachable === false;
}

export function PoliwebShell() {
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const loadedOnce = useRef(false);
  const failed = useRef(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nativeSplashHidden = useRef(false);

  const [introMounted, setIntroMounted] = useState(true);
  const [minElapsed, setMinElapsed] = useState(false);
  const [siteReady, setSiteReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [netOffline, setNetOffline] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId | null>("home");
  const [canGoBack, setCanGoBack] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const clearFallback = useCallback(() => {
    if (fallbackTimer.current) {
      clearTimeout(fallbackTimer.current);
      fallbackTimer.current = null;
    }
  }, []);

  const markReady = useCallback(() => {
    if (failed.current || loadedOnce.current) return;
    loadedOnce.current = true;
    clearFallback();
    setLoadFailed(false);
    setSiteReady(true);
  }, [clearFallback]);

  const markFailed = useCallback(() => {
    if (loadedOnce.current) return;
    failed.current = true;
    clearFallback();
    setSiteReady(false);
    setLoadFailed(true);
  }, [clearFallback]);

  const hideNativeSplash = useCallback(() => {
    if (nativeSplashHidden.current) return;
    nativeSplashHidden.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    minTimer.current = setTimeout(() => setMinElapsed(true), MIN_INTRO_MS);
    const splashGuard = setTimeout(hideNativeSplash, 2500);
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetOffline(isOfflineState(state));
    });
    NetInfo.fetch()
      .then((state) => setNetOffline(isOfflineState(state)))
      .catch(() => {});
    return () => {
      if (minTimer.current) clearTimeout(minTimer.current);
      clearTimeout(splashGuard);
      clearFallback();
      unsubscribe();
    };
  }, [clearFallback, hideNativeSplash]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack) {
        webRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const offline = (loadFailed || netOffline) && !siteReady;
  const exitingIntro = introMounted && minElapsed && (siteReady || offline);

  const scheduleFallback = useCallback(() => {
    if (loadedOnce.current || fallbackTimer.current) return;
    fallbackTimer.current = setTimeout(() => {
      if (!failed.current) markReady();
    }, INTRO_FALLBACK_MS);
  }, [markReady]);

  const onNavigation = useCallback((nav: WebViewNavigation) => {
    setCanGoBack(nav.canGoBack);
    if (nav.url) setActiveTab(tabForPath(pathnameOf(nav.url)));
  }, []);

  const onShouldStart = useCallback((request: ShouldStartLoadRequest) => {
    const decision = classifyNavigation(request.url, request.isTopFrame);
    if (decision === "allow") return true;
    void openExternal(request.url, decision);
    return false;
  }, []);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data) as { type?: string };
        if (data.type === "app-ready") markReady();
      } catch {
        // Mensagens do site que não são JSON ficam ignoradas.
      }
    },
    [markReady],
  );

  const goToPath = useCallback((path: string) => {
    const url = `${ORIGIN}${path}`;
    const script = `
      (function () {
        var target = ${JSON.stringify(path)};
        var current = (location.pathname || "/").replace(/\\/+$/, "") || "/";
        var same = target === "/" ? current === "/" : current === target || current.indexOf(target + "/") === 0;
        if (same) window.scrollTo({ top: 0, behavior: "smooth" });
        else window.location.assign(${JSON.stringify(url)});
      })();
      true;
    `;
    webRef.current?.injectJavaScript(script);
    setActiveTab(tabForPath(path));
  }, []);

  const retry = useCallback(() => {
    failed.current = false;
    loadedOnce.current = false;
    clearFallback();
    setLoadFailed(false);
    setSiteReady(false);
    setMinElapsed(false);
    setIntroMounted(true);
    if (minTimer.current) clearTimeout(minTimer.current);
    minTimer.current = setTimeout(() => setMinElapsed(true), 600);
    setRetryKey((key) => key + 1);
  }, [clearFallback]);

  const showTabs = siteReady && !offline;

  return (
    <View style={styles.root}>
      <StatusBar style={introMounted ? "dark" : "light"} />
      <View style={{ height: insets.top, backgroundColor: THEME_COLOR }} />
      <WebView
        key={retryKey}
        ref={webRef}
        source={{ uri: START_URL }}
        style={styles.web}
        containerStyle={styles.web}
        applicationNameForUserAgent="PoliwebAgenda"
        originWhitelist={["*"]}
        onShouldStartLoadWithRequest={onShouldStart}
        onNavigationStateChange={onNavigation}
        onMessage={onMessage}
        onLoadStart={() => {
          failed.current = false;
        }}
        onLoadEnd={() => {
          if (Platform.OS === "web") {
            markReady();
            return;
          }
          scheduleFallback();
        }}
        onError={() => markFailed()}
        onHttpError={(event) => {
          if (event.nativeEvent.statusCode >= 500) markFailed();
        }}
        injectedJavaScriptBeforeContentLoaded={NATIVE_SHELL_SCRIPT}
        injectedJavaScript={NATIVE_SHELL_SCRIPT}
        setSupportMultipleWindows={false}
        onOpenWindow={(event) => {
          const url = event.nativeEvent.targetUrl;
          if (!url) return;
          const decision = classifyNavigation(url, true);
          if (decision === "allow") {
            webRef.current?.injectJavaScript(
              `window.location.assign(${JSON.stringify(url)}); true;`,
            );
            return;
          }
          void openExternal(url, decision);
        }}
        pullToRefreshEnabled
        allowsBackForwardNavigationGestures
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        cacheEnabled
        bounces
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        setBuiltInZoomControls={false}
        textZoom={100}
        webviewDebuggingEnabled={__DEV__}
        mediaPlaybackRequiresUserAction
      />
      {showTabs ? <NativeTabBar active={activeTab} onPress={goToPath} /> : null}
      {offline && !introMounted ? <OfflineScreen onRetry={retry} /> : null}
      {introMounted ? (
        <IntroOverlay
          exiting={exitingIntro}
          onHidden={() => setIntroMounted(false)}
          onLayoutReady={hideNativeSplash}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND,
  },
  web: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND,
  },
});
