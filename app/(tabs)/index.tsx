import KeyboardScreen from "@/components/KeyboardScreen";
import {
  colors,
  radius,
  spacing,
  typography,
} from "@/constants/theme";
import { useWishlist } from "@/context/WishlistContext";
import { useMobCategories } from "@/hooks/useMobCategories";
import {
  getHomePageImages,
  HomePageImage,
  MobProduct,
} from "@/services/api";
import { formatRs } from "@/utils/currency";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// The wrapper has `marginHorizontal: spacing.sm` on both sides, so the
// actual visible width of each banner page must match that, or paging
// math (snapToInterval / scrollTo offsets) will drift.
const BANNER_HORIZONTAL_MARGIN = spacing.sm;
const BANNER_WIDTH = SCREEN_WIDTH - BANNER_HORIZONTAL_MARGIN * 2;
const BANNER_HEIGHT = 150;
const BANNER_AUTO_SCROLL_INTERVAL_MS = 3000;

export default function HomeScreen() {
  const {
    mainCategories,
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    refresh: refreshCategories,
  } = useMobCategories();

  const {
    wishlistProducts,
    loading: wishlistLoading,
    isWishlisted,
    toggleWishlist,
    refreshWishlist,
  } = useWishlist();

  const [refreshing, setRefreshing] = useState(false);

  /*
   * ============================================================
   * HOMEPAGE IMAGES
   * ============================================================
   */

  const [homePageImages, setHomePageImages] = useState<HomePageImage[]>([]);
  const [homePageImagesLoading, setHomePageImagesLoading] = useState(true);
  const [homePageImagesFetchedAt, setHomePageImagesFetchedAt] = useState(() => Date.now());

  /*
   * ============================================================
   * BANNER SLIDER (auto-advances every 3s, swipeable, dots)
   * ============================================================
   */

  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);
  const bannerAutoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserInteractingRef = useRef(false);

  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!homePageImagesLoading) {
      return;
    }

    shimmerAnimation.setValue(0);

    const animation = Animated.loop(
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [homePageImagesLoading, shimmerAnimation]);

  const shimmerTranslateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-350, 350],
  });

  const loadHomePageImages = useCallback(async () => {
    try {
      setHomePageImagesLoading(true);
      const data = await getHomePageImages();
      setHomePageImages(data);
      setHomePageImagesFetchedAt(Date.now());
      
      // Reset to first banner when images change
      setActiveBannerIndex(0);
      bannerScrollRef.current?.scrollTo({
        x: 0,
        animated: false,
      });
    } catch (error) {
      console.log("[HOME] Failed to load homepage images:", error);
      setHomePageImages([]);
    } finally {
      setHomePageImagesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomePageImages();
  }, [loadHomePageImages]);

  useFocusEffect(
    useCallback(() => {
      loadHomePageImages();
    }, [loadHomePageImages])
  );

  const getCacheBustedUri = (image: HomePageImage) => {
    return `${image.imagesPath}?v=${homePageImagesFetchedAt}`;
  };

  // Start auto-scroll timer
  const startBannerAutoScroll = useCallback(() => {
    // Clear any existing timer
    if (bannerAutoScrollTimerRef.current) {
      clearInterval(bannerAutoScrollTimerRef.current);
      bannerAutoScrollTimerRef.current = null;
    }

    // Don't start if user is interacting or there's 0 or 1 banner
    if (isUserInteractingRef.current || homePageImages.length <= 1) {
      return;
    }

    bannerAutoScrollTimerRef.current = setInterval(() => {
      setActiveBannerIndex((current) => {
        const next = (current + 1) % homePageImages.length;
        
        bannerScrollRef.current?.scrollTo({
          x: next * BANNER_WIDTH,
          animated: true,
        });

        return next;
      });
    }, BANNER_AUTO_SCROLL_INTERVAL_MS);
  }, [homePageImages.length]);

  // Stop auto-scroll timer
  const stopBannerAutoScroll = useCallback(() => {
    if (bannerAutoScrollTimerRef.current) {
      clearInterval(bannerAutoScrollTimerRef.current);
      bannerAutoScrollTimerRef.current = null;
    }
  }, []);

  // Start auto-scroll on mount and when dependencies change
  useEffect(() => {
    startBannerAutoScroll();

    return () => {
      stopBannerAutoScroll();
    };
  }, [startBannerAutoScroll, stopBannerAutoScroll]);

  // Handle user starting to drag
  const handleBannerScrollBeginDrag = useCallback(() => {
    isUserInteractingRef.current = true;
    stopBannerAutoScroll();
  }, [stopBannerAutoScroll]);

  // Handle user ending drag
  const handleBannerScrollEndDrag = useCallback(() => {
    isUserInteractingRef.current = false;
    // Small delay before resuming auto-scroll
    setTimeout(() => {
      startBannerAutoScroll();
    }, 3000);
  }, [startBannerAutoScroll]);

  // Handle momentum scroll end
  const handleBannerMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / BANNER_WIDTH);
      
      // Only update if the index actually changed
      if (newIndex !== activeBannerIndex) {
        setActiveBannerIndex(newIndex);
      }
      
      // Resume auto-scroll after user interaction
      isUserInteractingRef.current = false;
      startBannerAutoScroll();
    },
    [activeBannerIndex, startBannerAutoScroll]
  );

  // Go to specific banner index
  const goToBannerIndex = useCallback(
    (index: number) => {
      if (index === activeBannerIndex) return;
      
      setActiveBannerIndex(index);
      bannerScrollRef.current?.scrollTo({
        x: index * BANNER_WIDTH,
        animated: true,
      });

      // Restart auto-scroll after manual navigation
      stopBannerAutoScroll();
      setTimeout(() => {
        startBannerAutoScroll();
      }, 3000);
    },
    [activeBannerIndex, startBannerAutoScroll, stopBannerAutoScroll]
  );

  /*
   * ============================================================
   * SEARCH
   * ============================================================
   */

  const [searchQuery, setSearchQuery] = useState("");
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  const matchedCategories = useMemo(() => {
    if (!isSearching) return [];
    return mainCategories.filter((c) =>
      c.name?.toLowerCase().includes(trimmedQuery)
    );
  }, [mainCategories, trimmedQuery, isSearching]);

  const matchedWishlist = useMemo(() => {
    if (!isSearching) return [];
    return wishlistProducts.filter(
      (p) =>
        p.productTitle?.toLowerCase().includes(trimmedQuery) ||
        p.subCategoryTitle?.toLowerCase().includes(trimmedQuery)
    );
  }, [wishlistProducts, trimmedQuery, isSearching]);

  const hasSearchResults = matchedCategories.length > 0 || matchedWishlist.length > 0;

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  /*
   * ============================================================
   * PULL TO REFRESH
   * ============================================================
   */

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        refreshCategories(),
        refreshWishlist(),
        loadHomePageImages(),
      ]);
    } catch (error) {
      console.log("[HOME] Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshCategories, refreshWishlist, loadHomePageImages]);

  const previewWishlist = wishlistProducts.slice(0, 6);

  /*
   * ============================================================
   * RESOLVE PRODUCT CATEGORY IDS
   * ============================================================
   */

  const resolveIds = useCallback(
    (product: MobProduct) => {
      const subcategory = categories.find(
        (c) => c.type === "SubCat" && c.name === product.subCategoryTitle
      );
      return {
        catId: subcategory?.parentId ?? null,
        subCatId: subcategory?.id ?? null,
      };
    },
    [categories]
  );

  /*
   * ============================================================
   * PRODUCT DETAILS
   * ============================================================
   */

  const goToProduct = useCallback(
    (product: MobProduct) => {
      const { catId, subCatId } = resolveIds(product);
      router.push({
        pathname: "/product/[id]",
        params: {
          id: String(product.productID),
          catId: String(catId ?? ""),
          subCatId: String(subCatId ?? ""),
        },
      });
    },
    [resolveIds]
  );

  /*
   * ============================================================
   * CATEGORY NAVIGATION
   * ============================================================
   */

  const goToCategory = useCallback((categoryId: number | string) => {
    router.push({
      pathname: "/category/[id]",
      params: { id: String(categoryId) },
    });
  }, []);

  /*
   * ============================================================
   * WISHLIST NAVIGATION
   * ============================================================
   */

  const openWishlist = useCallback(() => {
    console.log("[HOME] Opening wishlist");
    router.push("/wishlist");
  }, []);

  return (
    <KeyboardScreen
      contentContainerStyle={{
        paddingBottom: 180,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primaryDark}
          colors={[colors.primaryDark]}
        />
      }
    >
      {/* ================================================== */}
      {/* SEARCH */}
      {/* ================================================== */}

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
        <TextInput
          placeholder="Search categories or wishlist..."
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {isSearching && (
          <TouchableOpacity onPress={clearSearch} hitSlop={8} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ================================================== */}
      {/* HOMEPAGE BANNER SLIDER */}
      {/* ================================================== */}

      {!isSearching && (
        <>
          {homePageImagesLoading ? (
            <View style={styles.homePageImageWrapper}>
              <View style={styles.shimmerContainer}>
                <Animated.View
                  style={[
                    styles.shimmerHighlight,
                    {
                      transform: [{ translateX: shimmerTranslateX }],
                    },
                  ]}
                />
              </View>
            </View>
          ) : (
            homePageImages.length > 0 && (
              <View style={styles.homePageImageWrapper}>
                <ScrollView
                  ref={bannerScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={BANNER_WIDTH}
                  snapToAlignment="start"
                  bounces={false}
                  onScrollBeginDrag={handleBannerScrollBeginDrag}
                  onScrollEndDrag={handleBannerScrollEndDrag}
                  onMomentumScrollEnd={handleBannerMomentumScrollEnd}
                  scrollEventThrottle={16}
                >
                  {homePageImages.map((image, index) => (
                    <View
                      key={`${image.imagesPath}-${index}`}
                      style={{
                        width: BANNER_WIDTH,
                        height: BANNER_HEIGHT,
                      }}
                    >
                      <Image
                        source={{
                          uri: getCacheBustedUri(image),
                        }}
                        style={styles.homePageImage}
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                </ScrollView>

                {/* Dot indicators */}
                {homePageImages.length > 1 && (
                  <View style={styles.bannerIndicators}>
                    {homePageImages.map((_, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => goToBannerIndex(index)}
                        hitSlop={6}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.bannerIndicator,
                            index === activeBannerIndex && styles.bannerIndicatorActive,
                          ]}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )
          )}
        </>
      )}

      {/* ================================================== */}
      {/* SEARCH RESULTS */}
      {/* ================================================== */}

      {isSearching ? (
        <View style={styles.searchResultsArea}>
          {!hasSearchResults ? (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={22} color={colors.textSecondary} />
              <Text style={styles.noResultsText}>No results for "{searchQuery}"</Text>
            </View>
          ) : (
            <>
              {/* Matched Categories */}
              {matchedCategories.length > 0 && (
                <View style={styles.searchSection}>
                  <Text style={styles.searchSectionTitle}>Categories</Text>
                  <View style={styles.searchCategoryGrid}>
                    {matchedCategories.map((item) => (
                      <TouchableOpacity
                        key={String(item.id)}
                        style={styles.categoryChip}
                        activeOpacity={0.8}
                        onPress={() => goToCategory(item.id)}
                      >
                        <View style={styles.categoryImageContainer}>
                          {item.image ? (
                            <Image
                              source={{ uri: item.image }}
                              style={styles.categoryImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <Ionicons name="grid-outline" size={28} color={colors.primaryDark} />
                          )}
                        </View>
                        <Text style={styles.categoryName} numberOfLines={1} ellipsizeMode="tail">
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Matched Wishlist Items */}
              {matchedWishlist.length > 0 && (
                <View style={styles.searchSection}>
                  <Text style={styles.searchSectionTitle}>Wishlist</Text>
                  <View style={styles.wishlistList}>
                    {matchedWishlist.map((product, index) => {
                      const liked = isWishlisted(product.productID);
                      const isLast = index === matchedWishlist.length - 1;
                      return (
                        <TouchableOpacity
                          key={product.productID}
                          style={[styles.wishRow, isLast && styles.wishRowLast]}
                          activeOpacity={0.7}
                          onPress={() => goToProduct(product)}
                        >
                          <View style={styles.wishThumb}>
                            {product.imagesPath ? (
                              <Image
                                source={{ uri: product.imagesPath }}
                                style={styles.wishThumbImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.wishThumbFallback}>
                                <Ionicons name="image-outline" size={18} color={colors.textSecondary} />
                              </View>
                            )}
                          </View>
                          <View style={styles.wishRowInfo}>
                            <Text style={styles.wishRowName} numberOfLines={1} ellipsizeMode="tail">
                              {product.productTitle}
                            </Text>
                            <Text style={styles.wishRowSub} numberOfLines={1} ellipsizeMode="tail">
                              {product.subCategoryTitle}
                            </Text>
                          </View>
                          <Text style={styles.wishRowPrice}>{formatRs(product.salePrice)}</Text>
                          <TouchableOpacity
                            style={styles.wishRowHeart}
                            activeOpacity={0.7}
                            onPress={(e) => {
                              e.stopPropagation();
                              toggleWishlist(product);
                            }}
                            hitSlop={8}
                          >
                            <Ionicons
                              name={liked ? "heart" : "heart-outline"}
                              size={18}
                              color={liked ? colors.primaryDark : colors.textSecondary}
                            />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      ) : (
        <>
          {/* ================================================== */}
          {/* CATEGORIES HEADER */}
          {/* ================================================== */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/(tabs)/categories")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* ================================================== */}
          {/* CATEGORIES */}
          {/* ================================================== */}

          {categoriesLoading ? (
            <View style={styles.categoryArea}>
              <ActivityIndicator color={colors.primaryDark} />
            </View>
          ) : categoriesError ? (
            <View style={styles.categoryArea}>
              <Ionicons name="cloud-offline-outline" size={24} color={colors.textSecondary} />
              <Text style={styles.categoryErrorText}>Unable to load categories</Text>
            </View>
          ) : mainCategories.length === 0 ? (
            <View style={styles.categoryArea}>
              <Text style={styles.categoryErrorText}>No categories available</Text>
            </View>
          ) : (
            <View style={styles.categoryArea}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {mainCategories.map((item) => (
                  <TouchableOpacity
                    key={String(item.id)}
                    style={styles.categoryChip}
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push({
                        pathname: "/category/[id]",
                        params: { id: String(item.id) },
                      })
                    }
                  >
                    <View style={styles.categoryImageContainer}>
                      {item.image ? (
                        <Image
                          source={{ uri: item.image }}
                          style={styles.categoryImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons name="grid-outline" size={28} color={colors.primaryDark} />
                      )}
                    </View>
                    <Text style={styles.categoryName} numberOfLines={1} ellipsizeMode="tail">
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ================================================== */}
          {/* WISHLIST HEADER */}
          {/* ================================================== */}

          <View style={styles.wishlistHeader}>
            <View style={styles.wishlistHeaderLeft}>
              <Text style={styles.wishlistTitle}>Wishlist</Text>
              {previewWishlist.length > 0 && (
                <View style={styles.wishlistCountPill}>
                  <Text style={styles.wishlistCountText}>{wishlistProducts.length}</Text>
                </View>
              )}
            </View>
            {previewWishlist.length > 0 && (
              <TouchableOpacity activeOpacity={0.7} onPress={openWishlist} hitSlop={8}>
                <Text style={styles.wishlistViewAll}>View all</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ================================================== */}
          {/* WISHLIST */}
          {/* ================================================== */}

          {wishlistLoading ? (
            <View style={styles.categoryLoading}>
              <ActivityIndicator color={colors.primaryDark} />
            </View>
          ) : previewWishlist.length > 0 ? (
            <View style={styles.wishlistList}>
              {previewWishlist.map((product, index) => {
                const liked = isWishlisted(product.productID);
                const isLast = index === previewWishlist.length - 1;
                return (
                  <TouchableOpacity
                    key={product.productID}
                    style={[styles.wishRow, isLast && styles.wishRowLast]}
                    activeOpacity={0.7}
                    onPress={() => goToProduct(product)}
                  >
                    <View style={styles.wishThumb}>
                      {product.imagesPath ? (
                        <Image
                          source={{ uri: product.imagesPath }}
                          style={styles.wishThumbImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.wishThumbFallback}>
                          <Ionicons name="image-outline" size={18} color={colors.textSecondary} />
                        </View>
                      )}
                    </View>
                    <View style={styles.wishRowInfo}>
                      <Text style={styles.wishRowName} numberOfLines={1} ellipsizeMode="tail">
                        {product.productTitle}
                      </Text>
                      <Text style={styles.wishRowSub} numberOfLines={1} ellipsizeMode="tail">
                        {product.subCategoryTitle}
                      </Text>
                    </View>
                    <Text style={styles.wishRowPrice}>{formatRs(product.salePrice)}</Text>
                    <TouchableOpacity
                      style={styles.wishRowHeart}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product);
                      }}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={liked ? "heart" : "heart-outline"}
                        size={18}
                        color={liked ? colors.primaryDark : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}

              {/* More wishlist items */}
              {wishlistProducts.length > previewWishlist.length && (
                <TouchableOpacity style={styles.wishlistMoreRow} activeOpacity={0.7} onPress={openWishlist}>
                  <Text style={styles.wishlistMoreText}>
                    +{wishlistProducts.length - previewWishlist.length} more saved
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primaryDark} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* ================================================== */
            /* EMPTY WISHLIST */
            /* ================================================== */

            <TouchableOpacity style={styles.emptyWishlist} activeOpacity={0.8} onPress={openWishlist}>
              <Ionicons name="heart-outline" size={22} color={colors.primaryDark} />
              <Text style={styles.emptyWishlistText}>Tap the heart on any product to save it here</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </>
      )}
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 10,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },

  deliveryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  deliveryAddress: {
    ...typography.h3,
    color: colors.textPrimary,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    marginTop: 3,
  },

  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },

  /* ================================================== */
  /* HOMEPAGE BANNER SLIDER */
  /* ================================================== */

  homePageImageWrapper: {
    marginHorizontal: BANNER_HORIZONTAL_MARGIN,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.card,
  },

  homePageImage: {
    width: "100%",
    height: BANNER_HEIGHT,
  },

  bannerIndicators: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  bannerIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
  },

  bannerIndicatorActive: {
    width: 18,
    backgroundColor: colors.white,
  },

  /* ================================================== */
  /* SHIMMER */
  /* ================================================== */

  shimmerContainer: {
    width: "100%",
    height: BANNER_HEIGHT,
    overflow: "hidden",
    backgroundColor: colors.border,
  },

  shimmerHighlight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 180,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    transform: [
      {
        skewX: "-20deg",
      },
    ],
  },

  /* ================================================== */
  /* SEARCH RESULTS */
  /* ================================================== */

  searchResultsArea: {
    marginTop: spacing.lg,
  },

  searchSection: {
    marginBottom: spacing.lg,
  },

  searchSectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },

  searchCategoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  noResults: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },

  noResultsText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },

  banner: {
    flexDirection: "row",
    backgroundColor: colors.primaryDark,
    marginHorizontal: spacing.sm,
    marginTop: 12,
    borderRadius: radius.lg,
    padding: spacing.lg,
    minHeight: 120,
  },

  bannerTitle: {
    ...typography.h1,
    color: colors.white,
  },

  bannerSubtitle: {
    ...typography.body,
    color: colors.white,
    marginBottom: spacing.md,
  },

  bannerBtn: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: "flex-start",
  },

  bannerBtnText: {
    color: colors.primaryDark,
    fontWeight: "700",
    fontSize: 13,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },

  seeAll: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: "600",
  },

  /* ================================================== */
  /* CATEGORIES */
  /* ================================================== */

  categoryArea: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    alignItems: "center",
  },

  categoryLoading: {
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryError: {
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },

  categoryErrorText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  categoryChip: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 110,
    borderWidth: 1,
    borderColor: colors.border,
  },

  categoryImageContainer: {
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    marginBottom: spacing.xs,
  },

  categoryImage: {
    width: "100%",
    height: "100%",
  },

  categoryName: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
  },

  /* ================================================== */
  /* WISHLIST */
  /* ================================================== */

  wishlistHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },

  wishlistHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  wishlistTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 19,
  },

  wishlistCountPill: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(241, 115, 31, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  wishlistCountText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primaryDark,
  },

  wishlistViewAll: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: "700",
  },

  wishlistList: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },

  wishRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },

  wishRowLast: {
    borderBottomWidth: 0,
  },

  wishThumb: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.background,
  },

  wishThumbImage: {
    width: "100%",
    height: "100%",
  },

  wishThumbFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  wishRowInfo: {
    flex: 1,
    minWidth: 0,
  },

  wishRowName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },

  wishRowSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },

  wishRowPrice: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 13,
    marginRight: spacing.xs,
  },

  wishRowHeart: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  wishlistMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },

  wishlistMoreText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: "700",
  },

  /* ================================================== */
  /* EMPTY WISHLIST */
  /* ================================================== */

  emptyWishlist: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  emptyWishlistText: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 13,
  },

  /* ================================================== */
  /* CLEAR CACHE */
  /* ================================================== */

  clearCacheSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },

  clearCacheTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  clearCacheDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
});