import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import LottieView from "lottie-react-native";
import Typography from "./typography";

interface LoadingProps {
  size?: "small" | "large";
  color?: string; // Geriye uyumluluk için tutuyoruz (kullanılmayacak)
  text?: string;
  overlay?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  speed?: number;
}

export default function Loading({
  size = "large",
  color, // Kullanılmıyor artık ama API uyumluluğu için tutuyoruz
  text,
  overlay = false,
  className = "",
  style,
  speed = 1,
}: LoadingProps) {
  // Boyut ayarları
  const sizeMapping = {
    small: 80,
    large: 120,
  };

  const animationSize = sizeMapping[size];

  const content = (
    <View className={`items-center justify-center ${className}`} style={style}>
      <LottieView
        source={require("../../assets/loadingAnimation.json")}
        autoPlay={true}
        loop={true}
        speed={speed}
        style={{
          width: animationSize,
          height: animationSize,
        }}
        resizeMode="contain"
        // Loop'u daha hızlı yapmak için
        onAnimationFinish={() => {
          // Animasyon bitince hemen yeniden başlat
        }}
      />
      {text && text.trim() && (
        <Typography
          variant="body"
          className="mt-3 text-stock-text"
          align="center"
        >
          {text}
        </Typography>
      )}
    </View>
  );

  if (overlay) {
    return (
      <View className="absolute inset-0 bg-black/20 items-center justify-center z-50">
        <View className="bg-white rounded-lg p-6 items-center shadow-lg">
          {content}
        </View>
      </View>
    );
  }

  return content;
}
