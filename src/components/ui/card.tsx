import React from "react";
import {
  View,
  ViewProps,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined" | "filled";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  pressable?: boolean;
  onPress?: () => void;
  className?: string;
}

export default function Card({
  children,
  variant = "default",
  padding = "md",
  radius = "md",
  pressable = false,
  onPress,
  className = "",
  ...props
}: CardProps) {
  const variantClasses = {
    default: "bg-white border border-gray-200",
    elevated: "bg-white shadow-lg",
    outlined: "bg-transparent border-2 border-gray-300",
    filled: "bg-gray-50 border border-gray-100",
  };

  const paddingClasses = {
    none: "",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  };

  const radiusClasses = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-lg",
    lg: "rounded-xl",
    xl: "rounded-2xl",
    full: "rounded-full",
  };

  const baseClasses = [
    variantClasses[variant],
    paddingClasses[padding],
    radiusClasses[radius],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (pressable || onPress) {
    return (
      <TouchableOpacity
        className={baseClasses}
        onPress={onPress}
        activeOpacity={0.8}
        {...(props as TouchableOpacityProps)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={baseClasses} {...props}>
      {children}
    </View>
  );
}
