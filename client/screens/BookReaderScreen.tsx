import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import CrossPlatformWebView from "@/components/CrossPlatformWebView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors, Typography } from "@/constants/theme";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import AsyncStorage from "@react-native-async-storage/async-storage";

type BookReaderRouteProp = RouteProp<HomeStackParamList, "BookReader">;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function BookReaderScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<BookReaderRouteProp>();
  const { theme, isDark } = useTheme();
  const { book } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    checkBookmark();
  }, [fadeAnim]);

  const checkBookmark = async () => {
    try {
      const bookmarks = await AsyncStorage.getItem("bookmarks");
      if (bookmarks) {
        const parsed = JSON.parse(bookmarks);
        setIsBookmarked(parsed.includes(book.id));
      }
    } catch (e) {
      console.log("Error checking bookmark:", e);
    }
  };

  const toggleBookmark = async () => {
    try {
      const bookmarks = await AsyncStorage.getItem("bookmarks");
      let parsed: string[] = bookmarks ? JSON.parse(bookmarks) : [];

      if (isBookmarked) {
        parsed = parsed.filter((id) => id !== book.id);
      } else {
        parsed.push(book.id);
      }

      await AsyncStorage.setItem("bookmarks", JSON.stringify(parsed));
      setIsBookmarked(!isBookmarked);

      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (e) {
      console.log("Error toggling bookmark:", e);
    }
  };

  const saveReadProgress = async () => {
    try {
      const progress = await AsyncStorage.getItem("readProgress");
      let parsed: { [key: string]: { lastRead: string; completed: boolean } } = progress
        ? JSON.parse(progress)
        : {};

      parsed[book.id] = {
        lastRead: new Date().toISOString(),
        completed: true,
      };

      await AsyncStorage.setItem("readProgress", JSON.stringify(parsed));
    } catch (e) {
      console.log("Error saving progress:", e);
    }
  };

  const handleClose = () => {
    saveReadProgress();
    navigation.goBack();
  };

  const testamentColor =
    book.testament === "old" ? AppColors.oldTestament : AppColors.newTestament;

  const getViewerUrl = () => {
    const url = book.pdfUrl;
    
    if (url.includes("fliphtml5.com")) {
      return url;
    }
    
    const googleDriveMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    
    if (googleDriveMatch) {
      const fileId = googleDriveMatch[1];
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(downloadUrl)}`;
    }
    
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
  };

  const viewerUrl = getViewerUrl();

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + Spacing.sm,
              backgroundColor: testamentColor,
            },
          ]}
        >
          <Pressable onPress={handleClose} style={styles.headerButton}>
            <Feather name="x" size={24} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerTitle}>
            <ThemedText style={styles.headerTitleText} numberOfLines={1}>
              {book.title}
            </ThemedText>
            <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
              {book.titleEnglish}
            </ThemedText>
          </View>

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable onPress={toggleBookmark} style={styles.headerButton}>
              <Feather
                name={isBookmarked ? "bookmark" : "bookmark"}
                size={24}
                color={isBookmarked ? "#FFD700" : "#FFFFFF"}
              />
            </Pressable>
          </Animated.View>
        </View>

        <View style={styles.pdfContainer}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={testamentColor} />
              <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
                Nilo-load ang kwento...
              </ThemedText>
            </View>
          )}

          {error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={48} color={theme.textSecondary} />
              <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>
                {error}
              </ThemedText>
              <Pressable
                style={[styles.retryButton, { backgroundColor: testamentColor }]}
                onPress={() => {
                  setError(null);
                  setIsLoading(true);
                }}
              >
                <ThemedText style={styles.retryButtonText}>Subukan Muli</ThemedText>
              </Pressable>
            </View>
          ) : (
            <CrossPlatformWebView
              uri={viewerUrl}
              style={styles.webview}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              onError={(errorMessage) => {
                console.log("WebView error:", errorMessage);
                setIsLoading(false);
                setError("Hindi ma-load ang kwento. Pakisuri ang iyong internet connection.");
              }}
              loadingColor={testamentColor}
            />
          )}
        </View>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + Spacing.md,
              backgroundColor: theme.backgroundRoot,
            },
          ]}
        >
          <View style={styles.bookInfoFooter}>
            <ThemedText style={[styles.footerTitle, { color: theme.text }]} numberOfLines={1}>
              {book.titleEnglish}
            </ThemedText>
            <View style={styles.footerMeta}>
              <Feather name="clock" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.footerMetaText, { color: theme.textSecondary }]}>
                {book.duration}
              </ThemedText>
            </View>
          </View>
        </View>
      </ThemedView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    alignItems: "center",
  },
  headerTitleText: {
    ...Typography.body,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    ...Typography.small,
    color: "rgba(255,255,255,0.8)",
  },
  pdfContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    zIndex: 10,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.body,
    textAlign: "center",
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  retryButtonText: {
    ...Typography.body,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  bookInfoFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerTitle: {
    ...Typography.body,
    fontStyle: "italic",
    flex: 1,
  },
  footerMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerMetaText: {
    ...Typography.small,
    marginLeft: Spacing.xs,
  },
});
