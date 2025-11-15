import React from "react";
import { TouchableOpacity, View } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Feather from "react-native-vector-icons/Feather";
import AntDesign from "react-native-vector-icons/AntDesign";
import Ionicons from "react-native-vector-icons/Ionicons";
import type { IconProps } from "@/src/types/ui";

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
    <IconComponent name={name as any} size={size} color={color} className={className} />
  );

  if (pressable || onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.95}
        className={`items-center justify-center ${containerClassName}`}
      >
        {iconElement}
      </TouchableOpacity>
    );
  }

  return <View className={`items-center justify-center ${containerClassName}`}>{iconElement}</View>;
}
