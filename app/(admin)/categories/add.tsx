import Button from "@/components/Button";
import Input from "@/components/Input";
import ScreenLayout from "@/components/layout/ScreenLayout";
import { spacing } from "@/constants/theme";
import { addCategory } from "@/services/adminApi";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";

export default function AddCategoryScreen() {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter a category name.");
      return;
    }

    try {
      setSaving(true);
      await addCategory({
        name: name.trim(),
        image: imageUrl.trim() || undefined,
      });
      Alert.alert("Success", "Category added successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Failed to add category", error?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenLayout title="Add Category" showBack>
      <ScrollView contentContainerStyle={styles.container}>
        <Input
          placeholder="Category name"
          icon="pricetag-outline"
          value={name}
          onChangeText={setName}
        />
        <Input
          placeholder="Image URL (optional)"
          icon="image-outline"
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
        />
        <Button
          title="Save Category"
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
});