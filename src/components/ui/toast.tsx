import React, { useCallback, useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import Typography from "./typography";
import Icon from "./icon";
import type { ToastProps } from "@/src/types/ui";

export default function Toast({
  visible,
  message,
  type = "error",
  duration, // Duration artık opsiyonel, type'a göre ayarlanacak
  onHide,
}: ToastProps) {
  // Sadece opacity animasyonu kullan, translateY kaldırıldı
  const opacity = useRef(new Animated.Value(0)).current;

  // Type'a göre default duration belirle
  const getDefaultDuration = () => {
    if (duration) return duration; // Manuel duration verilmişse onu kullan

    switch (type) {
      case "error":
        return 4000; // Error mesajları 4 saniye
      case "warning":
        return 3500; // Warning mesajları 3.5 saniye
      case "success":
        return 3000; // Success mesajları 3 saniye
      case "info":
      default:
        return 3000; // Info mesajları 3 saniye
    }
  };

  const toastDuration = getDefaultDuration();

  const hideToast = useCallback(() => {
    // Sadece opacity animasyonu
    Animated.timing(opacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      // State update'ini bir sonraki render cycle'a ertele
      setTimeout(() => {
        onHide?.();
      }, 0);
    });
  }, [opacity, onHide]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (visible) {
      // Toast'ı göster (sadece opacity animasyonu, daha hızlı)
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200, // Daha hızlı görünme
        useNativeDriver: true,
      }).start();

      // Belirtilen süre sonra gizle
      timer = setTimeout(() => {
        hideToast();
      }, toastDuration);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible, toastDuration, hideToast, opacity]);

  const getToastStyle = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: "#059669", // Daha koyu yeşil (tailwind green-600)
          borderColor: "#047857", // Daha da koyu border (tailwind green-700)
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
          backgroundColor: "#E3001B", // stock-red - Ana kırmızı renk
          borderColor: "#CC0018", // Daha koyu kırmızı border
          iconName: "error",
          iconColor: "white",
        };
    }
  };

  const toastStyle = getToastStyle();

  if (!visible) return null;

  return (
    <View
      className="absolute top-0 left-0 right-0"
      style={{
        paddingTop: 10, // En üste yakın olsun
        zIndex: 10000, // Z-index'i arttır
        elevation: 10000, // Android için elevation değerini arttır
        position: "absolute", // Pozisyonu sabit tut
      }}
    >
      <Animated.View
        style={[
          {
            opacity,
            marginTop: 0, // Üstten sıfır boşluk
            marginHorizontal: 20, // Yanlardan biraz daha fazla boşluk
            borderRadius: 10,
            backgroundColor: toastStyle.backgroundColor,
            borderWidth: 1, // Dört tarafı borderlı
            borderColor: toastStyle.borderColor,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.6,
            shadowRadius: 8,
            elevation: 12,
          },
        ]}
      >
        <View className="flex-row items-center py-3 px-4">
          <Icon
            family="MaterialIcons"
            name={toastStyle.iconName as any}
            size={20} // Daha küçük ikon
            color={toastStyle.iconColor}
            containerClassName="mr-2"
          />
          <View className="flex-1">
            <Typography
              variant="body"
              className="text-white"
              size="sm"
              weight="normal" // Daha ince yazı
            >
              {message}
            </Typography>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
