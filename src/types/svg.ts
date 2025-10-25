// SVG ve animation componentleri için type tanımları
import React from "react";
import LottieView from "lottie-react-native";

export interface BackgroundSvgProps {
  width?: number;
  height?: number;
  color?: string;
}

export type LottieProps = React.ComponentProps<typeof LottieView>;

export type SuccessAnimationRef = {
  play: () => void;
  pause: () => void;
  reset: () => void;
};

export type SuccessAnimationProps = {
  onAnimationFinish?: () => void;
  autoPlay?: boolean;
  loop?: boolean;
} & Partial<LottieProps>;
