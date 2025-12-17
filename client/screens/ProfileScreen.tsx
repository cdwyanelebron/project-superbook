import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors, Typography } from "@/constants/theme";
import { allBooks, getBookById, Book } from "@/data/allBooks";
import type { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

interface ReadProgress {
  [key: string]: {
    lastRead: string;
    completed: boolean;
  };
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: keyof typeof Feather.glyphMap;
  value: string | number;
  label: string;
  color: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + "20" }]}>
        <Feather name={icon} size={24} color={color} />
      </View>
      <ThemedText style={[styles.statValue, { color: theme.text }]}>{value}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
    </View>
  );
}

function BookmarkItem({ book, onPress }: { book: Book; onPress: () => void }) {
  const { theme } = useTheme();
  const testamentColor =
    book.testament === "old" ? AppColors.oldTestament : AppColors.newTestament;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.bookmarkItem,
        {
          backgroundColor: theme.backgroundSecondary,
          borderLeftColor: testamentColor,
        },
      ]}
    >
      <View style={[styles.bookmarkNumber, { backgroundColor: book.color }]}>
        <ThemedText style={styles.bookmarkNumberText}>{book.id}</ThemedText>
      </View>
      <View style={styles.bookmarkInfo}>
        <ThemedText style={[styles.bookmarkTitle, { color: theme.text }]} numberOfLines={1}>
          {book.title}
        </ThemedText>
        <ThemedText style={[styles.bookmarkCategory, { color: theme.textSecondary }]}>
          {book.category}
        </ThemedText>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

function SettingItem({
  icon,
  label,
  onPress,
  rightElement,
  destructive,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.settingItem, { backgroundColor: theme.backgroundSecondary }]}
      disabled={!onPress && !rightElement}
    >
      <View
        style={[
          styles.settingIconContainer,
          { backgroundColor: destructive ? "#FF3B3020" : AppColors.primary + "20" },
        ]}
      >
        <Feather
          name={icon}
          size={20}
          color={destructive ? "#FF3B30" : AppColors.primary}
        />
      </View>
      <ThemedText
        style={[
          styles.settingLabel,
          { color: destructive ? "#FF3B30" : theme.text },
        ]}
      >
        {label}
      </ThemedText>
      {rightElement || (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();

  const [bookmarks, setBookmarks] = useState<Book[]>([]);
  const [readProgress, setReadProgress] = useState<ReadProgress>({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const bookmarksData = await AsyncStorage.getItem("bookmarks");
      if (bookmarksData) {
        const bookmarkIds: string[] = JSON.parse(bookmarksData);
        const bookmarkBooks = bookmarkIds
          .map((id) => getBookById(id))
          .filter((book): book is Book => book !== undefined);
        setBookmarks(bookmarkBooks);
      } else {
        setBookmarks([]);
      }

      const progressData = await AsyncStorage.getItem("readProgress");
      if (progressData) {
        setReadProgress(JSON.parse(progressData));
      } else {
        setReadProgress({});
      }

      const notifData = await AsyncStorage.getItem("notificationsEnabled");
      setNotificationsEnabled(notifData === "true");
    } catch (e) {
      console.log("Error loading data:", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem("notificationsEnabled", value.toString());
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will remove all your bookmarks and reading progress. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove(["bookmarks", "readProgress"]);
            setBookmarks([]);
            setReadProgress({});
          },
        },
      ]
    );
  };

  const completedCount = Object.values(readProgress).filter((p) => p.completed).length;
  const totalReadTime = completedCount * 5;

  const getLastReadDate = () => {
    const dates = Object.values(readProgress)
      .map((p) => new Date(p.lastRead))
      .sort((a, b) => b.getTime() - a.getTime());

    if (dates.length === 0) return "Never";

    const lastDate = dates[0];
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return lastDate.toLocaleDateString();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: AppColors.primary }]}>
            <Feather name="user" size={40} color="#FFFFFF" />
          </View>
          <ThemedText style={[styles.profileName, { color: theme.text }]}>
            Young Reader
          </ThemedText>
          <ThemedText style={[styles.profileSubtitle, { color: theme.textSecondary }]}>
            Keep reading God's Word!
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            Reading Statistics
          </ThemedText>
          <View style={styles.statsGrid}>
            <StatCard
              icon="book-open"
              value={completedCount}
              label="Stories Read"
              color={AppColors.primary}
            />
            <StatCard
              icon="check-circle"
              value={`${Math.round((completedCount / 60) * 100)}%`}
              label="Completed"
              color={AppColors.oldTestament}
            />
            <StatCard
              icon="clock"
              value={`${totalReadTime}m`}
              label="Reading Time"
              color={AppColors.newTestament}
            />
            <StatCard
              icon="calendar"
              value={getLastReadDate()}
              label="Last Read"
              color="#BA68C8"
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            Bookmarks ({bookmarks.length})
          </ThemedText>
          {bookmarks.length > 0 ? (
            bookmarks.slice(0, 5).map((book) => (
              <BookmarkItem
                key={book.id}
                book={book}
                onPress={() => navigation.navigate("BookReader", { book })}
              />
            ))
          ) : (
            <View style={[styles.emptyBookmarks, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="bookmark" size={32} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No bookmarks yet
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Tap the bookmark icon while reading to save stories
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            Settings
          </ThemedText>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="bell"
              label="Notifications"
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                  trackColor={{ false: theme.backgroundTertiary, true: AppColors.primary }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <SettingItem
              icon="trash-2"
              label="Clear All Data"
              onPress={handleClearData}
              destructive
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            About
          </ThemedText>
          <View style={styles.settingsGroup}>
            <SettingItem icon="info" label="Version 1.0.0" />
            <SettingItem icon="heart" label="Made with love for Filipino Kids" />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  profileName: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  profileSubtitle: {
    ...Typography.body,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -Spacing.xs,
  },
  statCard: {
    width: "48%",
    margin: "1%",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.small,
    textAlign: "center",
  },
  bookmarkItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
  },
  bookmarkNumber: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  bookmarkNumberText: {
    ...Typography.small,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bookmarkInfo: {
    flex: 1,
  },
  bookmarkTitle: {
    ...Typography.body,
    fontWeight: "500",
  },
  bookmarkCategory: {
    ...Typography.small,
  },
  emptyBookmarks: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
  },
  emptyText: {
    ...Typography.body,
    fontWeight: "500",
    marginTop: Spacing.md,
  },
  emptySubtext: {
    ...Typography.small,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  settingsGroup: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: 1,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingLabel: {
    ...Typography.body,
    flex: 1,
  },
});
