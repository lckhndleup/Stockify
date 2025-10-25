// src/hooks/api/index.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ApiError,
  UseQueryOptions,
  UseMutationOptions,
} from "@/src/types/apiTypes";
import { router } from "expo-router";
import { queryKeys } from "./queryKeys";
export * from "./usePayments";
export * from "./useSales"; // NEW
export * from "./useBasket"; // NEW

// Hook factory'ler için base type'lar
export type QueryHook<TData, TParams = void> = TParams extends void
  ? (
      options?: UseQueryOptions<TData>
    ) => ReturnType<typeof useQuery<TData, ApiError>>
  : (
      params: TParams,
      options?: UseQueryOptions<TData>
    ) => ReturnType<typeof useQuery<TData, ApiError>>;

export type MutationHook<TData, TVariables = void> = (
  options?: UseMutationOptions<TData, ApiError, TVariables>
) => ReturnType<typeof useMutation<TData, ApiError, TVariables>>;

// 👈 YENİ: Type Guard - ApiError olup olmadığını kontrol et
const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "message" in error &&
    typeof (error as any).status === "number" &&
    typeof (error as any).message === "string"
  );
};

// Global error handler - Auth Store'u import etmeden
let authStore: any = null;

// Auth store'u set etmek için helper
export const setAuthStore = (store: any) => {
  authStore = store;
};
// Common error handler
export const handleApiError = async (error: ApiError) => {
  console.log("🚨 Global API Error Handler:", error);

  // 401 Unauthorized - Token expired veya invalid
  if (error.status === 401) {
    console.log("🔒 Unauthorized error - forcing logout");

    try {
      // Auth store varsa logout çağır
      if (authStore?.logout) {
        await authStore.logout();
        console.log("✅ Forced logout completed");
      }

      // Login sayfasına yönlendir
      router.replace("/login");

      // Kullanıcıya bilgi ver (opsiyonel - toast olarak gösterilebilir)
      console.log("📱 Redirected to login due to auth error");
    } catch (logoutError) {
      console.log("❌ Error during forced logout:", logoutError);
      // Yine de login sayfasına git
      router.replace("/login");
    }
  }

  // 403 Forbidden - Yetkisiz erişim
  else if (error.status === 403) {
    console.log("🚫 Forbidden - insufficient permissions");
    // Kullanıcıya yetki hatası göster
  }

  // 500 Server Error
  else if (error.status >= 500) {
    console.log("🔥 Server error:", error.message);
    // Server hatası toast'ı göster
  }

  // Network hatası
  else if (error.status === 0) {
    console.log("🌐 Network error - server unreachable");
    // Network hatası toast'ı göster
  }

  return error;
};

// Base query hook
export const createQueryHook = <TData, TParams = void>(
  queryKeyFactory: TParams extends void
    ? () => readonly unknown[]
    : (params: TParams) => readonly unknown[],
  queryFn: TParams extends void
    ? () => Promise<TData>
    : (params: TParams) => Promise<TData>
): QueryHook<TData, TParams> => {
  return ((params?: TParams, options?: UseQueryOptions<TData>) => {
    const queryKey =
      params !== undefined
        ? queryKeyFactory(params as TParams)
        : (queryKeyFactory as () => readonly unknown[])();

    return useQuery({
      queryKey,
      queryFn: () =>
        params !== undefined
          ? queryFn(params as TParams)
          : (queryFn as () => Promise<TData>)(),
      retry: (failureCount, error) => {
        console.log("🔄 Query retry check:", { failureCount, error });

        // 👈 DÜZELTİLDİ: Type guard kullan
        if (isApiError(error)) {
          // 401/403 hatalarında retry yapma
          if (error.status === 401 || error.status === 403) {
            console.log("🚫 No retry for auth errors:", error.status);
            return false;
          }
        }

        // Diğer hatalar için max 3 retry
        const shouldRetry = failureCount < 3;
        console.log("🔄 Retry decision:", { shouldRetry, failureCount });
        return shouldRetry;
      },
      ...options,
    });
  }) as QueryHook<TData, TParams>;
};

// Enhanced mutation hook
export const createMutationHook = <TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>
): MutationHook<TData, TVariables> => {
  return (options?: UseMutationOptions<TData, ApiError, TVariables>) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn,
      onError: async (error, variables) => {
        console.log("🚨 Mutation error:", error);

        // 👈 DÜZELTİLDİ: Type guard kullan
        if (isApiError(error)) {
          // Global error handling sadece ApiError için
          await handleApiError(error);
        } else {
          // Diğer error tiplerini logla
          console.log("❓ Non-API error:", error);
        }

        // User-defined error handler
        options?.onError?.(error, variables);
      },
      onSuccess: (data, variables) => {
        options?.onSuccess?.(data, variables);
      },
      onSettled: (data, error, variables) => {
        options?.onSettled?.(data, error, variables);
      },
    });
  };
};

export const useAuthErrorHandler = () => {
  // Bu hook component'ta çağrılarak auth store bağlanabilir
  const initializeErrorHandler = (authStoreInstance: any) => {
    setAuthStore(authStoreInstance);
  };

  return { initializeErrorHandler };
};
// Commonly used invalidation helper
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return {
    // Invalidate specific query families
    invalidateProducts: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
    invalidateCategories: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
    invalidateBrokers: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.all }),
    invalidateStock: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.all }),
    invalidateTransactions: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
    invalidateInvoices: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all }),
    invalidateDashboard: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),

    // Invalidate by broker ID
    invalidateBrokerData: (brokerId: string) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.brokers.detail(brokerId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.broker(brokerId),
      });
    },

    // Invalidate all broker data
    invalidateAllBrokerData: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.lists() });
    },

    // Invalidate broker and all related data
    invalidateBrokerWithRelations: (brokerId: string) => {
      // Broker detay ve listelerini yenile
      queryClient.invalidateQueries({
        queryKey: queryKeys.brokers.detail(brokerId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.lists() });

      // İlişkili verileri de yenile
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.broker(brokerId),
      });
    },

    // Invalidate by product ID
    invalidateProductData: (productId: string) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(productId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.all });
    },

    // NEW: Basket helpers
    invalidateBasket: (brokerId: string | number) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.basket.byBroker(brokerId),
      });
    },

    // NEW: Sales helpers
    invalidateSalesAll: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all }),
    clearSalesCalculation: (brokerId: string | number) =>
      queryClient.removeQueries({
        queryKey: queryKeys.sales.calculate(brokerId),
      }),
    clearSalesConfirm: (brokerId: string | number) =>
      queryClient.removeQueries({
        queryKey: queryKeys.sales.confirm(brokerId),
      }),

    // Invalidate all
    invalidateAll: () => queryClient.invalidateQueries(),
  };
};

// Export query keys for external use
export { queryKeys } from "./queryKeys";
