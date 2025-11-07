import React from "react";
import { TouchableOpacity, View } from "react-native";
import Typography from "./typography";
import type { TabProps } from "@/src/types/ui";

export default function Tab({
  tabs,
  activeTab,
  onTabChange,
  className = "",
  variant = "pills",
  size = "md",
}: TabProps) {
  // Dinamik font size hesaplama
  const calculateFontSize = (tabCount: number) => {
    const baseSizes = { sm: 14, md: 16, lg: 18 };
    const baseValue = baseSizes[size];

    // Tab sayısına göre font size azaltma
    if (tabCount <= 2) return baseValue;
    if (tabCount === 3) return Math.max(baseValue - 1, 12);
    if (tabCount === 4) return Math.max(baseValue - 2, 11);
    if (tabCount === 5) return Math.max(baseValue - 3, 10);
    return Math.max(baseValue - 4, 9); // 6+ tab için minimum 9px
  };

  // Dinamik padding hesaplama
  const calculatePadding = (tabCount: number) => {
    if (tabCount <= 2) return "px-4 py-3";
    if (tabCount <= 4) return "px-3 py-2";
    return "px-2 py-1"; // 5+ tab için daha az padding
  };

  const dynamicFontSize = calculateFontSize(tabs.length);
  const dynamicPadding = calculatePadding(tabs.length);

  const sizeClasses = {
    sm: { padding: dynamicPadding, text: "sm" },
    md: { padding: dynamicPadding, text: "base" },
    lg: { padding: dynamicPadding, text: "lg" },
  };

  const variantStyles = {
    default: {
      container: "bg-stock-gray rounded-lg border border-stock-border p-1",
      active: "bg-stock-red shadow-sm",
      inactive: "bg-transparent",
      activeText: "text-stock-white",
      inactiveText: "text-stock-dark",
    },
    pills: {
      container: "bg-transparent border border-stock-border rounded-lg p-1",
      active: "bg-stock-red",
      inactive: "bg-transparent",
      activeText: "text-stock-white",
      inactiveText: "text-stock-dark",
    },
    underline: {
      container: "border-b border-stock-border",
      active: "border-b-2 border-stock-red bg-transparent",
      inactive: "bg-transparent",
      activeText: "text-stock-red",
      inactiveText: "text-stock-text",
    },
  };

  const currentVariant = variantStyles[variant];
  const currentSize = sizeClasses[size];

  return (
    <View className={`w-full ${className}`}>
      <View className={currentVariant.container}>
        <View className="flex-row">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            const isDisabled = tab.disabled;
            const roundedClass = variant === "pills" || variant === "default" ? "rounded-md" : "";

            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => !isDisabled && onTabChange(tab.id)}
                disabled={isDisabled}
                className={`
                  flex-1 items-center justify-center
                  ${currentSize.padding}
                  ${isActive ? currentVariant.active : currentVariant.inactive}
                  ${roundedClass}
                  ${isDisabled ? "opacity-50" : ""}
                `}
                activeOpacity={1.0}
              >
                <Typography
                  variant="body"
                  weight={isActive ? "semibold" : "medium"}
                  className={`
                    ${isActive ? currentVariant.activeText : currentVariant.inactiveText}
                    ${isDisabled ? "opacity-60" : ""}
                  `}
                  style={{
                    fontSize: dynamicFontSize,
                    lineHeight: dynamicFontSize + 4,
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {tab.label}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
