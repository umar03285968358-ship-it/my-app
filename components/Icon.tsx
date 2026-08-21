import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

type IconProps = {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  style?: any;
};

export default function Icon({
  name,
  size = 22,
  color = colors.accentOrange, // 👈 centralized default
  style,
}: IconProps) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}
