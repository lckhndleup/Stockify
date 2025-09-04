import React from "react";
import { View } from "react-native";

interface DividerProps {
  orientation?: "horizontal" | "vertical";
  thickness?: number;
  color?: string;
  className?: string;
  style?: any;
}

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
