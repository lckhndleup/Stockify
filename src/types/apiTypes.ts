// API servisleri için type tanımları

// Auth API Types
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  message: string;
  status: number;
}

// Transaction API Types
export interface TransactionRequest {
  brokerId: number;
  startDate: number;
  endDate: number;
}

export interface TransactionItem {
  firstName: string;
  lastName: string;
  price: number;
  balance: number;
  type: "SALE" | "PAYMENT";
  downloadUrl: string;
  createdDate: number;
}

export interface TransactionSort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface TransactionPageable {
  offset: number;
  sort: TransactionSort;
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  unpaged: boolean;
}

export interface TransactionResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  content: TransactionItem[];
  number: number;
  sort: TransactionSort;
  pageable: TransactionPageable;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
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
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables
  ) => void;
}
