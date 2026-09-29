import { colors, radius, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

type Props = {
  visible: boolean;
  onClose: () => void;
  customerLatitude: number | null | undefined;
  customerLongitude: number | null | undefined;
  customerName?: string;
  customerAddress?: string;
};

type RouteInfo = {
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
};

async function fetchDrivingRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<RouteInfo> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${fromLng},${fromLat};${toLng},${toLat}` +
    `?overview=full&geometries=geojson`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch route.");
  }

  const json = await response.json();

  if (!json.routes || json.routes.length === 0) {
    throw new Error("No route found between these locations.");
  }

  const route = json.routes[0];

  const coordinates: [number, number][] = route.geometry.coordinates.map(
    (pair: [number, number]) => [pair[1], pair[0]],
  );

  return {
    coordinates,
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
  };
}

export default function RiderLocation({
  visible,
  onClose,
  customerLatitude,
  customerLongitude,
  customerName,
  customerAddress,
}: Props) {
  const webviewRef = useRef<WebView>(null);

  const [riderCoords, setRiderCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCustomerLocation =
    typeof customerLatitude === "number" &&
    typeof customerLongitude === "number" &&
    !isNaN(customerLatitude) &&
    !isNaN(customerLongitude) &&
    customerLatitude !== 0 &&
    customerLongitude !== 0;

  const loadRiderLocationAndRoute = async () => {
    try {
      setLoading(true);
      setError(null);
      
      setRoute(null);
      setRiderCoords(null);

      console.log("[RIDER LOCATION] Starting location fetch...");
      console.log("[RIDER LOCATION] Customer coords:", {
        lat: customerLatitude,
        lng: customerLongitude,
        isValid: hasCustomerLocation
      });

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setError("Location permission is required to navigate.");
        setLoading(false);
        return;
      }

      let current;
      try {
        current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          maximumAge: 10000,
          timeout: 15000,
        });
      } catch (locationError) {
        console.error("[RIDER LOCATION] Failed to get current position:", locationError);
        
        try {
          current = await Location.getLastKnownPositionAsync();
          if (!current) {
            throw new Error("Could not determine your location. Please check GPS and try again.");
          }
        } catch (fallbackError) {
          throw new Error("Could not determine your location. Please check GPS and try again.");
        }
      }

      const nextRiderCoords = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      console.log("[RIDER LOCATION] Rider coords:", nextRiderCoords);
      setRiderCoords(nextRiderCoords);

      if (hasCustomerLocation) {
        console.log("[RIDER LOCATION] Fetching route...");
        
        const routeInfo = await fetchDrivingRoute(
          nextRiderCoords.latitude,
          nextRiderCoords.longitude,
          customerLatitude as number,
          customerLongitude as number,
        );

        console.log("[RIDER LOCATION] Route fetched:", {
          distance: routeInfo.distanceKm,
          duration: routeInfo.durationMin,
          points: routeInfo.coordinates.length
        });
        
        setRoute(routeInfo);
      } else {
        console.log("[RIDER LOCATION] No customer location available");
      }
    } catch (e: any) {
      console.error("[RIDER LOCATION] Error:", e);
      setError(e?.message || "Failed to load your location or the route.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setRoute(null);
      setRiderCoords(null);
      loadRiderLocationAndRoute();
    }
  }, [visible, customerLatitude, customerLongitude]);

  const mapHtml = riderCoords
    ? `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; }
          .legend {
            position: absolute;
            bottom: 20px;
            left: 10px;
            background: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            z-index: 1000;
          }
          .legend-item {
            display: flex;
            align-items: center;
            margin: 5px 0;
          }
          .legend-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
            border: 2px solid white;
            box-shadow: 0 0 4px rgba(0,0,0,0.3);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="legend">
          <div class="legend-item">
            <div class="legend-dot" style="background:#0B5FFF;"></div>
            <span>You (Rider)</span>
          </div>
          ${
            hasCustomerLocation
              ? `
          <div class="legend-item">
            <div class="legend-dot" style="background:#F1731F;"></div>
            <span>Customer Location</span>
          </div>
          `
              : ""
          }
        </div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          const riderLatLng = [${riderCoords.latitude}, ${riderCoords.longitude}];

          const map = L.map('map', { zoomControl: true });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(map);

          const riderIcon = L.divIcon({
            className: '',
            html: '<div style="width:16px;height:16px;border-radius:50%;background:#0B5FFF;border:3px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.4);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          const riderMarker = L.marker(riderLatLng, { icon: riderIcon })
            .addTo(map)
            .bindPopup('<b>You are here</b>');

          ${
            route && hasCustomerLocation
              ? `
          const customerLatLng = [${customerLatitude}, ${customerLongitude}];

          const customerIcon = L.divIcon({
            className: '',
            html: '<div style="width:16px;height:16px;border-radius:50%;background:#F1731F;border:3px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.4);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          const customerMarker = L.marker(customerLatLng, { icon: customerIcon })
            .addTo(map)
            .bindPopup('<b>Customer Location</b>');

          const routeCoords = ${JSON.stringify(route.coordinates)};

          const polyline = L.polyline(routeCoords, {
            color: '#F1731F',
            weight: 5,
            opacity: 0.85,
          }).addTo(map);

          map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
          `
              : hasCustomerLocation
              ? `
          const customerLatLng = [${customerLatitude}, ${customerLongitude}];
          
          const customerIcon = L.divIcon({
            className: '',
            html: '<div style="width:16px;height:16px;border-radius:50%;background:#F1731F;border:3px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.4);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          L.marker(customerLatLng, { icon: customerIcon })
            .addTo(map)
            .bindPopup('<b>Customer Location</b>');
          
          const bounds = L.latLngBounds([riderLatLng, customerLatLng]);
          map.fitBounds(bounds, { padding: [40, 40] });
          `
              : `
          map.setView(riderLatLng, 16);
          riderMarker.openPopup();
          `
          }
        </script>
      </body>
    </html>
  `
    : "";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton} onPress={onClose}>
            <Ionicons name="close" size={21} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.topBarTextWrap}>
            <Text style={styles.topBarTitle} numberOfLines={1}>
              Navigate to {customerName || "Customer"}
            </Text>

            {customerAddress ? (
              <Text style={styles.topBarSubtitle} numberOfLines={1}>
                {customerAddress}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={loadRiderLocationAndRoute}
          >
            <Ionicons name="refresh" size={19} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {route && !loading && !error && (
          <View style={styles.routeSummary}>
            <View style={styles.routeSummaryItem}>
              <Ionicons name="navigate" size={15} color={colors.primaryDark} />
              <Text style={styles.routeSummaryText}>
                {route.distanceKm.toFixed(1)} km
              </Text>
            </View>

            <View style={styles.routeSummaryDivider} />

            <View style={styles.routeSummaryItem}>
              <Ionicons name="time" size={15} color={colors.primaryDark} />
              <Text style={styles.routeSummaryText}>
                {Math.round(route.durationMin)} min
              </Text>
            </View>
          </View>
        )}

        {!hasCustomerLocation && !loading && !error && (
          <View style={styles.noticeBox}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={colors.accentOrangeDark}
            />
            <Text style={styles.noticeText}>
              This customer hasn't pinned an exact location. Showing your
              current location only.
            </Text>
          </View>
        )}

        <View style={styles.mapWrap}>
          {riderCoords && !error ? (
            <WebView
              ref={webviewRef}
              originWhitelist={["*"]}
              source={{ html: mapHtml }}
              style={styles.map}
            />
          ) : null}

          {loading && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color={colors.primaryDark} />
              <Text style={styles.overlayText}>
                {hasCustomerLocation
                  ? "Getting your location and building the route..."
                  : "Getting your location..."}
              </Text>
            </View>
          )}

          {!loading && error && (
            <View style={styles.overlay}>
              <Ionicons
                name="alert-circle-outline"
                size={28}
                color={colors.danger}
              />
              <Text style={styles.overlayErrorText}>{error}</Text>

              <TouchableOpacity
                style={styles.retryButton}
                activeOpacity={0.85}
                onPress={loadRiderLocationAndRoute}
              >
                <Ionicons name="refresh" size={16} color={colors.white} />
                <Text style={styles.retryButtonText}>Try again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
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

  topBarTextWrap: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },

  topBarTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: "700",
    textAlign: "center",
  },

  topBarSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 2,
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

  routeSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  routeSummaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  routeSummaryText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  routeSummaryDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },

  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#FFF4E5",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  noticeText: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
    flexShrink: 1,
  },

  mapWrap: {
    flex: 1,
    position: "relative",
  },

  map: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },

  overlayText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },

  overlayErrorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: "center",
  },

  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
    marginTop: spacing.xs,
  },

  retryButtonText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "700",
  },
});