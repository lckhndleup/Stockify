import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import Typography from "./typography";

interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

interface TabProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: "default" | "pills" | "underline";
  size?: "sm" | "md" | "lg";
}

export default function Tab({
  tabs,
  activeTab,
  onTabChange,
  className = "",
  variant = "pills",
  size = "md",
}: TabProps) {
  const sizeClasses = {
    sm: { padding: "px-3 py-2", text: "sm" },
    md: { padding: "px-4 py-3", text: "base" },
    lg: { padding: "px-6 py-4", text: "lg" },
  };

  const variantStyles = {
    default: {
      container: "bg-stock-gray rounded-lg p-1 border border-stock-border",
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
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTab;
            const isDisabled = tab.disabled;
            const isFirst = index === 0;
            const isLast = index === tabs.length - 1;

            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => !isDisabled && onTabChange(tab.id)}
                disabled={isDisabled}
                className={`
                  flex-1 items-center justify-center
                  ${currentSize.padding}
                  ${isActive ? currentVariant.active : currentVariant.inactive}
                  ${
                    variant === "pills" || variant === "default"
                      ? "rounded-md"
                      : ""
                  }
                  ${isDisabled ? "opacity-50" : ""}
                `}
                activeOpacity={0.8}
              >
                <Typography
                  variant="body"
                  size={currentSize.text as any}
                  weight={isActive ? "semibold" : "medium"}
                  className={`
                    ${
                      isActive
                        ? currentVariant.activeText
                        : currentVariant.inactiveText
                    }
                    ${isDisabled ? "opacity-60" : ""}
                  `}
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
