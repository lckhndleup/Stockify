// src/services/authBridge.ts
// A tiny bridge to allow services layer to trigger auth flows without importing hooks
import { router } from "expo-router";

export type MinimalAuthStore = {
  logout: () => Promise<void> | void;
};

let authStoreRef: MinimalAuthStore | null = null;

export const setAuthStoreRef = (store: MinimalAuthStore) => {
  authStoreRef = store;
};

export const getAuthStoreRef = () => authStoreRef;

export const forceLogoutAndRedirect = async () => {
  try {
    if (authStoreRef?.logout) {
      await authStoreRef.logout();
    }
  } finally {
    // Ensure navigation to login even if logout fails
    try {
      router.replace("/login");
    } catch (e) {
      // noop
      void e;
    }
  }
};
