// src/components/common/FontProvider.tsx
import { useEffect, useState } from "react";
import { Text as RNText } from "react-native";
import RNBootSplash from "react-native-bootsplash";
import type { FontProviderProps } from "@/src/types/providers";

// Tüm Text componentleri için default font ayarla
// Fontlar react-native.config.js ile assets klasöründen otomatik yüklenecek
const TextAny = RNText as any;
TextAny.defaultProps = TextAny.defaultProps ?? {};
TextAny.defaultProps.style = { fontFamily: "Montserrat-Regular" };

export default function FontProvider({ children }: FontProviderProps) {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Fonts are automatically loaded via react-native.config.js
    // Just hide splash screen after a delay
    const timer = setTimeout(async () => {
      await RNBootSplash.hide({ fade: true });
      setAppReady(true);
    }, 1500); // 1.5 saniye splash screen

    return () => clearTimeout(timer);
  }, []);

  if (!appReady) {
    return null; // Show native splash screen
  }

  return <>{children}</>;
}
