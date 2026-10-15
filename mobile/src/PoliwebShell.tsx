import { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Platform,
  StatusBar as NativeStatusBar,
  StyleSheet,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import { NavigationBar } from "expo-navigation-bar";
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
  PUSH_PROMPT_DELAY_MS,
  SPLASH_BACKGROUND,
  START_URL,
  THEME_COLOR,
} from "./config";
import { IntroOverlay } from "./IntroOverlay";
import { NativeTabBar } from "./NativeTabBar";
import { NATIVE_SHELL_SCRIPT } from "./nativeShellScript";
import {
  collectNativePushToken,
  lastNotificationUrl,
  listenForNotificationOpens,
  listenForPushTokenChanges,
} from "./nativePush";
import { OfflineScreen } from "./OfflineScreen";
import {
  buildPushBridgeScript,
  type NativePushPayload,
} from "./pushBridge";
import { openExternal } from "./openExternal";
import {
  classifyNavigation,
  firstPartyWebUrl,
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
  const pushPayload = useRef<NativePushPayload | null>(null);
  const pendingPushUrl = useRef<string | null>(null);

  const [introMounted, setIntroMounted] = useState(true);
  const [minElapsed, setMinElapsed] = useState(false);
  const [siteReady, setSiteReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [netOffline, setNetOffline] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId | null>("home");
  const canGoBackRef = useRef(false);
  const [entryUrl, setEntryUrl] = useState<string | null>(
    Platform.OS === "android" ? null : START_URL,
  );
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

  const deliverPush = useCallback((payload: NativePushPayload) => {
    pushPayload.current = payload;
    webRef.current?.injectJavaScript(buildPushBridgeScript(payload));
  }, []);

  const openInSite = useCallback((url: string) => {
    webRef.current?.injectJavaScript(
      `window.location.assign(${JSON.stringify(url)}); true;`,
    );
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
    if (Platform.OS === "web") return;
    void lastNotificationUrl().then((url) => {
      if (url) pendingPushUrl.current = url;
    });
    const opens = listenForNotificationOpens((url) => {
      if (!loadedOnce.current) pendingPushUrl.current = url;
      else openInSite(url);
    });
    const tokens = listenForPushTokenChanges(deliverPush);
    return () => {
      opens.remove();
      tokens.remove();
    };
  }, [deliverPush, openInSite]);

  useEffect(() => {
    if (!siteReady || introMounted || Platform.OS === "web") return;
    const timer = setTimeout(() => {
      void collectNativePushToken({ requestPermission: true }).then((payload) => {
        if (payload) deliverPush(payload);
      });
      if (pendingPushUrl.current) {
        openInSite(pendingPushUrl.current);
        pendingPushUrl.current = null;
      }
    }, PUSH_PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [deliverPush, introMounted, openInSite, siteReady]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    let alive = true;
    const giveUp = setTimeout(() => {
      if (!alive) return;
      setEntryUrl((current) => current ?? START_URL);
    }, 1500);
    Linking.getInitialURL()
      .then((url) => {
        if (!alive || loadedOnce.current) return;
        setEntryUrl(firstPartyWebUrl(url) ?? START_URL);
      })
      .catch(() => {
        if (alive) setEntryUrl((current) => current ?? START_URL);
      });
    const links = Linking.addEventListener("url", ({ url }) => {
      const next = firstPartyWebUrl(url);
      if (!next) return;
      if (!loadedOnce.current) setEntryUrl(next);
      else openInSite(next);
    });
    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!canGoBackRef.current) return false;
      webRef.current?.goBack();
      return true;
    });
    return () => {
      alive = false;
      clearTimeout(giveUp);
      links.remove();
      back.remove();
    };
  }, [openInSite]);

  const offline = (loadFailed || netOffline) && !siteReady;
  const exitingIntro = introMounted && minElapsed && (siteReady || offline);

  const scheduleFallback = useCallback(() => {
    if (loadedOnce.current || fallbackTimer.current) return;
    fallbackTimer.current = setTimeout(() => {
      if (!failed.current) markReady();
    }, INTRO_FALLBACK_MS);
  }, [markReady]);

  const onNavigation = useCallback((nav: WebViewNavigation) => {
    canGoBackRef.current = nav.canGoBack;
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
        if (data.type === "poliweb-push-request") {
          if (pushPayload.current) deliverPush(pushPayload.current);
          else {
            void collectNativePushToken({ requestPermission: true }).then(
              (payload) => {
                if (payload) deliverPush(payload);
              },
            );
          }
        }
      } catch {
        // Mensagens do site que não são JSON ficam ignoradas.
      }
    },
    [deliverPush, markReady],
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
    canGoBackRef.current = false;
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
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? NativeStatusBar.currentHeight ?? 0 : 0,
  );

  return (
    <View style={styles.root}>
      <StatusBar style={introMounted ? "dark" : "light"} animated />
      <NavigationBar style="light" />
      <View style={{ height: topInset, backgroundColor: THEME_COLOR }} />
      {entryUrl ? (
      <WebView
        key={retryKey}
        ref={webRef}
        source={{ uri: entryUrl }}
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
          if (pushPayload.current) {
            webRef.current?.injectJavaScript(
              buildPushBridgeScript(pushPayload.current),
            );
          }
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
        setSupportMultipleWindows={Platform.OS === "android"}
        geolocationEnabled
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
        // Android: o SwipeRefreshLayout do pull-to-refresh intercepta o scroll
        // e os toques do site (scroll fica preso e taps somem). Só no iOS.
        pullToRefreshEnabled={Platform.OS === "ios"}
        nestedScrollEnabled
        overScrollMode="content"
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
      ) : null}
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
