import { colors } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import Footer, { FooterTab } from "./Footer";
import Header from "./Header";

interface ScreenLayoutProps {
  title: string;
  children: React.ReactNode;
  showBack?: boolean;
  footerTabs?: FooterTab[];
  activeTabKey?: string;
  onTabPress?: (key: string) => void;
}

export default function ScreenLayout({
  title,
  children,
  showBack = false,
  footerTabs,
  activeTabKey,
  onTabPress,
}: ScreenLayoutProps) {
  return (
    <View style={styles.container}>
      {/* ADMIN HEADER */}
      <Header
        title={title}
        showBack={showBack}
      />

      {/* SCREEN CONTENT */}
      <View style={styles.content}>
        {children}
      </View>

      {/* ADMIN FOOTER */}
      {footerTabs &&
        activeTabKey &&
        onTabPress && (
          <Footer
            tabs={footerTabs}
            activeKey={activeTabKey}
            onTabPress={onTabPress}
          />
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flex: 1,
    minHeight: 0,
  },
});