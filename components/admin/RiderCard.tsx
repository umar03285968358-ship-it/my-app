import { colors, radius, spacing, typography } from "@/constants/theme";
import { MobUser } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "?";

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function handleCall(phone: string) {
  if (!phone) return;

  const phoneUrl = `tel:${phone}`;

  try {
    const supported = await Linking.canOpenURL(phoneUrl);

    if (supported) {
      await Linking.openURL(phoneUrl);
    }
  } catch (error) {
    console.log("Failed to open phone dialer:", error);
  }
}

export default function RiderCard({
  rider,
  onPress,
}: {
  rider: MobUser;
  onPress: () => void;
}) {
  const hasPhone = Boolean(rider.phone?.trim());

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Avatar */}
      <View style={styles.avatar}>
        {rider.image ? (
          <Image source={{ uri: rider.image }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarInitials}>
            {getInitials(rider.fullName)}
          </Text>
        )}
      </View>

      {/* Rider Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {rider.fullName || "Unnamed Rider"}
        </Text>

        <View style={styles.row}>
          <Ionicons
            name="call-outline"
            size={13}
            color={colors.textSecondary}
          />

          <Text style={styles.rowText} numberOfLines={1}>
            {rider.phone || "No phone"}
          </Text>
        </View>

        <View style={styles.row}>
          <Ionicons
            name="mail-outline"
            size={13}
            color={colors.textSecondary}
          />

          <Text style={styles.rowText} numberOfLines={1}>
            {rider.email || "No email"}
          </Text>
        </View>
      </View>

      {/* RIGHT ACTIONS */}
      <View style={styles.actions}>
        {/* Details Arrow */}
        <TouchableOpacity
          style={styles.arrowButton}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-forward"
            size={19}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Call Button */}
        <TouchableOpacity
          style={styles.callButton}
          onPress={(event) => {
            event.stopPropagation();

            if (hasPhone) {
              handleCall(rider.phone);
            }
          }}
          activeOpacity={0.7}
          disabled={!hasPhone}
        >
          <Ionicons
            name="call"
            size={16}
            color={hasPhone ? colors.textPrimary : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentOrange,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarInitials: {
    ...typography.h3,
    color: colors.white,
  },

  info: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },

  name: {
    ...typography.body,
    fontWeight: "700",
    color: colors.textPrimary,
    fontSize: 15,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  rowText: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },

  /* RIGHT SIDE */
  actions: {
    width: 38,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  arrowButton: {
    width: 32,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },

  callButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});