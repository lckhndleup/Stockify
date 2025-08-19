import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useLangStore } from "@/src/stores/useLangStore";

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { lang, setLang } = useLangStore();
  const router = useRouter();

  const toggleLanguage = () => {
    const newLang = lang === "tr" ? "en" : "tr";
    setLang(newLang);
    i18n.changeLanguage(newLang);
  };

  return (
    <View className="flex-1 bg-gray-50 justify-center items-center px-6">
      {/* Dil Değiştirme Butonu */}
      <TouchableOpacity
        className="absolute top-12 right-4 bg-gray-200 px-3 py-2 rounded-lg"
        onPress={toggleLanguage}
      >
        <Text className="text-gray-700 font-medium">
          {lang === "tr" ? "🇬🇧 EN" : "🇹🇷 TR"}
        </Text>
      </TouchableOpacity>

      <View className="items-center mb-8">
        <Text className="text-6xl mb-4">📦</Text>
        <Text className="text-3xl font-bold text-gray-800 mt-4">
          {t("appName")}
        </Text>
        <Text className="text-gray-600 text-center mt-2 mb-6 font-medium">
          {t("tagline")}
        </Text>
        <Text className="text-sm text-gray-500">{t("version")}</Text>
      </View>
    </View>
  );
}
