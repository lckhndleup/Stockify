import React from "react";
import Svg, { Path } from "react-native-svg";
import { Dimensions } from "react-native";

interface BackgroundSvgProps {
  width?: number;
  height?: number;
}

const { width: screenWidth } = Dimensions.get("window");

export default function BackgroundSvg({
  width = screenWidth,
  height = 280,
}: BackgroundSvgProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 393 399"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
      }}
      preserveAspectRatio="xMidYMid slice"
    >
      <Path
        d="M91.7334 204.673C55.8933 199.836 0 217.47 0 217.47V-322H393V296.942C393 296.942 370.542 309.734 355.404 314.453C322.986 324.558 302.62 324.473 270.188 314.453C226.572 300.977 210 265.796 171.436 236.327C143.64 215.086 124.385 209.08 91.7334 204.673Z"
        fill="#E3001B"
      />
    </Svg>
  );
}
