// src/providers/QueryProvider.tsx
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// QueryClient konfigürasyonu
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 dakika cache süresi
      staleTime: 5 * 60 * 1000,
      // 10 dakika garbage collection
      gcTime: 10 * 60 * 1000,
      // Retry logic
      retry: (failureCount, error: any) => {
        // 401/403 hatalarında retry yapma
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Diğer durumlarda 3 kez dene
        return failureCount < 3;
      },
      // Background refetch ayarları
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      // Mutation retry sadece network hatalarında
      retry: (failureCount, error: any) => {
        if (error?.status && error.status >= 400) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
