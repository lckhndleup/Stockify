// src/stores/appStore.ts
import React from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppStore } from "@/src/types/stores";

const middleware = persist<AppStore>(
  (set, get) => ({
    // Global Toast
    globalToast: {
      visible: false,
      message: "",
      type: "info",
    },

    showGlobalToast: (message, type = "info") => {
      set({
        globalToast: {
          visible: true,
          message,
          type,
        },
      });
    },

    hideGlobalToast: () => {
      set({
        globalToast: {
          visible: false,
          message: "",
          type: "info",
        },
      });
    },

    resetStore: () => {
      set({
        globalToast: {
          visible: false,
          message: "",
          type: "info",
        },
      });
      console.log("🔄 Store completely reset");
    },
  }),
  {
    name: "stock-app-storage",
    storage: createJSONStorage(() => AsyncStorage),
    version: 4, // Version increased for complete cleanup
    migrate: (persistedState: any, version: number) => {
      if (version < 4) {
        // Clean all old data, keep only global toast
        const newState = {
          globalToast: {
            visible: false,
            message: "",
            type: "info",
          },
        };
        console.log("🔄 Migrated store to version 4 - removed all local data");
        return newState;
      }
      return persistedState;
    },
  }
);

export const useAppStore = create<AppStore>()(middleware);

export default useAppStore;
