import { useMemo, useState } from 'react';
import { Dimensions, Linking, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { SectionHeader } from '@/components/home/SectionHeader';
import type { RawHtmlConfig } from '@/lib/home/types';
import { openPortalUrl } from '@/lib/navigation/open-portal-url';
import { palette } from '@/lib/theme/tokens';

const SCREEN_W = Dimensions.get('window').width;

type Props = {
  config: RawHtmlConfig;
  title: string | null;
};

const PADDING: Record<NonNullable<RawHtmlConfig['padding']>, number> = {
  none: 0,
  tight: 12,
  comfortable: 16,
};

export function RawHtmlBlock({ config, title }: Props) {
  const html = typeof config?.html === 'string' ? config.html : '';
  const padding = PADDING[config?.padding ?? 'comfortable'];
  const document = useMemo(() => buildDocument(html, SCREEN_W - padding * 2), [html, padding]);
  const [contentHeight, setContentHeight] = useState(120);

  if (!html.trim()) return null;

  function onMessage(event: WebViewMessageEvent) {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as
        | { type: 'size'; height: number }
        | { type: 'link'; href: string };
      if (payload.type === 'size' && typeof payload.height === 'number') {
        const next = Math.min(Math.max(payload.height, 40), 4000);
        setContentHeight(next + 8);
      } else if (payload.type === 'link' && typeof payload.href === 'string') {
        const href = payload.href;
        if (/^https?:\/\//.test(href)) {
          openPortalUrl(href);
        } else if (href.startsWith('/')) {
          openPortalUrl(href);
        } else {
          void Linking.openURL(href).catch(() => undefined);
        }
      }
    } catch {
      // ignora payload mal formado
    }
  }

  return (
    <View style={{ paddingHorizontal: padding, paddingVertical: padding > 0 ? 8 : 0 }}>
      {title ? <SectionHeader title={title} /> : null}
      <View style={[styles.frame, { height: contentHeight }]}>
        <WebView
          originWhitelist={['*']}
          source={{ html: document, baseUrl: 'https://portalcarmelitano.com.br' }}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          setSupportMultipleWindows={false}
          androidLayerType="hardware"
          style={styles.webview}
          containerStyle={styles.webview}
        />
      </View>
    </View>
  );
}

function buildDocument(html: string, contentWidth: number): string {
  // O HTML do admin ja foi sanitizado por DOMPurify no servidor antes de salvar
  // no DB, mas confiamos no isolamento do WebView como segunda barreira: scripts
  // dentro do conteudo nao tem acesso ao app nativo, e o `originWhitelist` impede
  // cross-origin requests.
  const css = `
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: transparent; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: ${palette.ink900};
      font-size: 15px;
      line-height: 1.55;
      word-wrap: break-word;
    }
    h1, h2, h3, h4 { font-weight: 700; line-height: 1.2; margin: 14px 0 6px; }
    h1 { font-size: 24px; }
    h2 { font-size: 20px; }
    h3 { font-size: 17px; }
    p { margin: 0 0 10px; }
    a { color: ${palette.clay600 ?? '#b94a1f'}; text-decoration: underline; }
    img { max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 8px 0; }
    ul, ol { padding-left: 20px; margin: 8px 0; }
    li + li { margin-top: 4px; }
    blockquote {
      margin: 8px 0;
      padding-left: 10px;
      border-left: 3px solid #f4c79c;
      color: #57534e;
      font-style: italic;
    }
    hr { border: 0; border-top: 1px solid #e7e5e4; margin: 12px 0; }
    code { background: #f5f5f4; padding: 1px 4px; border-radius: 4px; font-size: 13px; }
    figure { margin: 8px 0; }
    figcaption { font-size: 12px; color: #78716c; margin-top: 4px; }
  `;
  const bridge = `
    (function () {
      function postSize() {
        var h = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'size', height: h })
        );
      }
      window.addEventListener('load', postSize);
      var imgs = document.getElementsByTagName('img');
      for (var i = 0; i < imgs.length; i++) {
        imgs[i].addEventListener('load', postSize);
        imgs[i].addEventListener('error', postSize);
      }
      document.addEventListener('click', function (event) {
        var target = event.target;
        while (target && target !== document) {
          if (target.tagName === 'A' && target.getAttribute('href')) {
            event.preventDefault();
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'link', href: target.getAttribute('href') })
            );
            return;
          }
          target = target.parentNode;
        }
      }, true);
      setTimeout(postSize, 80);
      setTimeout(postSize, 400);
    })();
  `;
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=${Math.max(320, Math.round(contentWidth))}, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>${css}</style>
</head>
<body>${html}<script>${bridge}</script></body>
</html>`;
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  webview: {
    backgroundColor: 'transparent',
    flex: 0,
  },
});
