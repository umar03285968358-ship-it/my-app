import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { consoleAllAsyncStorage } from "@/services/authStorage";

interface ConsoleCacheButtonProps {
  title?: string;
}

export default function ConsoleCacheButton({
  title = "Check App Cache",
}: ConsoleCacheButtonProps) {
  const [checking, setChecking] = useState(false);

  const handleCheckCache = async () => {
    try {
      setChecking(true);

      console.log("");
      console.log(
        "##################################################"
      );
      console.log(
        "# [CACHE CHECK BUTTON] Checking ALL AsyncStorage"
      );
      console.log(
        "##################################################"
      );

      const entries = await consoleAllAsyncStorage();

      console.log(
        "##################################################"
      );
      console.log(
        "# [CACHE CHECK BUTTON] Cache check completed"
      );
      console.log(
        "##################################################"
      );
      console.log("");

      if (entries.length === 0) {
        Alert.alert(
          "Cache Check",
          "AsyncStorage is completely empty. Nothing is currently stored."
        );
      } else {
        Alert.alert(
          "Cache Check",
          `${entries.length} AsyncStorage key(s) currently exist.\n\nCheck the Metro/terminal console for the complete data.`
        );
      }
    } catch (error) {
      console.log(
        "[CACHE CHECK BUTTON] Error:",
        error
      );

      Alert.alert(
        "Cache Check Failed",
        "Unable to read AsyncStorage."
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          checking && styles.buttonDisabled,
        ]}
        onPress={handleCheckCache}
        disabled={checking}
        activeOpacity={0.8}
      >
        {checking ? (
          <>
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />

            <Text style={styles.buttonText}>
              Checking...
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
    backgroundColor: "#555555",
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