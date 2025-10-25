import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { LangStore } from "@/src/types/stores";

const middleware = persist<LangStore>(
  (set) => ({
    lang: "tr", // Stockify için varsayılan Türkçe
    setLang: (lang: string) => set({ lang: lang }),
  }),
  {
    name: "stockify-language",
    storage: createJSONStorage(() => AsyncStorage),
  }
);

export const useLangStore = create<LangStore>()(middleware);
