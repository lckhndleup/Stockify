// src/stores/authStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import apiService, { ApiError } from "@/src/services/api";
import logger from "@/src/utils/logger";
import type { User, AuthStore } from "@/src/types/stores";
import { LoginRequest } from "../services/auth/type";
import { requestLogin, requestLogout } from "../services/auth";

const middleware = persist<AuthStore>(
  (set, get) => ({
    user: null,
    token: null,
    role: null,
    isAuthenticated: false,
    rememberMe: false,
    isLoading: false,
    error: null,

    login: async (username: string, password: string, rememberMe: boolean) => {
      set({ isLoading: true, error: null });

      try {
        logger.debug("🔐 Login attempt:", { username, rememberMe });

        const credentials: LoginRequest = {
          username,
          password,
          rememberMe, // 👈 YENİ: rememberMe field'i API'ye gönderiliyor
        };

        const response = await requestLogin(credentials);
        logger.debug("✅ Login response received");

        if (response.token) {
          logger.debug("🎯 Token received (content hidden)");

          // Token'ı hem API service'e hem base service'e set et
          apiService.setToken(response.token);
          // 👈 YENİ: base.ts axios instance için de token set et
          const { setToken: setBaseToken } = await import("@/src/services/base");
          setBaseToken(response.token);

          // User objesi oluştur (API'den user bilgisi gelmediği için username'den oluşturuyoruz)
          const user: User = {
            id: Date.now().toString(), // Geçici ID
            username: username,
            email: `${username}@stockify.com`, // Geçici email
            loginTime: new Date().toISOString(),
          };

          logger.debug("👤 User session created for:", { username: user.username });

          set({
            user,
            token: response.token,
            role: response.role ?? null,
            isAuthenticated: true,
            rememberMe,
            isLoading: false,
            error: null,
          });

          logger.info("🎉 Login successful! State updated.");
          return true;
        } else {
          logger.warn("❌ No token in response:", response);
          set({
            isLoading: false,
            error: "Giriş başarısız. Token alınamadı.",
          });
          return false;
        }
      } catch (error) {
        logger.error("❌ Login error (handled quietly):", error);

        const apiError = error as ApiError;
        let errorMessage = "Giriş başarısız.";

        if (apiError.status === 401 || apiError.status === 500) {
          if (
            apiError.message?.toLowerCase().includes("bad credentials") ||
            apiError.message?.toLowerCase().includes("unauthorized")
          ) {
            errorMessage = "Kullanıcı adı veya şifre hatalı.";
          } else {
            errorMessage = "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.";
          }
        } else if (apiError.status === 0) {
          errorMessage = "Sunucuya bağlanılamıyor. Lütfen Docker'ın çalıştığından emin olun.";
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }

        logger.warn("💔 Login failed - showing user friendly message:", errorMessage);

        set({
          isLoading: false,
          error: errorMessage,
          isAuthenticated: false,
          user: null,
          token: null,
        });

        return false;
      }
    },

    // 👈 YENİ: Async logout with API call
    logout: async () => {
      logger.info("🚪 Logout triggered");

      try {
        // Önce API'ye logout request'i gönder
        if (get().token) {
          logger.debug("📡 Sending logout request to API...");
          const logoutResponse = await requestLogout();
          logger.debug("✅ Logout API response:", logoutResponse);
        }
      } catch (error) {
        // Logout API hatası olsa bile local state'i temizle
        logger.warn("⚠️ Logout API error (proceeding with local logout):", error);
      } finally {
        // Her durumda local state'i ve token'ı temizle
        apiService.clearToken();
        // 👈 YENİ: base.ts axios instance için de token temizle
        const { clearToken: clearBaseToken } = await import("@/src/services/base");
        clearBaseToken();

        set({
          user: null,
          token: null,
          role: null,
          isAuthenticated: false,
          rememberMe: false,
          isLoading: false,
          error: null,
        });

        logger.info("✅ Logout completed - all state cleared");
      }
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    clearError: () => {
      set({ error: null });
    },

    checkTokenExpiry: () => {
      // Token expiry check logic could be implemented here
      logger.debug("🕐 Checking token expiry");
      // This would typically decode JWT and check exp field
    },

    refreshToken: async () => {
      logger.debug("🔄 Refreshing token");
      try {
        // Token refresh logic would be implemented here
        // const newToken = await apiService.refreshToken();
        // set({ token: newToken });
      } catch (error) {
        logger.error("❌ Token refresh failed:", error);
        // Force logout on refresh failure
        get().logout();
      }
    },

    initializeAuth: async () => {
      const state = get();
      logger.debug("🔄 Initializing auth:", {
        hasToken: !!state.token,
        isAuthenticated: state.isAuthenticated,
        username: state.user?.username,
        role: state.role,
        rememberMe: state.rememberMe,
      });

      if (state.token && state.isAuthenticated) {
        // Uygulama başlarken token'ı hem API service'e hem base service'e set et
        apiService.setToken(state.token);
        // 👈 YENİ: base.ts axios instance için de token set et
        const { setToken: setBaseToken } = await import("@/src/services/base");
        setBaseToken(state.token);
        logger.debug("🔑 Token restored to both API services");
      } else {
        logger.debug("ℹ️ No token to restore");
      }
    },
  }),
  {
    name: "envantra-auth",
    storage: createJSONStorage(() => AsyncStorage),
    // Sadece seri hale getirilebilir alanları sakla
    // rememberMe true ise user/token/isAuthenticated/rememberMe alanlarını persist et
    // aksi halde hiçbir şey persist etme (boş obje)
    partialize: (state) =>
      (state.rememberMe
        ? {
            user: state.user,
            token: state.token,
            role: state.role,
            isAuthenticated: state.isAuthenticated,
            rememberMe: state.rememberMe,
          }
        : {}) as any,
    // Eski state'leri temizlemek için versiyon ve migrate ekle
    version: 3,
    migrate: (persistedState: any, _version) => {
      // v1'de fonksiyonlar ve geçici alanlar persist edilmiş olabilir; temizle
      const base = persistedState || {};
      if (!base.rememberMe) {
        return {
          user: null,
          token: null,
          role: null,
          isAuthenticated: false,
          rememberMe: false,
          isLoading: false,
          error: null,
        };
      }

      return {
        user: base.user ?? null,
        token: base.token ?? null,
        role: base.role ?? null,
        isAuthenticated: !!base.isAuthenticated && !!base.token,
        rememberMe: !!base.rememberMe,
        isLoading: false,
        error: null,
      } as any;
    },
    // Rehydrate sonrası token'ı hem API service'e hem base service'e aktar
    onRehydrateStorage: () => (state) => {
      try {
        const token = state?.token;
        if (token) {
          apiService.setToken(token);
          // 👈 YENİ: base.ts axios instance için de token set et
          import("@/src/services/base").then(({ setToken: setBaseToken }) => {
            setBaseToken(token);
          });
        } else {
          apiService.clearToken();
          // 👈 YENİ: base.ts axios instance için de token temizle
          import("@/src/services/base").then(({ clearToken: clearBaseToken }) => {
            clearBaseToken();
          });
        }
      } catch {
        // noop
      }
    },
  },
);

export const useAuthStore = create<AuthStore>()(middleware);
