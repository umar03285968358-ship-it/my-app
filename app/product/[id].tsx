import {
  colors,
  radius,
  spacing,
  typography,
} from "@/constants/theme";
import { useCart } from "@/context/CartContext";
import { useMobProducts } from "@/hooks/useMobProducts";
import { rateProduct } from "@/services/api";
import { getUser } from "@/services/authStorage";
import { formatRs } from "@/utils/currency";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProductDetailScreen() {
  const router = useRouter();

  const { id, catId, subCatId } = useLocalSearchParams<{
    id: string;
    catId: string;
    subCatId: string;
  }>();

  const productId = Number(id);

  const { products, loading, error, refetch } = useMobProducts(
    Number(catId),
    Number(subCatId),
  );

  const product =
    products.find((p) => p.productID === productId) ?? null;

  const { addToCart, updateQty, getItemQuantity } = useCart();

  /*
   * ============================================================
   * PRODUCT RATING
   * ============================================================
   *
   * Only ONE rating is displayed in the Product Rating section.
   *
   * Backend rating can be fractional, but the UI always shows
   * a whole number:
   *
   * 3.4 -> 3
   * 3.5 -> 4
   * 4.8 -> 5
   *
   * The UI will never display 3.5/5.
   */

  const rawBackendRating =
    product && Number((product as any).ratingStar) > 0
      ? Number((product as any).ratingStar)
      : null;

  const [overrideRating, setOverrideRating] = useState<number | null>(
    null,
  );

  /*
   * The rating currently shown on the screen.
   *
   * After successful submission, overrideRating takes priority.
   */

  const displayedRatingRaw =
    overrideRating ?? rawBackendRating;

  const displayedRating =
    displayedRatingRaw !== null
      ? Math.min(
          5,
          Math.max(
            0,
            Math.round(displayedRatingRaw),
          ),
        )
      : null;

  /*
   * ============================================================
   * CART
   * ============================================================
   */

  const stock = Infinity;

  const inCart = product
    ? getItemQuantity(product.productID)
    : 0;

  const [qty, setQty] = useState(1);

  const [imageViewerVisible, setImageViewerVisible] =
    useState(false);

  useEffect(() => {
    if (!product) return;

    setQty(inCart > 0 ? inCart : 1);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.productID]);

  const canDecrease = qty > 0;
  const canIncrease = qty < stock;

  const isAddedToCart =
    inCart > 0 && qty > 0;

  const totalPrice = useMemo(() => {
    if (!product || qty <= 0) return 0;

    return product.salePrice * qty;
  }, [product, qty]);

  const decrease = () => {
    if (!product) return;

    const nextQty = Math.max(0, qty - 1);

    setQty(nextQty);

    if (inCart > 0) {
      updateQty(
        product.productID,
        nextQty,
      );
    }
  };

  const increase = () => {
    if (!product) return;

    const nextQty = Math.min(
      stock,
      qty + 1,
    );

    setQty(nextQty);

    if (inCart > 0) {
      updateQty(
        product.productID,
        nextQty,
      );
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (qty <= 0) return;

    if (inCart > 0) {
      updateQty(
        product.productID,
        qty,
      );
      return;
    }

    addToCart(product, qty);
  };

  const canCheckout =
    inCart > 0 && qty > 0;

  const handleCheckout = () => {
    if (!canCheckout) return;

    router.push("/cart");
  };

  /*
   * ============================================================
   * RATING FLOW
   * ============================================================
   */

  const [myRating, setMyRating] =
    useState<number | null>(null);

  const [myRemarks, setMyRemarks] =
    useState("");

  const [ratingModalVisible, setRatingModalVisible] =
    useState(false);

  const [draftStars, setDraftStars] =
    useState(0);

  const [draftRemarks, setDraftRemarks] =
    useState("");

  const [submittingRating, setSubmittingRating] =
    useState(false);

  const [ratingSubmitError, setRatingSubmitError] =
    useState<string | null>(null);

  /*
   * ============================================================
   * RESET RATING STATE WHEN PRODUCT CHANGES
   * ============================================================
   */

  useEffect(() => {
    if (!product) return;

    setMyRating(null);
    setMyRemarks("");

    setOverrideRating(null);

    const backendRating = Number(
      (product as any).ratingStar,
    );

    const roundedBackendRating =
      Number.isFinite(backendRating) &&
      backendRating > 0
        ? Math.min(
            5,
            Math.max(
              0,
              Math.round(backendRating),
            ),
          )
        : 0;

    setDraftStars(
      roundedBackendRating,
    );

    setDraftRemarks("");

    setRatingSubmitError(null);

    setRatingModalVisible(false);
  }, [product?.productID]);

  /*
   * ============================================================
   * OPEN RATING MODAL
   * ============================================================
   */

  const openRatingModal = (
    prefillStars?: number,
  ) => {
    /*
     * Priority:
     *
     * 1. Star directly tapped
     * 2. User's previous rating during this screen session
     * 3. Current displayed product rating
     * 4. Empty
     */

    const startingStars =
      prefillStars ??
      myRating ??
      displayedRating ??
      0;

    const safeStartingStars =
      Math.min(
        5,
        Math.max(
          0,
          Math.round(
            Number(startingStars) || 0,
          ),
        ),
      );

    setDraftStars(
      safeStartingStars,
    );

    setDraftRemarks(
      myRemarks,
    );

    setRatingSubmitError(null);

    setRatingModalVisible(true);
  };

  /*
   * ============================================================
   * CLOSE RATING MODAL
   * ============================================================
   */

  const closeRatingModal = () => {
    if (submittingRating) return;

    setRatingModalVisible(false);
  };

  /*
   * ============================================================
   * GET LOGGED-IN USER ID
   * ============================================================
   */

  const getLoggedInMobUserId =
    async (): Promise<number> => {
      const user = await getUser();

      if (!user) {
        throw new Error(
          "You must be logged in to rate a product.",
        );
      }

      const directMobUserId =
        user?.MobUserID ??
        user?.mobUserID ??
        user?.MobUserId ??
        user?.mobUserId;

      if (
        directMobUserId !== undefined &&
        directMobUserId !== null &&
        String(
          directMobUserId,
        ).trim() !== ""
      ) {
        const parsed = Number(
          directMobUserId,
        );

        if (
          Number.isFinite(parsed) &&
          parsed > 0
        ) {
          return parsed;
        }
      }

      const userKeys =
        Object.keys(user);

      const mobUserIdKey =
        userKeys.find(
          (key) =>
            key.toLowerCase() ===
            "mobuserid",
        );

      if (mobUserIdKey) {
        const parsed = Number(
          user[mobUserIdKey],
        );

        if (
          Number.isFinite(parsed) &&
          parsed > 0
        ) {
          return parsed;
        }
      }

      const fallbackKeys = [
        "UserID",
        "userID",
        "UserId",
        "userId",
        "id",
      ];

      for (const key of fallbackKeys) {
        const value = user?.[key];

        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          const parsed = Number(
            value,
          );

          if (
            Number.isFinite(parsed) &&
            parsed > 0
          ) {
            return parsed;
          }
        }
      }

      throw new Error(
        "Could not find your user ID. Please login again and try again.",
      );
    };

  /*
   * ============================================================
   * SUBMIT PRODUCT RATING
   * ============================================================
   */

  const handleSubmitRating = async () => {
    if (!product) return;

    const safeStars =
      Math.min(
        5,
        Math.max(
          0,
          Math.round(
            Number(draftStars) || 0,
          ),
        ),
      );

    if (safeStars <= 0) {
      setRatingSubmitError(
        "Please select a star rating.",
      );
      return;
    }

    if (safeStars > 5) {
      setRatingSubmitError(
        "Rating must be between 1 and 5 stars.",
      );
      return;
    }

    setSubmittingRating(true);
    setRatingSubmitError(null);

    try {
      /*
       * Get logged-in user.
       */

      const mobUserID =
        await getLoggedInMobUserId();

      /*
       * Clean comment.
       */

      const cleanRemarks =
        draftRemarks.trim();

      /*
       * API CALL
       */

      await rateProduct({
        productID: Number(
          product.productID,
        ),
        mobUserID: Number(
          mobUserID,
        ),
        ratingStar: Number(
          safeStars,
        ),
        ratingRemarks:
          cleanRemarks,
      });

      /*
       * ========================================================
       * API SUCCESS
       * ========================================================
       *
       * Immediately show ONLY the newly submitted rating.
       *
       * No success alert.
       * No success message.
       * No "1 rating" text.
       * No "Your Rating" section.
       */

      setOverrideRating(
        safeStars,
      );

      /*
       * Keep these internally so if the user opens
       * "Rate Again" during this screen session, the modal
       * starts from the last rating.
       */

      setMyRating(
        safeStars,
      );

      setMyRemarks(
        cleanRemarks,
      );

      setDraftStars(
        safeStars,
      );

      setDraftRemarks(
        cleanRemarks,
      );

      /*
       * CLOSE MODAL IMMEDIATELY
       */

      setRatingModalVisible(false);

      /*
       * ========================================================
       * BACKGROUND REFRESH
       * ========================================================
       *
       * Refresh backend data silently.
       *
       * We intentionally DO NOT clear overrideRating after
       * refetch, because the UI should continue showing only
       * the rating the user just submitted.
       */

      try {
        await refetch();
      } catch (refreshError) {
        console.error(
          "[PRODUCT RATING] Background refresh failed:",
          refreshError,
        );

        /*
         * Keep the optimistic rating.
         */
      }
    } catch (err: any) {
      console.error(
        "[PRODUCT RATING] Submit failed:",
        err,
      );

      setRatingSubmitError(
        err?.message ||
          "Couldn't submit your rating. Please try again.",
      );
    } finally {
      setSubmittingRating(false);
    }
  };

  /*
   * ============================================================
   * STAR ROW
   * ============================================================
   */

  const renderStarRow = (
    value: number,
    options?: {
      interactive?: boolean;
      onChange?: (
        stars: number,
      ) => void;
      size?: number;
    },
  ) => {
    const size =
      options?.size ?? 22;

    const interactive =
      options?.interactive ?? false;

    const safeValue =
      Math.min(
        5,
        Math.max(
          0,
          Math.round(
            Number(value) || 0,
          ),
        ),
      );

    return (
      <View
        style={styles.starRow}
      >
        {[1, 2, 3, 4, 5].map(
          (starIndex) => {
            const filled =
              starIndex <=
              safeValue;

            const star = (
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

            if (!interactive) {
              return (
                <View
                  key={
                    starIndex
                  }
                >
                  {star}
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={
                  starIndex
                }
                activeOpacity={0.7}
                hitSlop={{
                  top: 8,
                  bottom: 8,
                  left: 8,
                  right: 8,
                }}
                onPress={() =>
                  options?.onChange?.(
                    starIndex,
                  )
                }
                style={
                  styles.starTouchable
                }
              >
                {star}
              </TouchableOpacity>
            );
          },
        )}
      </View>
    );
  };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
        edges={[
          "left",
          "right",
          "bottom",
        ]}
      >
        <View
          style={
            styles.centerState
          }
        >
          <View
            style={
              styles.stateIcon
            }
          >
            <ActivityIndicator
              color={
                colors.primaryDark
              }
              size="small"
            />
          </View>

          <Text
            style={
              styles.stateTitle
            }
          >
            Loading product
          </Text>

          <Text
            style={
              styles.stateText
            }
          >
            Please wait while we
            load the product
            details.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * ============================================================
   * ERROR / NOT FOUND
   * ============================================================
   */

  if (error || !product) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
        edges={[
          "left",
          "right",
          "bottom",
        ]}
      >
        <View
          style={
            styles.centerState
          }
        >
          <View
            style={
              styles.stateIcon
            }
          >
            <Ionicons
              name={
                error
                  ? "cloud-offline-outline"
                  : "cube-outline"
              }
              size={30}
              color={
                colors.primaryDark
              }
            />
          </View>

          <Text
            style={
              styles.stateTitle
            }
          >
            {error
              ? "Something went wrong"
              : "Product not found"}
          </Text>

          <Text
            style={
              styles.stateText
            }
          >
            {error ??
              "This product is no longer available."}
          </Text>

          <TouchableOpacity
            style={
              styles.retryButton
            }
            activeOpacity={0.85}
            onPress={() =>
              refetch()
            }
          >
            <Ionicons
              name="refresh-outline"
              size={17}
              color={
                colors.white
              }
            />

            <Text
              style={
                styles.retryText
              }
            >
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * ============================================================
   * MAIN SCREEN
   * ============================================================
   */

  return (
    <SafeAreaView
      style={
        styles.container
      }
      edges={[
        "left",
        "right",
        "bottom",
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
        bounces={true}
      >
        {/* PRODUCT IMAGE */}

        <View
          style={
            styles.visualWrapper
          }
        >
          <TouchableOpacity
            activeOpacity={0.95}
            style={
              styles.imageCard
            }
            onPress={() => {
              if (
                product.imagesPath
              ) {
                setImageViewerVisible(
                  true,
                );
              }
            }}
          >
            {product.imagesPath ? (
              <>
                <Image
                  source={{
                    uri: product.imagesPath,
                  }}
                  style={
                    styles.image
                  }
                />

                <View
                  style={
                    styles.zoomHint
                  }
                >
                  <Ionicons
                    name="search-outline"
                    size={15}
                    color={
                      colors.white
                    }
                  />

                  <Text
                    style={
                      styles.zoomHintText
                    }
                  >
                    Tap to zoom
                  </Text>
                </View>
              </>
            ) : (
              <View
                style={
                  styles.imageFallback
                }
              >
                <View
                  style={
                    styles.fallbackIcon
                  }
                >
                  <Ionicons
                    name="image-outline"
                    size={38}
                    color={
                      colors.primaryDark
                    }
                  />
                </View>

                <Text
                  style={
                    styles.fallbackText
                  }
                >
                  No image
                  available
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* PRODUCT NAME + PRICE */}

        <View
          style={
            styles.productHeader
          }
        >
          <View
            style={
              styles.productNameWrapper
            }
          >
            <Text
              style={
                styles.title
              }
            >
              {
                product.productTitle
              }
            </Text>

            <View
              style={
                styles.stockBanner
              }
            >
              <View
                style={
                  styles.stockDot
                }
              />

              <Text
                style={
                  styles.stockText
                }
              >
                In Stock
              </Text>
            </View>
          </View>

          <Text
            style={
              styles.price
            }
          >
            {formatRs(
              product.salePrice,
            )}
          </Text>
        </View>

        {/* QUANTITY + ADD TO CART */}

        <View
          style={
            styles.cartSection
          }
        >
          <View
            style={
              styles.quantityBlock
            }
          >
            <Text
              style={
                styles.quantityLabel
              }
            >
              Quantity
            </Text>

            <View
              style={
                styles.quantitySelector
              }
            >
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  !canDecrease &&
                    styles.quantityDisabled,
                ]}
                activeOpacity={0.75}
                disabled={
                  !canDecrease
                }
                onPress={
                  decrease
                }
              >
                <Ionicons
                  name="remove"
                  size={18}
                  color={
                    canDecrease
                      ? colors.textPrimary
                      : colors.textSecondary
                  }
                />
              </TouchableOpacity>

              <View
                style={
                  styles.quantityValueBox
                }
              >
                <Text
                  style={
                    styles.quantityValue
                  }
                >
                  {qty}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  !canIncrease &&
                    styles.quantityDisabled,
                ]}
                activeOpacity={0.75}
                disabled={
                  !canIncrease
                }
                onPress={
                  increase
                }
              >
                <Ionicons
                  name="add"
                  size={18}
                  color={
                    canIncrease
                      ? colors.textPrimary
                      : colors.textSecondary
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              isAddedToCart &&
                styles.addedButton,
              qty === 0 &&
                styles.addButtonDisabled,
            ]}
            activeOpacity={0.85}
            disabled={
              qty === 0
            }
            onPress={
              handleAddToCart
            }
          >
            <Ionicons
              name={
                isAddedToCart
                  ? "checkmark-circle-outline"
                  : "cart-outline"
              }
              size={20}
              color={
                colors.white
              }
            />

            <Text
              style={
                styles.addButtonText
              }
            >
              {isAddedToCart
                ? "Added to Cart"
                : "Add to Cart"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* PRODUCT RATING */}

        <View
          style={
            styles.ratingSection
          }
        >
          <View
            style={
              styles.ratingHeaderRow
            }
          >
            <View
              style={
                styles.ratingHeaderLeft
              }
            >
              <View
                style={
                  styles.detailsIcon
                }
              >
                <Ionicons
                  name="star-outline"
                  size={18}
                  color={
                    colors.primaryDark
                  }
                />
              </View>

              <Text
                style={
                  styles.detailsTitle
                }
              >
                Product Rating
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() =>
                openRatingModal()
              }
            >
              <Text
                style={
                  styles.editRatingText
                }
              >
                {myRating
                  ? "Rate Again"
                  : "Rate Product"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ONLY ONE RATING IS SHOWN */}

          {displayedRating !== null ? (
            <View
              style={
                styles.productRatingRow
              }
            >
              {renderStarRow(
                displayedRating,
                {
                  size: 26,
                },
              )}

              <Text
                style={
                  styles.ratingNumber
                }
              >
                {displayedRating}/5
              </Text>
            </View>
          ) : (
            <>
              <Text
                style={
                  styles.ratingPrompt
                }
              >
                This product has not
                been rated yet. Be
                the first to rate it.
              </Text>

              {renderStarRow(
                0,
                {
                  interactive: true,
                  size: 30,
                  onChange: (
                    stars,
                  ) =>
                    openRatingModal(
                      stars,
                    ),
                },
              )}
            </>
          )}
        </View>

        {/* PRODUCT DETAILS */}

        <View
          style={
            styles.detailsSection
          }
        >
          <View
            style={
              styles.detailsHeader
            }
          >
            <View
              style={
                styles.detailsIcon
              }
            >
              <Ionicons
                name="information-outline"
                size={18}
                color={
                  colors.primaryDark
                }
              />
            </View>

            <Text
              style={
                styles.detailsTitle
              }
            >
              Product Details
            </Text>
          </View>

          {product.productDescription &&
          product.productDescription.trim() !==
            "" &&
          product.productDescription !==
            "-" ? (
            <Text
              style={
                styles.description
              }
            >
              {
                product.productDescription
              }
            </Text>
          ) : (
            <Text
              style={
                styles.noDescription
              }
            >
              No product
              description
              available.
            </Text>
          )}
        </View>

        <View
          style={
            styles.footerSpace
          }
        />
      </ScrollView>

      {/* STICKY CHECKOUT BAR */}

      <View
        style={
          styles.checkoutBar
        }
      >
        <View
          style={
            styles.totalSection
          }
        >
          <Text
            style={
              styles.totalLabel
            }
          >
            Total ({qty}{" "}
            {qty === 1
              ? "Item"
              : "Items"}
            )
          </Text>

          <Text
            style={
              styles.totalPrice
            }
          >
            {formatRs(
              totalPrice,
            )}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.checkoutButton,
            !canCheckout &&
              styles.checkoutButtonDisabled,
          ]}
          activeOpacity={
            canCheckout
              ? 0.85
              : 1
          }
          disabled={
            !canCheckout
          }
          onPress={
            handleCheckout
          }
        >
          <Text
            style={[
              styles.checkoutButtonText,
              !canCheckout &&
                styles.checkoutButtonTextDisabled,
            ]}
            numberOfLines={1}
            ellipsizeMode="clip"
          >
            Checkout
          </Text>

          <Ionicons
            name="arrow-forward"
            size={25}
            color={
              canCheckout
                ? colors.white
                : colors.textSecondary
            }
            style={
              styles.checkoutArrow
            }
          />
        </TouchableOpacity>
      </View>

      {/* FULL SCREEN IMAGE VIEWER */}

      <ImageZoomViewer
        visible={
          imageViewerVisible
        }
        imageUri={
          product.imagesPath
        }
        onClose={() =>
          setImageViewerVisible(
            false,
          )
        }
      />

      {/* RATING POPUP */}

      <Modal
        visible={
          ratingModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeRatingModal
        }
      >
        <KeyboardAvoidingView
          style={
            styles.modalOverlay
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
              closeRatingModal
            }
          >
            <View
              style={
                styles.modalOverlayTouchable
              }
            />
          </TouchableWithoutFeedback>

          <View
            style={
              styles.modalCard
            }
          >
            <View
              style={
                styles.modalHeaderRow
              }
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                Rate this Product
              </Text>

              <TouchableOpacity
                onPress={
                  closeRatingModal
                }
                disabled={
                  submittingRating
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

            <Text
              style={
                styles.modalProductName
              }
              numberOfLines={1}
            >
              {
                product.productTitle
              }
            </Text>

            <View
              style={
                styles.modalStarsWrapper
              }
            >
              {renderStarRow(
                draftStars,
                {
                  interactive: true,
                  size: 36,
                  onChange: (
                    stars,
                  ) => {
                    setDraftStars(
                      stars,
                    );

                    if (
                      ratingSubmitError
                    ) {
                      setRatingSubmitError(
                        null,
                      );
                    }
                  },
                },
              )}

              <Text
                style={
                  styles.modalStarsHint
                }
              >
                {draftStars >
                0
                  ? `You rated ${draftStars} out of 5`
                  : "Tap a star to rate"}
              </Text>
            </View>

            <Text
              style={
                styles.modalInputLabel
              }
            >
              Add a comment
              (optional)
            </Text>

            <TextInput
              style={
                styles.modalInput
              }
              placeholder="What did you like or dislike?"
              placeholderTextColor={
                colors.textSecondary
              }
              multiline
              numberOfLines={4}
              value={
                draftRemarks
              }
              onChangeText={(
                text,
              ) => {
                setDraftRemarks(
                  text,
                );

                if (
                  ratingSubmitError
                ) {
                  setRatingSubmitError(
                    null,
                  );
                }
              }}
              editable={
                !submittingRating
              }
              maxLength={500}
            />

            {ratingSubmitError ? (
              <Text
                style={
                  styles.modalErrorText
                }
              >
                {
                  ratingSubmitError
                }
              </Text>
            ) : null}

            <View
              style={
                styles.modalActionsRow
              }
            >
              <TouchableOpacity
                style={
                  styles.modalCancelButton
                }
                activeOpacity={0.8}
                onPress={
                  closeRatingModal
                }
                disabled={
                  submittingRating
                }
              >
                <Text
                  style={
                    styles.modalCancelText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  (submittingRating ||
                    draftStars ===
                      0) &&
                    styles.modalSubmitButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={
                  handleSubmitRating
                }
                disabled={
                  submittingRating ||
                  draftStars === 0
                }
              >
                {submittingRating ? (
                  <ActivityIndicator
                    color={
                      colors.white
                    }
                    size="small"
                  />
                ) : (
                  <Text
                    style={
                      styles.modalSubmitText
                    }
                  >
                    Submit
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* =============================================================== */
/* IMAGE ZOOM VIEWER                                                */
/* =============================================================== */

type ImageZoomViewerProps = {
  visible: boolean;
  imageUri:
    | string
    | null
    | undefined;
  onClose: () => void;
};

function ImageZoomViewer({
  visible,
  imageUri,
  onClose,
}: ImageZoomViewerProps) {
  const scale =
    useSharedValue(1);

  const savedScale =
    useSharedValue(1);

  const translateX =
    useSharedValue(0);

  const translateY =
    useSharedValue(0);

  const savedTranslateX =
    useSharedValue(0);

  const savedTranslateY =
    useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = 1;
      savedScale.value = 1;

      translateX.value = 0;
      translateY.value = 0;

      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  }, [
    visible,
    scale,
    savedScale,
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
  ]);

  const pinchGesture =
    Gesture.Pinch()
      .onStart(() => {
        savedScale.value =
          scale.value;
      })
      .onUpdate((event) => {
        const nextScale =
          savedScale.value *
          event.scale;

        scale.value =
          Math.min(
            Math.max(
              nextScale,
              1,
            ),
            4,
          );
      })
      .onEnd(() => {
        if (
          scale.value <=
          1.05
        ) {
          scale.value =
            withTiming(1);

          translateX.value =
            withTiming(0);

          translateY.value =
            withTiming(0);

          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
        }
      });

  const panGesture =
    Gesture.Pan()
      .onStart(() => {
        savedTranslateX.value =
          translateX.value;

        savedTranslateY.value =
          translateY.value;
      })
      .onUpdate((event) => {
        if (
          scale.value <=
          1
        ) {
          translateX.value = 0;
          translateY.value = 0;
          return;
        }

        translateX.value =
          savedTranslateX.value +
          event.translationX;

        translateY.value =
          savedTranslateY.value +
          event.translationY;
      })
      .onEnd(() => {
        if (
          scale.value <=
          1
        ) {
          translateX.value =
            withTiming(0);

          translateY.value =
            withTiming(0);
        }
      });

  const doubleTapGesture =
    Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        if (
          scale.value > 1
        ) {
          scale.value =
            withTiming(1);

          translateX.value =
            withTiming(0);

          translateY.value =
            withTiming(0);

          savedScale.value = 1;

          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
        } else {
          scale.value =
            withTiming(2);

          savedScale.value = 2;
        }
      });

  const composedGesture =
    Gesture.Simultaneous(
      pinchGesture,
      panGesture,
      doubleTapGesture,
    );

  const animatedImageStyle =
    useAnimatedStyle(() => {
      return {
        transform: [
          {
            translateX:
              translateX.value,
          },
          {
            translateY:
              translateY.value,
          },
          {
            scale:
              scale.value,
          },
        ],
      };
    });

  if (!imageUri) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={
        onClose
      }
    >
      <View
        style={
          styles.imageViewerContainer
        }
      >
        <Pressable
          style={
            styles.imageViewerClose
          }
          onPress={onClose}
          hitSlop={12}
        >
          <Ionicons
            name="close"
            size={27}
            color={colors.white}
          />
        </Pressable>

        <GestureDetector
          gesture={
            composedGesture
          }
        >
          <Animated.View
            style={
              styles.zoomImageWrapper
            }
          >
            <Animated.Image
              source={{
                uri: imageUri,
              }}
              style={[
                styles.zoomImage,
                animatedImageStyle,
              ]}
              resizeMode="contain"
            />
          </Animated.View>
        </GestureDetector>

        <View
          style={
            styles.zoomInstructions
          }
        >
          <Ionicons
            name="scan-outline"
            size={16}
            color={colors.white}
          />

          <Text
            style={
              styles.zoomInstructionsText
            }
          >
            Pinch to zoom • Drag
            to move • Double tap
          </Text>
        </View>
      </View>
    </Modal>
  );
}

