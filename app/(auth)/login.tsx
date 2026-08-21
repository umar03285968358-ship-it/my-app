import Button from "@/components/Button";
import GoogleButton from "@/components/GoogleButton";
import Input from "@/components/Input";
import { colors, spacing, typography } from "@/constants/theme";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { loginUser } from "@/services/api";
import { saveSession } from "@/services/authStorage";
import { router } from "expo-router";
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

/*
 * ============================================================
 * ROUTE RESOLVER
 * ============================================================
 *
 * Decides where to send the user after login based on
 * userType returned by the API.
 *
 * - "Rider"    -> rider dashboard/orders tab group
 * - anything else (e.g. "Customer") -> normal customer tabs
 */
function resolvePostLoginRoute(user: any): "/(rider)/dashboard" | "/(tabs)" {
  const userType = String(user?.userType ?? "")
    .trim()
    .toLowerCase();

  if (userType === "rider") {
    return "/(rider)/dashboard";
  }

  return "/(tabs)";
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  /*
   * ============================================================
   * GOOGLE LOGIN
   * ============================================================
   *
   * Google is frontend-only.
   *
   * Google account
   *      ↓
   * Google profile
   *      ↓
   * AsyncStorage
   *      ↓
   * Tabs
   *
   * No backend Google API is used.
   *
   * NOTE: Google sign-in has no userType from your backend,
   * so it always goes to the customer tabs. Riders are expected
   * to use normal email/password login.
   */
  const { promptGoogleLogin, loading: googleLoading } = useGoogleAuth({
    onSuccess: async (user, accessToken) => {
      try {
        console.log("====================================");
        console.log("[LOGIN SCREEN] GOOGLE LOGIN SUCCESS");
        console.log("[LOGIN SCREEN] Google User:", user);
        console.log("====================================");

        /*
         * Store the Google access token and Google profile
         * in the same AsyncStorage session used by
         * normal login.
         */
        await saveSession(`google:${accessToken}`, {
          ...user,

          /*
           * Extra fields make it easier to identify
           * this locally stored session later.
           */
          authProvider: "google",
          googleId: user.id,
          googleAccessToken: accessToken,
        });

        console.log("[LOGIN SCREEN] Google session saved to AsyncStorage.");

        /*
         * Enter the application.
         */
        router.replace("/(tabs)");
      } catch (error: any) {
        console.log("[LOGIN SCREEN] Failed to save Google session:", error);

        Alert.alert(
          "Google Login Failed",
          error?.message ?? "Unable to save your Google session.",
        );
      }
    },

    onError: (message) => {
      console.log("====================================");
      console.log("[LOGIN SCREEN] GOOGLE LOGIN FAILED");
      console.log("[LOGIN SCREEN] Error:", message);
      console.log("====================================");

      Alert.alert("Google Login Failed", message);
    },
  });

  /*
   * ============================================================
   * NORMAL LOGIN
   * ============================================================
   *
   * Your existing login API remains unchanged.
   */
  const handleLogin = async () => {
    try {
      setLoading(true);

      console.log("====================================");
      console.log("[LOGIN SCREEN] Starting login...");
      console.log("[LOGIN SCREEN] Email:", email.trim());
      console.log("====================================");

      const response = await loginUser(email.trim(), password);

      console.log("====================================");
      console.log("[LOGIN SCREEN] Login API response:", response);
      console.log("====================================");

      /*
       * API returned HTTP 200-299.
       *
       * Your API wraps the actual user inside
       * response.user.
       */
      const loggedInUser = response?.user?.[0] ?? response?.user ?? null;

      if (!loggedInUser) {
        throw new Error("Login succeeded but no user data was returned.");
      }

      console.log("====================================");
      console.log("[LOGIN SCREEN] Unwrapped user to save:", loggedInUser);
      console.log("[LOGIN SCREEN] userType:", loggedInUser?.userType);
      console.log("[LOGIN SCREEN] riderID:", loggedInUser?.riderID);
      console.log("====================================");

      /*
       * Use the token if your backend returns one.
       *
       * Otherwise keep your existing fallback.
       */
      const token =
        response?.Token ??
        response?.token ??
        response?.AccessToken ??
        response?.accessToken ??
        "logged-in";

      await saveSession(token, loggedInUser);

      setLoading(false);

      /*
       * ============================================================
       * REDIRECT BASED ON userType
       * ============================================================
       *
       * "Rider"    -> /(rider)  (rider dashboard + orders tabs)
       * "Customer" -> /(tabs)   (existing customer tabs)
       */
      const destination = resolvePostLoginRoute(loggedInUser);

      console.log("[LOGIN SCREEN] Redirecting to:", destination);

      router.replace(destination);
    } catch (error: any) {
      console.log("====================================");
      console.log("[LOGIN SCREEN] Login failed");
      console.log("[LOGIN SCREEN] Error:", error);
      console.log("====================================");

      setLoading(false);

      Alert.alert(
        "Login Failed",
        error?.message ||
          "Unable to login. Please check your email and password.",
      );
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Welcome Back!</Text>

      <Text style={styles.subtitle}>Sign in to continue</Text>

      <Image
        source={{
          uri: "https://i.pinimg.com/1200x/7c/e5/c0/7ce5c0cf8df035e6126d57b4e271dbac.jpg",
        }}
        style={styles.image}
      />

      <Input
        placeholder="Email"
        icon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      <Input
        placeholder="Password"
        icon="lock-closed-outline"
        isPassword
        value={password}
        onChangeText={setPassword}
      />

      <Text
        style={styles.forgot}
        onPress={() => router.push("/(auth)/forgot-password")}
      >
        Forgot Password?
      </Text>

      <Button
        title="Login"
        onPress={handleLogin}
        loading={loading}
        style={{
          marginTop: spacing.sm,
        }}
      />

      <Text style={styles.orText}>Or Continue with</Text>

      <View style={styles.googleContainer}>
        <GoogleButton onPress={promptGoogleLogin} loading={googleLoading} />
      </View>

      <Text style={styles.footerText}>
        Don't have an account?{" "}
        <Text style={styles.link} onPress={() => router.push("/(auth)/signup")}>
          Sign Up
        </Text>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    alignItems: "center",
  },

  title: {
    ...typography.h1,
    color: colors.textPrimary,
    alignSelf: "flex-start",
    width: "100%",
    textAlign: "center",
  },

  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    alignSelf: "flex-start",
    marginBottom: spacing.md,
    width: "100%",
    textAlign: "center",
  },

  image: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: 999,
    marginBottom: spacing.lg,
  },

  forgot: {
    ...typography.caption,
    color: colors.accentOrange,
    alignSelf: "flex-end",
    marginBottom: spacing.md,
    fontWeight: "600",
  },

  orText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginVertical: spacing.md,
  },

  googleContainer: {
    width: "100%",
    marginBottom: spacing.lg,
  },

  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  link: {
    color: colors.accentOrange,
    fontWeight: "700",
  },
});
