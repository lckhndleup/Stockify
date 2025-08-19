import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// JSON dosyalarını import et
import tr from "@/src/locales/tr.json";
import en from "@/src/locales/en.json";

const resources = {
  tr: {
    translation: tr,
  },
  en: {
    translation: en,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "tr", // varsayılan Türkçe
  fallbackLng: "tr",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