/* =============================================================== */
/* STYLES                                                           */
/* =============================================================== */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        colors.background,
      paddingTop: 4,
    },

    scrollContent: {
      paddingTop: 0,
      paddingBottom: 90,
    },

    visualWrapper: {
      marginHorizontal:
        spacing.lg,
      marginTop: 0,
      paddingTop: 0,
    },

    imageCard: {
      width: "100%",
      aspectRatio: 1,
      backgroundColor:
        colors.card,
      borderRadius:
        radius.lg,
      borderWidth: 1,
      borderColor:
        "#FFDCC2",
      padding: spacing.md,
      alignItems: "center",
      justifyContent:
        "center",
      overflow: "hidden",
    },

    image: {
      width: "94%",
      height: "94%",
      resizeMode: "contain",
    },

    zoomHint: {
      position: "absolute",
      right: spacing.sm,
      bottom: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor:
        "rgba(0, 0, 0, 0.55)",
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius:
        radius.pill,
    },

    zoomHintText: {
      ...typography.caption,
      color: colors.white,
      fontSize: 11,
      fontWeight: "700",
    },

    imageFallback: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      gap: spacing.sm,
    },

    fallbackIcon: {
      width: 64,
      height: 64,
      borderRadius:
        radius.pill,
      backgroundColor:
        colors.background,
      alignItems: "center",
      justifyContent:
        "center",
    },

    fallbackText: {
      ...typography.caption,
      color:
        colors.textSecondary,
    },

    productHeader: {
      paddingHorizontal:
        spacing.lg,
      paddingTop:
        spacing.lg,
      flexDirection: "row",
      alignItems:
        "flex-start",
      justifyContent:
        "space-between",
      gap: spacing.md,
    },

    productNameWrapper: {
      flex: 1,
      paddingRight:
        spacing.sm,
    },

    title: {
      ...typography.h2,
      color:
        colors.textPrimary,
      fontWeight: "700",
      lineHeight: 30,
    },

    stockBanner: {
      alignSelf:
        "flex-start",
      flexDirection: "row",
      alignItems:
        "center",
      marginTop:
        spacing.xs,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius:
        radius.pill,
      backgroundColor:
        "#EAF8EE",
      borderWidth: 1,
      borderColor:
        "#C8EBD2",
    },

    stockDot: {
      width: 7,
      height: 7,
      borderRadius: 7 / 2,
      backgroundColor:
        "#22A447",
      marginRight: 6,
    },

    stockText: {
      ...typography.caption,
      color: "#168534",
      fontSize: 12,
      fontWeight: "700",
    },

    price: {
      ...typography.h2,
      color:
        colors.primaryDark,
      fontWeight: "800",
      lineHeight: 30,
      textAlign: "right",
    },

    cartSection: {
      paddingHorizontal:
        spacing.lg,
      marginTop:
        spacing.sm,
      flexDirection: "row",
      alignItems:
        "flex-end",
      gap: spacing.md,
    },

    quantityBlock: {
      flex: 1,
      minWidth: 0,
    },

    quantityLabel: {
      ...typography.caption,
      color:
        colors.textSecondary,
      fontWeight: "700",
      marginBottom:
        spacing.xs,
    },

    quantitySelector: {
      height: 52,
      flexDirection: "row",
      alignItems:
        "center",
      backgroundColor:
        colors.card,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius:
        radius.md,
      paddingHorizontal: 5,
    },

    quantityButton: {
      width: 42,
      height: 42,
      borderRadius:
        radius.sm,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    quantityDisabled: {
      opacity: 0.35,
    },

    quantityValueBox: {
      flex: 1,
      height: 42,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    quantityValue: {
      ...typography.h3,
      color:
        colors.textPrimary,
      fontWeight: "800",
    },

    addButton: {
      flex: 1,
      minHeight: 52,
      minWidth: 0,
      borderRadius:
        radius.md,
      backgroundColor:
        colors.primaryDark,
      flexDirection: "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: spacing.sm,
      paddingHorizontal:
        spacing.md,
      shadowColor:
        colors.primaryDark,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 4,
    },

    addedButton: {
      backgroundColor:
        colors.primaryLight,
    },

    addButtonDisabled: {
      opacity: 0.5,
    },

    addButtonText: {
      ...typography.button,
      color: colors.white,
      fontWeight: "700",
      textAlign: "center",
      flexShrink: 1,
    },

    ratingSection: {
      marginHorizontal:
        spacing.lg,
      marginTop:
        spacing.md,
      backgroundColor:
        colors.card,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius:
        radius.md,
      padding: spacing.md,
    },

    ratingHeaderRow: {
      flexDirection: "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom:
        spacing.sm,
    },

    ratingHeaderLeft: {
      flexDirection: "row",
      alignItems:
        "center",
      gap: spacing.sm,
    },

    editRatingText: {
      ...typography.caption,
      color:
        colors.primaryDark,
      fontWeight: "700",
    },

    ratingPrompt: {
      ...typography.body,
      color:
        colors.textSecondary,
      marginBottom:
        spacing.sm,
    },

    productRatingRow: {
      flexDirection: "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    ratingNumber: {
      ...typography.h3,
      color:
        colors.textPrimary,
      fontWeight: "800",
    },

    starRow: {
      flexDirection: "row",
      alignItems:
        "center",
      gap: spacing.xs,
    },

    starTouchable: {
      padding: 2,
    },

    detailsSection: {
      marginHorizontal:
        spacing.lg,
      marginTop:
        spacing.md,
      backgroundColor:
        colors.card,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius:
        radius.md,
      padding: spacing.md,
    },

    detailsHeader: {
      flexDirection: "row",
      alignItems:
        "center",
      gap: spacing.sm,
      marginBottom:
        spacing.sm,
    },

    detailsIcon: {
      width: 36,
      height: 36,
      borderRadius:
        radius.pill,
      backgroundColor:
        colors.background,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    detailsTitle: {
      ...typography.h3,
      color:
        colors.textPrimary,
      fontWeight: "700",
    },

    description: {
      ...typography.body,
      color:
        colors.textSecondary,
      lineHeight: 23,
    },

    noDescription: {
      ...typography.body,
      color:
        colors.textSecondary,
      lineHeight: 23,
    },

    checkoutBar: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor:
        colors.card,
      borderTopWidth: 1,
      borderTopColor:
        colors.border,
      paddingHorizontal:
        spacing.lg,
      paddingTop:
        spacing.sm,
      paddingBottom:
        spacing.sm,
      flexDirection: "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: spacing.md,
      shadowColor:
        colors.black,
      shadowOffset: {
        width: 0,
        height: -3,
      },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 10,
      zIndex: 100,
    },

    totalSection: {
      flex: 1,
      justifyContent:
        "center",
      minWidth: 0,
      paddingBottom: 7,
    },

    totalLabel: {
      ...typography.caption,
      color:
        colors.textPrimary,
      fontWeight: "600",
      marginBottom: 2,
    },

    totalPrice: {
      ...typography.h2,
      color:
        colors.primaryDark,
      fontWeight: "800",
      lineHeight: 30,
    },

    checkoutButton: {
      minHeight: 50,
      marginBottom: 3,
      width: 130,
      borderRadius:
        radius.md,
      backgroundColor:
        colors.primaryDark,
      paddingHorizontal:
        spacing.sm,
      flexDirection: "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: spacing.sm,
      overflow: "hidden",
    },

    checkoutButtonDisabled: {
      backgroundColor:
        colors.border,
      opacity: 0.9,
    },

    checkoutButtonText: {
      ...typography.button,
      color: colors.white,
      fontWeight: "700",
      fontSize: 16,
      textAlign: "center",
      flexShrink: 1,
      minWidth: 0,
    },

    checkoutButtonTextDisabled: {
      color:
        colors.textSecondary,
    },

    checkoutArrow: {
      flexShrink: 0,
    },

    footerSpace: {
      height: spacing.xl,
    },

    imageViewerContainer: {
      flex: 1,
      backgroundColor: "#000",
      alignItems:
        "center",
      justifyContent:
        "center",
      overflow: "hidden",
    },

    zoomImageWrapper: {
      width: "100%",
      height: "100%",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    zoomImage: {
      width: "100%",
      height: "100%",
    },

    imageViewerClose: {
      position: "absolute",
      top: 52,
      right: 18,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor:
        "rgba(0, 0, 0, 0.65)",
      alignItems:
        "center",
      justifyContent:
        "center",
      zIndex: 100,
      elevation: 100,
    },

    zoomInstructions: {
      position: "absolute",
      bottom: 28,
      alignSelf:
        "center",
      flexDirection: "row",
      alignItems:
        "center",
      gap: 7,
      backgroundColor:
        "rgba(0, 0, 0, 0.65)",
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius:
        radius.pill,
    },

    zoomInstructionsText: {
      ...typography.caption,
      color: colors.white,
      fontSize: 11,
      fontWeight: "600",
    },

    centerState: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal:
        spacing.xl,
    },

    stateIcon: {
      width: 66,
      height: 66,
      borderRadius:
        radius.pill,
      backgroundColor:
        colors.card,
      borderWidth: 1,
      borderColor:
        colors.primaryLight,
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom:
        spacing.md,
    },

    stateTitle: {
      ...typography.h3,
      color:
        colors.textPrimary,
      fontWeight: "700",
      textAlign: "center",
      marginBottom:
        spacing.xs,
    },

    stateText: {
      ...typography.body,
      color:
        colors.textSecondary,
      textAlign: "center",
      lineHeight: 21,
      maxWidth: 300,
    },

    retryButton: {
      marginTop:
        spacing.lg,
      paddingHorizontal:
        spacing.lg,
      paddingVertical:
        spacing.sm + 2,
      borderRadius:
        radius.pill,
      backgroundColor:
        colors.primaryDark,
      flexDirection: "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: spacing.xs,
    },

    retryText: {
      ...typography.caption,
      color: colors.white,
      fontWeight: "700",
    },

    modalOverlay: {
      flex: 1,
      justifyContent:
        "flex-end",
    },

    modalOverlayTouchable: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(33, 30, 61, 0.45)",
    },

    modalCard: {
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

    modalHeaderRow: {
      flexDirection: "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom:
        spacing.xs,
    },

    modalTitle: {
      ...typography.h3,
      color:
        colors.textPrimary,
      fontWeight: "700",
    },

    modalProductName: {
      ...typography.body,
      color:
        colors.textSecondary,
      marginBottom:
        spacing.md,
    },

    modalStarsWrapper: {
      alignItems:
        "center",
      paddingVertical:
        spacing.md,
      gap: spacing.sm,
    },

    modalStarsHint: {
      ...typography.caption,
      color:
        colors.textSecondary,
      fontWeight: "600",
    },

    modalInputLabel: {
      ...typography.caption,
      color:
        colors.textSecondary,
      fontWeight: "700",
      marginBottom:
        spacing.xs,
      marginTop:
        spacing.sm,
    },

    modalInput: {
      ...typography.body,
      color:
        colors.textPrimary,
      minHeight: 90,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius:
        radius.md,
      padding: spacing.md,
      textAlignVertical:
        "top",
    },

    modalErrorText: {
      ...typography.caption,
      color: colors.danger,
      marginTop:
        spacing.sm,
      fontWeight: "600",
    },

    modalActionsRow: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop:
        spacing.lg,
    },

    modalCancelButton: {
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

    modalCancelText: {
      ...typography.button,
      color:
        colors.textPrimary,
      fontWeight: "700",
    },

    modalSubmitButton: {
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

    modalSubmitButtonDisabled: {
      opacity: 0.5,
    },

    modalSubmitText: {
      ...typography.button,
      color: colors.white,
      fontWeight: "700",
    },
  });