import EmptyState from "@/components/admin/EmptyState";
import Fab from "@/components/admin/Fab";
import SimpleListCard from "@/components/admin/SimpleListCard";
import ScreenLayout from "@/components/layout/ScreenLayout";
import { colors, spacing } from "@/constants/theme";
import { getCategories } from "@/services/adminApi";
import { Category } from "@/types/admin";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        setLoading(true);
        const data = await getCategories();
        if (isActive) {
          setCategories(data);
          setLoading(false);
        }
      })();
      return () => {
        isActive = false;
      };
    }, []),
  );

  return (
    <ScreenLayout title="Categories" showBack>
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator
            style={styles.loader}
            size="large"
            color={colors.accentOrange}
          />
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon="pricetags-outline"
                message="No categories yet. Add your first one."
              />
            }
            renderItem={({ item }) => (
              <SimpleListCard
                title={item.name}
                subtitle={item.isActive ? "Active" : "Inactive"}
              />
            )}
          />
        )}
        <Fab onPress={() => router.push("/(admin)/categories/add" as any)} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginTop: spacing.xl,
  },
  listContent: {
    padding: spacing.md,
  },
});