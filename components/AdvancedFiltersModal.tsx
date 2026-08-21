import { colors, radius, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ================================================================
// TYPES
// ================================================================

export type PaymentFilter = "COD" | "Bank";

export type DeliveryFilter = "Urgent" | "Normal";

export interface AdvancedFilterValues {
  paymentTypes: PaymentFilter[];
  deliveryTypes: DeliveryFilter[];
}

interface AdvancedFiltersModalProps {
  visible: boolean;
  filters: AdvancedFilterValues;
  onApply: (filters: AdvancedFilterValues) => void;
  onClose: () => void;
}

// ================================================================
// CONSTANTS
// ================================================================

const PAYMENT_OPTIONS: {
  key: PaymentFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "COD",
    label: "COD",
    icon: "cash-outline",
  },
  {
    key: "Bank",
    label: "Bank",
    icon: "card-outline",
  },
];

const DELIVERY_OPTIONS: {
  key: DeliveryFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "Urgent",
    label: "Urgent",
    icon: "flash-outline",
  },
  {
    key: "Normal",
    label: "Normal",
    icon: "bicycle-outline",
  },
];

// ================================================================
// COMPONENT
// ================================================================

export default function AdvancedFiltersModal({
  visible,
  filters,
  onApply,
  onClose,
}: AdvancedFiltersModalProps) {
  const translateY = useRef(new Animated.Value(-700)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const [localPaymentTypes, setLocalPaymentTypes] = useState<PaymentFilter[]>(
    filters.paymentTypes,
  );

  const [localDeliveryTypes, setLocalDeliveryTypes] = useState<
    DeliveryFilter[]
  >(filters.deliveryTypes);

  // --------------------------------------------------------------
  // SYNC LOCAL STATE WHEN MODAL OPENS
  // --------------------------------------------------------------

  useEffect(() => {
    if (!visible) {
      return;
    }

    setLocalPaymentTypes(filters.paymentTypes);
    setLocalDeliveryTypes(filters.deliveryTypes);

    translateY.setValue(-700);
    opacity.setValue(0);

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 430,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, filters, opacity, translateY]);

  // --------------------------------------------------------------
  // CLOSE ANIMATION
  // --------------------------------------------------------------

  const closeWithAnimation = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -700,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        callback();
      }
    });
  };

  const handleClose = () => {
    closeWithAnimation(onClose);
  };

  // --------------------------------------------------------------
  // TOGGLE PAYMENT
  // --------------------------------------------------------------
  // SINGLE SELECT:
  // Only COD OR Bank can be selected at one time.
  // --------------------------------------------------------------

  const togglePayment = (value: PaymentFilter) => {
    setLocalPaymentTypes((current) => {
      if (current.includes(value)) {
        return [];
      }

      return [value];
    });
  };

  // --------------------------------------------------------------
  // TOGGLE DELIVERY
  // --------------------------------------------------------------
  // SINGLE SELECT:
  // Only Urgent OR Normal can be selected at one time.
  // --------------------------------------------------------------

  const toggleDelivery = (value: DeliveryFilter) => {
    setLocalDeliveryTypes((current) => {
      if (current.includes(value)) {
        return [];
      }

      return [value];
    });
  };

  // --------------------------------------------------------------
  // CLEAR
  // --------------------------------------------------------------

  const clearAll = () => {
    setLocalPaymentTypes([]);
    setLocalDeliveryTypes([]);
  };

  // --------------------------------------------------------------
  // APPLY
  // --------------------------------------------------------------

  const applyFilters = () => {
    const nextFilters: AdvancedFilterValues = {
      paymentTypes: [...localPaymentTypes],
      deliveryTypes: [...localDeliveryTypes],
    };

    closeWithAnimation(() => {
      onApply(nextFilters);
    });
  };

  // --------------------------------------------------------------
  // ACTIVE COUNT
  // --------------------------------------------------------------

  const activeCount = localPaymentTypes.length + localDeliveryTypes.length;

  // ==============================================================
  // RENDER
  // ==============================================================

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* BACKDROP */}

        <Animated.View
          pointerEvents="none"
          style={[
            styles.backdrop,
            {
              opacity: opacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.45],
              }),
            },
          ]}
        />

        {/* TAP OUTSIDE TO CLOSE */}

        <Pressable style={styles.dismissArea} onPress={handleClose} />

        {/* PANEL */}

        <Animated.View
          style={[
            styles.panel,
            {
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          {/* HANDLE */}

          <View style={styles.handle} />

          {/* HEADER */}

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons
                  name="options-outline"
                  size={20}
                  color={colors.primaryDark}
                />
              </View>

              <View>
                <Text style={styles.title}>Advanced Filters</Text>

                <Text style={styles.subtitle}>Refine your orders further</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.8}
              style={styles.closeButton}
              hitSlop={{
                top: 8,
                bottom: 8,
                left: 8,
                right: 8,
              }}
            >
              <Ionicons name="close" size={21} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ACTIVE FILTER SUMMARY */}

          {activeCount > 0 && (
            <View style={styles.activeSummary}>
              <Ionicons
                name="filter-outline"
                size={15}
                color={colors.primaryDark}
              />

              <Text style={styles.activeSummaryText}>
                {activeCount} filter{activeCount === 1 ? "" : "s"} selected
              </Text>
            </View>
          )}

          {/* CONTENT */}

          <View style={styles.content}>
            {/* PAYMENT TYPE */}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Payment Type</Text>

                  <Text style={styles.sectionSubtitle}>
                    Select one payment method
                  </Text>
                </View>

                {localPaymentTypes.length > 0 && (
                  <Text style={styles.selectedText}>1 selected</Text>
                )}
              </View>

              <View style={styles.optionsRow}>
                {PAYMENT_OPTIONS.map((option) => {
                  const checked = localPaymentTypes.includes(option.key);

                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.optionCard,
                        checked && styles.optionCardActive,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => togglePayment(option.key)}
                    >
                      <View
                        style={[
                          styles.optionIcon,
                          checked && styles.optionIconActive,
                        ]}
                      >
                        <Ionicons
                          name={option.icon}
                          size={19}
                          color={
                            checked ? colors.primaryDark : colors.textSecondary
                          }
                        />
                      </View>

                      <Text
                        style={[
                          styles.optionText,
                          checked && styles.optionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>

                      <View
                        style={[
                          styles.checkbox,
                          checked && styles.checkboxActive,
                        ]}
                      >
                        {checked && (
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color={colors.white}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* DELIVERY TYPE */}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Delivery Type</Text>

                  <Text style={styles.sectionSubtitle}>
                    Select one delivery type
                  </Text>
                </View>

                {localDeliveryTypes.length > 0 && (
                  <Text style={styles.selectedText}>1 selected</Text>
                )}
              </View>

              <View style={styles.optionsRow}>
                {DELIVERY_OPTIONS.map((option) => {
                  const checked = localDeliveryTypes.includes(option.key);

                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.optionCard,
                        checked && styles.optionCardActive,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => toggleDelivery(option.key)}
                    >
                      <View
                        style={[
                          styles.optionIcon,
                          checked && styles.optionIconActive,
                        ]}
                      >
                        <Ionicons
                          name={option.icon}
                          size={19}
                          color={
                            checked ? colors.primaryDark : colors.textSecondary
                          }
                        />
                      </View>

                      <Text
                        style={[
                          styles.optionText,
                          checked && styles.optionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>

                      <View
                        style={[
                          styles.checkbox,
                          checked && styles.checkboxActive,
                        ]}
                      >
                        {checked && (
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color={colors.white}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* FOOTER */}

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.clearButton}
              activeOpacity={0.8}
              onPress={clearAll}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyButton}
              activeOpacity={0.85}
              onPress={applyFilters}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={colors.white}
              />

              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ================================================================
// STYLES
// ================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },

  dismissArea: {
    ...StyleSheet.absoluteFillObject,
  },

  panel: {
    width: "92%",
    alignSelf: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },

  handle: {
    width: 42,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginTop: spacing.sm,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryDark + "12",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },

  title: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },

  activeSummary: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark + "10",
  },

  activeSummaryText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: "600",
    marginLeft: 5,
  },

  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },

  section: {
    marginBottom: spacing.md,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  selectedText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: "700",
  },

  optionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  optionCard: {
    flex: 1,
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },

  optionCardActive: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primaryDark + "08",
  },

  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.xs,
  },

  optionIconActive: {
    backgroundColor: colors.primaryDark + "12",
  },

  optionText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
    flex: 1,
  },

  optionTextActive: {
    color: colors.primaryDark,
    fontWeight: "700",
  },

  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },

  checkboxActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },

  clearButton: {
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  clearButtonText: {
    ...typography.button,
    color: colors.textSecondary,
    fontSize: 14,
  },

  applyButton: {
    flex: 1,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.primaryDark,
  },

  applyButtonText: {
    ...typography.button,
    color: colors.white,
    fontSize: 14,
    marginLeft: 6,
  },
});
