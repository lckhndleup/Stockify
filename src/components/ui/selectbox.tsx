import React, { useState } from "react";
import { View, TouchableOpacity, Modal, ScrollView } from "react-native";
import Typography from "./typography";
import Icon from "./icon";
import type { SelectBoxProps } from "@/src/types/ui";

export default function SelectBox({
  label,
  error,
  helperText,
  placeholder = "Seçiniz...",
  options,
  value,
  onSelect,
  variant = "outlined",
  size = "md",
  fullWidth = true,
  disabled = false,
  className = "",
  inputClassName = "",
}: SelectBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

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

  const focusClasses = isFocused || isOpen ? "border-stock-red" : "";
  const errorClasses = error ? "border-stock-red" : "";
  const disabledClasses = disabled ? "opacity-50" : "";

  const containerClasses = [
    "flex-row items-center justify-between",
    variantClasses[variant],
    sizeClasses[size],
    focusClasses,
    errorClasses,
    disabledClasses,
    fullWidth && "w-full",
    inputClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const containerStyle = {
    height: inputHeights[size],
  };

  const handlePress = () => {
    if (!disabled) {
      setIsOpen(true);
      setIsFocused(true);
    }
  };

  const handleSelect = (optionValue: string) => {
    onSelect(optionValue);
    setIsOpen(false);
    setIsFocused(false);
  };

  const handleModalClose = () => {
    setIsOpen(false);
    setIsFocused(false);
  };

  return (
    <View className={`${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <Typography variant="caption" weight="medium" className="mb-2 text-stock-dark">
          {label}
        </Typography>
      )}

      <TouchableOpacity
        className={containerClasses}
        style={containerStyle}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.95}
      >
        <Typography
          variant="body"
          className={`flex-1 ${textSizes[size]} ${
            selectedOption ? "text-stock-dark" : "text-stock-text"
          }`}
          style={{
            lineHeight: size === "sm" ? 18 : size === "md" ? 20 : 22,
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Typography>

        <View className="ml-3">
          <Icon
            family="MaterialIcons"
            name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={20}
            color="#E3001B" // Kırmızı ok rengi
          />
        </View>
      </TouchableOpacity>

      {(error || helperText) && (
        <Typography
          variant="caption"
          className={`mt-1 ${error ? "text-stock-red" : "text-stock-text"}`}
        >
          {error || helperText}
        </Typography>
      )}

      {/* Dropdown Modal */}
      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={handleModalClose}>
        <TouchableOpacity
          className="flex-1 bg-black/20"
          activeOpacity={1}
          onPress={handleModalClose}
        >
          <View className="flex-1 justify-center px-6">
            <View className="bg-white border border-stock-border rounded-lg max-h-80 shadow-lg">
              <ScrollView showsVerticalScrollIndicator={false}>
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={option.value}
                    className={`px-4 py-4 ${
                      index !== options.length - 1 ? "border-b border-stock-border" : ""
                    } ${value === option.value ? "bg-stock-gray" : "bg-white"}`}
                    onPress={() => handleSelect(option.value)}
                    activeOpacity={0.95}
                  >
                    <Typography
                      variant="body"
                      className={`${value === option.value ? "text-stock-red" : "text-stock-dark"}`}
                      weight={value === option.value ? "semibold" : "normal"}
                    >
                      {option.label}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
