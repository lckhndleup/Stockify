// Auth API Types
import type { Role } from "@/src/types/apiTypes";
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token: string;
  role?: Role;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  message: string;
  status: number;
}
