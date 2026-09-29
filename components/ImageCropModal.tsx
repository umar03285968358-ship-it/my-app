// components/profile/ImageCropModal.tsx
//
// A self-contained, in-app replacement for expo-image-picker's
// `allowsEditing: true` native crop screen.
//
// WHY THIS EXISTS:
// ----------------------------------------------------------------
// `allowsEditing: true` hands the picked photo off to the OS's own
// crop activity (Android) / crop sheet (iOS). That native screen is
// NOT a React Native view — it can't be restyled from JS, and on
// certain devices/screen sizes its own buttons get pushed off-screen
// or overlap (exactly the bug in the screenshot). The fix is to never
// open that native cropper at all, and instead show our own crop
// screen — same idea as WhatsApp, Instagram, etc. — where WE control
// the layout, so the bottom action bar is always visible and never
// depends on quirks of the native cropping activity.
//
// This screen lets the user pan + pinch-zoom the photo inside a fixed
// square frame, rotate it 90° at a time, and always shows Cancel /
// Rotate / Done pinned to the bottom via SafeAreaView.
//
// Requires:
//   npx expo install expo-image-manipulator react-native-gesture-handler

import { colors, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
  State,
} from "react-native-gesture-handler";
import ShimmerPlaceholder from "./ShimmerPlaceholder";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// The fixed square crop window. Leaves a margin on both sides.
const FRAME_SIZE = SCREEN_WIDTH - 48;

// How far past "just covers the frame" the user is allowed to zoom in.
const MAX_ZOOM_MULTIPLIER = 4;

type Props = {
  visible: boolean;
  imageUri: string | null;
  onCancel: () => void;
  onDone: (croppedUri: string) => void;
};

