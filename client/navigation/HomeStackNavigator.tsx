import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "@/screens/HomeScreen";
import LibraryScreen from "@/screens/LibraryScreen";
import BookReaderScreen from "@/screens/BookReaderScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import type { Book } from "@/data/allBooks";

export type HomeStackParamList = {
  HomeMain: undefined;
  LibraryFromHome: { testament: "old" | "new" };
  BookReader: { book: Book };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="LibraryFromHome"
        component={LibraryScreen}
        options={{
          headerTitle: "Library",
        }}
      />
      <Stack.Screen
        name="BookReader"
        component={BookReaderScreen}
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
    </Stack.Navigator>
  );
}
