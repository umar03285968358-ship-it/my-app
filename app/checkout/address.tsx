import KeyboardScreen from "@/components/KeyboardScreen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { PaymentMethod, useCheckout } from "@/context/CheckoutContext";
import { getBankDetail } from "@/services/api";
import { getUser } from "@/services/authStorage";
import { showToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router, Stack } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const ORANGE = "#F1731F";
const SOFT_ORANGE = "#FFF1E8";

// Default map center when we don't yet know the user's location
// (Islamabad, Pakistan).
const DEFAULT_LAT = 33.6844;
const DEFAULT_LNG = 73.0479;

export default function CheckoutAddressScreen() {
  const { data, updateData, logCheckoutData, validateCheckoutData } = useCheckout();
  const [prefilled, setPrefilled] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  const [errors, setErrors] = useState({
    address: "",
    contactNumber: "",
    screenshot: "",
  });

  /*
   * ==========================================================
   * PIN LOCATION STATE
   * ==========================================================
   */
  const [mapVisible, setMapVisible] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);

  const [pickedCoords, setPickedCoords] = useState({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
  });

  const webviewRef = useRef<WebView>(null);

  // Prefill address + contact from the saved user, only once.
  useEffect(() => {
    (async () => {
      if (prefilled) return;

      const user = await getUser();

      console.log("[CHECKOUT ADDRESS] Prefilling user data:", {
        userAddress: user?.userAddress || user?.UserAddress,
        mobileNo: user?.mobileNo || user?.MobileNo,
      });

      if (user) {
        updateData({
          address:
            data.address || user.userAddress || user.UserAddress || "",
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
    console.log("[CHECKOUT ADDRESS] Payment method selected:", method);
    updateData({ paymentMethod: method });

    if (method === "IBFT" && !data.bankDetail && !bankLoading) {
      fetchBankDetail();
    }

    // Clear screenshot error when switching away from IBFT.
    if (method !== "IBFT") {
      setErrors((prev) => ({
        ...prev,
        screenshot: "",
      }));
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

      setErrors((prev) => ({
        ...prev,
        screenshot: "",
      }));
    }
  };

  const removeScreenshot = () => {
    updateData({
      screenshotUri: null,
      screenshotBase64: null,
    });

    if (data.paymentMethod === "IBFT") {
      setErrors((prev) => ({
        ...prev,
        screenshot: "Please attach your payment screenshot",
      }));
    }
  };

  /*
   * ==========================================================
   * PIN LOCATION FLOW
   * ==========================================================
   */

  const openLocationPicker = async () => {
    console.log("[CHECKOUT ADDRESS] Opening location picker...");
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      console.log("[CHECKOUT ADDRESS] Location permission status:", status);

      if (status !== "granted") {
        showToast(
          "Location permission is required to pin your address",
          "error",
        );
        return;
      }

      setMapLoading(true);
      setMapVisible(true);

      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        console.log("[CHECKOUT ADDRESS] Got current position:", {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });

        setPickedCoords({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
      } catch (e) {
        console.log(
          "[CHECKOUT ADDRESS] Failed to get current position:",
          e,
        );
        console.log("[CHECKOUT ADDRESS] Using default coordinates:", {
          latitude: DEFAULT_LAT,
          longitude: DEFAULT_LNG,
        });
      } finally {
        setMapLoading(false);
      }
    } catch (e) {
      console.log(
        "[CHECKOUT ADDRESS] Failed to request location permission:",
        e,
      );
      showToast("Something went wrong requesting location", "error");
    }
  };

  const handleMapMessage = (event: any) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);

      if (payload?.type === "pin_moved") {
        console.log("[CHECKOUT ADDRESS] Pin moved to:", {
          latitude: payload.lat,
          longitude: payload.lng,
        });
        
        setPickedCoords({
          latitude: payload.lat,
          longitude: payload.lng,
        });
      }
    } catch (e) {
      console.log("[CHECKOUT ADDRESS] Failed to parse map message:", e);
    }
  };

  const confirmPinLocation = async () => {
    console.log("[CHECKOUT ADDRESS] Confirming pin location:", pickedCoords);
    
    try {
      setResolvingAddress(true);

      const [result] = await Location.reverseGeocodeAsync({
        latitude: pickedCoords.latitude,
        longitude: pickedCoords.longitude,
      });

      const resolvedAddress = result
        ? [
            result.name,
            result.street,
            result.district,
            result.city,
            result.region,
          ]
            .filter(Boolean)
            .join(", ")
        : null;

      console.log("[CHECKOUT ADDRESS] Resolved address:", resolvedAddress);

      updateData({
        address: resolvedAddress || data.address,
        latitude: pickedCoords.latitude,
        longitude: pickedCoords.longitude,
      });

      console.log("[CHECKOUT ADDRESS] Updated checkout data with location:", {
        latitude: pickedCoords.latitude,
        longitude: pickedCoords.longitude,
        address: resolvedAddress || data.address,
      });

      if (resolvedAddress) {
        setErrors((prev) => ({
          ...prev,
          address: "",
        }));
      }

      setMapVisible(false);
    } catch (e) {
      console.log("[CHECKOUT ADDRESS] Reverse geocode failed:", e);

      // Even if reverse geocoding fails, still save the coordinates
      updateData({
        latitude: pickedCoords.latitude,
        longitude: pickedCoords.longitude,
      });

      console.log("[CHECKOUT ADDRESS] Saved coordinates without address:", {
        latitude: pickedCoords.latitude,
        longitude: pickedCoords.longitude,
      });

      showToast(
        "Location pinned, but couldn't resolve an address automatically",
        "info",
      );

      setMapVisible(false);
    } finally {
      setResolvingAddress(false);
    }
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          const map = L.map('map', { zoomControl: false }).setView(
            [${pickedCoords.latitude}, ${pickedCoords.longitude}],
            16
          );

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(map);

          let marker = L.marker(
            [${pickedCoords.latitude}, ${pickedCoords.longitude}],
            { draggable: true }
          ).addTo(map);

          function sendCoords(lat, lng) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'pin_moved', lat: lat, lng: lng })
            );
          }

          marker.on('dragend', function (e) {
            const pos = e.target.getLatLng();
            sendCoords(pos.lat, pos.lng);
          });

          map.on('click', function (e) {
            marker.setLatLng(e.latlng);
            sendCoords(e.latlng.lat, e.latlng.lng);
          });
        </script>
      </body>
    </html>
  `;

  const handleConfirm = () => {
    console.log("====================================");
    console.log("[CHECKOUT ADDRESS] Confirm button pressed");
    console.log("[CHECKOUT ADDRESS] Current checkout data:");
    logCheckoutData();
    console.log("====================================");

    const nextErrors = {
      address: "",
      contactNumber: "",
      screenshot: "",
    };

    let hasError = false;

    if (!data.address.trim()) {
      nextErrors.address = "Please enter a delivery address";
      hasError = true;
    }

    if (!data.contactNumber.trim()) {
      nextErrors.contactNumber = "Please enter a contact number";
      hasError = true;
    }

    if (data.paymentMethod === "IBFT") {
      if (!data.screenshotBase64) {
        nextErrors.screenshot = "Please attach your payment screenshot";
        hasError = true;
      }
    }

    setErrors(nextErrors);

    if (hasError) {
      console.log("[CHECKOUT ADDRESS] Validation errors:", nextErrors);
      showToast("Please complete the required fields", "error");
      return;
    }

    if (data.paymentMethod === "IBFT") {
      if (!data.bankDetail) {
        showToast("Please wait for bank details to load", "error");
        return;
      }
    }

    // Check if coordinates are present
    if (data.latitude === null || data.longitude === null) {
      console.warn("[CHECKOUT ADDRESS] WARNING: No coordinates pinned!");
      console.warn("[CHECKOUT ADDRESS] The customer did not pin a location");
    } else {
      console.log("[CHECKOUT ADDRESS] Coordinates confirmed:", {
        latitude: data.latitude,
        longitude: data.longitude,
      });
    }

    // Run validation
    const validationErrors = validateCheckoutData();
    if (validationErrors.length > 0) {
      console.log("[CHECKOUT ADDRESS] Additional validation errors:", validationErrors);
    }

    console.log("[CHECKOUT ADDRESS] Navigating to summary screen");
    router.push("/checkout/summary");
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back"
            size={21}
            color={colors.textPrimary}
          />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Delivery Details</Text>

        <View style={styles.iconButtonPlaceholder} />
      </View>

      <KeyboardScreen
        contentContainerStyle={styles.scrollContent}
      >
        {/* ADDRESS */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>Delivery Address</Text>

          <TouchableOpacity
            style={styles.pinButton}
            activeOpacity={0.8}
            onPress={openLocationPicker}
          >
            <Ionicons name="location" size={14} color={ORANGE} />

            <Text style={styles.pinButtonText}>Pin Location</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[
            styles.textArea,
            errors.address && styles.inputError,
          ]}
          value={data.address}
          onChangeText={(t) => {
            updateData({ address: t });

            if (t.trim()) {
              setErrors((prev) => ({
                ...prev,
                address: "",
              }));
            }
          }}
          placeholder="Enter your delivery address"
          placeholderTextColor={colors.textSecondary}
          multiline
        />

        {errors.address ? (
          <Text style={styles.errorText}>{errors.address}</Text>
        ) : null}

        {/* Display coordinates if available */}
        {data.latitude !== null && data.longitude !== null && (
          <View style={styles.coordinatesDisplay}>
            <Ionicons name="location" size={12} color={ORANGE} />
            <Text style={styles.coordinatesText}>
              Lat: {data.latitude.toFixed(6)}, Lng: {data.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        {/* CONTACT NUMBER */}
        <Text style={styles.label}>Contact Number</Text>

        <TextInput
          style={[
            styles.input,
            errors.contactNumber && styles.inputError,
          ]}
          value={data.contactNumber}
          onChangeText={(t) => {
            updateData({ contactNumber: t });

            if (t.trim()) {
              setErrors((prev) => ({
                ...prev,
                contactNumber: "",
              }));
            }
          }}
          placeholder="03XX-XXXXXXX"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
        />

        {errors.contactNumber ? (
          <Text style={styles.errorText}>
            {errors.contactNumber}
          </Text>
        ) : null}

        {/* DELIVERY TYPE */}
        <Text style={styles.label}>Delivery Type</Text>

        <View style={styles.row}>
          {(["Normal Delivery", "Urgent Delivery"] as const).map(
            (type) => {
              const selected = data.deliveryType === type;

              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionCard,
                    selected && styles.optionCardActive,
                  ]}
                  onPress={() =>
                    updateData({ deliveryType: type })
                  }
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={
                      type === "Urgent Delivery"
                        ? "flash"
                        : "bicycle"
                    }
                    size={18}
                    color={
                      selected
                        ? ORANGE
                        : colors.textSecondary
                    }
                  />

                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextActive,
                    ]}
                  >
                    {type === "Urgent Delivery"
                      ? "Urgent"
                      : "Normal"}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
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
          {(["Cash On Delivery", "IBFT"] as const).map(
            (method) => {
              const selected = data.paymentMethod === method;

              return (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.optionCard,
                    selected && styles.optionCardActive,
                  ]}
                  onPress={() =>
                    handleSelectPaymentMethod(method)
                  }
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={
                      method === "IBFT" ? "card" : "cash"
                    }
                    size={18}
                    color={
                      selected
                        ? ORANGE
                        : colors.textSecondary
                    }
                  />

                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextActive,
                    ]}
                  >
                    {method === "IBFT"
                      ? "IBFT / Bank"
                      : "Cash on Delivery"}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>

        {/* IBFT DETAILS */}
        {data.paymentMethod === "IBFT" && (
          <View style={styles.ibftCard}>
            <Text style={styles.ibftTitle}>
              Transfer To This Account
            </Text>

            {bankLoading && (
              <View style={styles.bankStateBox}>
                <ActivityIndicator
                  color={ORANGE}
                  size="small"
                />

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

                <Text style={styles.bankStateText}>
                  {bankError}
                </Text>

                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={fetchBankDetail}
                >
                  <Text style={styles.retryBtnText}>
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!bankLoading &&
              !bankError &&
              data.bankDetail && (
                <>
                  <BankRow
                    label="Bank Name"
                    value={data.bankDetail.bankName}
                  />

                  <BankRow
                    label="Account Title"
                    value={data.bankDetail.accountTitle}
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

            <Text
              style={[
                styles.label,
                { marginTop: spacing.md },
              ]}
            >
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
                  <Ionicons
                    name="close"
                    size={16}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.attachBtn,
                  errors.screenshot &&
                    styles.attachBtnError,
                ]}
                onPress={pickFromGallery}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="image-outline"
                  size={18}
                  color={ORANGE}
                />

                <Text style={styles.attachBtnText}>
                  Attach from Gallery
                </Text>
              </TouchableOpacity>
            )}

            {errors.screenshot ? (
              <Text style={styles.errorText}>
                {errors.screenshot}
              </Text>
            ) : null}
          </View>
        )}

        {/* CONFIRM BUTTON */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.confirmButton}
            activeOpacity={0.85}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>
              Confirm
            </Text>

            <Ionicons
              name="arrow-forward"
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </KeyboardScreen>

      {/* ============================================================ */}
      {/* PIN LOCATION MODAL */}
      {/* ============================================================ */}

      <Modal
        visible={mapVisible}
        animationType="slide"
        onRequestClose={() => setMapVisible(false)}
        statusBarTranslucent
      >
        <SafeAreaView
          style={styles.mapContainer}
          edges={["top", "left", "right"]}
        >
          <View style={styles.mapTopBar}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setMapVisible(false)}
            >
              <Ionicons
                name="close"
                size={21}
                color={colors.textPrimary}
              />
            </TouchableOpacity>

            <Text style={styles.topBarTitle}>Pin Your Location</Text>

            <View style={styles.iconButtonPlaceholder} />
          </View>

          <View style={styles.mapWrap}>
            <WebView
              ref={webviewRef}
              originWhitelist={["*"]}
              source={{ html: mapHtml }}
              onMessage={handleMapMessage}
              style={styles.map}
            />

            {mapLoading && (
              <View style={styles.mapLoadingOverlay}>
                <ActivityIndicator size="large" color={ORANGE} />

                <Text style={styles.mapLoadingText}>
                  Getting your location...
                </Text>
              </View>
            )}

            <View style={styles.pinHint}>
              <Ionicons
                name="hand-left-outline"
                size={14}
                color={ORANGE}
              />

              <Text style={styles.pinHintText}>
                Drag the pin or tap the map to adjust
              </Text>
            </View>
          </View>

          <View style={styles.mapFooter}>
            <TouchableOpacity
              style={styles.confirmButton}
              activeOpacity={0.85}
              onPress={confirmPinLocation}
              disabled={resolvingAddress}
            >
              {resolvingAddress ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <Text style={styles.confirmButtonText}>
                    Use This Location
                  </Text>

                  <Ionicons
                    name="checkmark"
                    size={18}
                    color="#FFFFFF"
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  onCopy?: (value: string, label: string) => void;
}) {
  return (
    <View style={styles.bankRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.bankRowLabel}>{label}</Text>

        <Text style={styles.bankRowValue}>
          {value || "-"}
        </Text>
      </View>

      {onCopy && (
        <TouchableOpacity
          style={styles.copyBtn}
          onPress={() => onCopy(value, label)}
          hitSlop={8}
        >
          <Ionicons
            name="copy-outline"
            size={16}
            color={ORANGE}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

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

  iconButtonPlaceholder: {
    width: 42,
    height: 42,
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "700",
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },

  pinButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: SOFT_ORANGE,
    borderWidth: 1,
    borderColor: ORANGE,
  },

  pinButtonText: {
    ...typography.caption,
    color: ORANGE,
    fontWeight: "700",
    fontSize: 11,
  },

  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical:
      Platform.OS === "ios"
        ? spacing.sm + 2
        : spacing.sm,
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

  inputError: {
    borderColor: colors.danger,
  },

  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
    marginLeft: 2,
  },

  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },

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

  optionCardActive: {
    borderColor: ORANGE,
    backgroundColor: SOFT_ORANGE,
  },

  optionText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  optionTextActive: {
    color: ORANGE,
    fontWeight: "700",
  },

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

  retryBtnText: {
    ...typography.caption,
    color: "#FFFFFF",
    fontWeight: "700",
  },

  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  bankRowLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },

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

  attachBtnError: {
    borderColor: colors.danger,
  },

  attachBtnText: {
    ...typography.body,
    color: ORANGE,
    fontWeight: "700",
  },

  screenshotPreviewWrap: {
    position: "relative",
    alignSelf: "flex-start",
  },

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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
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

  coordinatesDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: SOFT_ORANGE,
    borderRadius: radius.sm,
    alignSelf: "flex-start",
  },

  coordinatesText: {
    ...typography.caption,
    color: ORANGE,
    fontWeight: "600",
    fontSize: 11,
  },

  mapContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  mapTopBar: {
    height: 62,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  mapWrap: {
    flex: 1,
    position: "relative",
  },

  map: {
    flex: 1,
  },

  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  mapLoadingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  pinHint: {
    position: "absolute",
    top: spacing.md,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  pinHintText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 11,
  },

  mapFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
