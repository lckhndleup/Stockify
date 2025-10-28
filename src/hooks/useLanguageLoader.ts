import { useEffect } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import logger from "@/src/utils/logger";

import { useLangStore } from "../stores/useLangStore";

export default function useLanguageLoader() {
  const { i18n } = useTranslation();
  const lang = useLangStore((state) => state.lang);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        if (lang) {
          await i18n.changeLanguage(lang);
          dayjs.locale(lang === "tr" ? "tr" : "en");
        }
      } catch (error) {
        logger.error("Language loading error:", error);
      }
    };

    loadLanguage();
  }, [lang, i18n]);
}
