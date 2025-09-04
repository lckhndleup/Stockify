// src/components/common/Providers.tsx
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import QueryProvider from "@/src/providers/QueryProvider";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SafeAreaProvider>
      <QueryProvider>{children}</QueryProvider>
    </SafeAreaProvider>
  );
}
