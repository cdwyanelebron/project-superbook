import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LibraryScreen from "@/screens/LibraryScreen";
import BookReaderScreen from "@/screens/BookReaderScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import type { Book } from "@/data/allBooks";

export type LibraryStackParamList = {
  LibraryMain: { testament?: "old" | "new" } | undefined;
  BookReader: { book: Book };
};

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export default function LibraryStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="LibraryMain"
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
