import SelectModal, { SelectOption } from "@/components/admin/SelectModal";
import Button from "@/components/Button";
import Input from "@/components/Input";
import ScreenLayout from "@/components/layout/ScreenLayout";
import { colors, radius, spacing, typography } from "@/constants/theme";
import {
    addProduct,
    getCategories,
    getSubcategories,
} from "@/services/adminApi";
import { Category, Subcategory } from "@/types/admin";
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

export default function AddProductScreen() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<Subcategory | null>(null);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [subcategoryModalVisible, setSubcategoryModalVisible] =
    useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getCategories();
      setCategories(data);
    })();
  }, []);

  // Load subcategories whenever the selected category changes
  useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([]);
      setSelectedSubcategory(null);
      return;
    }
    (async () => {
      const data = await getSubcategories(selectedCategory.id);
      setSubcategories(data);
      setSelectedSubcategory(null);
    })();
  }, [selectedCategory]);

  const categoryOptions: SelectOption[] = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const subcategoryOptions: SelectOption[] = subcategories.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter a product name.");
      return;
    }
    const numericPrice = parseFloat(price);
    if (!price || Number.isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert("Invalid price", "Please enter a valid price.");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("Missing category", "Please select a category.");
      return;
    }

    try {
      setSaving(true);
      await addProduct({
        name: name.trim(),
        price: numericPrice,
        stock: stock ? parseInt(stock, 10) : undefined,
        categoryId: selectedCategory.id,
        subcategoryId: selectedSubcategory?.id,
        description: description.trim() || undefined,
        image: imageUrl.trim() || undefined,
      });
      Alert.alert("Success", "Product added successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Failed to add product", error?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenLayout title="Add Product" showBack>
      <ScrollView contentContainerStyle={styles.container}>
        <Input
          placeholder="Product name"
          icon="cube-outline"
          value={name}
          onChangeText={setName}
        />
        <Input
          placeholder="Price"
          icon="cash-outline"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />
        <Input
          placeholder="Stock quantity (optional)"
          icon="layers-outline"
          keyboardType="numeric"
          value={stock}
          onChangeText={setStock}
        />

        {/* CATEGORY */}
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
            {selectedCategory ? selectedCategory.name : "Select category"}
          </Text>
          <Ionicons
            name="chevron-down"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {/* SUBCATEGORY (depends on category) */}
        <TouchableOpacity
          style={[
            styles.selector,
            !selectedCategory && styles.selectorDisabled,
          ]}
          disabled={!selectedCategory}
          onPress={() => setSubcategoryModalVisible(true)}
        >
          <Text
            style={[
              styles.selectorText,
              !selectedSubcategory && styles.selectorPlaceholder,
            ]}
          >
            {selectedSubcategory
              ? selectedSubcategory.name
              : selectedCategory
                ? "Select subcategory (optional)"
                : "Select a category first"}
          </Text>
          <Ionicons
            name="chevron-down"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <Input
          placeholder="Description (optional)"
          icon="document-text-outline"
          value={description}
          onChangeText={setDescription}
        />
        <Input
          placeholder="Image URL (optional)"
          icon="image-outline"
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
        />

        <Button
          title="Save Product"
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

      <SelectModal
        visible={subcategoryModalVisible}
        title="Select Subcategory"
        options={subcategoryOptions}
        selectedValue={selectedSubcategory?.id}
        onSelect={(value) => {
          const subcategory =
            subcategories.find((s) => s.id === value) ?? null;
          setSelectedSubcategory(subcategory);
          setSubcategoryModalVisible(false);
        }}
        onClose={() => setSubcategoryModalVisible(false)}
        emptyText="No subcategories for this category yet"
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
  selectorDisabled: {
    opacity: 0.5,
  },
  selectorText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  selectorPlaceholder: {
    color: colors.textSecondary,
  },
});