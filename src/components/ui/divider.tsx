import React from "react";
import { View } from "react-native";
import type { DividerProps } from "@/src/types/ui";

export default function Divider({
  orientation = "horizontal",
  thickness = 1,
  color = "#ECECEC", // stock-border rengi
  className = "",
  style,
}: DividerProps) {
  const dividerStyle = {
    backgroundColor: color,
    ...(orientation === "horizontal"
      ? { height: thickness, width: "100%" }
      : { width: thickness, height: "100%" }),
    ...style,
  };

  return <View className={className} style={dividerStyle} />;
}
