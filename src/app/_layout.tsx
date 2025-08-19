import { Stack } from "expo-router";

import Providers from "../components/common/Providers";
import useLanguageLoader from "../hooks/useLanguageLoader";

import "../utils/i18n";
import "../../global.css";

export default function RootLayout() {
  useLanguageLoader();

  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </Providers>
  );
}
