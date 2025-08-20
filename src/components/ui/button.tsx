import React from "react";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  View,
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
    primary: "bg-stock-red active:bg-[#CC0018]",
    secondary: "bg-stock-gray active:bg-[#E5E8F0]",
    success: "bg-green-500 active:bg-green-600",
    danger: "bg-stock-red active:bg-[#CC0018]",
    warning: "bg-yellow-500 active:bg-yellow-600",
    outline: "border-2 border-stock-red bg-transparent active:bg-[#FFF1F2]",
    ghost: "bg-transparent active:bg-stock-gray",
  };

  const textColors = {
    primary: "text-stock-white",
    secondary: "text-stock-dark",
    success: "text-white",
    danger: "text-stock-white",
    warning: "text-white",
    outline: "text-stock-red",
    ghost: "text-stock-dark",
  };

  // Tüm boyutlar için standart yükseklik (52px) ayarlanıyor, padding-x değerleri korunuyor
  const sizeClasses = {
    sm: "px-3", // py değerleri kaldırıldı, çünkü height ile ayarlanacak
    md: "px-6",
    lg: "px-8",
    xl: "px-10",
  };

  const textSizes = {
    sm: "sm",
    md: "base",
    lg: "lg",
    xl: "xl",
  };

  const baseClasses = [
    "rounded-lg", // Tüm komponentlerde tutarlı border radius
    "flex-row",
    "items-center",
    "justify-center",
    "border border-stock-border", // SearchBar ile tutarlı border eklendi
    // space-x-3 kaldırıldı, çünkü doğrudan margin kullanıyoruz
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
      style={[{ height: 52 }, props.style]} // Standart 52px yükseklik eklendi
      {...props}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={textColors[variant].includes("white") ? "white" : "#E3001B"}
        />
      )}

      {!loading && leftIcon && (
        <View
          style={{
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 8, // Doğrudan margin ekleyerek boşluk oluşturuyoruz
          }}
        >
          {leftIcon}
        </View>
      )}

      <Typography
        variant="body"
        size={textSizes[size] as any}
        weight="semibold"
        className={`${textColors[variant]}`}
      >
        {children}
      </Typography>

      {!loading && rightIcon && (
        <View
          style={{
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 8, // Sağ ikonlar için sol margin ekliyoruz
          }}
        >
          {rightIcon}
        </View>
      )}
    </TouchableOpacity>
  );
}
