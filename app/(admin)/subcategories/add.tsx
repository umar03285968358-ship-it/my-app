import SelectModal, { SelectOption } from "@/components/admin/SelectModal";
import Button from "@/components/Button";
import Input from "@/components/Input";
import ScreenLayout from "@/components/layout/ScreenLayout";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { addSubcategory, getCategories } from "@/services/adminApi";
import { Category } from "@/types/admin";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";

export default function AddSubcategoryScreen() {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getCategories();
      setCategories(data);
    })();
  }, []);

  const categoryOptions: SelectOption[] = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter a subcategory name.");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("Missing category", "Please select a parent category.");
      return;
    }

    try {
      setSaving(true);
      await addSubcategory({
        name: name.trim(),
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        image: imageUrl.trim() || undefined,
      });
      Alert.alert("Success", "Subcategory added successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Failed to add subcategory",
        error?.message || "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenLayout title="Add Subcategory" showBack>
      <ScrollView contentContainerStyle={styles.container}>
        <Input
          placeholder="Subcategory name"
          icon="albums-outline"
          value={name}
          onChangeText={setName}
        />

        <TouchableOpacity
          style={styles.selector}
          onPress={() => setCategoryModalVisible(true)}
        >
          <Text
            style={[
              styles.selectorText,
              !selectedCategory && styles.selectorPlaceholder,
            ]}
          >
            {selectedCategory ? selectedCategory.name : "Select parent category"}
          </Text>
          <Ionicons
            name="chevron-down"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <Input
          placeholder="Image URL (optional)"
          icon="image-outline"
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
        />

        <Button
          title="Save Subcategory"
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>

      <SelectModal
        visible={categoryModalVisible}
        title="Select Category"
        options={categoryOptions}
        selectedValue={selectedCategory?.id}
        onSelect={(value) => {
          const category = categories.find((c) => c.id === value) ?? null;
          setSelectedCategory(category);
          setCategoryModalVisible(false);
        }}
        onClose={() => setCategoryModalVisible(false)}
        emptyText="No categories yet — add one first"
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  selector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.card,
  },
  selectorText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  selectorPlaceholder: {
    color: colors.textSecondary,
  },
});