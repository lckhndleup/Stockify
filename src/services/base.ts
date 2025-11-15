// src/services/base.ts
import axios, { type AxiosInstance } from "axios";
import type { ApiError } from "@/src/types/apiTypes";
import logger from "@/src/utils/logger";
import { forceLogoutAndRedirect } from "./authBridge";
import Config from "@/src/config";

const API_BASE_URL = Config.API_URL;

const DEFAULT_TIMEOUT_MS = () => {
  return Config.API_TIMEOUT_MS;
};

let token: string | null = null;
// Prevent recursive logout loops on 401 handling
let forcingLogout = false;

// Axios instance oluştur
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Token ekleme
axiosInstance.interceptors.request.use(
  (config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    logger.debug("🌐 API Request:", {
      method: config.method?.toUpperCase() || "GET",
      url: config.url,
      hasToken: !!token,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? "[HIDDEN]" : undefined,
      },
    });

    return config;
  },
  (error) => {
    logger.error("❌ Request Interceptor Error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor - Hata yönetimi
axiosInstance.interceptors.response.use(
  (response) => {
    const isDebugMode = process.env.NODE_ENV === "development";

    if (isDebugMode) {
      logger.debug("📡 API Response:", {
        status: response.status,
        statusText: response.statusText,
        url: response.config.url,
      });
      logger.debug("📦 Response data:", response.data);
    }

    return response;
  },
  async (error) => {
    const isDebugMode = process.env.NODE_ENV === "development";

    if (axios.isAxiosError(error)) {
      // Timeout hatası
      if (error.code === "ECONNABORTED") {
        const timeoutError: ApiError = {
          message: "İstek zaman aşımına uğradı. Lütfen tekrar deneyin.",
          status: 0,
        };
        logger.warn("⏳ Request timed out:", error.config?.url);
        throw timeoutError;
      }

      // Network hatası
      if (!error.response) {
        const networkError: ApiError = {
          message: "Bağlantı hatası. Sunucuya ulaşılamıyor.",
          status: 0,
        };
        logger.error("🌐 Network Error:", networkError);
        throw networkError;
      }

      // HTTP hatası
      const apiError: ApiError = {
        message: error.response.data?.message || "Bir hata oluştu",
        status: error.response.status,
      };

      if (isDebugMode) {
        logger.warn("❌ API Error (debug):", apiError);
      }

      // 401 Unauthorized - Force logout
      const endpoint = error.config?.url || "";
      if (
        apiError.status === 401 &&
        !endpoint.startsWith("/auth/logout") &&
        !endpoint.startsWith("/auth/login") &&
        !forcingLogout
      ) {
        try {
          forcingLogout = true;
          await forceLogoutAndRedirect();
        } catch (e) {
          logger.error("Failed to force logout after 401:", e);
        } finally {
          forcingLogout = false;
        }
      }

      throw apiError;
    }

    // Diğer hatalar
    logger.error("❌ Unexpected Error:", error);
    throw error;
  },
);

// Token'ı set etmek için
const setToken = (_token: string) => {
  token = _token;
};

const getToken = (): string | null => {
  return token;
};

// Token'ı temizlemek için
const clearToken = () => {
  token = null;
};

// Return headers that include Authorization if token exists
const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

// Base request wrapper
const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const response = await axiosInstance.request<T>({
    url: endpoint,
    method: (options.method as any) || "GET",
    data: options.body ? JSON.parse(options.body as string) : undefined,
    headers: options.headers as Record<string, string>,
  });

  // Boş response kontrolü
  if (!response.data) {
    logger.debug("✅ Empty successful response, returning success");
    return { success: true, message: "İşlem başarılı" } as T;
  }

  return response.data;
};

export { request, setToken, clearToken, getAuthHeaders, getToken, API_BASE_URL };
