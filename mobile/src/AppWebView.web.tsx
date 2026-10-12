import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { StyleSheet, View } from "react-native";

type WebSource = { uri?: string };

type WebViewProps = {
  source?: WebSource;
  style?: object;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
};

export type WebViewRef = {
  goBack: () => void;
  reload: () => void;
  injectJavaScript: (script: string) => void;
};

/**
 * O react-native-webview não renderiza na web. Este iframe só existe para
 * o `expo start --web`. No iOS/Android o Metro usa o WebView nativo.
 */
export const WebView = forwardRef<WebViewRef, WebViewProps>(
  function PoliwebWebPreview({ source, style, onLoadStart, onLoadEnd, onError }, ref) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useImperativeHandle(ref, () => ({
      goBack() {
        try {
          iframeRef.current?.contentWindow?.history.back();
        } catch {
          // Documento de outro domínio não deixa voltar pelo frame.
        }
      },
      reload() {
        const frame = iframeRef.current;
        if (!frame) return;
        const src = frame.src;
        frame.src = "";
        frame.src = src;
      },
      injectJavaScript(script: string) {
        const match = script.match(/location\.assign\("([^"]+)"\)/);
        const next = match?.[1];
        const frame = iframeRef.current;
        if (!next || !frame || frame.src === next) return;
        frame.src = next;
      },
    }));

    useEffect(() => {
      onLoadStart?.();
    }, [onLoadStart, source?.uri]);

    return (
      <View style={[styles.fill, style]}>
        <iframe
          ref={iframeRef}
          title="Poliweb"
          src={source?.uri}
          onLoad={() => onLoadEnd?.()}
          onError={() => onError?.()}
          style={{
            border: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "#ffffff",
          }}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
