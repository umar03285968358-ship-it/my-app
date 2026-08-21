import { colors, radius, spacing, typography } from "@/constants/theme";
import { PaymentMethod, useCheckout } from "@/context/CheckoutContext";
import { getBankDetail } from "@/services/api";
import { getUser } from "@/services/authStorage";
import { showToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ORANGE = "#F1731F";
const SOFT_ORANGE = "#FFF1E8";

export default function CheckoutAddressScreen() {
  const { data, updateData } = useCheckout();
  const [prefilled, setPrefilled] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  // Prefill address + contact from the saved user, only once.
  useEffect(() => {
    (async () => {
      if (prefilled) return;
      const user = await getUser();
      if (user) {
        updateData({
          address: data.address || user.userAddress || user.UserAddress || "",
          contactNumber:
            data.contactNumber || user.mobileNo || user.MobileNo || "",
        });
      }
      setPrefilled(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBankDetail = async () => {
    try {
      setBankLoading(true);
      setBankError(null);
      const detail = await getBankDetail();
      if (detail) {
        updateData({ bankDetail: detail });
      } else {
        setBankError("Bank details are currently unavailable.");
      }
    } catch (e: any) {
      setBankError(e?.message || "Failed to load bank details.");
    } finally {
      setBankLoading(false);
    }
  };

  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    updateData({ paymentMethod: method });
    if (method === "IBFT" && !data.bankDetail && !bankLoading) {
      fetchBankDetail();
    }
  };

  const copyToClipboard = async (value: string, label: string) => {
    if (!value) return;
    await Clipboard.setStringAsync(value);
    showToast(`${label} copied`, "success");
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast("Gallery permission is required", "error");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      updateData({
        screenshotUri: result.assets[0].uri,
        screenshotBase64: result.assets[0].base64 ?? null,
      });
    }
  };

  const removeScreenshot = () => {
    updateData({ screenshotUri: null, screenshotBase64: null });
  };

  const handleConfirm = () => {
    if (!data.address.trim()) {
      showToast("Please enter a delivery address", "error");
      return;
    }
    if (!data.contactNumber.trim()) {
      showToast("Please enter a contact number", "error");
      return;
    }
    if (data.paymentMethod === "IBFT") {
      if (!data.bankDetail) {
        showToast("Please wait for bank details to load", "error");
        return;
      }
      if (!data.screenshotBase64) {
        showToast("Please attach your payment screenshot", "error");
        return;
      }
    }
    router.push("/checkout/summary");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={21} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Delivery Details</Text>
        <View style={styles.iconButtonPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ADDRESS */}
        <Text style={styles.label}>Delivery Address</Text>
        <TextInput
          style={styles.textArea}
          value={data.address}
          onChangeText={(t) => updateData({ address: t })}
          placeholder="Enter your delivery address"
          placeholderTextColor={colors.textSecondary}
          multiline
        />

        {/* CONTACT NUMBER */}
        <Text style={styles.label}>Contact Number</Text>
        <TextInput
          style={styles.input}
          value={data.contactNumber}
          onChangeText={(t) => updateData({ contactNumber: t })}
          placeholder="03XX-XXXXXXX"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
        />

        {/* DELIVERY TYPE */}
        <Text style={styles.label}>Delivery Type</Text>
        <View style={styles.row}>
          {(["Normal Delivery", "Urgent Delivery"] as const).map((type) => {
            const selected = data.deliveryType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.optionCard, selected && styles.optionCardActive]}
                onPress={() => updateData({ deliveryType: type })}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={type === "Urgent Delivery" ? "flash" : "bicycle"}
                  size={18}
                  color={selected ? ORANGE : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.optionText,
                    selected && styles.optionTextActive,
                  ]}
                >
                  {type === "Urgent Delivery" ? "Urgent" : "Normal"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* NOTE */}
        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={styles.textArea}
          value={data.note}
          onChangeText={(t) => updateData({ note: t })}
          placeholder="Any instructions for the delivery rider..."
          placeholderTextColor={colors.textSecondary}
          multiline
        />

        {/* PAYMENT METHOD */}
        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.row}>
          {(["Cash On Delivery", "IBFT"] as const).map((method) => {
            const selected = data.paymentMethod === method;
            return (
              <TouchableOpacity
                key={method}
                style={[styles.optionCard, selected && styles.optionCardActive]}
                onPress={() => handleSelectPaymentMethod(method)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={method === "IBFT" ? "card" : "cash"}
                  size={18}
                  color={selected ? ORANGE : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.optionText,
                    selected && styles.optionTextActive,
                  ]}
                >
                  {method === "IBFT" ? "IBFT / Bank" : "Cash on Delivery"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* IBFT DETAILS */}
        {data.paymentMethod === "IBFT" && (
          <View style={styles.ibftCard}>
            <Text style={styles.ibftTitle}>Transfer To This Account</Text>

            {bankLoading && (
              <View style={styles.bankStateBox}>
                <ActivityIndicator color={ORANGE} size="small" />
                <Text style={styles.bankStateText}>
                  Loading bank details...
                </Text>
              </View>
            )}

            {!bankLoading && bankError && (
              <View style={styles.bankStateBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={colors.danger}
                />
                <Text style={styles.bankStateText}>{bankError}</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={fetchBankDetail}
                >
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {!bankLoading && !bankError && data.bankDetail && (
              <>
                <BankRow
                  label="Bank Name"
                  value={data.bankDetail.bankName}
                  onCopy={copyToClipboard}
                />
                <BankRow
                  label="Account Title"
                  value={data.bankDetail.accountTitle}
                  onCopy={copyToClipboard}
                />
                <BankRow
                  label="Account Number"
                  value={data.bankDetail.accountNo}
                  onCopy={copyToClipboard}
                />
                <BankRow
                  label="IBAN"
                  value={data.bankDetail.iban}
                  onCopy={copyToClipboard}
                />
              </>
            )}

            <Text style={[styles.label, { marginTop: spacing.md }]}>
              Payment Screenshot
            </Text>

            {data.screenshotUri ? (
              <View style={styles.screenshotPreviewWrap}>
                <Image
                  source={{ uri: data.screenshotUri }}
                  style={styles.screenshotPreview}
                />
                <TouchableOpacity
                  style={styles.removeShotBtn}
                  onPress={removeScreenshot}
                >
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={pickFromGallery}
                activeOpacity={0.85}
              >
                <Ionicons name="image-outline" size={18} color={ORANGE} />
                <Text style={styles.attachBtnText}>Attach from Gallery</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          activeOpacity={0.85}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>Confirm</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function BankRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (value: string, label: string) => void;
}) {
  return (
    <View style={styles.bankRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.bankRowLabel}>{label}</Text>
        <Text style={styles.bankRowValue}>{value || "-"}</Text>
      </View>
      <TouchableOpacity
        style={styles.copyBtn}
        onPress={() => onCopy(value, label)}
        hitSlop={8}
      >
        <Ionicons name="copy-outline" size={16} color={ORANGE} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    height: 62,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarTitle: {
    ...typography.h3,
    flex: 1,
    textAlign: "center",
    color: colors.textPrimary,
    fontWeight: "700",
    marginHorizontal: spacing.md,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonPlaceholder: { width: 42, height: 42 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "700",
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === "ios" ? spacing.sm + 2 : spacing.sm,
  },
  textArea: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 80,
    textAlignVertical: "top",
  },
  row: { flexDirection: "row", gap: spacing.sm },
  optionCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  optionCardActive: { borderColor: ORANGE, backgroundColor: SOFT_ORANGE },
  optionText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  optionTextActive: { color: ORANGE, fontWeight: "700" },
  ibftCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  ibftTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  bankStateBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  bankStateText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: ORANGE,
  },
  retryBtnText: { ...typography.caption, color: "#FFFFFF", fontWeight: "700" },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bankRowLabel: { ...typography.caption, color: colors.textSecondary },
  bankRowValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
    marginTop: 2,
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: SOFT_ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: SOFT_ORANGE,
  },
  attachBtnText: { ...typography.body, color: ORANGE, fontWeight: "700" },
  screenshotPreviewWrap: { position: "relative", alignSelf: "flex-start" },
  screenshotPreview: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  removeShotBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  confirmButton: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: ORANGE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  confirmButtonText: {
    ...typography.button,
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
