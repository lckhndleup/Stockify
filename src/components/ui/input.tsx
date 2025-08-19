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
    default: "border-b border-border-light bg-transparent",
    outlined: "border border-border-light rounded-lg bg-white",
    filled: "bg-surface-secondary border border-border-default rounded-lg",
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

  const focusClasses = isFocused ? "border-primary-500" : "";
  const errorClasses = error ? "border-danger-500" : "";

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
          color="text-primary"
          className="mb-2"
        >
          {label}
        </Typography>
      )}

      <View className={containerClasses}>
        {leftIcon && <View className="mr-3">{leftIcon}</View>}

        <TextInput
          className={`flex-1 ${textSizes[size]} text-text-primary font-normal`}
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
          className={`mt-1 ${
            error ? "text-danger-500" : "text-text-secondary"
          }`}
        >
          {error || helperText}
        </Typography>
      )}
    </View>
  );
}
