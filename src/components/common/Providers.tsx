// src/components/common/Providers.tsx
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import QueryProvider from "@/src/providers/QueryProvider";
import type { ProvidersProps } from "@/src/types/providers";

export default function Providers({ children }: ProvidersProps) {
  return (
    <SafeAreaProvider>
      <QueryProvider>{children}</QueryProvider>
    </SafeAreaProvider>
  );
}
