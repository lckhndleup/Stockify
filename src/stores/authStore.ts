// src/stores/authStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import apiService, { ApiError } from "@/src/services/api";
import logger from "@/src/utils/logger";
import type { User, AuthStore } from "@/src/types/stores";
import type { LoginRequest } from "@/src/types/apiTypes";

const middleware = persist<AuthStore>(
  (set, get) => ({
    user: null,
    token: null,
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

        const response = await apiService.login(credentials);
        logger.debug("✅ Login response:", response);

        if (response.token) {
          logger.debug("🎯 Token received:", {
            tokenLength: response.token.length,
            tokenPreview: response.token.substring(0, 20) + "...",
            tokenType: typeof response.token,
          });

          // Token'ı API service'e set et
          apiService.setToken(response.token);

          // User objesi oluştur (API'den user bilgisi gelmediği için username'den oluşturuyoruz)
          const user: User = {
            id: Date.now().toString(), // Geçici ID
            username: username,
            email: `${username}@stockify.com`, // Geçici email
            loginTime: new Date().toISOString(),
          };

          logger.debug("👤 User created:", user);

          set({
            user,
            token: response.token,
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
          const logoutResponse = await apiService.logout();
          logger.debug("✅ Logout API response:", logoutResponse);
        }
      } catch (error) {
        // Logout API hatası olsa bile local state'i temizle
        logger.warn("⚠️ Logout API error (proceeding with local logout):", error);
      } finally {
        // Her durumda local state'i ve token'ı temizle
        apiService.clearToken();

        set({
          user: null,
          token: null,
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

    initializeAuth: () => {
      const state = get();
      logger.debug("🔄 Initializing auth:", {
        hasToken: !!state.token,
        isAuthenticated: state.isAuthenticated,
        username: state.user?.username,
        rememberMe: state.rememberMe,
      });

      if (state.token && state.isAuthenticated) {
        // Uygulama başlarken token'ı API service'e set et
        apiService.setToken(state.token);
        logger.debug("🔑 Token restored to API service");
      } else {
        logger.debug("ℹ️ No token to restore");
      }
    },
  }),
  {
    name: "stockify-auth",
    storage: createJSONStorage(() => AsyncStorage),
    // Sadece seri hale getirilebilir alanları sakla
    // rememberMe true ise user/token/isAuthenticated/rememberMe alanlarını persist et
    // aksi halde hiçbir şey persist etme (boş obje)
    partialize: (state) =>
      (state.rememberMe
        ? {
            user: state.user,
            token: state.token,
            isAuthenticated: state.isAuthenticated,
            rememberMe: state.rememberMe,
          }
        : {}) as any,
    // Eski state'leri temizlemek için versiyon ve migrate ekle
    version: 2,
    migrate: (persistedState: any, _version) => {
      // v1'de fonksiyonlar ve geçici alanlar persist edilmiş olabilir; temizle
      const base = persistedState || {};
      if (!base.rememberMe) {
        return {
          user: null,
          token: null,
          isAuthenticated: false,
          rememberMe: false,
          isLoading: false,
          error: null,
        };
      }

      return {
        user: base.user ?? null,
        token: base.token ?? null,
        isAuthenticated: !!base.isAuthenticated && !!base.token,
        rememberMe: !!base.rememberMe,
        isLoading: false,
        error: null,
      } as any;
    },
    // Rehydrate sonrası token'ı API service'e aktar
    onRehydrateStorage: () => (state) => {
      try {
        const token = state?.token;
        if (token) {
          apiService.setToken(token);
        } else {
          apiService.clearToken();
        }
      } catch {
        // noop
      }
    },
  },
);

export const useAuthStore = create<AuthStore>()(middleware);
