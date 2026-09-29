import Button from "@/components/Button";
import Input from "@/components/Input";
import { colors, radius, spacing, typography } from "@/constants/theme";
import {
  insertRider,
  MobUser,
  updateRider,
} from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface RiderFormModalProps {
  visible: boolean;
  rider: MobUser | null;
  onClose: () => void;
  onSuccess: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function RiderFormModal({
  visible,
  rider,
  onClose,
  onSuccess,
}: RiderFormModalProps) {
  const isEditMode = !!rider;

  const scrollViewRef = useRef<ScrollView>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setFirstName(rider?.firstName ?? "");
      setLastName(rider?.lastName ?? "");
      setMobileNo(rider?.phone ?? "");
      setEmail(rider?.email ?? "");
      setPassword("");
      setAddress("");

      // Start at the top whenever the modal opens.
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: 0,
          animated: false,
        });
      }, 100);
    }
  }, [visible, rider]);

  useEffect(() => {
    const keyboardShowEvent =
      Platform.OS === "ios"
        ? "keyboardWillShow"
        : "keyboardDidShow";

    const keyboardHideEvent =
      Platform.OS === "ios"
        ? "keyboardWillHide"
        : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(
      keyboardShowEvent,
      (event) => {
        const keyboardHeight = event.endCoordinates.height;

        // Give the ScrollView enough time to resize.
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({
            animated: true,
          });
        }, 100);

        // Extra delayed scroll makes this reliable on Android.
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({
            animated: true,
          });
        }, 300);

        console.log(
          "[RiderFormModal] Keyboard opened:",
          keyboardHeight,
        );
      },
    );

    const hideSubscription = Keyboard.addListener(
      keyboardHideEvent,
      () => {
        console.log("[RiderFormModal] Keyboard closed");
      },
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleSave = async () => {
    Keyboard.dismiss();

    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(
        "Missing name",
        "Please enter first and last name.",
      );
      return;
    }

    if (!mobileNo.trim()) {
      Alert.alert(
        "Missing mobile number",
        "Please enter a mobile number.",
      );
      return;
    }

    if (!isEditMode && !email.trim()) {
      Alert.alert(
        "Missing email",
        "Please enter an email address.",
      );
      return;
    }

    // Password is only collected (and required) when adding a new
    // rider. When editing, the password field isn't shown at all,
    // so there's nothing to validate here.
    if (!isEditMode && !password.trim()) {
      Alert.alert(
        "Missing password",
        "Please enter a password.",
      );
      return;
    }

    try {
      setSaving(true);

      if (isEditMode && rider) {
        await updateRider({
          mobUserID: rider.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          mobileNo: mobileNo.trim(),
          email: email.trim(),
          // Password field is hidden in edit mode, so `password`
          // is always empty here — pass undefined instead of an
          // empty string so an existing password never gets wiped.
          password: password.trim() || undefined,
          userAddress: address.trim() || undefined,
        });
      } else {
        await insertRider({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          mobileNo: mobileNo.trim(),
          email: email.trim(),
          password: password.trim(),
          userAddress: address.trim() || undefined,
        });
      }

      Alert.alert(
        "Success",
        isEditMode
          ? "Rider updated successfully."
          : "Rider added successfully.",
        [
          {
            text: "OK",
            onPress: onSuccess,
          },
        ],
      );
    } catch (error: any) {
      Alert.alert(
        isEditMode
          ? "Failed to update rider"
          : "Failed to add rider",
        error?.message || "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />

        {/* Keyboard-aware sheet */}
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {isEditMode ? "Edit Rider" : "Add Rider"}
              </Text>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  Keyboard.dismiss();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.form}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === "ios"
                  ? "interactive"
                  : "on-drag"
              }
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              bounces={true}
              scrollEventThrottle={16}
              automaticallyAdjustKeyboardInsets={
                Platform.OS === "ios"
              }
            >
              {/* First + Last Name */}
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    placeholder="First name"
                    icon="person-outline"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>

                <View style={styles.halfInput}>
                  <Input
                    placeholder="Last name"
                    icon="person-outline"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>

              {/* Mobile */}
              <Input
                placeholder="Mobile number"
                icon="call-outline"
                keyboardType="phone-pad"
                value={mobileNo}
                onChangeText={setMobileNo}
              />

              {/* Email — locked once a rider already exists */}
              <View
                style={
                  isEditMode
                    ? styles.disabledFieldWrap
                    : undefined
                }
              >
                <Input
                  placeholder="Email"
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!isEditMode}
                />
              </View>

              {isEditMode && (
                <Text style={styles.disabledHint}>
                  Email can't be changed for an existing rider.
                </Text>
              )}

              {/* Password — only shown when adding a new rider */}
              {!isEditMode && (
                <Input
                  placeholder="Password"
                  icon="lock-closed-outline"
                  isPassword
                  value={password}
                  onChangeText={setPassword}
                />
              )}

              {/* Address */}
              <Input
                placeholder="Address (optional)"
                icon="location-outline"
                value={address}
                onChangeText={setAddress}
              />

              {/* Save Button */}
              <Button
                title={
                  isEditMode
                    ? "Update Rider"
                    : "Add Rider"
                }
                onPress={handleSave}
                loading={saving}
                style={{
                  marginTop: spacing.sm,
                }}
              />

              {/* Extra bottom space.
                  This gives the keyboard enough room to
                  scroll the final fields completely above it. */}
              <View style={styles.bottomSpacer} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  keyboardContainer: {
    width: "100%",
    maxHeight: SCREEN_HEIGHT * 0.9,
    justifyContent: "flex-end",
  },

  sheet: {
    width: "100%",
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: SCREEN_HEIGHT * 0.9,
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },

  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },

  closeButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollView: {
    flexGrow: 0,
  },

  form: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },

  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  halfInput: {
    flex: 1,
  },

  disabledFieldWrap: {
    opacity: 0.5,
  },

  disabledHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
  },

  bottomSpacer: {
    height: 120,
  },
});