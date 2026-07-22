import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { ChevronLeft, Image as ImageIcon, Pencil, Search, Settings, Share2, Video, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';

import { useAuth } from '@/lib/auth/AuthProvider';
import { mobileDebug } from '@/lib/debug';
import { env } from '@/lib/env';
import { palette } from '@/lib/theme/tokens';
import { useImmersiveLock } from '@/lib/ui/immersive';
import { pickMedia } from '@/lib/uploads/pick';
import { UploadQueue } from '@/lib/uploads/queue';
import { resolveWebViewUrl } from '@/lib/webview/url-policy';

import { WebViewErrorOverlay } from './WebViewErrorOverlay';
import { WebViewSkeleton } from './WebViewSkeleton';

const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';
const APP_UA_SUFFIX = `CarmelitanoApp/${APP_VERSION} (${Platform.OS})`;
const LOGO_MARK_URI = `${env.webBaseUrl.replace(/\/$/, '')}/logo-mark.svg`;

type Props = {
  path: string;
  /** When true, taps that would normally open the home/buscar/agenda/assistente tabs route to the native tab instead. */
  redirectTabs?: boolean;
  /** When true, the built-in SmartWebView header (back/search/share) is hidden — caller must provide its own chrome. */
  hideHeader?: boolean;
};

type PageSection = {
  id: string;
  label: string;
  href?: string;
};

type SectionsPayload = {
  sections: PageSection[];
  mode?: 'scroll' | 'navigate';
};

type BusinessOwnerActions = {
  businessId: string;
  businessName: string;
  adminPath: string;
  postsPath?: string | null;
};

const FALLBACK_LINKS: PageSection[] = [
  { id: '/servicos', label: 'Serviços', href: '/servicos' },
  { id: '/servicos/alertas', label: 'Alertas', href: '/servicos/alertas' },
  { id: '/servicos/farmacias', label: 'Farmácias', href: '/servicos/farmacias' },
  { id: '/servicos/coleta', label: 'Coleta', href: '/servicos/coleta' },
  { id: '/servicos/clima', label: 'Clima', href: '/servicos/clima' },
  { id: '/comercio', label: 'Comércio', href: '/comercio' },
  { id: '/turismo', label: 'Turismo', href: '/turismo' },
  { id: '/comunidade', label: 'Comunidade', href: '/comunidade' },
];

const NATIVE_TAB_PATHS: Record<string, string> = {
  '/': '/(tabs)',
  '/buscar': '/buscar-nativo',
  '/assistente': '/assistente',
  '/painel': '/(tabs)/perfil',
};

const WEBVIEW_DEBUG_BRIDGE = `
  try {
    var alreadyDebugBridge = !!window.__CARMO_WEBVIEW_DEBUG_BRIDGE__;
    if (alreadyDebugBridge) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mobile-webview-log',
        payload: { level: 'info', args: ['js-alive-repeat'], href: window.location.href }
      }));
    }
    if (!alreadyDebugBridge) {
      window.__CARMO_WEBVIEW_DEBUG_BRIDGE__ = true;
      window.__CARMO_MOBILE_LOG__ = function(level, args) {
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mobile-webview-log',
            payload: {
              level: level,
              args: Array.prototype.slice.call(args).map(function(item) {
                if (typeof item === 'string') return item;
                try { return JSON.stringify(item); } catch (e) { return String(item); }
              }),
              href: window.location.href
            }
          }));
        } catch (e) {}
      };
      ['log', 'info', 'warn', 'error'].forEach(function(level) {
        var original = console[level];
        console[level] = function() {
          window.__CARMO_MOBILE_LOG__(level, arguments);
          if (original) original.apply(console, arguments);
        };
      });
      window.addEventListener('error', function(event) {
        var target = event && event.target;
        if (target && target !== window && (target.src || target.href)) {
          window.__CARMO_MOBILE_LOG__('resource-error', [
            target.tagName || 'resource',
            target.src || target.href
          ]);
          return;
        }
        window.__CARMO_MOBILE_LOG__('window-error', [event.message, event.filename, event.lineno, event.colno]);
      });
      window.addEventListener('unhandledrejection', function(event) {
        window.__CARMO_MOBILE_LOG__('unhandled-rejection', [event.reason]);
      });
      document.addEventListener('click', function(event) {
        try {
          if (window.location.pathname.indexOf('/painel/comercio') !== 0) return;
          var target = event.target && event.target.closest
            ? event.target.closest('button,a,summary,input,select,textarea,[role="button"]')
            : null;
          window.__CARMO_MOBILE_LOG__('click-capture', [
            target ? target.tagName : 'none',
            target ? (target.getAttribute('type') || target.getAttribute('href') || target.getAttribute('aria-label') || '') : '',
            target ? (target.textContent || '').trim().slice(0, 80) : ''
          ]);
        } catch (e) {}
      }, true);
    }
    window.__CARMO_MOBILE_LOG__('info', ['js-alive', document.readyState, window.location.href]);
  } catch (e) {}
`;

/**
 * Bridge that injects the Supabase session into the embedded web app via cookies,
 * forwards push deep links, and intercepts navigations that should stay native.
 */
export function SmartWebView({ path, redirectTabs = true, hideHeader = false }: Props) {
  const { session } = useAuth();
  const webRef = useRef<WebView>(null);
  const chipsRef = useRef<ScrollView>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [pageSections, setPageSections] = useState<PageSection[]>(FALLBACK_LINKS);
  const [sectionsMode, setSectionsMode] = useState<'scroll' | 'navigate'>('navigate');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [businessOwnerActions, setBusinessOwnerActions] = useState<BusinessOwnerActions | null>(null);
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);
  const [firstLoaded, setFirstLoaded] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const setImmersiveLock = useImmersiveLock();

  const uri = useMemo(() => {
    const url = new URL(path.startsWith('http') ? path : `${env.webBaseUrl}${path}`);
    url.searchParams.set('mobile', '1');
    return url.toString();
  }, [path]);

  const initialSource = useMemo(() => {
    const token = session?.access_token;
    const refresh = session?.refresh_token;
    // Dev local (HTTP/LAN): iOS bloqueia GET no bridge — sessão via POST injetado.
    if (!token || !refresh || env.webEnv === 'local') {
      return { uri };
    }
    const target = new URL(uri);
    const nextPath = `${target.pathname}${target.search}${target.hash}`;
    const bridgeUrl = `${env.webBaseUrl}/api/auth/mobile-bridge?next=${encodeURIComponent(nextPath)}`;
    return {
      uri: bridgeUrl,
      headers: {
        'x-access-token': token,
        'x-refresh-token': refresh,
      },
    };
  }, [session, uri]);

  useEffect(() => {
    setPageSections(FALLBACK_LINKS);
    setSectionsMode('navigate');
    setActiveSectionId(null);
    setBusinessOwnerActions(null);
    setOwnerMenuOpen(false);
    setFirstLoaded(false);
    setImmersive(false);
    setImmersiveLock(false);
  }, [path, setImmersiveLock]);

  useEffect(() => {
    setImmersiveLock(immersive);
  }, [immersive, setImmersiveLock]);

  useEffect(() => {
    mobileDebug('webview', 'uri resolved', {
      path,
      uri,
      webBaseUrl: env.webBaseUrl,
      platform: Platform.OS,
    });

    if (env.webBaseUrl.includes('localhost') || env.webBaseUrl.includes('127.0.0.1')) {
      mobileDebug('webview', 'local webBaseUrl may be unreachable on a physical device', {
        webBaseUrl: env.webBaseUrl,
      });
    }
  }, [path, uri]);

  const injectedJs = useMemo(() => {
    const token = session?.access_token;
    const refresh = session?.refresh_token;
    mobileDebug('webview', 'bridge: injectedJs computed', {
      hasSession: Boolean(token && refresh),
      userId: session?.user?.id ?? null,
    });
    if (!token || !refresh) {
      return `
        ${WEBVIEW_DEBUG_BRIDGE}
        window.__CARMO_MOBILE__ = { app: 'carmelitano', platform: '${Platform.OS}' };
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mobile-bridge-log',
            payload: { step: 'skip', reason: 'no-session' }
          }));
        } catch (e) {}
        true;
      `;
    }
    const sentinel = token.slice(-24);
    const targetUrl = uri;
    return `
      ${WEBVIEW_DEBUG_BRIDGE}
      window.__CARMO_MOBILE__ = { app: 'carmelitano', platform: '${Platform.OS}' };
      window.__CARMO_TARGET__ = ${JSON.stringify(targetUrl)};
      (function() {
        function bridgeLog(step, extra) {
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mobile-bridge-log',
              payload: Object.assign({ step: step, href: window.location.href }, extra || {})
            }));
          } catch (e) {}
        }
        try {
          var existing = window.sessionStorage.getItem('__carmo_bridge');
          if (existing === ${JSON.stringify(sentinel)}) {
            bridgeLog('skip', { reason: 'already-bridged', sentinel: existing });
            return;
          }
          bridgeLog('start', { sentinel: ${JSON.stringify(sentinel)}, previous: existing });
          fetch('/api/auth/mobile-bridge', {
            method: 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              access_token: ${JSON.stringify(token)},
              refresh_token: ${JSON.stringify(refresh)}
            })
          }).then(function(res) {
            bridgeLog('response', { status: res.status, ok: res.ok });
            if (!res.ok) {
              return res.text().then(function(body) {
                bridgeLog('error-body', { body: body.slice(0, 300) });
              });
            }
            window.sessionStorage.setItem('__carmo_bridge', ${JSON.stringify(sentinel)});
            var target = window.__CARMO_TARGET__ || window.location.href;
            bridgeLog('redirect', { target: target });
            window.location.replace(target);
          }).catch(function(err) {
            bridgeLog('fetch-failed', { message: String(err && err.message || err) });
          });
        } catch (e) {
          bridgeLog('exception', { message: String(e && e.message || e) });
        }
      })();
      true;
    `;
  }, [session, uri]);

  const scrollToSection = useCallback((section: PageSection) => {
    const href = section.href ?? `#${section.id}`;
    if (!href.startsWith('#')) return;

    const hash = href.slice(1);
    const js = `
      (function() {
        var ids = [${JSON.stringify(hash)}, ${JSON.stringify(`sec-${hash}`)}];
        var el = null;
        for (var i = 0; i < ids.length; i++) {
          el = document.getElementById(ids[i]);
          if (el) break;
        }
        if (!el) {
          el = document.querySelector('[data-mobile-section-id="${hash}"]');
        }
        if (!el) return;
        if (el.getBoundingClientRect().height < 2) {
          var sib = el.nextElementSibling;
          while (sib && sib.getBoundingClientRect().height < 2) sib = sib.nextElementSibling;
          if (sib) el = sib;
        }
        var top = el.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        try { history.pushState(null, '', '#${hash}'); } catch (e) {}
      })();
      true;
    `;
    webRef.current?.injectJavaScript(js);
    setActiveSectionId(section.id);
  }, []);

  const openWebPath = useCallback((nextPath: string) => {
    const nextUrl = new URL(nextPath, env.webBaseUrl);
    nextUrl.searchParams.set('mobile', '1');
    mobileDebug('webview', 'native header navigate', nextUrl.toString());
    setError(null);
    webRef.current?.injectJavaScript(`
      window.location.href = ${JSON.stringify(nextUrl.toString())};
      true;
    `);
  }, []);

  const detectBusinessOwnerActions = useCallback(() => {
    webRef.current?.injectJavaScript(`
      (function() {
        try {
          var el = document.querySelector('[data-native-business-actions]');
          var payload = el ? {
            businessId: el.getAttribute('data-business-id'),
            businessName: el.getAttribute('data-business-name'),
            adminPath: el.getAttribute('data-admin-path'),
            postsPath: el.getAttribute('data-posts-path')
          } : null;
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'business-owner-actions',
            payload: payload
          }));
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mobile-webview-log',
            payload: {
              level: 'business-owner-actions',
              args: [payload ? 'found' : 'missing', window.location.pathname, payload && payload.businessId],
              href: window.location.href
            }
          }));
        } catch (e) {}
      })();
      true;
    `);
  }, []);

  const handleChipPress = useCallback(
    (section: PageSection) => {
      const href = section.href ?? `#${section.id}`;
      if (sectionsMode === 'scroll' || href.startsWith('#')) {
        scrollToSection(section);
        return;
      }
      openWebPath(href);
    },
    [openWebPath, scrollToSection, sectionsMode],
  );

  const handleBack = useCallback(() => {
    if (canGoBack) {
      webRef.current?.goBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.push('/(tabs)/index' as never);
  }, [canGoBack]);

  const handleShare = useCallback(async () => {
    const shareUrl = currentUrl ?? uri;
    try {
      await Share.share({
        message: shareUrl,
        url: shareUrl,
      });
    } catch (shareError) {
      mobileDebug('webview', 'share failed', shareError);
    }
  }, [currentUrl, uri]);

  const onShouldStartLoadWithRequest = useCallback(
    (req: WebViewNavigation) => {
      try {
        const u = new URL(req.url);
        const decision = resolveWebViewUrl(req.url, env.webBaseUrl);
        mobileDebug('webview', 'should start request', {
          url: req.url,
          path: u.pathname,
          decision,
          redirectTabs,
        });
        if (decision === 'open-external') {
          Linking.openURL(req.url).catch(() => undefined);
          return false;
        }
        if (
          u.origin === new URL(env.webBaseUrl).origin &&
          !u.searchParams.has('mobile') &&
          req.navigationType !== 'formsubmit' &&
          req.navigationType !== 'formresubmit' &&
          u.pathname !== '/api/auth/mobile-bridge' &&
          !u.pathname.startsWith('/_next/')
        ) {
          u.searchParams.set('mobile', '1');
          mobileDebug('webview', 'append mobile param', { from: req.url, to: u.toString() });
          webRef.current?.injectJavaScript(`
            window.location.href = ${JSON.stringify(u.toString())};
            true;
          `);
          return false;
        }
        if (redirectTabs && NATIVE_TAB_PATHS[u.pathname]) {
          router.push(NATIVE_TAB_PATHS[u.pathname] as never);
          return false;
        }
      } catch (requestError) {
        mobileDebug('webview', 'request parse failed', { url: req.url, error: requestError });
        return true;
      }
      return true;
    },
    [redirectTabs],
  );

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        payload?: unknown;
        requestId?: string;
      };
      if (data.type === 'business-owner-actions') {
        const payload = data.payload as BusinessOwnerActions | null;
        mobileDebug('webview', 'business owner actions', {
          found: Boolean(payload?.businessId && payload.adminPath),
          businessId: payload?.businessId ?? null,
          adminPath: payload?.adminPath ?? null,
        });
        if (payload?.businessId && payload.adminPath) {
          setBusinessOwnerActions({
            businessId: payload.businessId,
            businessName: payload.businessName || 'Comércio',
            adminPath: payload.adminPath,
            postsPath: payload.postsPath ?? null,
          });
        } else {
          setBusinessOwnerActions(null);
          setOwnerMenuOpen(false);
        }
        return;
      }
      if (data.type === 'mobile-webview-log') {
        mobileDebug('webview-page', 'console', data.payload);
        return;
      }
      if (data.type === 'mobile-bridge-log') {
        mobileDebug('webview-bridge', 'step', data.payload);
        return;
      }
      if (data.type === 'mobile-sections') {
        const payload = data.payload as SectionsPayload;
        if (payload?.sections?.length) {
          setPageSections(payload.sections);
          setSectionsMode(payload.mode ?? 'navigate');
          setActiveSectionId(payload.sections[0]?.id ?? null);
          mobileDebug('webview', 'page sections', payload);
        }
        return;
      }
      if (data.type === 'mobile-section-active') {
        const payload = data.payload as { id?: string };
        if (payload?.id) setActiveSectionId(payload.id);
        return;
      }
      if (data.type === 'mobile-immersive') {
        const payload = data.payload as { active?: boolean } | null;
        const nextActive = Boolean(payload?.active);
        mobileDebug('webview', 'immersive', { active: nextActive });
        setImmersive(nextActive);
        if (nextActive) setOwnerMenuOpen(false);
        return;
      }
      if (data.type === 'navigate' && typeof data.payload === 'string') {
        mobileDebug('webview', 'bridge navigate', data.payload);
        router.push(data.payload as never);
      }
    } catch (parseError) {
      mobileDebug('webview', 'message parse failed', {
        data: event.nativeEvent.data,
        error: parseError,
      });
    }
  }, []);

  useEffect(() => {
    if (!activeSectionId || !chipsRef.current) return;
    const index = pageSections.findIndex((s) => s.id === activeSectionId);
    if (index < 0) return;
    chipsRef.current.scrollTo({ x: Math.max(0, index * 88 - 40), animated: true });
  }, [activeSectionId, pageSections]);

  const showHeader = !hideHeader && !immersive;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {showHeader ? (
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              hitSlop={8}
            >
              <ChevronLeft size={24} color={palette.white} strokeWidth={2.2} />
            </Pressable>

            <Pressable
              onPress={() => router.push('/buscar-nativo' as never)}
              style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Buscar no portal"
            >
              <View style={styles.logoBubble}>
                <Image source={{ uri: LOGO_MARK_URI }} style={styles.logoMark} contentFit="contain" />
              </View>
              <Search size={17} color={palette.ink700} strokeWidth={2.2} />
              <Text style={styles.searchText} numberOfLines={1}>
                Buscar em Carmo
              </Text>
            </Pressable>

            <Pressable
              onPress={() => void handleShare()}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Compartilhar página"
              hitSlop={8}
            >
              <Share2 size={22} color={palette.white} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView
            ref={chipsRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContent}
            keyboardShouldPersistTaps="handled"
          >
            {pageSections.map((item) => {
              const isActive = activeSectionId === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleChipPress(item)}
                  style={({ pressed }) => [
                    styles.chip,
                    isActive && styles.chipActive,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>
      ) : null}

      <WebView
        key={reloadKey}
        ref={webRef}
        source={initialSource}
        applicationNameForUserAgent={APP_UA_SUFFIX}
        userAgent={`Mozilla/5.0 (Mobile) ${APP_UA_SUFFIX}`}
        injectedJavaScriptBeforeContentLoaded={injectedJs}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onLoadStart={(event) => {
          setError(null);
          setErrorStatus(null);
          setCurrentUrl(event.nativeEvent.url || null);
          mobileDebug('webview', 'load start', { url: event.nativeEvent.url });
        }}
        onLoadEnd={(event) => {
          if (event.nativeEvent.url) {
            setCurrentUrl(event.nativeEvent.url);
          }
          setFirstLoaded(true);
          mobileDebug('webview', 'load end', { url: event.nativeEvent.url });
          webRef.current?.injectJavaScript(`
            ${WEBVIEW_DEBUG_BRIDGE}
            window.__CARMO_MOBILE__ = window.__CARMO_MOBILE__ || { app: 'carmelitano', platform: '${Platform.OS}' };
            true;
          `);
          detectBusinessOwnerActions();
          setTimeout(detectBusinessOwnerActions, 250);
          setTimeout(detectBusinessOwnerActions, 750);
          setTimeout(detectBusinessOwnerActions, 1500);
        }}
        onError={(event) => {
          const nextError = event.nativeEvent.description ?? 'Falha ao carregar';
          setError(nextError);
          setFirstLoaded(true);
          mobileDebug('webview', 'load error', event.nativeEvent);
        }}
        onHttpError={(event) => {
          const statusCode = event.nativeEvent.statusCode;
          const failedUrl = event.nativeEvent.url ?? '';
          // Ignora erros 4xx/5xx vindos do bridge — não devem cobrir a tela
          // (eles têm fallback próprio no injected JS).
          if (failedUrl.includes('/api/auth/mobile-bridge')) {
            mobileDebug('webview', 'bridge http error (ignored for overlay)', event.nativeEvent);
            return;
          }
          setErrorStatus(statusCode);
          setError(`HTTP ${statusCode}`);
          mobileDebug('webview', 'http error', event.nativeEvent);
        }}
        onNavigationStateChange={(navState) => {
          setCurrentUrl(navState.url);
          setCanGoBack(navState.canGoBack);
          mobileDebug('webview', 'navigation state', {
            url: navState.url,
            title: navState.title,
            loading: navState.loading,
            canGoBack: navState.canGoBack,
            canGoForward: navState.canGoForward,
          });
        }}
        onContentProcessDidTerminate={() => {
          mobileDebug('webview', 'content process terminated, reloading');
          webRef.current?.reload();
        }}
        onMessage={onMessage}
        decelerationRate="normal"
        allowsBackForwardNavigationGestures
        allowsLinkPreview={false}
        pullToRefreshEnabled={Platform.OS === 'ios'}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        contentInsetAdjustmentBehavior="automatic"
        nestedScrollEnabled
        setSupportMultipleWindows={false}
        overScrollMode="never"
        androidLayerType="hardware"
        style={styles.web}
      />
      {!firstLoaded && !error ? <WebViewSkeleton showHeader={showHeader} /> : null}
      {error ? (
        <WebViewErrorOverlay
          status={errorStatus}
          message={__DEV__ ? error : null}
          onRetry={() => {
            setError(null);
            setErrorStatus(null);
            setReloadKey((k) => k + 1);
          }}
          onBack={() => {
            setError(null);
            setErrorStatus(null);
            handleBack();
          }}
        />
      ) : null}
      {businessOwnerActions && !immersive ? (
        <BusinessOwnerNativeFab
          actions={businessOwnerActions}
          open={ownerMenuOpen}
          onToggle={() => setOwnerMenuOpen((value) => !value)}
          onClose={() => setOwnerMenuOpen(false)}
          onNavigate={(nextPath) => openWebPath(nextPath)}
          onUpload={(accept) => {
            void enqueueBusinessMedia({
              accept,
              business: businessOwnerActions,
              onDone: () => {
                setTimeout(() => {
                  webRef.current?.reload();
                  detectBusinessOwnerActions();
                }, 1200);
              },
            });
            setOwnerMenuOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}

async function enqueueBusinessMedia({
  accept,
  business,
  onDone,
}: {
  accept: 'image' | 'video';
  business: BusinessOwnerActions;
  onDone: () => void;
}) {
  const assets = await pickMedia({ accept, max: 10, source: 'gallery' });
  if (assets.length === 0) return;

  const jobIds: string[] = [];
  for (const asset of assets) {
    const jobId = await UploadQueue.addJob({
      entityType: 'business',
      entityId: business.businessId,
      role: 'gallery',
      label: `Galeria · ${business.businessName}`,
      asset,
    });
    jobIds.push(jobId);
  }

  const reloadWhenSettled = () => {
    const activeJobs = UploadQueue.pendingByStatus('pending', 'uploading', 'processing')
      .filter((item) => jobIds.includes(item.id));
    if (activeJobs.length > 0) return false;
    onDone();
    return true;
  };

  const unsub = UploadQueue.onComplete((job) => {
    if (!jobIds.includes(job.id)) return;
    if (reloadWhenSettled()) {
      unsub();
    }
  });
  if (reloadWhenSettled()) unsub();
}

function BusinessOwnerNativeFab({
  actions,
  open,
  onToggle,
  onClose,
  onNavigate,
  onUpload,
}: {
  actions: BusinessOwnerActions;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onUpload: (accept: 'image' | 'video') => void;
}) {
  return (
    <View pointerEvents="box-none" style={styles.ownerFabHost}>
      {open ? (
        <View style={styles.ownerMenu}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 60 : 90}
            tint={Platform.OS === 'ios' ? 'systemChromeMaterial' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.ownerMenuTint} pointerEvents="none" />
          <Text style={styles.ownerMenuTitle} numberOfLines={1}>Editar comércio</Text>
          <Text style={styles.ownerMenuSubtitle} numberOfLines={1}>{actions.businessName}</Text>
          <OwnerFabAction icon={<ImageIcon size={18} color={palette.ink900} />} label="Postar foto" onPress={() => onUpload('image')} />
          <OwnerFabAction icon={<Video size={18} color={palette.ink900} />} label="Postar vídeo" onPress={() => onUpload('video')} />
          <OwnerFabAction icon={<Pencil size={18} color={palette.ink900} />} label="Editar no admin" onPress={() => { onClose(); onNavigate(actions.adminPath); }} />
        </View>
      ) : null}
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.ownerFab, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={open ? 'Fechar edição do comércio' : 'Editar comércio'}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 70 : 95}
          tint={Platform.OS === 'ios' ? 'systemChromeMaterialDark' : 'dark'}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.ownerFabTint} pointerEvents="none" />
        {open ? <X size={18} color={palette.white} /> : <Settings size={18} color={palette.white} />}
        <Text style={styles.ownerFabText}>Editar comércio</Text>
      </Pressable>
    </View>
  );
}

function OwnerFabAction({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ownerMenuAction, pressed && styles.pressed]}>
      {icon}
      <Text style={styles.ownerMenuActionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: palette.paper },
  headerSafe: { backgroundColor: palette.clay500 },
  header: {
    backgroundColor: palette.clay500,
    paddingHorizontal: 10,
    paddingBottom: 8,
    gap: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  searchButton: {
    flex: 1,
    minWidth: 0,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 10,
    paddingRight: 14,
  },
  logoBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  logoMark: {
    width: 22,
    height: 22,
  },
  searchText: {
    flex: 1,
    color: palette.ink600,
    fontSize: 14,
    fontWeight: '700',
  },
  chipsContent: {
    gap: 6,
    paddingRight: 6,
  },
  chip: {
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: palette.ink900,
  },
  chipText: {
    color: palette.ink900,
    fontSize: 13,
    fontWeight: '800',
  },
  chipTextActive: {
    color: palette.white,
  },
  pressed: { opacity: 0.72 },
  web: { flex: 1, backgroundColor: palette.paper },
  ownerFabHost: {
    position: 'absolute',
    right: 14,
    bottom: 132,
    alignItems: 'flex-end',
    gap: 10,
  },
  ownerFab: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 9,
  },
  ownerFabTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(15,15,20,0.32)' : 'rgba(15,15,20,0.72)',
  },
  ownerFabText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '900',
  },
  ownerMenu: {
    width: 232,
    borderRadius: 22,
    backgroundColor: 'transparent',
    padding: 10,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.45)',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    gap: 7,
  },
  ownerMenuTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.62)',
  },
  ownerMenuTitle: {
    color: palette.ink900,
    fontSize: 14,
    fontWeight: '900',
  },
  ownerMenuSubtitle: {
    color: palette.ink600,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  ownerMenuAction: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    backgroundColor: palette.paper,
    paddingHorizontal: 12,
  },
  ownerMenuActionText: {
    flex: 1,
    color: palette.ink900,
    fontSize: 13,
    fontWeight: '800',
  },
  errorWrap: {
    position: 'absolute',
    inset: 0,
    backgroundColor: palette.paper,
    padding: 24,
    justifyContent: 'center',
    gap: 8,
  },
  errorTitle: { fontSize: 18, fontWeight: '900', color: palette.ink900 },
  errorBody: { fontSize: 13, color: palette.ink600 },
});
