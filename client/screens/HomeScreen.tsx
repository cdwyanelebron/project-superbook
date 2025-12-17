import React, { useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors, Typography } from "@/constants/theme";
import { allBooks, Book } from "@/data/allBooks";
import { getImageUrl } from "@/lib/image-utils";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

function FeaturedBookCard({ book, index }: { book: Book; index: number }) {
  const navigation = useNavigation<NavigationProp>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Pressable
        onPress={() => navigation.navigate("BookReader", { book })}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.featuredCard,
          {
            backgroundColor: book.color,
          },
        ]}
      >
        <Image
          source={{ uri: getImageUrl(book.imageUrl) }}
          style={styles.featuredImage}
          resizeMode="cover"
        />
        <View style={styles.featuredCardOverlay} />
        <View style={styles.featuredCardContent}>
          <ThemedText style={styles.featuredBookNumber}>#{book.id}</ThemedText>
          <ThemedText style={styles.featuredBookTitle} numberOfLines={2}>
            {book.title}
          </ThemedText>
          <ThemedText style={styles.featuredBookEnglish} numberOfLines={1}>
            {book.titleEnglish}
          </ThemedText>
          <View style={styles.featuredMeta}>
            <Feather name="clock" size={12} color="rgba(255,255,255,0.8)" />
            <ThemedText style={styles.featuredDuration}>{book.duration}</ThemedText>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function TestamentButton({
  title,
  subtitle,
  color,
  icon,
  onPress,
  delay,
}: {
  title: string;
  subtitle: string;
  color: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  delay: number;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.testamentButtonWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.testamentButton, { backgroundColor: color }]}
      >
        <Feather name={icon} size={32} color="#FFFFFF" />
        <View style={styles.testamentButtonText}>
          <ThemedText style={styles.testamentTitle}>{title}</ThemedText>
          <ThemedText style={styles.testamentSubtitle}>{subtitle}</ThemedText>
        </View>
        <Feather name="chevron-right" size={24} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

function StatBadge({ value, label }: { value: string; label: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.statBadge, { backgroundColor: theme.backgroundSecondary }]}>
      <ThemedText style={[styles.statValue, { color: AppColors.primary }]}>{value}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const featuredBooks = allBooks;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.appIcon}
          />
          <ThemedText style={[styles.appTitle, { color: AppColors.primary }]}>
            PROJECT SUPERBOOK
          </ThemedText>
          <ThemedText style={[styles.appSubtitle, { color: theme.textSecondary }]}>
            Mga Kuwento sa Bibliya para sa mga Batang Pilipino
          </ThemedText>
        </Animated.View>

        <View style={styles.statsRow}>
          <StatBadge value="60" label="Kuwento" />
          <StatBadge value="2" label="Tipan" />
          <StatBadge value="100%" label="Libre" />
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            Pumili ng Tipan
          </ThemedText>

          <TestamentButton
            title="LUMANG TIPAN"
            subtitle="Old Testament - 35 Kuwento"
            color={AppColors.oldTestament}
            icon="book"
            onPress={() => navigation.navigate("LibraryFromHome", { testament: "old" })}
            delay={200}
          />

          <TestamentButton
            title="BAGONG TIPAN"
            subtitle="New Testament - 25 Kuwento"
            color={AppColors.newTestament}
            icon="star"
            onPress={() => navigation.navigate("LibraryFromHome", { testament: "new" })}
            delay={300}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            Mga Tampok na Kuwento
          </ThemedText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScrollContent}
          >
            {featuredBooks.map((book, index) => (
              <FeaturedBookCard key={book.id} book={book} index={index} />
            ))}
          </ScrollView>
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
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  appTitle: {
    ...Typography.h2,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  appSubtitle: {
    ...Typography.body,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing["2xl"],
  },
  statBadge: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statValue: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.small,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.lg,
  },
  testamentButtonWrapper: {
    marginBottom: Spacing.md,
  },
  testamentButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    minHeight: 80,
  },
  testamentButtonText: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  testamentTitle: {
    ...Typography.h4,
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  testamentSubtitle: {
    ...Typography.small,
    color: "rgba(255,255,255,0.8)",
  },
  featuredScrollContent: {
    paddingRight: Spacing.lg,
  },
  featuredCard: {
    width: 180,
    height: 220,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
    overflow: "hidden",
    position: "relative",
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  featuredCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  featuredCardContent: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: "flex-end",
    position: "relative",
    zIndex: 1,
  },
  featuredBookNumber: {
    ...Typography.small,
    color: "rgba(255,255,255,0.7)",
    marginBottom: Spacing.xs,
  },
  featuredBookTitle: {
    ...Typography.body,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  featuredBookEnglish: {
    ...Typography.small,
    fontStyle: "italic",
    color: "rgba(255,255,255,0.85)",
    marginBottom: Spacing.sm,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  featuredDuration: {
    ...Typography.small,
    color: "rgba(255,255,255,0.8)",
    marginLeft: Spacing.xs,
  },
});
