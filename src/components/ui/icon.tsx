import React from "react";
import { TouchableOpacity, View } from "react-native";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
  AntDesign,
  Ionicons,
} from "@expo/vector-icons";

type IconFamily =
  | "MaterialIcons"
  | "MaterialCommunityIcons"
  | "Feather"
  | "AntDesign"
  | "Ionicons";

interface IconProps {
  family?: IconFamily;
  name: string;
  size?: number;
  color?: string;
  pressable?: boolean;
  onPress?: () => void;
  className?: string;
  containerClassName?: string;
}

export default function Icon({
  family = "MaterialIcons",
  name,
  size = 24,
  color = "#6D706F", // Default icon color (text-tertiary)
  pressable = false,
  onPress,
  className = "",
  containerClassName = "",
}: IconProps) {
  const IconComponent = {
    MaterialIcons,
    MaterialCommunityIcons,
    Feather,
    AntDesign,
    Ionicons,
  }[family];

  const iconElement = (
    <IconComponent
      name={name as any}
      size={size}
      color={color}
      className={className}
    />
  );

  if (pressable || onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={`items-center justify-center ${containerClassName}`}
      >
        {iconElement}
      </TouchableOpacity>
    );
  }

  return (
    <View className={`items-center justify-center ${containerClassName}`}>
      {iconElement}
    </View>
  );
}
