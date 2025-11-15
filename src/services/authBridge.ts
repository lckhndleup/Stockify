// src/services/authBridge.ts
// A tiny bridge to allow services layer to trigger auth flows without importing hooks
import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '@/src/navigation/RootNavigator';

export type MinimalAuthStore = {
  logout: () => Promise<void> | void;
};

let authStoreRef: MinimalAuthStore | null = null;
let navigationRef: NavigationContainerRef<RootStackParamList> | null = null;

export const setAuthStoreRef = (store: MinimalAuthStore) => {
  authStoreRef = store;
};

export const setNavigationRef = (ref: NavigationContainerRef<RootStackParamList>) => {
  navigationRef = ref;
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
      if (navigationRef?.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (e) {
      // noop
      void e;
    }
  }
};
