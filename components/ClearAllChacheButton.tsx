import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { clearAllAsyncStorage } from "@/services/authStorage";

interface ClearAllCacheButtonProps {
  title?: string;
}

export default function ClearAllCacheButton({
  title = "Clear All App Cache",
}: ClearAllCacheButtonProps) {
  const [clearing, setClearing] = useState(false);

  const handleClearAll = () => {
    Alert.alert(
      "Clear All App Cache",
      "This will remove ALL data stored in AsyncStorage, including your login session, user data, cart, and other locally stored app data. Continue?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear Everything",
          style: "destructive",
          onPress: performClear,
        },
      ]
    );
  };

  const performClear = async () => {
    try {
      setClearing(true);

      console.log("");
      console.log("########################################");
      console.log("#");
      console.log("# [CLEAR CACHE BUTTON]");
      console.log("# Starting complete app cache clear...");
      console.log("#");
      console.log("########################################");

      await clearAllAsyncStorage();

      console.log("");
      console.log("########################################");
      console.log("#");
      console.log("# [CLEAR CACHE BUTTON]");
      console.log("# Complete cache clear finished");
      console.log("#");
      console.log("########################################");
      console.log("");

      Alert.alert(
        "Cache Cleared",
        "All locally stored app data has been cleared successfully."
      );
    } catch (error) {
      console.log(
        "[CLEAR CACHE BUTTON] Failed:",
        error
      );

      Alert.alert(
        "Clear Failed",
        "Something went wrong while clearing the app cache."
      );
    } finally {
      setClearing(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          clearing && styles.buttonDisabled,
        ]}
        onPress={handleClearAll}
        disabled={clearing}
        activeOpacity={0.8}
      >
        {clearing ? (
          <>
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />

            <Text style={styles.buttonText}>
              Clearing...
            </Text>
          </>
        ) : (
          <Text style={styles.buttonText}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  button: {
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: "#D32F2F",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});