// src/components/svg/successAnimation.tsx
import React, { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { StyleProp, ViewStyle } from "react-native";
import LottieView from "lottie-react-native";
import type {
  LottieProps,
  SuccessAnimationRef,
  SuccessAnimationProps,
} from "@/src/types/svg";

type Props = {
  /** Boş bırakılırsa ./Checked.json kullanılır */
  source?: LottieProps["source"];
  /** Kare boyut (width & height birlikte) */
  size?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  autoPlay?: LottieProps["autoPlay"];
  loop?: LottieProps["loop"];
  speed?: LottieProps["speed"];
  onFinish?: LottieProps["onAnimationFinish"];
  testID?: string;
};

const SuccessAnimation = forwardRef<SuccessAnimationRef, Props>(
  (
    {
      source,
      size = 120,
      width,
      height,
      style,
      autoPlay = true,
      loop = false,
      speed = 1,
      onFinish,
      testID,
    },
    ref
  ) => {
    const lottieRef = useRef<LottieView>(null);

    useImperativeHandle(ref, () => ({
      play: () => lottieRef.current?.play?.(),
      pause: () => lottieRef.current?.pause?.(),
      reset: () => lottieRef.current?.reset?.(),
    }));

    const resolvedSource = useMemo(
      () => source ?? require("./Checked.json"),
      [source]
    );

    return (
      <LottieView
        ref={lottieRef}
        source={resolvedSource}
        autoPlay={autoPlay}
        loop={loop}
        speed={speed}
        style={[{ width: width ?? size, height: height ?? size }, style]}
        onAnimationFinish={onFinish}
        testID={testID}
      />
    );
  }
);

export default SuccessAnimation;
