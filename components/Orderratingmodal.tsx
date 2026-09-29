import {
  colors,
  radius,
  spacing,
  typography,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, {
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export interface OrderRatingSubmission {
  orderNo: number | string;
  stars: number;
  remarks: string;
}

interface OrderRatingModalProps {
  visible: boolean;

  orderNo:
    | number
    | string
    | null;

  /*
   * Existing rating from backend.
   *
   * null = no rating yet.
   */
  existingRating?:
    | number
    | null;

  /*
   * Existing remarks from backend.
   */
  existingRemarks?: string;

  onClose: () => void;

  /*
   * Parent performs the real API call.
   *
   * Promise<void> allows the modal to wait
   * until the API succeeds or fails.
   */
  onSubmitted?: (
    submission: OrderRatingSubmission,
  ) => Promise<void> | void;
}

/*
 * Five tappable stars.
 */
function StarRow({
  value,
  onChange,
  size = 36,
}: {
  value: number;

  onChange: (
    stars: number,
  ) => void;

  size?: number;
}) {
  return (
    <View
      style={
        styles.starRow
      }
    >
      {[1, 2, 3, 4, 5].map(
        (starIndex) => {
          const filled =
            starIndex <= value;

          return (
            <TouchableOpacity
              key={
                starIndex
              }
              activeOpacity={
                0.7
              }
              hitSlop={{
                top: 8,
                bottom: 8,
                left: 8,
                right: 8,
              }}
              onPress={() =>
                onChange(
                  starIndex,
                )
              }
              style={
                styles.starTouchable
              }
            >
              <Ionicons
                name={
                  filled
                    ? "star"
                    : "star-outline"
                }
                size={size}
                color={
                  filled
                    ? colors.primaryDark
                    : colors.textSecondary
                }
              />
            </TouchableOpacity>
          );
        },
      )}
    </View>
  );
}

/*
 * Five display-only stars.
 */
function DisplayStarRow({
  value,
  size = 25,
}: {
  value: number;
  size?: number;
}) {
  return (
    <View
      style={
        styles.displayStarRow
      }
    >
      {[1, 2, 3, 4, 5].map(
        (starIndex) => {
          const filled =
            starIndex <= value;

          return (
            <Ionicons
              key={
                starIndex
              }
              name={
                filled
                  ? "star"
                  : "star-outline"
              }
              size={size}
              color={
                filled
                  ? colors.primaryDark
                  : colors.textSecondary
              }
            />
          );
        },
      )}
    </View>
  );
}

export default function OrderRatingModal({
  visible,
  orderNo,
  existingRating = null,
  existingRemarks = "",
  onClose,
  onSubmitted,
}: OrderRatingModalProps) {
  const [stars, setStars] =
    useState(0);

  const [remarks, setRemarks] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [errorText, setErrorText] =
    useState<string | null>(
      null,
    );

  /*
   * Convert backend rating safely.
   *
   * 0 means "not rated".
   *
   * We never display 0/5.
   */
  const safeExistingRating =
    (() => {
      const value =
        Number(
          existingRating,
        );

      if (
        !Number.isFinite(
          value,
        ) ||
        value <= 0
      ) {
        return null;
      }

      return Math.min(
        5,
        Math.max(
          1,
          value,
        ),
      );
    })();

  const hasExistingRating =
    safeExistingRating !==
    null;

  /*
   * Reset / prefill form whenever
   * the modal opens or a different
   * order is selected.
   */
  useEffect(() => {
    if (!visible) {
      return;
    }

    /*
     * If backend already has a rating,
     * show that rating in the editable
     * form so the user can rate again.
     */
    setStars(
      safeExistingRating ??
        0,
    );

    setRemarks(
      existingRemarks ??
        "",
    );

    setErrorText(
      null,
    );
  }, [
    visible,
    orderNo,
    existingRating,
    existingRemarks,
  ]);

  const handleClose = () => {
    if (submitting) {
      return;
    }

    onClose();
  };

  const handleSubmit =
    async () => {
      if (
        orderNo ===
          null ||
        orderNo ===
          undefined
      ) {
        return;
      }

      if (
        stars < 1 ||
        stars > 5
      ) {
        setErrorText(
          "Please rate your order.",
        );

        return;
      }

      setSubmitting(true);
      setErrorText(null);

      try {
        const cleanRemarks =
          remarks.trim();

        /*
         * Parent calls the REAL API.
         */
        await onSubmitted?.({
          orderNo,
          stars: Number(
            stars,
          ),
          remarks:
            cleanRemarks,
        });

        /*
         * Parent closes the modal
         * after successful API call.
         */
      } catch (e: any) {
        console.log(
          "[ORDER RATING MODAL] Submission failed:",
          e,
        );

        setErrorText(
          e?.message ??
            "Couldn't submit your rating. Please try again.",
        );
      } finally {
        setSubmitting(false);
      }
    };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={
        handleClose
      }
    >
      <KeyboardAvoidingView
        style={
          styles.overlay
        }
        behavior={
          Platform.OS ===
          "ios"
            ? "padding"
            : undefined
        }
      >
        <TouchableWithoutFeedback
          onPress={
            handleClose
          }
        >
          <View
            style={
              styles.overlayTouchable
            }
          />
        </TouchableWithoutFeedback>

        <View
          style={
            styles.card
          }
        >
          {/* HEADER */}

          <View
            style={
              styles.headerRow
            }
          >
            <Text
              style={
                styles.title
              }
            >
              {hasExistingRating
                ? "Rate Order Again"
                : "Rate this Order"}
            </Text>

            <TouchableOpacity
              onPress={
                handleClose
              }
              disabled={
                submitting
              }
              hitSlop={{
                top: 8,
                bottom: 8,
                left: 8,
                right: 8,
              }}
            >
              <Ionicons
                name="close"
                size={22}
                color={
                  colors.textSecondary
                }
              />
            </TouchableOpacity>
          </View>

          {/* ORDER NUMBER */}

          {orderNo !==
          null ? (
            <Text
              style={
                styles.orderNoText
              }
            >
              Order #
              {orderNo}
            </Text>
          ) : null}

          {/* EXISTING BACKEND RATING */}

          {hasExistingRating ? (
            <View
              style={
                styles.existingRatingBlock
              }
            >
              <Text
                style={
                  styles.existingRatingLabel
                }
              >
                Your Current Rating
              </Text>

              <View
                style={
                  styles.existingRatingRow
                }
              >
                <DisplayStarRow
                  value={
                    safeExistingRating
                  }
                  size={23}
                />

                <Text
                  style={
                    styles.ratingValue
                  }
                >
                  {safeExistingRating}/5
                </Text>
              </View>

              {existingRemarks &&
              existingRemarks.trim() !==
                "" ? (
                <Text
                  style={
                    styles.existingRemarks
                  }
                >
                  {existingRemarks.trim()}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* ORDER RATING */}

          <View
            style={
              styles.ratingBlock
            }
          >
            <Text
              style={
                styles.ratingLabel
              }
            >
              {hasExistingRating
                ? "Update your rating"
                : "How was your overall order experience?"}
            </Text>

            <StarRow
              value={stars}
              onChange={(
                selectedStars,
              ) => {
                setStars(
                  selectedStars,
                );

                if (
                  errorText
                ) {
                  setErrorText(
                    null,
                  );
                }
              }}
            />

            {stars > 0 ? (
              <Text
                style={
                  styles.selectedRatingText
                }
              >
                {stars}/5
              </Text>
            ) : null}
          </View>

          {/* REMARKS */}

          <Text
            style={
              styles.inputLabel
            }
          >
            Remarks (optional)
          </Text>

          <TextInput
            style={
              styles.input
            }
            placeholder="Tell us more about your experience"
            placeholderTextColor={
              colors.textSecondary
            }
            multiline
            numberOfLines={4}
            value={remarks}
            onChangeText={(
              text,
            ) => {
              setRemarks(
                text,
              );

              if (
                errorText
              ) {
                setErrorText(
                  null,
                );
              }
            }}
            editable={
              !submitting
            }
            maxLength={500}
          />

          {/* ERROR */}

          {errorText ? (
            <Text
              style={
                styles.errorText
              }
            >
              {errorText}
            </Text>
          ) : null}

          {/* ACTIONS */}

          <View
            style={
              styles.actionsRow
            }
          >
            <TouchableOpacity
              style={
                styles.cancelButton
              }
              activeOpacity={
                0.8
              }
              onPress={
                handleClose
              }
              disabled={
                submitting
              }
            >
              <Text
                style={
                  styles.cancelText
                }
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (submitting ||
                  stars ===
                    0) &&
                  styles.submitButtonDisabled,
              ]}
              activeOpacity={
                0.85
              }
              onPress={
                handleSubmit
              }
              disabled={
                submitting ||
                stars === 0
              }
            >
              {submitting ? (
                <ActivityIndicator
                  color={
                    colors.white
                  }
                  size="small"
                />
              ) : (
                <Text
                  style={
                    styles.submitText
                  }
                >
                  {hasExistingRating
                    ? "Update Rating"
                    : "Submit"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent:
      "flex-end",
  },

  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      "rgba(33, 30, 61, 0.45)",
  },

  card: {
    backgroundColor:
      colors.card,

    borderTopLeftRadius:
      radius.lg,

    borderTopRightRadius:
      radius.lg,

    paddingHorizontal:
      spacing.lg,

    paddingTop:
      spacing.lg,

    paddingBottom:
      spacing.xl,
  },

  headerRow: {
    flexDirection:
      "row",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    marginBottom:
      spacing.xs,
  },

  title: {
    ...typography.h3,

    color:
      colors.textPrimary,

    fontWeight:
      "700",
  },

  orderNoText: {
    ...typography.body,

    color:
      colors.textSecondary,

    marginBottom:
      spacing.md,
  },

  /*
   * Existing rating from backend.
   */
  existingRatingBlock: {
    backgroundColor:
      colors.background,

    borderRadius:
      radius.md,

    padding:
      spacing.md,

    marginBottom:
      spacing.lg,

    borderWidth: 1,

    borderColor:
      colors.border,
  },

  existingRatingLabel: {
    ...typography.caption,

    color:
      colors.textSecondary,

    fontWeight:
      "700",

    marginBottom:
      spacing.xs,
  },

  existingRatingRow: {
    flexDirection:
      "row",

    alignItems:
      "center",

    gap:
      spacing.sm,
  },

  displayStarRow: {
    flexDirection:
      "row",

    alignItems:
      "center",

    gap: 2,
  },

  ratingValue: {
    ...typography.body,

    color:
      colors.textPrimary,

    fontWeight:
      "800",
  },

  existingRemarks: {
    ...typography.body,

    color:
      colors.textSecondary,

    marginTop:
      spacing.sm,

    lineHeight: 21,
  },

  /*
   * Editable rating.
   */
  ratingBlock: {
    marginBottom:
      spacing.lg,

    alignItems:
      "center",
  },

  ratingLabel: {
    ...typography.caption,

    color:
      colors.textSecondary,

    fontWeight:
      "700",

    marginBottom:
      spacing.md,

    textAlign:
      "center",
  },

  starRow: {
    flexDirection:
      "row",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      spacing.sm,
  },

  starTouchable: {
    padding: 2,
  },

  selectedRatingText: {
    ...typography.caption,

    color:
      colors.primaryDark,

    fontWeight:
      "800",

    marginTop:
      spacing.sm,
  },

  inputLabel: {
    ...typography.caption,

    color:
      colors.textSecondary,

    fontWeight:
      "700",

    marginBottom:
      spacing.xs,

    marginTop:
      spacing.xs,
  },

  input: {
    ...typography.body,

    color:
      colors.textPrimary,

    minHeight: 90,

    borderWidth: 1,

    borderColor:
      colors.border,

    borderRadius:
      radius.md,

    padding:
      spacing.md,

    textAlignVertical:
      "top",
  },

  errorText: {
    ...typography.caption,

    color:
      colors.danger,

    fontWeight:
      "600",

    marginTop:
      spacing.sm,
  },

  actionsRow: {
    flexDirection:
      "row",

    gap:
      spacing.md,

    marginTop:
      spacing.lg,
  },

  cancelButton: {
    flex: 1,

    minHeight: 50,

    borderRadius:
      radius.md,

    borderWidth: 1,

    borderColor:
      colors.border,

    alignItems:
      "center",

    justifyContent:
      "center",
  },

  cancelText: {
    ...typography.button,

    color:
      colors.textPrimary,

    fontWeight:
      "700",
  },

  submitButton: {
    flex: 1,

    minHeight: 50,

    borderRadius:
      radius.md,

    backgroundColor:
      colors.primaryDark,

    alignItems:
      "center",

    justifyContent:
      "center",
  },

  submitButtonDisabled: {
    opacity: 0.5,
  },

  submitText: {
    ...typography.button,

    color:
      colors.white,

    fontWeight:
      "700",
  },
});