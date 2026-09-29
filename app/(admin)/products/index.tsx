import EmptyState from "@/components/admin/EmptyState";
import Fab from "@/components/admin/Fab";
import ProductCard from "@/components/admin/ProductCard";
import ScreenLayout from "@/components/layout/ScreenLayout";
import { colors, spacing } from "@/constants/theme";
import { getProducts } from "@/services/adminApi";
import { Product } from "@/types/admin";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        setLoading(true);
        const data = await getProducts();
        if (isActive) {
          setProducts(data);
          setLoading(false);
        }
      })();
      return () => {
        isActive = false;
      };
    }, []),
  );

  return (
    <ScreenLayout title="Products" showBack>
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator
            style={styles.loader}
            size="large"
            color={colors.accentOrange}
          />
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon="cube-outline"
                message="No products yet. Add your first one."
              />
            }
            renderItem={({ item }) => <ProductCard product={item} />}
          />
        )}
        <Fab onPress={() => router.push("/(admin)/products/add" as any)} />
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