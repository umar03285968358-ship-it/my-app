import { colors } from "@/constants/theme";
import { Stack } from "expo-router";
import React from "react";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="dashboard" />

      <Stack.Screen name="notifications" />

      <Stack.Screen name="orders/index" />
      <Stack.Screen name="orders/[id]" />

      <Stack.Screen name="riders/index" />

      <Stack.Screen name="products/index" />
      <Stack.Screen name="products/add" />

      <Stack.Screen name="categories/index" />
      <Stack.Screen name="categories/add" />

      <Stack.Screen name="subcategories/index" />
      <Stack.Screen name="subcategories/add" />
    </Stack>
  );
}