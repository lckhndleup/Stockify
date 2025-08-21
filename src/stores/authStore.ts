import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface User {
  id: string;
  username: string;
  email?: string;
  loginTime: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
  isLoading: boolean;

  // Actions
  login: (
    username: string,
    password: string,
    rememberMe: boolean
  ) => Promise<boolean>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

// Mock login function - gerçek uygulamada API çağrısı olacak
const mockLogin = async (
  username: string,
  password: string
): Promise<User | null> => {
  // Simülasyon için 1 saniye bekle
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Basit validation - gerçek uygulamada API'den gelecek
  const validCredentials = [
    { username: "admin", password: "123456" },
    { username: "stockify", password: "password" },
    { username: "test", password: "test123" },
  ];

  const isValid = validCredentials.some(
    (cred) => cred.username === username && cred.password === password
  );

  if (isValid) {
    return {
      id: Date.now().toString(),
      username: username,
      email: `${username}@stockify.com`,
      loginTime: new Date().toISOString(),
    };
  }

  return null;
};

const middleware = persist<AuthStore>(
  (set, get) => ({
    user: null,
    isAuthenticated: false,
    rememberMe: false,
    isLoading: false,

    login: async (username: string, password: string, rememberMe: boolean) => {
      set({ isLoading: true });

      try {
        const user = await mockLogin(username, password);

        if (user) {
          set({
            user,
            isAuthenticated: true,
            rememberMe,
            isLoading: false,
          });
          return true;
        } else {
          set({ isLoading: false });
          return false;
        }
      } catch (error) {
        set({ isLoading: false });
        return false;
      }
    },

    logout: () => {
      set({
        user: null,
        isAuthenticated: false,
        rememberMe: false,
        isLoading: false,
      });
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
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
          isAuthenticated: state.isAuthenticated,
          rememberMe: state.rememberMe,
          isLoading: false,
          login: state.login,
          logout: state.logout,
          setLoading: state.setLoading,
        };
      }
      return {
        user: null,
        isAuthenticated: false,
        rememberMe: false,
        isLoading: false,
        login: state.login,
        logout: state.logout,
        setLoading: state.setLoading,
      };
    },
  }
);

export const useAuthStore = create<AuthStore>()(middleware);
