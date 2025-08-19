import React from "react";
import { View, ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ContainerProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  safeTop?: boolean;
  safeBottom?: boolean;
  center?: boolean;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

export default function Container({
  children,
  className = "",
  safeTop = true,
  safeBottom = false,
  center = false,
  padding = "md",
  style,
  ...props
}: ContainerProps) {
  const insets = useSafeAreaInsets();

  // Padding değerleri (px olarak)
  const paddingValues = {
    none: { paddingHorizontal: 0, paddingVertical: 0 },
    sm: { paddingHorizontal: 12, paddingVertical: 8 },
    md: { paddingHorizontal: 24, paddingVertical: 16 },
    lg: { paddingHorizontal: 32, paddingVertical: 24 },
    xl: { paddingHorizontal: 40, paddingVertical: 32 },
  };

  // Base classes (padding class'larını kaldırdık)
  const baseClasses = ["flex-1", center && "justify-center items-center"]
    .filter(Boolean)
    .join(" ");

  // className'i ayrı handle et
  const finalClassName = `${baseClasses} ${className}`;

  // Style'ları birleştir
  const containerStyle = {
    paddingTop: safeTop ? insets.top : 0,
    paddingBottom: safeBottom ? insets.bottom : 0,
    ...paddingValues[padding], // Horizontal ve vertical padding'i manual ekle
    ...style, // User style'ı en son
  };

  return (
    <View className={finalClassName} style={containerStyle} {...props}>
      {children}
    </View>
  );
}
