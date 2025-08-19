import React from "react";
import { View, ActivityIndicator } from "react-native";
import Typography from "./typography";

interface LoadingProps {
  size?: "small" | "large";
  color?: string;
  text?: string;
  overlay?: boolean;
  className?: string;
}

export default function Loading({
  size = "large",
  color = "#0284c7",
  text,
  overlay = false,
  className = "",
}: LoadingProps) {
  const content = (
    <View className={`items-center justify-center ${className}`}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Typography
          variant="body"
          className="mt-3 text-gray-600"
          align="center"
        >
          {text}
        </Typography>
      )}
    </View>
  );

  if (overlay) {
    return (
      <View className="absolute inset-0 bg-black/20 items-center justify-center z-50">
        <View className="bg-white rounded-lg p-6 items-center">{content}</View>
      </View>
    );
  }

  return content;
}
