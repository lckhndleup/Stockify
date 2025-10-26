// API servisleri için type tanımları

export interface ApiError {
  message: string;
  status: number;
}

// Hook Options Types
export interface UseQueryOptions<T> {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  retry?: number | boolean;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
}

export interface UseMutationOptions<TData, TError, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void;
}
