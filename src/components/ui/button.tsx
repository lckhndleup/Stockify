import React from "react";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
} from "react-native";
import Typography from "./typography";

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "outline"
    | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = "",
  onPress,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const variantClasses = {
    primary: "bg-primary-600 active:bg-primary-700",
    secondary: "bg-gray-600 active:bg-gray-700",
    success: "bg-green-600 active:bg-green-700",
    danger: "bg-red-600 active:bg-red-700",
    warning: "bg-orange-600 active:bg-orange-700",
    outline: "border-2 border-primary-600 bg-transparent active:bg-primary-50",
    ghost: "bg-transparent active:bg-gray-100",
  };

  const textColors = {
    primary: "text-white",
    secondary: "text-white",
    success: "text-white",
    danger: "text-white",
    warning: "text-white",
    outline: "text-primary-600",
    ghost: "text-gray-700",
  };

  const sizeClasses = {
    sm: "px-3 py-2",
    md: "px-6 py-3",
    lg: "px-8 py-4",
    xl: "px-10 py-5",
  };

  const textSizes = {
    sm: "sm",
    md: "base",
    lg: "lg",
    xl: "xl",
  };

  const baseClasses = [
    "rounded-lg",
    "flex-row",
    "items-center",
    "justify-center",
    "space-x-2",
    sizeClasses[size],
    variantClasses[variant],
    fullWidth && "w-full",
    isDisabled && "opacity-50",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <TouchableOpacity
      className={baseClasses}
      disabled={isDisabled}
      onPress={onPress}
      activeOpacity={0.8}
      {...props}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={textColors[variant].includes("white") ? "white" : "#0284c7"}
        />
      )}

      {!loading && leftIcon && leftIcon}

      <Typography
        variant="body"
        size={textSizes[size] as any}
        weight="semibold"
        className={textColors[variant]}
      >
        {children}
      </Typography>

      {!loading && rightIcon && rightIcon}
    </TouchableOpacity>
  );
}
