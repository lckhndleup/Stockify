import React from "react";
import { TouchableOpacity, ActivityIndicator, View } from "react-native";
import Typography from "./typography";
import type { ButtonProps } from "@/src/types/ui";

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
  loadingIndicatorColor,
  onPress,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const spinnerColors = {
    primary: "#FFFFFF",
    secondary: "#1F2937",
    success: "#FFFFFF",
    danger: "#FFFFFF",
    warning: "#FFFFFF",
    outline: "#E3001B",
    ghost: "#1F2937",
  } as const;

  const indicatorColor = loadingIndicatorColor ?? spinnerColors[variant] ?? "#FFFFFF";

  const variantClasses = {
    primary: "bg-stock-red active:bg-[#CC0018]",
    secondary: "bg-stock-gray active:bg-[#E5E8F0]",
    success: "bg-green-500 active:bg-green-600",
    danger: "bg-stock-red active:bg-[#CC0018]",
    warning: "bg-yellow-500 active:bg-yellow-600",
    outline: "border-2 border-stock-red bg-transparent active:bg-[#FFF1F2]",
    ghost: "bg-transparent active:bg-stock-gray",
  };

  const disabledVariantClasses = {
    primary: "bg-red-200 border border-red-300",
    secondary: "bg-gray-300 border border-stock-border",
    success: "bg-green-200 border border-green-300",
    danger: "bg-red-200 border border-red-300",
    warning: "bg-yellow-200 border border-yellow-300",
    outline: "border-2 border-stock-border bg-transparent",
    ghost: "bg-transparent border border-stock-border",
  } as const;

  const textColors = {
    primary: "text-stock-white",
    secondary: "text-stock-dark",
    success: "text-white",
    danger: "text-stock-white",
    warning: "text-white",
    outline: "text-stock-red",
    ghost: "text-stock-dark",
  };

  const disabledTextColors = {
    primary: "text-red-600",
    secondary: "text-stock-dark",
    success: "text-green-700",
    danger: "text-red-600",
    warning: "text-yellow-700",
    outline: "text-stock-dark",
    ghost: "text-stock-dark",
  } as const;

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

  const textColorClass = isDisabled ? disabledTextColors[variant] : textColors[variant];

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
    // opacity-50 kaldırıldı, disabled renk değişikliği yeterli
    className,
    isDisabled && disabledVariantClasses[variant],
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <TouchableOpacity
      className={baseClasses}
      disabled={isDisabled}
      onPress={onPress}
      activeOpacity={0.95}
      style={[{ height: 52 }, props.style]} // Standart 52px yükseklik eklendi
      {...props}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={indicatorColor}
          style={{ marginRight: leftIcon || children ? 8 : 0 }}
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

      {typeof children === "string" || typeof children === "number" ? (
        <Typography
          variant="body"
          size={textSizes[size] as any}
          weight="semibold"
          className={textColorClass}
        >
          {children}
        </Typography>
      ) : (
        children
      )}

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
