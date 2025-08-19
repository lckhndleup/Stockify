import React, { useState } from "react";
import { View, TextInput, TextInputProps } from "react-native";
import Typography from "./typography";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: "default" | "outlined" | "filled";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
  inputClassName?: string;
}

export default function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = "outlined",
  size = "md",
  fullWidth = true,
  className = "",
  inputClassName = "",
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const variantClasses = {
    default: "border-b border-stock-border bg-transparent",
    outlined: "border border-stock-border rounded-lg bg-stock-white",
    filled: "bg-stock-gray border border-stock-border rounded-lg",
  };

  const sizeClasses = {
    sm: "px-3 py-2",
    md: "px-4 py-3",
    lg: "px-5 py-4",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const focusClasses = isFocused ? "border-stock-red" : "";
  const errorClasses = error ? "border-stock-red" : "";

  const containerClasses = [
    "flex-row items-center",
    variantClasses[variant],
    sizeClasses[size],
    focusClasses,
    errorClasses,
    fullWidth && "w-full",
    inputClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <View className={`${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <Typography
          variant="caption"
          weight="medium"
          className="mb-2 text-stock-dark"
        >
          {label}
        </Typography>
      )}

      <View className={containerClasses}>
        {leftIcon && <View className="mr-3">{leftIcon}</View>}

        <TextInput
          className={`flex-1 ${textSizes[size]} text-stock-dark font-normal`}
          placeholderTextColor="#73767A"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {rightIcon && <View className="ml-3">{rightIcon}</View>}
      </View>

      {(error || helperText) && (
        <Typography
          variant="caption"
          className={`mt-1 ${error ? "text-stock-red" : "text-stock-text"}`}
        >
          {error || helperText}
        </Typography>
      )}
    </View>
  );
}
