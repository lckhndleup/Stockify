// import React from "react";
// import Svg, { Path } from "react-native-svg";
// import { Dimensions } from "react-native";

// interface BackgroundSvgProps {
//   width?: number;
//   height?: number;
// }

// const { width: screenWidth } = Dimensions.get("window");

// export default function BackgroundSvg({
//   width = screenWidth,
//   height = 320,
// }: BackgroundSvgProps) {
//   return (
//     <Svg
//       width={width}
//       height={height}
//       viewBox="0 0 393 399"
//       style={{
//         position: "absolute",
//         top: 0,
//         left: 0,
//       }}
//       preserveAspectRatio="xMidYMid slice"
//     >
//       <Path
//         d="M91.7334 204.673C55.8933 199.836 0 217.47 0 217.47V-322H393V296.942C393 296.942 370.542 309.734 355.404 314.453C322.986 324.558 302.62 324.473 270.188 314.453C226.572 300.977 210 265.796 171.436 236.327C143.64 215.086 124.385 209.08 91.7334 204.673Z"
//         fill="#E3001B"
//       />
//     </Svg>
//   );
// }

// import React from "react";
// import Svg, { Path } from "react-native-svg";
// import { Dimensions } from "react-native";

// interface BackgroundSvgProps {
//   width?: number;
//   height?: number;
// }

// const { width: screenWidth } = Dimensions.get("window");

// export default function BackgroundSvg({
//   width = screenWidth,
//   height = 380,
// }: BackgroundSvgProps) {
//   return (
//     <Svg
//       width={width}
//       height={height}
//       viewBox="0 0 1440 590"
//       style={{
//         position: "absolute",
//         top: 0,
//         left: 0,
//       }}
//       preserveAspectRatio="xMidYMid slice"
//     >
//       <Path
//         d="M 0,600 L 0,225 C 65.95215311004787,203.6602870813397 131.90430622009575,182.3205741626794 241,167 C 350.09569377990425,151.6794258373206 502.334928229665,142.37799043062202 605,151 C 707.665071770335,159.62200956937798 760.7559808612441,186.1674641148325 847,208 C 933.2440191387559,229.8325358851675 1052.6411483253587,246.95215311004787 1157,249 C 1261.3588516746413,251.04784688995213 1350.6794258373207,238.02392344497605 1440,225 L 1440,600 L 0,600 Z"
//         fill="#E3001B"
//         fillOpacity="1"
//         transform="rotate(-180 720 295)"
//       />
//     </Svg>
//   );
// }

// import React from "react";
// import Svg, { Path } from "react-native-svg";
// import { Dimensions } from "react-native";

// interface BackgroundSvgProps {
//   width?: number;
//   height?: number;
// }

// const { width: screenWidth } = Dimensions.get("window");

// export default function BackgroundSvg({
//   width = screenWidth,
//   height = 380,
// }: BackgroundSvgProps) {
//   return (
//     <Svg
//       width={width}
//       height={height}
//       viewBox="0 0 1440 690"
//       style={{
//         position: "absolute",
//         top: 0,
//         left: 0,
//       }}
//       preserveAspectRatio="xMidYMid slice"
//     >
//       <Path
//         d="M 0,700 L 0,262 C 84.10526315789474,220.10526315789474 168.21052631578948,178.21052631578945 271,189 C 373.7894736842105,199.78947368421055 495.2631578947369,263.2631578947369 588,261 C 680.7368421052631,258.7368421052631 744.7368421052631,190.73684210526315 836,205 C 927.2631578947369,219.26315789473685 1045.7894736842104,315.7894736842105 1151,339 C 1256.2105263157896,362.2105263157895 1348.1052631578948,312.10526315789474 1440,262 L 1440,700 L 0,700 Z"
//         fill="#E3001B"
//         fillOpacity="1"
//         transform="rotate(-180 720 350)"
//       />
//     </Svg>
//   );
// }

import React, { useEffect, useRef } from "react";
import Svg, { Path } from "react-native-svg";
import { Dimensions, Animated, Easing } from "react-native";

interface BackgroundSvgProps {
  width?: number;
  height?: number;
}

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
      ])
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
      ])
    ).start();

    return () => {
      floatAnimation.stopAnimation();
      waveAnimation.stopAnimation();
    };
  }, []);

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
