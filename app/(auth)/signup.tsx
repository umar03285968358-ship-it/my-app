import Button from "@/components/Button";
import Input from "@/components/Input";
import KeyboardScreen from "@/components/KeyboardScreen";
import { colors, spacing, typography } from "@/constants/theme";
import { signupUser } from "@/services/api";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
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

  const nameRegex =
    /^[A-Za-zÀ-ÿ]+(?:[ '-][A-Za-zÀ-ÿ]+)*$/;

  const emailRegex =
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  const phoneRegex =
    /^(?:03\d{9}|923\d{9}|\+923\d{9})$/;

  /*
   * ============================================================
   * ERROR HELPER
   * ============================================================
   */

  const setFieldError = (
    field: keyof typeof errors,
    message: string,
  ) => {
    setErrors((previous) => ({
      ...previous,
      [field]: message,
    }));
  };

  /*
   * ============================================================
   * VALIDATION
   * ============================================================
   */

  const validateFirstName = (value: string) => {
    const cleanValue = value.trim();

    if (!cleanValue) return "First name is required.";

    if (cleanValue.length < 2)
      return "First name must contain at least 2 characters.";

    if (cleanValue.length > 30)
      return "First name cannot be longer than 30 characters.";

    if (!nameRegex.test(cleanValue))
      return "Only letters, spaces, apostrophes and hyphens are allowed.";

    return "";
  };

  const validateLastName = (value: string) => {
    const cleanValue = value.trim();

    if (!cleanValue) return "Last name is required.";

    if (cleanValue.length < 2)
      return "Last name must contain at least 2 characters.";

    if (cleanValue.length > 30)
      return "Last name cannot be longer than 30 characters.";

    if (!nameRegex.test(cleanValue))
      return "Only letters, spaces, apostrophes and hyphens are allowed.";

    return "";
  };

  const validateEmail = (value: string) => {
    const cleanValue = value.trim();

    if (!cleanValue) return "Email address is required.";

    if (cleanValue.length > 100)
      return "Email address is too long.";

    if (!emailRegex.test(cleanValue))
      return "Please enter a valid email address.";

    return "";
  };

  const validatePhone = (value: string) => {
    const cleanValue = value.trim().replace(/\s+/g, "");

    if (!cleanValue)
      return "Mobile number is required.";

    if (!phoneRegex.test(cleanValue))
      return "Enter a valid Pakistani mobile number.";

    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required.";

    if (value.length < 8)
      return "Password must be at least 8 characters.";

    if (value.length > 64)
      return "Password cannot be longer than 64 characters.";

    if (!/[A-Z]/.test(value))
      return "Password must contain an uppercase letter.";

    if (!/[a-z]/.test(value))
      return "Password must contain a lowercase letter.";

    if (!/[0-9]/.test(value))
      return "Password must contain a number.";

    return "";
  };

  const validateConfirmPassword = (
    value: string,
    currentPassword: string,
  ) => {
    if (!value)
      return "Please confirm your password.";

    if (value !== currentPassword)
      return "Passwords do not match.";

    return "";
  };

  /*
   * ============================================================
   * NORMAL SIGNUP
   * ============================================================
   */

  const handleSignup = async () => {
    const validationErrors = {
      firstName: validateFirstName(firstName),
      lastName: validateLastName(lastName),
      email: validateEmail(email),
      phone: validatePhone(phone),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(
        confirmPassword,
        password,
      ),
    };

    setErrors(validationErrors);

    const hasErrors = Object.values(
      validationErrors,
    ).some((error) => error.length > 0);

    if (hasErrors) return;

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim().replace(/\s+/g, "");

    try {
      setLoading(true);

      console.log(
        "[SIGNUP SCREEN] Starting normal signup...",
      );

      const response = await signupUser({
        firstName: cleanFirstName,
        lastName: cleanLastName,
        email: cleanEmail,
        phone: cleanPhone,
        password,
      });

      console.log(
        "[SIGNUP SCREEN] Signup response:",
        response,
      );

      /*
       * ============================================================
       * CHECK BACKEND RESPONSE
       * ============================================================
       */

      const message = String(
        response?.msg ?? "",
      ).trim();

      console.log(
        "[SIGNUP SCREEN] Backend message:",
        message,
      );

      const normalizedMessage =
        message.toLowerCase();

      const isSuccess =
        normalizedMessage.includes(
          "data saved successfully",
        ) ||
        normalizedMessage.includes(
          "saved successfully",
        ) ||
        normalizedMessage.includes(
          "user created successfully",
        ) ||
        normalizedMessage.includes(
          "account created successfully",
        ) ||
        normalizedMessage.includes(
          "registration successful",
        ) ||
        normalizedMessage.includes(
          "registered successfully",
        );

      const isEmailExists =
        normalizedMessage.includes(
          "already exist",
        ) ||
        normalizedMessage.includes(
          "already registered",
        ) ||
        normalizedMessage.includes(
          "email exists",
        );

      if (isSuccess) {
        console.log(
          "[SIGNUP SCREEN] ✅ Account created successfully.",
        );

        Alert.alert(
          "Account Created",
          "Your account has been created successfully. Please login to continue.",
          [
            {
              text: "Login",
              onPress: () =>
                router.replace("/(auth)/login"),
            },
          ],
        );
      } else if (isEmailExists) {
        /*
         * ============================================================
         * EMAIL ALREADY EXISTS
         * ============================================================
         */

        console.warn(
          "[SIGNUP SCREEN] Email already exists:",
          message,
        );

        Alert.alert(
          "Signup Failed",
          message ||
            "Email already exists. Please use a different email or login.",
        );
      } else {
        /*
         * ============================================================
         * OTHER BACKEND ERROR
         * ============================================================
         */

        console.warn(
          "[SIGNUP SCREEN] Signup rejected by backend:",
          message,
        );

        Alert.alert(
          "Signup Failed",
          message ||
            "Unable to create your account. Please try again.",
        );
      }
    } catch (error: any) {
      console.error(
        "[SIGNUP SCREEN] Signup failed:",
        error,
      );

      Alert.alert(
        "Signup Failed",
        error?.message ??
          "Unable to create your account. Please try again.",
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
    <KeyboardScreen>
      <View style={styles.container}>
        {/* TITLE */}
        <Text style={styles.title}>
          Create Account
        </Text>

        {/* SUBTITLE */}
        <Text style={styles.subtitle}>
          Let's get you started
        </Text>

        {/* SIGNUP IMAGE */}
      <Image
      source={require('../../assets/images/logo.png')}
        style={styles.image}
      />

        {/* NAME ROW */}
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
                  setFieldError(
                    "firstName",
                    validateFirstName(value),
                  );
                }
              }}
              onBlur={() =>
                setFieldError(
                  "firstName",
                  validateFirstName(firstName),
                )
              }
            />

            {!!errors.firstName && (
              <Text style={styles.errorText}>
                {errors.firstName}
              </Text>
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
                  setFieldError(
                    "lastName",
                    validateLastName(value),
                  );
                }
              }}
              onBlur={() =>
                setFieldError(
                  "lastName",
                  validateLastName(lastName),
                )
              }
            />

            {!!errors.lastName && (
              <Text style={styles.errorText}>
                {errors.lastName}
              </Text>
            )}
          </View>
        </View>

        {/* EMAIL */}
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
                setFieldError(
                  "email",
                  validateEmail(value),
                );
              }
            }}
            onBlur={() =>
              setFieldError(
                "email",
                validateEmail(email),
              )
            }
          />

          {!!errors.email && (
            <Text style={styles.errorText}>
              {errors.email}
            </Text>
          )}
        </View>

        {/* PHONE */}
        <View style={styles.fieldContainer}>
          <Input
            placeholder="Mobile Number"
            icon="call-outline"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(value) => {
              setPhone(value);

              if (errors.phone) {
                setFieldError(
                  "phone",
                  validatePhone(value),
                );
              }
            }}
            onBlur={() =>
              setFieldError(
                "phone",
                validatePhone(phone),
              )
            }
          />

          {!!errors.phone && (
            <Text style={styles.errorText}>
              {errors.phone}
            </Text>
          )}
        </View>

        {/* PASSWORD */}
        <View style={styles.fieldContainer}>
          <Input
            placeholder="Password"
            icon="lock-closed-outline"
            isPassword
            value={password}
            onChangeText={(value) => {
              setPassword(value);

              if (errors.password) {
                setFieldError(
                  "password",
                  validatePassword(value),
                );
              }

              if (confirmPassword) {
                setFieldError(
                  "confirmPassword",
                  validateConfirmPassword(
                    confirmPassword,
                    value,
                  ),
                );
              }
            }}
            onBlur={() =>
              setFieldError(
                "password",
                validatePassword(password),
              )
            }
          />

          {!!errors.password && (
            <Text style={styles.errorText}>
              {errors.password}
            </Text>
          )}

          {!errors.password &&
            password.length === 0 && (
              <Text style={styles.passwordHint}>
                8+ characters, uppercase, lowercase and
                number
              </Text>
            )}
        </View>

        {/* CONFIRM PASSWORD */}
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
                  validateConfirmPassword(
                    value,
                    password,
                  ),
                );
              }
            }}
            onBlur={() =>
              setFieldError(
                "confirmPassword",
                validateConfirmPassword(
                  confirmPassword,
                  password,
                ),
              )
            }
          />

          {!!errors.confirmPassword && (
            <Text style={styles.errorText}>
              {errors.confirmPassword}
            </Text>
          )}
        </View>

        {/* SIGN UP BUTTON */}
        <Button
          title="Sign Up"
          onPress={handleSignup}
          loading={loading}
          style={{ marginTop: spacing.sm }}
        />

        {/* LOGIN FOOTER */}
        <Text style={styles.footerText}>
          Already have an account?{" "}
          <Text
            style={styles.link}
            onPress={() =>
              router.push("/(auth)/login")
            }
          >
            Login
          </Text>
        </Text>
      </View>
    </KeyboardScreen>
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
  width: width * 0.75,
  height: width * 0.5,
  marginBottom: spacing.lg,
  resizeMode: 'contain',
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

  footerText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },

  link: {
    color: colors.accentOrange,
    fontWeight: "700",
  },
});