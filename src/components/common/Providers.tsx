import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import FontProvider from "./FontProvider";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <FontProvider>
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </FontProvider>
  );
}
