// Store'lar için type tanımları
import type { Role } from "./apiTypes";

// Auth Store Types
export interface User {
  id: string;
  username: string;
  email?: string;
  loginTime: string;
}

export interface AuthStore {
  user: User | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  checkTokenExpiry: () => void;
  refreshToken: () => Promise<void>;
  initializeAuth: () => void;
}

// App Store Types
export interface GlobalToast {
  visible: boolean;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

export interface AppStore {
  globalToast: GlobalToast;
  showGlobalToast: (message: string, type?: "success" | "error" | "warning" | "info") => void;
  hideGlobalToast: () => void;
}

// Language Store Types
export interface LangStore {
  lang?: string;
  setLang: (lang: string) => void;
}
