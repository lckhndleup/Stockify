// src/components/common/FontProvider.tsx
import { useEffect, useState } from "react";
import { Text as RNText } from "react-native";
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  useFonts,
} from "@expo-google-fonts/montserrat";
import * as SplashScreen from "expo-splash-screen";

interface FontProviderProps {
  children: React.ReactNode;
}

// Tüm Text componentleri için default font ayarla
const TextAny = RNText as any;
TextAny.defaultProps = TextAny.defaultProps ?? {};
TextAny.defaultProps.style = { fontFamily: "Montserrat_400Regular" };

SplashScreen.preventAutoHideAsync();

export default function FontProvider({ children }: FontProviderProps) {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      const timer = setTimeout(async () => {
        await SplashScreen.hideAsync();
        setAppReady(true);
      }, 1500); // 1.5 saniye splash screen

      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || !appReady) {
    return null; // Expo'nun default splash screen'ini göster
  }

  return <>{children}</>;
}
