import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { WebView, WebViewProps } from "react-native-webview";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography } from "@/constants/theme";

interface CrossPlatformWebViewProps {
  uri: string;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: string) => void;
  style?: any;
  loadingColor?: string;
}

function WebIframe({ 
  uri, 
  onLoadStart, 
  onLoadEnd, 
  onError,
  style,
  loadingColor,
}: CrossPlatformWebViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoadEnd?.();
  }, [onLoadEnd]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    onLoadStart?.();
  }, [onLoadStart]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    onError?.("Failed to load content");
  }, [onError]);

  return (
    <View style={[styles.container, style]}>
      {isLoading && (
        <View style={[styles.loadingOverlay, { backgroundColor: theme.backgroundDefault }]}>
          <ActivityIndicator size="large" color={loadingColor || theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading...
          </ThemedText>
        </View>
      )}
      <iframe
        src={uri}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          flex: 1,
        }}
        onLoad={handleLoad}
        onLoadStart={handleLoadStart}
        onError={handleError}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
      />
    </View>
  );
}

function NativeWebView({
  uri,
  onLoadStart,
  onLoadEnd,
  onError,
  style,
  loadingColor,
}: CrossPlatformWebViewProps) {
  const { theme } = useTheme();
  
  return (
    <WebView
      source={{ uri }}
      style={[styles.webview, style]}
      onLoadStart={onLoadStart}
      onLoadEnd={onLoadEnd}
      onError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.log("WebView error:", nativeEvent);
        onError?.(nativeEvent.description || "Failed to load content");
      }}
      onHttpError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.log("HTTP error:", nativeEvent.statusCode);
        if (nativeEvent.statusCode >= 400) {
          onError?.(`HTTP Error: ${nativeEvent.statusCode}`);
        }
      }}
      startInLoadingState={true}
      renderLoading={() => (
        <View style={[styles.loadingOverlay, { backgroundColor: theme.backgroundDefault }]}>
          <ActivityIndicator size="large" color={loadingColor || theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading...
          </ThemedText>
        </View>
      )}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
      allowsFullscreenVideo={true}
      cacheEnabled={true}
      cacheMode="LOAD_DEFAULT"
      mixedContentMode="always"
      originWhitelist={["*"]}
      thirdPartyCookiesEnabled={true}
      sharedCookiesEnabled={true}
      allowsBackForwardNavigationGestures={true}
      allowFileAccess={true}
      allowUniversalAccessFromFileURLs={true}
      scalesPageToFit={true}
      setSupportMultipleWindows={false}
      userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
    />
  );
}

export default function CrossPlatformWebView(props: CrossPlatformWebViewProps) {
  if (Platform.OS === "web") {
    return <WebIframe {...props} />;
  }
  return <NativeWebView {...props} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
});
