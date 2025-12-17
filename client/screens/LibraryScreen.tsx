import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TextInput,
  Pressable,
  Animated,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors, Typography } from "@/constants/theme";
import {
  allBooks,
  oldTestamentBooks,
  newTestamentBooks,
  searchBooks,
  getCategories,
  Book,
} from "@/data/allBooks";
import { getImageUrl } from "@/lib/image-utils";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import type { LibraryStackParamList } from "@/navigation/LibraryStackNavigator";

type LibraryRouteProp = RouteProp<HomeStackParamList, "LibraryFromHome"> | RouteProp<LibraryStackParamList, "LibraryMain">;
type NavigationProp = NativeStackNavigationProp<HomeStackParamList | LibraryStackParamList>;

function BookListItem({
  book,
  index,
  onPress,
}: {
  book: Book;
  index: number;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: Math.min(index * 50, 500),
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const testamentColor =
    book.testament === "old" ? AppColors.oldTestament : AppColors.newTestament;

  return (
    <Animated.View
      style={[
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.bookItem,
          {
            backgroundColor: theme.backgroundRoot,
            borderLeftColor: testamentColor,
          },
        ]}
      >
        <View style={styles.bookCoverContainer}>
          <Image
            source={{ uri: getImageUrl(book.imageUrl) }}
            style={[styles.bookCover, { backgroundColor: book.color }]}
            resizeMode="cover"
          />
          <View style={[styles.bookNumberOverlay, { backgroundColor: book.color }]}>
            <ThemedText style={styles.bookNumberText}>{book.id}</ThemedText>
          </View>
        </View>
        <View style={styles.bookInfo}>
          <ThemedText style={[styles.bookTitle, { color: theme.text }]} numberOfLines={1}>
            {book.title}
          </ThemedText>
          <ThemedText
            style={[styles.bookTitleEnglish, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {book.titleEnglish}
          </ThemedText>
          <View style={styles.bookMeta}>
            <View style={[styles.categoryBadge, { backgroundColor: `${book.color}4D` }]}>
              <ThemedText style={[styles.categoryText, { color: book.color }]}>
                {book.category}
              </ThemedText>
            </View>
            <View style={styles.durationContainer}>
              <Feather name="clock" size={12} color={theme.textSecondary} />
              <ThemedText style={[styles.durationText, { color: theme.textSecondary }]}>
                {book.duration}
              </ThemedText>
            </View>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>
    </Animated.View>
  );
}

function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  testamentColor,
}: {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  testamentColor: string;
}) {
  const { theme } = useTheme();

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={["Lahat", ...categories]}
      keyExtractor={(item) => item}
      contentContainerStyle={styles.categoryFilterContent}
      renderItem={({ item }) => {
        const isSelected = item === "Lahat" ? selectedCategory === null : selectedCategory === item;
        return (
          <Pressable
            onPress={() => onSelectCategory(item === "Lahat" ? null : item)}
            style={[
              styles.categoryPill,
              {
                backgroundColor: isSelected ? testamentColor : theme.backgroundSecondary,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.categoryPillText,
                { color: isSelected ? "#FFFFFF" : theme.text },
              ]}
            >
              {item}
            </ThemedText>
          </Pressable>
        );
      }}
    />
  );
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<LibraryRouteProp>();
  const { theme } = useTheme();

  let tabBarHeight = 0;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch {
    tabBarHeight = insets.bottom + 49;
  }

  const testament = route.params?.testament;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const testamentColor = testament === "new" ? AppColors.newTestament : AppColors.oldTestament;
  const testamentTitle = testament === "new" ? "BAGONG TIPAN" : testament === "old" ? "LUMANG TIPAN" : "Lahat ng Kuwento";

  const categories = useMemo(() => getCategories(testament), [testament]);

  const filteredBooks = useMemo(() => {
    let books = testament
      ? testament === "old"
        ? oldTestamentBooks
        : newTestamentBooks
      : allBooks;

    if (searchQuery.trim()) {
      books = searchBooks(searchQuery, testament);
    }

    if (selectedCategory) {
      books = books.filter((book) => book.category === selectedCategory);
    }

    return books;
  }, [testament, searchQuery, selectedCategory]);

  const totalBooks = testament
    ? testament === "old"
      ? oldTestamentBooks.length
      : newTestamentBooks.length
    : allBooks.length;

  useEffect(() => {
    navigation.setOptions({
      headerTitle: testamentTitle,
      headerTintColor: testament ? testamentColor : AppColors.primary,
    });
  }, [navigation, testamentTitle, testamentColor, testament]);

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.searchContainer,
          {
            paddingTop: headerHeight + Spacing.md,
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        <View style={[styles.searchBar, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Maghanap ng kuwento..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          testamentColor={testament ? testamentColor : AppColors.primary}
        />

        <ThemedText style={[styles.resultsCount, { color: theme.textSecondary }]}>
          {filteredBooks.length} sa {totalBooks} kuwento
        </ThemedText>
      </View>

      <FlatList
        data={filteredBooks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        renderItem={({ item, index }) => (
          <BookListItem
            book={item}
            index={index}
            onPress={() => navigation.navigate("BookReader" as any, { book: item })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="search" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              Walang nahanap na kuwento
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  categoryFilterContent: {
    paddingBottom: Spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  categoryPillText: {
    ...Typography.small,
    fontWeight: "500",
  },
  resultsCount: {
    ...Typography.small,
  },
  bookItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
  },
  bookCoverContainer: {
    position: "relative",
    marginRight: Spacing.md,
  },
  bookCover: {
    width: 60,
    height: 80,
    borderRadius: BorderRadius.xs,
  },
  bookNumberOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 2,
    alignItems: "center",
    borderBottomLeftRadius: BorderRadius.xs,
    borderBottomRightRadius: BorderRadius.xs,
  },
  bookNumberText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: 2,
  },
  bookTitleEnglish: {
    ...Typography.small,
    fontStyle: "italic",
    marginBottom: Spacing.xs,
  },
  bookMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.sm,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  durationText: {
    ...Typography.small,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyStateText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
});
