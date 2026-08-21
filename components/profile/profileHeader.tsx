import { colors, radius, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Props = {
  name: string;
  email: string;
  imageUri: string | null;
  uploading: boolean;
  onChangePhoto: () => void;
  onEditPress: () => void;
};

export default function ProfileHeader({
  name,
  email,
  imageUri,
  uploading,
  onChangePhoto,
  onEditPress,
}: Props) {
  return (
    <View style={styles.profileRow}>
      <TouchableOpacity
        onPress={onChangePhoto}
        disabled={uploading}
        style={styles.avatarWrap}
      >
        <Image
          source={{ uri: imageUri || "https://i.pravatar.cc/150?img=12" }}
          style={styles.avatar}
        />
        <View style={styles.cameraBadge}>
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="camera" size={14} color="#fff" />
          )}
        </View>
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <TouchableOpacity onPress={onEditPress} hitSlop={10}>
        <Ionicons name="create-outline" size={22} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  avatarWrap: { position: "relative" },
  avatar: { width: 64, height: 64, borderRadius: radius.pill },
  cameraBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.accentOrange,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  name: { ...typography.h3, color: colors.textPrimary },
  email: { ...typography.caption, color: colors.textSecondary },
});
