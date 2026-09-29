import EmptyState from "@/components/admin/EmptyState";
import Fab from "@/components/admin/Fab";
import RiderCard from "@/components/admin/RiderCard";
import RiderFormModal from "@/components/admin/RiderFormModal";
import ScreenLayout from "@/components/layout/ScreenLayout";
import { colors, spacing, typography } from "@/constants/theme";
import { getMobRiders, MobUser } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const ADMIN_TABS = [
  { key: "dashboard", label: "Dashboard", icon: "grid-outline" as const },
  { key: "orders", label: "Orders", icon: "receipt-outline" as const },
  { key: "notifications", label: "Notifications", icon: "notifications-outline" as const },
];

export default function RidersScreen() {
  const [riders, setRiders] = useState<MobUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formVisible, setFormVisible] = useState(false);
  const [editingRider, setEditingRider] = useState<MobUser | null>(null);

  const loadRiders = useCallback(async () => {
    const data = await getMobRiders();
    setRiders(data);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadRiders();
      setLoading(false);
    })();
  }, [loadRiders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRiders();
    setRefreshing(false);
  };

  const handleTabPress = (key: string) => {
    if (key === "dashboard") {
      router.replace("/(admin)/dashboard" as any);
    } else if (key === "orders") {
      router.replace("/(admin)/orders" as any);
    } else if (key === "notifications") {
      router.replace("/(admin)/notifications" as any);
    }
  };

  const filteredRiders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return riders;
    return riders.filter(
      (r) =>
        r.fullName.toLowerCase().includes(query) ||
        r.phone.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query),
    );
  }, [riders, searchQuery]);

  const openAddModal = () => {
    setEditingRider(null);
    setFormVisible(true);
  };

  const openEditModal = (rider: MobUser) => {
    setEditingRider(rider);
    setFormVisible(true);
  };

  const handleFormSuccess = () => {
    setFormVisible(false);
    setEditingRider(null);
    loadRiders();
  };

  return (
    <ScreenLayout
      title="Rider Management"
      showBack
      footerTabs={ADMIN_TABS}
      activeTabKey="riders"
      onTabPress={handleTabPress}
    >
      <View style={styles.container}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            placeholder="Search riders..."
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {filteredRiders.length} rider{filteredRiders.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            style={styles.loader}
            size="large"
            color={colors.accentOrange}
          />
        ) : (
          <FlatList
            data={filteredRiders}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="bicycle-outline"
                message="No riders found. Add your first rider."
              />
            }
            renderItem={({ item }) => (
              <RiderCard rider={item} onPress={() => openEditModal(item)} />
            )}
          />
        )}

        <Fab onPress={openAddModal} />
      </View>

      <RiderFormModal
        visible={formVisible}
        rider={editingRider}
        onClose={() => setFormVisible(false)}
        onSuccess={handleFormSuccess}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  countRow: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  countText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  loader: {
    marginTop: spacing.xl,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: spacing.xs,
  },
});