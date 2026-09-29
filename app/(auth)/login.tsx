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
import {
  updateOneSignalUser,
} from "@/services/oneSignal";
import { resolvePostLoginRoute } from "@/utils/authRouting";
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
      const response = await loginUser(
        loginEmail,
        loginPassword,
        isGoogle ? "Google" : "Normal",
      );

      const backendMessage = String(
        response?.msg ??
          response?.message ??
          "",
      ).trim();

      const normalizedMessage =
        backendMessage.toLowerCase();

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
        throw new Error(
          backendMessage ||
            "Unable to login. Please check your credentials.",
        );
      }

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

      /*
       * ========================================================
       * SAVE SESSION
       * ========================================================
       */
      await saveSession(token, loggedInUser);

      /*
       * ========================================================
       * ONESIGNAL
       * ========================================================
       *
       * The backend login response contains:
       *
       * mobUserID
       *
       * This ID is used as the OneSignal External ID.
       * The Subscription ID is obtained inside
       * updateOneSignalUser() and is NOT sent to the backend
       * from this screen.
       */
      const oneSignalUserId =
        loggedInUser?.mobUserID;

      if (
        oneSignalUserId !== undefined &&
        oneSignalUserId !== null &&
        String(oneSignalUserId).trim() !== ""
      ) {
        await updateOneSignalUser(oneSignalUserId);
      }

      /*
       * ========================================================
       * ROUTING
       * ========================================================
       * After successful login, redirect immediately.
       * No success modal / extra click required.
       */
      const destination =
        resolvePostLoginRoute(loggedInUser);

      router.replace(destination);
    } catch (error: any) {
      console.error(
        "[LOGIN SCREEN] Login error:",
        error,
      );

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

        let signupResponse;
        try {
          signupResponse = await signupGoogleUser({
            firstName: googleFirstName,
            lastName: googleLastName,
            email: user.email,
            googleId: user.id,
          });
        } catch (signupError: any) {
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

        /*
         * ========================================================
         * STEP 3: LOGIN WITH GOOGLE (REGARDLESS OF SIGNUP RESULT)
         * ========================================================
         */
        if (isSignupSuccess || isEmailExists) {
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
        console.error(
          "[LOGIN SCREEN] Google login failed:",
          error,
        );

        Alert.alert(
          "Google Login Failed",
          error?.message ??
            "Unable to login with Google.",
        );
      }
    },

    onError: (message) => {
      console.error(
        "[LOGIN SCREEN] Google error:",
        message,
      );

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
      source={require('../../assets/images/logo.png')}
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
    marginTop:2,
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
  width: width * 0.75,
  height: width * 0.5,
  marginBottom: spacing.lg,
  resizeMode: 'contain',
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