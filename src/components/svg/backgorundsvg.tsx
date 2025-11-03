// src/components/svg/backgorundsvg.tsx
import React, { useEffect, useRef } from "react";
import Svg, { Path } from "react-native-svg";
import { Dimensions, Animated, Easing } from "react-native";
import type { BackgroundSvgProps } from "@/src/types/svg";

const { width: screenWidth } = Dimensions.get("window");

export default function BackgroundSvg({
  width = screenWidth,
  height = 220, // Kırmızı alanı daha küçük yapalım ki beyaz boşluk azalsın
}: BackgroundSvgProps) {
  // İki farklı animasyon değeri kullanalım - daha belirgin efekt için
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const waveAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Yüzen animasyon (yukarı-aşağı hafif hareket)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Dalga animasyonu (sağa-sola hafif hareket)
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnimation, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnimation, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    return () => {
      floatAnimation.stopAnimation();
      waveAnimation.stopAnimation();
    };
  }, [floatAnimation, waveAnimation]);

  // SVG'yi ekstra genişletip, sol tarafa taşırarak boşluk oluşmasını önleyelim
  const svgWidth = width * 1.4; // Daha fazla genişletilmiş

  // Animasyon değerlerini daha belirgin hale getirelim
  const translateX = waveAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-10, 10, -10], // Daha belirgin yatay hareket
  });

  const translateY = floatAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -5, 0], // Hafif yukarı-aşağı hareket
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: -width * 0.2, // Daha fazla sol offset
        width: svgWidth,
        height: height,
        transform: [{ translateX }, { translateY }],
      }}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 1440 320" // Daha alçak bir viewBox
        preserveAspectRatio="xMidYMid slice"
      >
        <Path
          d="M 0,320 L 0,122 C 84.10526315789474,100.10526315789474 168.21052631578948,80.21052631578945 271,89 C 373.7894736842105,99.78947368421055 495.2631578947369,133.2631578947369 588,131 C 680.7368421052631,128.7368421052631 744.7368421052631,90.73684210526315 836,95 C 927.2631578947369,99.26315789473685 1045.7894736842104,145.7894736842105 1151,159 C 1256.2105263157896,172.2105263157895 1348.1052631578948,152.10526315789474 1440,122 L 1440,320 L 0,320 Z"
          fill="#E3001B"
          fillOpacity="1"
          transform="rotate(-180 720 160)"
        />
      </Svg>
    </Animated.View>
  );
}
