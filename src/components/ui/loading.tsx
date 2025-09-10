import React, { useRef, useEffect, useState } from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import LottieView from "lottie-react-native";
import Typography from "./typography";
import type { LoadingProps } from "@/src/types/ui";

export default function Loading({
  size = "large",
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
  const animationRef = useRef<LottieView>(null);
  const [animationKey, setAnimationKey] = useState(0);

  // Animasyon bittiğinde hemen yeniden başlatma işlevi
  const handleAnimationFinish = () => {
    // Animasyon bitince anında yeni bir animasyon başlat
    if (animationRef.current) {
      // Animasyonu sıfırla ve anında yeniden başlat
      animationRef.current.reset();
      animationRef.current.play();
    }
  };

  // Yedek çözüm - herhangi bir sorun olursa periyodik olarak animasyonu yeniden başlat
  useEffect(() => {
    // Her 2 saniyede bir animasyonu kontrol et
    const intervalId = setInterval(() => {
      if (animationRef.current) {
        // Animasyonu yeniden başlat
        animationRef.current.reset();
        animationRef.current.play();
      }
    }, 1400);

    return () => clearInterval(intervalId);
  }, []);

  const content = (
    <View className={`items-center justify-center ${className}`} style={style}>
      <LottieView
        key={animationKey}
        ref={animationRef}
        source={require("../../assets/loadingAnimation.json")}
        autoPlay={true}
        loop={false} // Loop'u kapatıyoruz çünkü manuel kontrol edeceğiz
        speed={speed}
        onAnimationFinish={handleAnimationFinish} // Animasyon bitince hemen yeniden başlat
        style={{
          width: animationSize,
          height: animationSize,
        }}
        resizeMode="contain"
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
