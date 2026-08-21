import RiderProfileButton from "@/components/RiderProfileButton";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors, typography } from "../../constants/theme";

export default function RiderTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,

        headerStyle: {
          backgroundColor: "#FFF1E8",
          borderBottomWidth: 1,
          borderBottomColor: "#F1731F",
        },

        headerTitleStyle: {
          ...typography.h3,
          color: colors.textPrimary,
        },

        headerRight: () => <RiderProfileButton />,

        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textSecondary,

        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 62,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="speedometer-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