export default function ImageCropModal({
  visible,
  imageUri,
  onCancel,
  onDone,
}: Props) {
  const [imgSize, setImgSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const [imageLoading, setImageLoading] = useState(true);
  const [rotation, setRotation] = useState(0); // 0 | 90 | 180 | 270
  const [processing, setProcessing] = useState(false);

  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // The max distance (in screen px, from center) the image is allowed
  // to be panned in each axis without leaving a gap at the frame's
  // edge. Recomputed at the start of every pan gesture and used to
  // clamp the live drag in real time — see `clampedPanX/Y` below.
  const [panRange, setPanRange] = useState({ maxX: 0.01, maxY: 0.01 });

  // Animated-driven transform values for the live gesture preview.
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pinchAnim = useRef(new Animated.Value(1)).current;

  // Plain JS mirrors used for the crop math + as the "committed"
  // baseline that each new gesture builds on top of.
  const panOffset = useRef({ x: 0, y: 0 });
  const scaleOffset = useRef(1); // total (cover * zoom) scale, in image px -> screen px
  const coverScaleRef = useRef(1); // the "just covers the frame" scale for current rotation

  // ============================================================
  // BOUNDARY HELPERS
  // ============================================================
  //
  // The image must always fully cover the FRAME_SIZE square — this
  // is what stops the black cropArea background from ever showing
  // at the sides while panning or after zooming out.

  const getRotatedDims = () => {
    if (!imgSize) return { rw: FRAME_SIZE, rh: FRAME_SIZE };

    const isSideways = rotation === 90 || rotation === 270;

    return isSideways
      ? { rw: imgSize.height, rh: imgSize.width }
      : { rw: imgSize.width, rh: imgSize.height };
  };

  const getMaxOffsets = (rw: number, rh: number, scale: number) => {
    const displayedW = rw * scale;
    const displayedH = rh * scale;

    return {
      maxOffsetX: Math.max(0, (displayedW - FRAME_SIZE) / 2),
      maxOffsetY: Math.max(0, (displayedH - FRAME_SIZE) / 2),
    };
  };

  // Snaps the committed pan offset back inside bounds (called after
  // every pan/pinch gesture ends) so the resting position — and the
  // final crop math — never reflects an out-of-bounds drag.
  const clampPanOffsetToBounds = (
    rw: number,
    rh: number,
    scale: number,
  ) => {
    const { maxOffsetX, maxOffsetY } = getMaxOffsets(rw, rh, scale);

    const clampedX = Math.max(
      -maxOffsetX,
      Math.min(maxOffsetX, panOffset.current.x),
    );
    const clampedY = Math.max(
      -maxOffsetY,
      Math.min(maxOffsetY, panOffset.current.y),
    );

    panOffset.current = { x: clampedX, y: clampedY };

    pan.setOffset(panOffset.current);
    pan.setValue({ x: 0, y: 0 });
  };

  const panHandlerRef = useRef(null);
  const pinchHandlerRef = useRef(null);

  // ============================================================
  // RESET WHEN A NEW IMAGE IS OPENED
  // ============================================================
  useEffect(() => {
    if (!visible || !imageUri) return;

    setImageLoading(true);
    setRotation(0);
    setImgSize(null);
    setProcessing(false);

    resetTransform();

    Image.getSize(
      imageUri,
      (w, h) => {
        setImgSize({ width: w, height: h });
        applyCoverScale(w, h);
      },
      () => {
        // Fallback so the screen doesn't get stuck if getSize fails.
        setImgSize({ width: FRAME_SIZE, height: FRAME_SIZE });
        applyCoverScale(FRAME_SIZE, FRAME_SIZE);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, imageUri]);

  const resetTransform = () => {
    pan.setValue({ x: 0, y: 0 });
    pan.setOffset({ x: 0, y: 0 });
    panOffset.current = { x: 0, y: 0 };
  };

  const applyCoverScale = (rw: number, rh: number) => {
    const cover = Math.max(FRAME_SIZE / rw, FRAME_SIZE / rh);

    coverScaleRef.current = cover;
    scaleOffset.current = cover;

    scaleAnim.setValue(cover);
    pinchAnim.setValue(1);
  };

  // ============================================================
  // PAN GESTURE
  // ============================================================

  const onPanEvent = Animated.event(
    [{ nativeEvent: { translationX: pan.x, translationY: pan.y } }],
    { useNativeDriver: true },
  );

  const onPanStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      panOffset.current = {
        x: panOffset.current.x + event.nativeEvent.translationX,
        y: panOffset.current.y + event.nativeEvent.translationY,
      };

      pan.setOffset(panOffset.current);
      pan.setValue({ x: 0, y: 0 });
    }
  };

  // ============================================================
  // PINCH GESTURE
  // ============================================================

  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: pinchAnim } }],
    { useNativeDriver: true },
  );

  const onPinchStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const min = coverScaleRef.current;
      const max = coverScaleRef.current * MAX_ZOOM_MULTIPLIER;

      let next = scaleOffset.current * event.nativeEvent.scale;
      next = Math.max(min, Math.min(max, next));

      scaleOffset.current = next;

      scaleAnim.setValue(next);
      pinchAnim.setValue(1);
    }
  };

  const totalScale = Animated.multiply(scaleAnim, pinchAnim);

  // ============================================================
  // ROTATE
  // ============================================================

  const handleRotate = () => {
    if (processing || !imgSize) return;

    const nextRotation = (rotation + 90) % 360;
    setRotation(nextRotation);

    const isSideways = nextRotation === 90 || nextRotation === 270;
    const rw = isSideways ? imgSize.height : imgSize.width;
    const rh = isSideways ? imgSize.width : imgSize.height;

    resetTransform();
    applyCoverScale(rw, rh);
  };

  // ============================================================
  // DONE — compute the crop rect in original image pixels, then
  // hand off to expo-image-manipulator to actually rotate + crop.
  // ============================================================

  const handleDone = async () => {
    if (!imageUri || !imgSize || processing) return;

    setProcessing(true);

    try {
      const isSideways = rotation === 90 || rotation === 270;
      const rotatedW = isSideways ? imgSize.height : imgSize.width;
      const rotatedH = isSideways ? imgSize.width : imgSize.height;

      const totalScaleValue = scaleOffset.current;
      const displayedW = rotatedW * totalScaleValue;
      const displayedH = rotatedH * totalScaleValue;

      const panX = panOffset.current.x;
      const panY = panOffset.current.y;

      let cropX =
        (displayedW / 2 - panX - FRAME_SIZE / 2) / totalScaleValue;
      let cropY =
        (displayedH / 2 - panY - FRAME_SIZE / 2) / totalScaleValue;
      let cropSize = FRAME_SIZE / totalScaleValue;

      // Keep the crop rect fully inside the (rotated) image bounds.
      cropX = Math.max(0, Math.min(cropX, rotatedW - cropSize));
      cropY = Math.max(0, Math.min(cropY, rotatedH - cropSize));

      const actions: ImageManipulator.Action[] = [];

      if (rotation !== 0) {
        actions.push({ rotate: rotation });
      }

      actions.push({
        crop: {
          originX: cropX,
          originY: cropY,
          width: cropSize,
          height: cropSize,
        },
      });

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        {
          compress: 0.85,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      onDone(result.uri);
    } catch (error) {
      console.error("[IMAGE CROP] Failed to crop image:", error);

      // Don't block the user on a manipulation failure — fall back
      // to the original picked image rather than a dead end.
      onDone(imageUri);
    } finally {
      setProcessing(false);
    }
  };

  if (!visible) return null;

  const topBottomDim = containerSize
    ? Math.max(0, (containerSize.height - FRAME_SIZE) / 2)
    : 0;

  const leftRightDim = containerSize
    ? Math.max(0, (containerSize.width - FRAME_SIZE) / 2)
    : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.flex}>
        <View style={styles.container}>
          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <SafeAreaView style={styles.chrome}>
            {/* <View style={styles.header}>
              <TouchableOpacity
                onPress={onCancel}
                disabled={processing}
                hitSlop={12}
              >
                <Ionicons
                  name="arrow-back"
                  size={26}
                  color={colors.white}
                />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>
                Move and Scale
              </Text>

              <View style={{ width: 26 }} />
            </View> */}
          </SafeAreaView>

          {/* ================================================== */}
          {/* CROP AREA */}
          {/* ================================================== */}

          <View
            style={styles.cropArea}
            onLayout={(e) =>
              setContainerSize({
                width: e.nativeEvent.layout.width,
                height: e.nativeEvent.layout.height,
              })
            }
          >
            {/* Pan + pinch layer */}
            <PanGestureHandler
              ref={panHandlerRef}
              simultaneousHandlers={pinchHandlerRef}
              onGestureEvent={onPanEvent}
              onHandlerStateChange={onPanStateChange}
            >
              <Animated.View style={StyleSheet.absoluteFill}>
                <PinchGestureHandler
                  ref={pinchHandlerRef}
                  simultaneousHandlers={panHandlerRef}
                  onGestureEvent={onPinchEvent}
                  onHandlerStateChange={onPinchStateChange}
                >
                  <Animated.View
                    style={[
                      styles.imageLayer,
                      {
                        transform: [
                          { translateX: pan.x },
                          { translateY: pan.y },
                          { scale: totalScale },
                          { rotate: `${rotation}deg` },
                        ],
                      },
                    ]}
                  >
                    {imageUri && imgSize && (
                      <Image
                        source={{ uri: imageUri }}
                        style={{
                          width: imgSize.width,
                          height: imgSize.height,
                        }}
                        resizeMode="cover"
                        onLoadEnd={() => setImageLoading(false)}
                      />
                    )}
                  </Animated.View>
                </PinchGestureHandler>
              </Animated.View>
            </PanGestureHandler>

            {/* Dimmed surround + frame outline — marks the crop window
                without clipping the image, so the user can see what's
                just outside the frame while dragging, same as WhatsApp. */}
            {containerSize && (
              <>
                <View
                  pointerEvents="none"
                  style={[
                    styles.dim,
                    { top: 0, left: 0, right: 0, height: topBottomDim },
                  ]}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.dim,
                    {
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: topBottomDim,
                    },
                  ]}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.dim,
                    {
                      top: topBottomDim,
                      bottom: topBottomDim,
                      left: 0,
                      width: leftRightDim,
                    },
                  ]}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.dim,
                    {
                      top: topBottomDim,
                      bottom: topBottomDim,
                      right: 0,
                      width: leftRightDim,
                    },
                  ]}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.frameBorder,
                    { width: FRAME_SIZE, height: FRAME_SIZE },
                  ]}
                />
              </>
            )}

            {/* Shimmer instead of a blank square while the picked
                photo is still decoding/loading. */}
            {imageLoading && (
              <View
                pointerEvents="none"
                style={styles.shimmerWrap}
              >
                <ShimmerPlaceholder
                  width={FRAME_SIZE}
                  height={FRAME_SIZE}
                  borderRadius={0}
                />
              </View>
            )}
          </View>

          {/* ================================================== */}
          {/* BOTTOM BAR — pinned via SafeAreaView, always visible */}
          {/* ================================================== */}

          <SafeAreaView style={styles.chrome}>
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.footerBtn}
                onPress={onCancel}
                disabled={processing}
                hitSlop={8}
              >
                <Text style={styles.footerBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.footerBtn}
                onPress={handleRotate}
                disabled={processing || imageLoading}
                hitSlop={8}
              >
                <Ionicons
                  name="reload-outline"
                  size={22}
                  color={
                    processing || imageLoading
                      ? colors.textSecondary
                      : colors.white
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.footerBtn}
                onPress={handleDone}
                disabled={processing || imageLoading}
                hitSlop={8}
              >
                {processing ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text
                    style={[
                      styles.footerBtnText,
                      styles.footerDoneText,
                    ]}
                  >
                    Done
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  chrome: {
    backgroundColor: "#000",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  headerTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: "600",
  },

  cropArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#000",
  },

  imageLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },

  dim: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  frameBorder: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
  },

  shimmerWrap: {
    position: "absolute",
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: 56,
  },

  footerBtn: {
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },

  footerBtnText: {
    ...typography.body,
    color: colors.white,
    fontWeight: "600",
  },

  footerDoneText: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
});