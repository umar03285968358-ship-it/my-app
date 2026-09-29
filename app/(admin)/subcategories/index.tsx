import EmptyState from "@/components/admin/EmptyState";
import Fab from "@/components/admin/Fab";
import SimpleListCard from "@/components/admin/SimpleListCard";
import ScreenLayout from "@/components/layout/ScreenLayout";
import { colors, spacing } from "@/constants/theme";
import { getSubcategories } from "@/services/adminApi";
import { Subcategory } from "@/types/admin";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

export default function SubcategoriesScreen() {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        setLoading(true);
        const data = await getSubcategories();
        if (isActive) {
          setSubcategories(data);
          setLoading(false);
        }
      })();
      return () => {
        isActive = false;
      };
    }, []),
  );

  return (
    <ScreenLayout title="Subcategories" showBack>
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator
            style={styles.loader}
            size="large"
            color={colors.accentOrange}
          />
        ) : (
          <FlatList
            data={subcategories}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon="albums-outline"
                message="No subcategories yet. Add your first one."
              />
            }
            renderItem={({ item }) => (
              <SimpleListCard
                title={item.name}
                subtitle={`Category: ${item.categoryName ?? "-"}`}
              />
            )}
          />
        )}
        <Fab onPress={() => router.push("/(admin)/subcategories/add" as any)} />
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