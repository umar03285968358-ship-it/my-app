import Button from "@/components/Button";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { router } from "expo-router";
import React from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";

const { width } = Dimensions.get("window");

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.brandTitle}>Sweet Crumbs</Text>
        <Text style={styles.brandSubtitle}>BAKERY</Text>

        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600",
          }}
          style={styles.image}
          resizeMode="cover"
        />

        <Text style={styles.description}>
          Delicious cakes, fresh bakes delivered to your doorstep.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          title="Get Started"
          variant="secondary"
          onPress={() => router.push("/(auth)/login")}
        />
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  content: { alignItems: "center", marginTop: spacing.xl },
  brandTitle: {
    ...typography.h1,
    color: colors.primaryDark,
    fontStyle: "italic",
  },
  brandSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    letterSpacing: 2,
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: radius.lg,
    marginVertical: spacing.lg,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  footer: { alignItems: "center" },
  dots: { flexDirection: "row", marginTop: spacing.md, gap: spacing.xs },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.accentOrange, width: 18 },
});
