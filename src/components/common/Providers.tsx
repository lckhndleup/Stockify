// src/components/common/Providers.tsx
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import QueryProvider from "@/src/providers/QueryProvider";
import type { ProvidersProps } from "@/src/types/providers";
import FontProvider from "@/src/components/common/FontProvider";

export default function Providers({ children }: ProvidersProps) {
  return (
    <SafeAreaProvider>
      <FontProvider>
        <QueryProvider>{children}</QueryProvider>
      </FontProvider>
    </SafeAreaProvider>
  );
}
