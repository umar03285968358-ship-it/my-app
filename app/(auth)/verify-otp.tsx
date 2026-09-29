import Button from "@/components/Button";
import Input from "@/components/Input";
import { colors, spacing, typography } from "@/constants/theme";
import { changeMobPassword, generateMobOtp } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function VerifyOtpScreen() {
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(params.email ?? "");
  const [otp, setOtp] = useState("");
  const [Password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<{
    email?: string;
    otp?: string;
    Password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    }

    if (!otp.trim()) {
      newErrors.otp = "OTP is required";
    }

    if (!Password.trim()) {
      newErrors.Password = "New password is required";
    } else if (Password.trim().length < 6) {
      newErrors.Password = "Password must be at least 6 characters";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (confirmPassword !== Password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleVerify = async () => {
    setErrors({});

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      console.log("====================================");
      console.log("[VERIFY OTP] Changing password for:", email.trim());
      console.log("====================================");

      const response = await changeMobPassword({
        email: email.trim(),
        otp: otp.trim(),

        // Backend field is `password`
        password: Password.trim(),
      });

      console.log("====================================");
      console.log("[VERIFY OTP] Response:", response);
      console.log("====================================");

      setLoading(false);

      Alert.alert("Success", "Your password has been reset. Please log in.", [
        {
          text: "OK",
          onPress: () => router.replace("/(auth)/login"),
        },
      ]);
    } catch (err: any) {
      console.log("====================================");
      console.log("[VERIFY OTP] Failed:", err);
      console.log("====================================");

      setLoading(false);

      setErrors({
        general: err?.message || "Unable to reset password. Please try again.",
      });
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setErrors((prev) => ({
        ...prev,
        email: "Email is required",
      }));

      return;
    }

    try {
      setResending(true);

      await generateMobOtp(email.trim());

      setResending(false);

      Alert.alert("OTP Sent", `A new OTP was sent to ${email.trim()}.`);
    } catch (err: any) {
      setResending(false);

      Alert.alert("Failed", err?.message || "Unable to resend OTP.");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.backRow}>
        <Ionicons
          name="chevron-back"
          size={24}
          color={colors.textPrimary}
          onPress={() => router.back()}
        />
      </View>

      <Text style={styles.title}>Verify OTP</Text>

      <Image
      source={require('../../assets/images/logo.png')}
        style={styles.image}
      />


      <Text style={styles.description}>
        Enter the OTP sent to your email along with your new password.
      </Text>

      {errors.general ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errors.general}</Text>
        </View>
      ) : null}

      <Input
        placeholder="Email"
        icon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={(text) => {
          setEmail(text);

          setErrors((prev) => ({
            ...prev,
            email: undefined,
            general: undefined,
          }));
        }}
        error={errors.email}
      />

      <Input
        placeholder="OTP"
        icon="keypad-outline"
        keyboardType="number-pad"
        value={otp}
        onChangeText={(text) => {
          setOtp(text);

          setErrors((prev) => ({
            ...prev,
            otp: undefined,
            general: undefined,
          }));
        }}
        error={errors.otp}
      />

      <Input
        placeholder="New Password"
        icon="lock-closed-outline"
        isPassword
        value={Password}
        onChangeText={(text) => {
          setPassword(text);

          setErrors((prev) => ({
            ...prev,
            Password: undefined,
            general: undefined,
          }));
        }}
        error={errors.Password}
      />

      <Input
        placeholder="Confirm New Password"
        icon="lock-closed-outline"
        isPassword
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);

          setErrors((prev) => ({
            ...prev,
            confirmPassword: undefined,
            general: undefined,
          }));
        }}
        error={errors.confirmPassword}
      />

      <Button
        title="Reset Password"
        onPress={handleVerify}
        loading={loading}
        style={{ marginTop: spacing.sm }}
      />

      <Text style={styles.link} onPress={handleResend}>
        {resending ? "Resending..." : "Didn't get the code? Resend OTP"}
      </Text>

      <Text style={styles.link} onPress={() => router.replace("/(auth)/login")}>
        Back to Login
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: "center",
  },

  backRow: {
    width: "100%",
    marginBottom: spacing.lg,
  },

  title: {
    ...typography.h1,
    color: colors.textPrimary,
    alignSelf: "flex-start",
    marginBottom: spacing.lg,
    width: "100%",
    textAlign: "center",
  },

 image: {
  width: width * 0.75,
  height: width * 0.5,
  marginBottom: spacing.lg,
  resizeMode: 'contain',
},
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },

  errorBox: {
    width: "100%",
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },

  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  link: {
    ...typography.body,
    color: colors.accentOrange,
    fontWeight: "700",
    marginTop: spacing.lg,
  },
});
