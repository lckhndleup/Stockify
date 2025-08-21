import React, { useEffect, useRef } from "react";
import { View, Animated, Dimensions } from "react-native";
import { Typography, Icon } from "@/src/components/ui";

interface ToastProps {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  onHide?: () => void;
}

const { width } = Dimensions.get("window");

export default function Toast({
  visible,
  message,
  type = "error",
  duration = 3000,
  onHide,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Toast'ı göster
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Belirtilen süre sonra gizle
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  const getToastStyle = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: "#10b981",
          borderColor: "#059669",
          iconName: "check-circle",
          iconColor: "white",
        };
      case "warning":
        return {
          backgroundColor: "#f59e0b",
          borderColor: "#d97706",
          iconName: "warning",
          iconColor: "white",
        };
      case "info":
        return {
          backgroundColor: "#3b82f6",
          borderColor: "#2563eb",
          iconName: "info",
          iconColor: "white",
        };
      case "error":
      default:
        return {
          backgroundColor: "#ef4444",
          borderColor: "#dc2626",
          iconName: "error",
          iconColor: "white",
        };
    }
  };

  const toastStyle = getToastStyle();

  if (!visible) return null;

  return (
    <View
      className="absolute top-0 left-0 right-0 z-50"
      style={{ paddingTop: 60 }}
    >
      <Animated.View
        style={[
          {
            transform: [{ translateY }],
            opacity,
            marginHorizontal: 16,
            borderRadius: 12,
            backgroundColor: toastStyle.backgroundColor,
            borderLeftWidth: 4,
            borderLeftColor: toastStyle.borderColor,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          },
        ]}
      >
        <View className="flex-row items-center p-4">
          <Icon
            family="MaterialIcons"
            name={toastStyle.iconName as any}
            size={24}
            color={toastStyle.iconColor}
            containerClassName="mr-3"
          />
          <View className="flex-1">
            <Typography
              variant="body"
              className="text-white"
              size="sm"
              weight="medium"
            >
              {message}
            </Typography>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
