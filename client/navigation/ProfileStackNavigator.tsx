import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "@/screens/ProfileScreen";
import BookReaderScreen from "@/screens/BookReaderScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import type { Book } from "@/data/allBooks";

export type ProfileStackParamList = {
  ProfileMain: undefined;
  BookReader: { book: Book };
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{
          headerTitle: "Profile",
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
