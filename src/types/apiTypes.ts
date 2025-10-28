// API servisleri için type tanımları

// Rol tipleri (backend swagger)
export type Role = "ROLE_ADMIN" | "ROLE_BROKER" | "ROLE_USER";

// Auth API Types
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token: string;
  role: Role;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  message: string;
  status: number;
}

// Swagger adlarına uygun alias'lar
export type AuthenticationRequest = LoginRequest;
export type AuthenticationResponse = LoginResponse;

// Hook Options Types
export interface UseQueryOptions<_T = unknown> {
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
