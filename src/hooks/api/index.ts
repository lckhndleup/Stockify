// src/hooks/api/index.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService, ApiError } from "@/src/services/api";
import { queryKeys } from "./queryKeys";
export * from "./usePayments";

// Base hook types
interface UseQueryOptions<T> {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  retry?: number | boolean;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
}

interface UseMutationOptions<TData, TError, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables
  ) => void;
}

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

// Common error handler
export const handleApiError = (error: ApiError) => {
  console.log("API Error:", error);

  // Global error handling
  if (error.status === 401) {
    // Token expired, logout user
    // Bu kısmı auth store ile bağlayabiliriz
    console.log("Unauthorized - redirecting to login");
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
        : queryKeyFactory();

    return useQuery({
      queryKey,
      queryFn: () =>
        params !== undefined ? queryFn(params as TParams) : queryFn(),
      ...options,
    });
  }) as QueryHook<TData, TParams>;
};

// Base mutation hook
export const createMutationHook = <TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>
): MutationHook<TData, TVariables> => {
  return (options?: UseMutationOptions<TData, ApiError, TVariables>) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn,
      onError: (error) => {
        handleApiError(error);
        options?.onError?.(error, {} as TVariables);
      },
      ...options,
    });
  };
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

    // Invalidate all
    invalidateAll: () => queryClient.invalidateQueries(),
  };
};

// Export query keys for external use
export { queryKeys } from "./queryKeys";
