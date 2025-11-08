import React, { useState, forwardRef } from "react";
import { View, TextInput } from "react-native";
import Typography from "./typography";
import type { InputProps } from "@/src/types/ui";

const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = "outlined",
      size = "md",
      fullWidth = true,
      numericOnly = false, // YENİ PROP
      className = "",
      inputClassName = "",
      style,
      onChangeText, // Mevcut onChangeText'i alıyoruz
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const variantClasses = {
      default: "border-b border-stock-border bg-transparent",
      outlined: "border border-stock-border rounded-lg bg-stock-white",
      filled: "bg-stock-gray border border-stock-border rounded-lg",
    };

    const sizeClasses = {
      sm: "px-3",
      md: "px-4",
      lg: "px-5",
    };

    const inputHeights = {
      sm: 52,
      md: 52,
      lg: 52,
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

    const containerStyle = {
      height: inputHeights[size],
    };

    // YENİ: Numeric validation fonksiyonu
    const handleTextChange = (text: string) => {
      if (numericOnly) {
        // Sadece sayıları ve ondalık nokta/virgülü kabul et
        const numericText = text.replace(/[^0-9.,]/g, "");
        // Virgülü noktaya çevir (Türkiye'de virgül kullanılır)
        const normalizedText = numericText.replace(",", ".");

        // Birden fazla nokta varsa sadece ilkini tut
        const parts = normalizedText.split(".");
        const finalText =
          parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : normalizedText;

        // Orijinal onChangeText fonksiyonunu çağır
        onChangeText?.(finalText);
      } else {
        // Normal metin girişi
        onChangeText?.(text);
      }
    };

    return (
      <View className={`${fullWidth ? "w-full" : ""} ${className}`}>
        {label && (
          <Typography variant="caption" weight="medium" className="mb-2 text-stock-dark">
            {label}
          </Typography>
        )}

        <View className={containerClasses} style={containerStyle}>
          {leftIcon && <View className="mr-3">{leftIcon}</View>}

          <TextInput
            ref={ref}
            className={`flex-1 ${textSizes[size]} text-stock-dark font-normal`}
            placeholderTextColor="#73767A"
            textAlign={
              style?.textAlign ||
              (numericOnly || props.keyboardType === "numeric" ? "left" : "left")
            }
            textAlignVertical="center"
            style={{
              minHeight: inputHeights[size] - 8,
              paddingVertical: 12,
              paddingHorizontal: 4,
              margin: 0,
              lineHeight: size === "sm" ? 18 : size === "md" ? 20 : 22,
              ...style,
            }}
            multiline={false}
            // YENİ: numericOnly true ise keyboard type'ı otomatik ayarla
            keyboardType={numericOnly ? "numeric" : props.keyboardType}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChangeText={handleTextChange} // YENİ HANDLER
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
  },
);

Input.displayName = "Input";

export default Input;
