import Button from "@/components/Button";
import GoogleButton from "@/components/GoogleButton";
import Input from "@/components/Input";
import { colors, spacing, typography } from "@/constants/theme";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import {
  loginUser,
  signupGoogleUser,
} from "@/services/api";
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
 */
function resolvePostLoginRoute(
  user: any,
): "/(rider)/dashboard" | "/(tabs)" {
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
   * HANDLE LOGIN (Shared by Normal and Google)
   * ============================================================
   */
  const handleLoginSuccess = async (
    loginEmail: string,
    loginPassword: string,
    isGoogle: boolean,
  ) => {
    try {
      console.log("");
      console.log("====================================");
      console.log(
        `[LOGIN SCREEN] STARTING ${
          isGoogle ? "GOOGLE" : "NORMAL"
        } LOGIN`,
      );
      console.log("====================================");
      console.log("[LOGIN SCREEN] Email:", loginEmail);
      console.log(
        "[LOGIN SCREEN] Password:",
        isGoogle ? '"!@#" (Google)' : "PROVIDED",
      );
      console.log(
        "[LOGIN SCREEN] RegType:",
        isGoogle ? "Google" : "Normal",
      );

      const response = await loginUser(
        loginEmail,
        loginPassword,
        isGoogle ? "Google" : "Normal",
      );

      console.log(
        "[LOGIN SCREEN] Login API response:",
        response,
      );

      const backendMessage = String(
        response?.msg ??
          response?.message ??
          "",
      ).trim();

      const normalizedMessage =
        backendMessage.toLowerCase();

      console.log(
        "[LOGIN SCREEN] Backend message:",
        backendMessage,
      );

      /*
       * ========================================================
       * DETECT EXPLICIT BACKEND FAILURE
       * ========================================================
       */
      const hasExplicitFailure =
        normalizedMessage.includes("invalid user") ||
        normalizedMessage.includes("invalid password") ||
        normalizedMessage.includes("invalid login") ||
        normalizedMessage.includes("login failed") ||
        normalizedMessage.includes("user not found") ||
        normalizedMessage.includes("account not found") ||
        normalizedMessage.includes("incorrect password") ||
        normalizedMessage.includes("wrong password") ||
        normalizedMessage.includes("unauthorized") ||
        normalizedMessage.includes("not exist");

      if (hasExplicitFailure) {
        console.warn(
          "[LOGIN SCREEN] Login rejected by backend:",
          backendMessage,
        );

        throw new Error(
          backendMessage ||
            "Unable to login. Please check your credentials.",
        );
      }

      /*
       * ========================================================
       * EXTRACT USER
       * ========================================================
       */
      const loggedInUser =
        response?.user?.[0] ??
        response?.user ??
        null;

      if (!loggedInUser) {
        console.warn(
          "[LOGIN SCREEN] Login response did not contain user data.",
        );

        throw new Error(
          backendMessage ||
            "Unable to login. Please check your credentials.",
        );
      }

      console.log(
        "[LOGIN SCREEN] User returned by API:",
        loggedInUser,
      );

      console.log(
        "[LOGIN SCREEN] userType:",
        loggedInUser?.userType,
      );

      /*
       * ========================================================
       * BACKEND TOKEN
       * ========================================================
       */
      const token =
        response?.Token ??
        response?.token ??
        response?.AccessToken ??
        response?.accessToken ??
        "logged-in";

      console.log(
        "[LOGIN SCREEN] Backend token available:",
        token ? "YES" : "NO",
      );

      /*
       * ========================================================
       * SAVE SESSION
       * ========================================================
       */
      await saveSession(token, loggedInUser);

      console.log(
        "[LOGIN SCREEN] ✅ Login session saved.",
      );

      /*
       * ========================================================
       * ROUTING
       * ========================================================
       */
      const destination =
        resolvePostLoginRoute(loggedInUser);

      console.log(
        "[LOGIN SCREEN] User type:",
        loggedInUser?.userType,
      );

      console.log(
        "[LOGIN SCREEN] Redirecting to:",
        destination,
      );

      console.log(
        "====================================",
      );
      console.log(
        `[LOGIN SCREEN] ${
          isGoogle ? "GOOGLE" : "NORMAL"
        } LOGIN SUCCESS`,
      );
      console.log(
        "====================================",
      );
      console.log("");

      // For Google login, redirect without alert
      if (isGoogle) {
        router.replace(destination);
      } else {
        // For normal login, show alert then redirect
        Alert.alert(
          "Login Successful",
          "Welcome back!",
          [
            {
              text: "OK",
              onPress: () =>
                router.replace(destination),
            },
          ],
        );
      }
    } catch (error: any) {
      console.log("");
      console.log("====================================");
      console.log(
        `[LOGIN SCREEN] ${
          isGoogle ? "GOOGLE" : "NORMAL"
        } LOGIN FAILED`,
      );
      console.log("====================================");
      console.error(
        "[LOGIN SCREEN] Login error:",
        error,
      );
      console.log("====================================");
      console.log("");

      Alert.alert(
        "Login Failed",
        error?.message ||
          "Unable to login. Please check your credentials.",
      );
    }
  };

  /*
   * ============================================================
   * GOOGLE LOGIN (WITH AUTO SIGNUP IF NEEDED)
   * ============================================================
   */
  const {
    promptGoogleLogin,
    loading: googleLoading,
  } = useGoogleAuth({
    onSuccess: async (user) => {
      try {
        console.log("");
        console.log(
          "####################################################",
        );
        console.log(
          "############ GOOGLE AUTH SUCCESS ###################",
        );
        console.log(
          "####################################################",
        );

        console.log(
          "[LOGIN SCREEN] Google user received:",
          user,
        );

        console.log(
          "[LOGIN SCREEN] Google email:",
          user?.email,
        );

        console.log(
          "[LOGIN SCREEN] Google ID:",
          user?.id,
        );

        /*
         * ========================================================
         * STEP 1: TRY GOOGLE SIGNUP FIRST
         * ========================================================
         * If account doesn't exist, this will create it.
         * If account already exists, we'll get "Email Already Exist"
         */
        const googleFirstName =
          user.given_name ||
          user.name.trim().split(" ")[0] ||
          "";

        const googleLastName =
          user.family_name ||
          user.name.trim().split(" ").slice(1).join(" ") ||
          "";

        console.log(
          "[LOGIN SCREEN] Attempting Google signup...",
        );

        let signupResponse;
        try {
          signupResponse = await signupGoogleUser({
            firstName: googleFirstName,
            lastName: googleLastName,
            email: user.email,
            googleId: user.id,
          });

          console.log(
            "[LOGIN SCREEN] Google signup response:",
            signupResponse,
          );
        } catch (signupError: any) {
          console.log(
            "[LOGIN SCREEN] Signup attempt failed:",
            signupError?.message,
          );
          // Continue to login even if signup fails
        }

        /*
         * ========================================================
         * STEP 2: CHECK IF SIGNUP SUCCEEDED OR EMAIL EXISTS
         * ========================================================
         */
        const signupMessage = String(
          signupResponse?.msg ?? "",
        ).trim();

        const normalizedSignupMessage =
          signupMessage.toLowerCase();

        const isSignupSuccess =
          normalizedSignupMessage.includes(
            "data saved successfully",
          ) ||
          normalizedSignupMessage.includes(
            "saved successfully",
          ) ||
          normalizedSignupMessage.includes(
            "user created successfully",
          ) ||
          normalizedSignupMessage.includes(
            "account created successfully",
          ) ||
          normalizedSignupMessage.includes(
            "registration successful",
          ) ||
          normalizedSignupMessage.includes(
            "registered successfully",
          );

        const isEmailExists =
          normalizedSignupMessage.includes(
            "already exist",
          ) ||
          normalizedSignupMessage.includes(
            "already registered",
          ) ||
          normalizedSignupMessage.includes(
            "email exists",
          );

        console.log(
          "[LOGIN SCREEN] Signup success:",
          isSignupSuccess,
        );

        console.log(
          "[LOGIN SCREEN] Email exists:",
          isEmailExists,
        );

        /*
         * ========================================================
         * STEP 3: LOGIN WITH GOOGLE (REGARDLESS OF SIGNUP RESULT)
         * ========================================================
         * Whether signup succeeded or email already exists,
         * we proceed to login with password "!@#" and RegType "Google"
         */
        if (isSignupSuccess || isEmailExists) {
          console.log(
            "[LOGIN SCREEN] Proceeding to Google login...",
          );

          await handleLoginSuccess(
            user.email,
            "!@#",
            true,
          );
        } else {
          // Signup failed for some other reason
          throw new Error(
            signupMessage ||
              "Google authentication failed.",
          );
        }
      } catch (error: any) {
        console.log("");
        console.log(
          "####################################################",
        );
        console.log(
          "######## GOOGLE LOGIN FAILED #######################",
        );
        console.log(
          "####################################################",
        );

        console.error(
          "[LOGIN SCREEN] Google login failed:",
          error,
        );

        console.log(
          "####################################################",
        );
        console.log("");

        Alert.alert(
          "Google Login Failed",
          error?.message ??
            "Unable to login with Google.",
        );
      }
    },

    onError: (message) => {
      console.log("");
      console.log(
        "####################################################",
      );
      console.log(
        "############ GOOGLE AUTH FAILED ####################",
      );
      console.log(
        "####################################################",
      );

      console.error(
        "[LOGIN SCREEN] Google error:",
        message,
      );

      console.log(
        "####################################################",
      );
      console.log("");

      Alert.alert(
        "Google Login Failed",
        message,
      );
    },
  });

  /*
   * ============================================================
   * NORMAL EMAIL/PASSWORD LOGIN
   * ============================================================
   */
  const handleLogin = async () => {
    try {
      setLoading(true);

      const cleanEmail = email.trim();

      if (!cleanEmail || !password) {
        Alert.alert(
          "Login Failed",
          "Please enter both email and password.",
        );
        return;
      }

      await handleLoginSuccess(
        cleanEmail,
        password,
        false,
      );
    } catch (error: any) {
      console.error(
        "[LOGIN SCREEN] Login error:",
        error,
      );

      Alert.alert(
        "Login Failed",
        error?.message ||
          "Unable to login. Please check your email and password.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */
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

      {/* EMAIL */}
      <Input
        placeholder="Email"
        icon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      {/* PASSWORD */}
      <Input
        placeholder="Password"
        icon="lock-closed-outline"
        isPassword
        value={password}
        onChangeText={setPassword}
      />

      {/* FORGOT PASSWORD */}
      <Text
        style={styles.forgot}
        onPress={() =>
          router.push("/(auth)/forgot-password")
        }
      >
        Forgot Password?
      </Text>

      {/* NORMAL LOGIN */}
      <Button
        title="Login"
        onPress={handleLogin}
        loading={loading}
        style={{ marginTop: spacing.sm }}
      />

      {/* GOOGLE */}
      <Text style={styles.orText}>Or Continue with</Text>

      <View style={styles.googleContainer}>
        <GoogleButton
          onPress={promptGoogleLogin}
          loading={googleLoading}
        />
      </View>

      {/* SIGNUP */}
      <Text style={styles.footerText}>
        Don't have an account?{" "}
        <Text
          style={styles.link}
          onPress={() => router.push("/(auth)/signup")}
        >
          Sign Up
        </Text>
      </Text>
    </ScrollView>
  );
}

/*
 * ============================================================
 * STYLES
 * ============================================================
 */
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