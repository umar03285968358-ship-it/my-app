import Button from "@/components/Button";
import Input from "@/components/Input";
import { colors, spacing, typography } from "@/constants/theme";
import { generateMobOtp } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Dimensions, Image, StyleSheet, Text, View } from "react-native";

const { width } = Dimensions.get("window");

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setError("");
    setLoading(true);

    try {
      console.log("====================================");
      console.log("[FORGOT PASSWORD] Requesting OTP for:", email.trim());
      console.log("====================================");

      const response = await generateMobOtp(email.trim());

      console.log("====================================");
      console.log("[FORGOT PASSWORD] OTP API response:", response);
      console.log("====================================");

      setLoading(false);

      Alert.alert("OTP Sent", `Check ${email.trim()} for your OTP.`);

      // Adjust this route to wherever your OTP-entry screen actually lives.
      router.push({
        pathname: "/(auth)/verify-otp",
        params: { email: email.trim() },
      });
    } catch (err: any) {
      console.log("====================================");
      console.log("[FORGOT PASSWORD] OTP request failed");
      console.log("[FORGOT PASSWORD] Error:", err);
      console.log("====================================");

      setLoading(false);

      setError(err?.message || "Unable to send OTP. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backRow}>
        <Ionicons
          name="chevron-back"
          size={24}
          color={colors.textPrimary}
          onPress={() => router.back()}
        />
      </View>

      <Text style={styles.title}>Forgot Password?</Text>

      <Image
        source={{
          uri: "https://images.unsplash.com/photo-1587668178277-295251f900ce?w=400",
        }}
        style={styles.image}
      />

      <Text style={styles.description}>
        Enter your email and we will send you an OTP to reset your password.
      </Text>

      <Input
        placeholder="Email"
        icon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setError("");
        }}
        error={error}
      />

      <Button
        title="Send OTP"
        onPress={handleSend}
        loading={loading}
        style={{ marginTop: spacing.sm }}
      />

      <Text style={styles.link} onPress={() => router.push("/(auth)/login")}>
        Back to Login
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: "center",
  },
  backRow: { width: "100%", marginBottom: spacing.lg },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    alignSelf: "flex-start",
    marginBottom: spacing.lg,
    width: "100%",
    textAlign: "center",
  },
  image: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: 999,
    marginBottom: spacing.lg,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  link: {
    ...typography.body,
    color: colors.accentOrange,
    fontWeight: "700",
    marginTop: spacing.lg,
  },
});
