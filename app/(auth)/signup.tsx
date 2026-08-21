import Button from "@/components/Button";
import GoogleButton from "@/components/GoogleButton";
import Input from "@/components/Input";
import { colors, spacing, typography } from "@/constants/theme";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { signupUser } from "@/services/api";
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

export default function SignupScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  /*
   * ============================================================
   * VALIDATION ERRORS
   * ============================================================
   */

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  /*
   * ============================================================
   * REGEX
   * ============================================================
   */

  const nameRegex = /^[A-Za-zÀ-ÿ]+(?:[ '-][A-Za-zÀ-ÿ]+)*$/;

  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  const phoneRegex = /^(?:03\d{9}|923\d{9}|\+923\d{9})$/;

  /*
   * ============================================================
   * ERROR UPDATE HELPER
   * ============================================================
   */

  const setFieldError = (field: keyof typeof errors, message: string) => {
    setErrors((previous) => ({
      ...previous,
      [field]: message,
    }));
  };

  /*
   * ============================================================
   * FIRST NAME VALIDATION
   * ============================================================
   */

  const validateFirstName = (value: string) => {
    const cleanValue = value.trim();

    if (!cleanValue) {
      return "First name is required.";
    }

    if (cleanValue.length < 2) {
      return "First name must contain at least 2 characters.";
    }

    if (cleanValue.length > 30) {
      return "First name cannot be longer than 30 characters.";
    }

    if (!nameRegex.test(cleanValue)) {
      return "Only letters, spaces, apostrophes and hyphens are allowed.";
    }

    return "";
  };

  /*
   * ============================================================
   * LAST NAME VALIDATION
   * ============================================================
   */

  const validateLastName = (value: string) => {
    const cleanValue = value.trim();

    if (!cleanValue) {
      return "Last name is required.";
    }

    if (cleanValue.length < 2) {
      return "Last name must contain at least 2 characters.";
    }

    if (cleanValue.length > 30) {
      return "Last name cannot be longer than 30 characters.";
    }

    if (!nameRegex.test(cleanValue)) {
      return "Only letters, spaces, apostrophes and hyphens are allowed.";
    }

    return "";
  };

  /*
   * ============================================================
   * EMAIL VALIDATION
   * ============================================================
   */

  const validateEmail = (value: string) => {
    const cleanValue = value.trim();

    if (!cleanValue) {
      return "Email address is required.";
    }

    if (cleanValue.length > 100) {
      return "Email address is too long.";
    }

    if (!emailRegex.test(cleanValue)) {
      return "Please enter a valid email address.";
    }

    return "";
  };

  /*
   * ============================================================
   * PHONE VALIDATION
   * ============================================================
   */

  const validatePhone = (value: string) => {
    const cleanValue = value.trim().replace(/\s+/g, "");

    if (!cleanValue) {
      return "Mobile number is required.";
    }

    if (!phoneRegex.test(cleanValue)) {
      return "Enter a valid Pakistani mobile number.";
    }

    return "";
  };

  /*
   * ============================================================
   * PASSWORD VALIDATION
   * ============================================================
   */

  const validatePassword = (value: string) => {
    if (!value) {
      return "Password is required.";
    }

    if (value.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (value.length > 64) {
      return "Password cannot be longer than 64 characters.";
    }

    if (!/[A-Z]/.test(value)) {
      return "Password must contain an uppercase letter.";
    }

    if (!/[a-z]/.test(value)) {
      return "Password must contain a lowercase letter.";
    }

    if (!/[0-9]/.test(value)) {
      return "Password must contain a number.";
    }

    return "";
  };

  /*
   * ============================================================
   * CONFIRM PASSWORD VALIDATION
   * ============================================================
   */

  const validateConfirmPassword = (value: string, currentPassword: string) => {
    if (!value) {
      return "Please confirm your password.";
    }

    if (value !== currentPassword) {
      return "Passwords do not match.";
    }

    return "";
  };

  /*
   * ============================================================
   * GOOGLE SIGNUP
   * ============================================================
   */

  const { promptGoogleLogin, loading: googleLoading } = useGoogleAuth({
    onSuccess: async (user, accessToken) => {
      try {
        console.log("====================================");
        console.log("[SIGNUP SCREEN] GOOGLE SIGNUP SUCCESS");
        console.log("[SIGNUP SCREEN] Google User:", user);
        console.log("====================================");

        await saveSession(`google:${accessToken}`, {
          ...user,
          authProvider: "google",
          googleId: user.id,
          googleAccessToken: accessToken,
        });

        console.log("[SIGNUP SCREEN] Google session saved to AsyncStorage.");

        router.replace("/(tabs)");
      } catch (error: any) {
        console.log("[SIGNUP SCREEN] Failed to save Google session:", error);

        Alert.alert(
          "Google Sign-Up Failed",
          error?.message ?? "Unable to save your Google session.",
        );
      }
    },

    onError: (message) => {
      console.log("====================================");
      console.log("[SIGNUP SCREEN] GOOGLE SIGNUP FAILED");
      console.log("[SIGNUP SCREEN] Error:", message);
      console.log("====================================");

      Alert.alert("Google Sign-Up Failed", message);
    },
  });

  /*
   * ============================================================
   * HANDLE SIGNUP
   * ============================================================
   */

  const handleSignup = async () => {
    const firstNameError = validateFirstName(firstName);
    const lastNameError = validateLastName(lastName);
    const emailError = validateEmail(email);
    const phoneError = validatePhone(phone);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(
      confirmPassword,
      password,
    );

    const validationErrors = {
      firstName: firstNameError,
      lastName: lastNameError,
      email: emailError,
      phone: phoneError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    };

    setErrors(validationErrors);

    const hasErrors = Object.values(validationErrors).some(
      (error) => error.length > 0,
    );

    if (hasErrors) {
      return;
    }

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim().replace(/\s+/g, "");

    try {
      setLoading(true);

      console.log("====================================");
      console.log("[SIGNUP SCREEN] Starting signup...");
      console.log("[SIGNUP SCREEN] First Name:", cleanFirstName);
      console.log("[SIGNUP SCREEN] Last Name:", cleanLastName);
      console.log("[SIGNUP SCREEN] Email:", cleanEmail);
      console.log("[SIGNUP SCREEN] Phone:", cleanPhone);
      console.log("====================================");

      const response = await signupUser({
        firstName: cleanFirstName,
        lastName: cleanLastName,
        email: cleanEmail,
        phone: cleanPhone,
        password,
      });

      console.log("====================================");
      console.log("[SIGNUP SCREEN] Signup API response:", response);
      console.log("====================================");

      setLoading(false);

      Alert.alert(
        "Account Created",
        "Your account has been created successfully. Please login to continue.",
        [
          {
            text: "Login",
            onPress: () => {
              router.replace("/(auth)/login");
            },
          },
        ],
      );
    } catch (error: any) {
      console.log("====================================");
      console.log("[SIGNUP SCREEN] Signup failed");
      console.log("[SIGNUP SCREEN] Error:", error);
      console.log("====================================");

      setLoading(false);

      Alert.alert(
        "Signup Failed",
        error?.message || "Unable to create your account. Please try again.",
      );
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
      <Text style={styles.title}>Create Account</Text>

      <Text style={styles.subtitle}>Let's get you started</Text>

      <Image
        source={{
          uri: "https://i.pinimg.com/1200x/7c/e5/c0/7ce5c0cf8df035e6126d57b4e271dbac.jpg",
        }}
        style={styles.image}
      />

      {/* ========================================================
          NAME
      ======================================================== */}

      <View style={styles.nameRow}>
        <View style={styles.nameInput}>
          <Input
            placeholder="First Name"
            icon="person-outline"
            autoCapitalize="words"
            autoCorrect={false}
            value={firstName}
            onChangeText={(value) => {
              setFirstName(value);

              if (errors.firstName) {
                setFieldError("firstName", validateFirstName(value));
              }
            }}
            onBlur={() => {
              setFieldError("firstName", validateFirstName(firstName));
            }}
          />

          {!!errors.firstName && (
            <Text style={styles.errorText}>{errors.firstName}</Text>
          )}
        </View>

        <View style={styles.nameInput}>
          <Input
            placeholder="Last Name"
            icon="person-outline"
            autoCapitalize="words"
            autoCorrect={false}
            value={lastName}
            onChangeText={(value) => {
              setLastName(value);

              if (errors.lastName) {
                setFieldError("lastName", validateLastName(value));
              }
            }}
            onBlur={() => {
              setFieldError("lastName", validateLastName(lastName));
            }}
          />

          {!!errors.lastName && (
            <Text style={styles.errorText}>{errors.lastName}</Text>
          )}
        </View>
      </View>

      {/* ========================================================
          EMAIL
      ======================================================== */}

      <View style={styles.fieldContainer}>
        <Input
          placeholder="Email"
          icon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={(value) => {
            setEmail(value);

            if (errors.email) {
              setFieldError("email", validateEmail(value));
            }
          }}
          onBlur={() => {
            setFieldError("email", validateEmail(email));
          }}
        />

        {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      {/* ========================================================
          PHONE
      ======================================================== */}

      <View style={styles.fieldContainer}>
        <Input
          placeholder="Mobile Number"
          icon="call-outline"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(value) => {
            setPhone(value);

            if (errors.phone) {
              setFieldError("phone", validatePhone(value));
            }
          }}
          onBlur={() => {
            setFieldError("phone", validatePhone(phone));
          }}
        />

        {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      {/* ========================================================
          PASSWORD
      ======================================================== */}

      <View style={styles.fieldContainer}>
        <Input
          placeholder="Password"
          icon="lock-closed-outline"
          isPassword
          value={password}
          onChangeText={(value) => {
            setPassword(value);

            if (errors.password) {
              setFieldError("password", validatePassword(value));
            }

            if (confirmPassword) {
              setFieldError(
                "confirmPassword",
                validateConfirmPassword(confirmPassword, value),
              );
            }
          }}
          onBlur={() => {
            setFieldError("password", validatePassword(password));
          }}
        />

        {!!errors.password && (
          <Text style={styles.errorText}>{errors.password}</Text>
        )}

        {!errors.password && password.length === 0 && (
          <Text style={styles.passwordHint}>
            8+ characters, uppercase, lowercase and number
          </Text>
        )}
      </View>

      {/* ========================================================
          CONFIRM PASSWORD
      ======================================================== */}

      <View style={styles.fieldContainer}>
        <Input
          placeholder="Confirm Password"
          icon="lock-closed-outline"
          isPassword
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);

            if (errors.confirmPassword) {
              setFieldError(
                "confirmPassword",
                validateConfirmPassword(value, password),
              );
            }
          }}
          onBlur={() => {
            setFieldError(
              "confirmPassword",
              validateConfirmPassword(confirmPassword, password),
            );
          }}
        />

        {!!errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        )}
      </View>

      {/* ========================================================
          SIGN UP BUTTON
      ======================================================== */}

      <Button
        title="Sign Up"
        onPress={handleSignup}
        loading={loading}
        style={{
          marginTop: spacing.sm,
        }}
      />

      {/* ========================================================
          GOOGLE
      ======================================================== */}

      <Text style={styles.orText}>Or Continue with</Text>

      <View style={styles.googleContainer}>
        <GoogleButton onPress={promptGoogleLogin} loading={googleLoading} />
      </View>

      {/* ========================================================
          LOGIN
      ======================================================== */}

      <Text style={styles.footerText}>
        Already have an account?{" "}
        <Text style={styles.link} onPress={() => router.push("/(auth)/login")}>
          Login
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
    width: "100%",
    textAlign: "center",
  },

  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
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

  nameRow: {
    width: "100%",
    flexDirection: "row",
    gap: spacing.sm,
  },

  nameInput: {
    flex: 1,
  },

  fieldContainer: {
    width: "100%",
  },

  errorText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#D32F2F",
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },

  passwordHint: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
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
