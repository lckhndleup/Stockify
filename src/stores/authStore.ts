// src/stores/authStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import apiService, { ApiError } from "@/src/services/api";
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
        console.log("🔐 Login attempt:", { username, rememberMe });

        const credentials: LoginRequest = {
          username,
          password,
          rememberMe, // 👈 YENİ: rememberMe field'i API'ye gönderiliyor
        };

        const response = await apiService.login(credentials);

        console.log("✅ Login response:", response);

        if (response.token) {
          console.log("🎯 Token received:", {
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

          console.log("👤 User created:", user);

          set({
            user,
            token: response.token,
            isAuthenticated: true,
            rememberMe,
            isLoading: false,
            error: null,
          });

          console.log("🎉 Login successful! State updated.");
          return true;
        } else {
          console.log("❌ No token in response:", response);
          set({
            isLoading: false,
            error: "Giriş başarısız. Token alınamadı.",
          });
          return false;
        }
      } catch (error) {
        console.log("❌ Login error (handled quietly):", error);

        const apiError = error as ApiError;
        let errorMessage = "Giriş başarısız.";

        if (apiError.status === 401 || apiError.status === 500) {
          if (
            apiError.message?.toLowerCase().includes("bad credentials") ||
            apiError.message?.toLowerCase().includes("unauthorized")
          ) {
            errorMessage = "Kullanıcı adı veya şifre hatalı.";
          } else {
            errorMessage =
              "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.";
          }
        } else if (apiError.status === 0) {
          errorMessage =
            "Sunucuya bağlanılamıyor. Lütfen Docker'ın çalıştığından emin olun.";
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }

        console.log(
          "💔 Login failed - showing user friendly message:",
          errorMessage
        );

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
      console.log("🚪 Logout triggered");

      try {
        // Önce API'ye logout request'i gönder
        if (get().token) {
          console.log("📡 Sending logout request to API...");
          const logoutResponse = await apiService.logout();
          console.log("✅ Logout API response:", logoutResponse);
        }
      } catch (error) {
        // Logout API hatası olsa bile local state'i temizle
        console.log(
          "⚠️ Logout API error (proceeding with local logout):",
          error
        );
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

        console.log("✅ Logout completed - all state cleared");
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
      console.log("🕐 Checking token expiry");
      // This would typically decode JWT and check exp field
    },

    refreshToken: async () => {
      console.log("🔄 Refreshing token");
      try {
        // Token refresh logic would be implemented here
        // const newToken = await apiService.refreshToken();
        // set({ token: newToken });
      } catch (error) {
        console.log("❌ Token refresh failed:", error);
        // Force logout on refresh failure
        get().logout();
      }
    },

    initializeAuth: () => {
      const state = get();
      console.log("🔄 Initializing auth:", {
        hasToken: !!state.token,
        isAuthenticated: state.isAuthenticated,
        username: state.user?.username,
        rememberMe: state.rememberMe,
      });

      if (state.token && state.isAuthenticated) {
        // Uygulama başlarken token'ı API service'e set et
        apiService.setToken(state.token);
        console.log("🔑 Token restored to API service");
      } else {
        console.log("ℹ️ No token to restore");
      }
    },
  }),
  {
    name: "stockify-auth",
    storage: createJSONStorage(() => AsyncStorage),
    // Sadece rememberMe true ise persist et
    partialize: (state) => {
      if (state.rememberMe) {
        return {
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
          rememberMe: state.rememberMe,
          isLoading: false,
          error: null,
          // Functions serialization için gerekli
          login: state.login,
          logout: state.logout,
          setLoading: state.setLoading,
          clearError: state.clearError,
          checkTokenExpiry: state.checkTokenExpiry,
          refreshToken: state.refreshToken,
          initializeAuth: state.initializeAuth,
        };
      }
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        rememberMe: false,
        isLoading: false,
        error: null,
        // Functions serialization için gerekli
        login: state.login,
        logout: state.logout,
        setLoading: state.setLoading,
        clearError: state.clearError,
        checkTokenExpiry: state.checkTokenExpiry,
        refreshToken: state.refreshToken,
        initializeAuth: state.initializeAuth,
      };
    },
  }
);

export const useAuthStore = create<AuthStore>()(middleware);
