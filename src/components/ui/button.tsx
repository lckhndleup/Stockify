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
    primary: "bg-primary-500 active:bg-primary-600",
    secondary: "bg-secondary-50 active:bg-secondary-100",
    success: "bg-success-500 active:bg-success-600",
    danger: "bg-danger-500 active:bg-danger-600",
    warning: "bg-warning-500 active:bg-warning-600",
    outline: "border-2 border-primary-500 bg-transparent active:bg-primary-50",
    ghost: "bg-transparent active:bg-secondary-50",
  };

  const textColors = {
    primary: "text-white",
    secondary: "text-text-secondary",
    success: "text-white",
    danger: "text-white",
    warning: "text-white",
    outline: "text-primary-500",
    ghost: "text-text-primary",
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
          color={textColors[variant].includes("white") ? "white" : "#E3001B"}
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
