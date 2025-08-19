import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useLangStore } from "@/src/stores/useLangStore";

// UI Components
import { Container, Button, Typography, Icon } from "@/src/components/ui";

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
    <Container center padding="md" className="bg-gray-50">
      {/* Language Toggle Button */}
      <View className="absolute top-4 right-6">
        <Button
          variant="ghost"
          size="sm"
          onPress={toggleLanguage}
          className="bg-white/80 border border-gray-200"
        >
          <Typography variant="caption" weight="medium">
            {lang === "tr" ? "🇬🇧 EN" : "🇹🇷 TR"}
          </Typography>
        </Button>
      </View>
      {/* Logo and Title Section */}
      <View className="items-center mb-12">
        <Typography className="text-6xl mb-6">📦</Typography>

        <Typography variant="h1" align="center" className="text-gray-800 mb-4">
          {t("appName")}
        </Typography>

        <Typography
          variant="body"
          align="center"
          color="secondary"
          className="mb-4 max-w-xs px-4"
        >
          {t("tagline")}
        </Typography>

        <Typography variant="caption" color="gray">
          {t("version")}
        </Typography>
      </View>
      {/* Action Buttons */}
      <View className="w-full max-w-sm space-y-4">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.push("/products")}
          leftIcon={
            <Icon
              family="MaterialIcons"
              name="inventory"
              color="white"
              size={20}
            />
          }
        >
          {t("buttons.viewProducts")}
        </Button>
        <Button
          variant="success"
          size="lg"
          fullWidth
          onPress={() => router.push("/stock")}
          leftIcon={
            <Icon
              family="MaterialIcons"
              name="assessment"
              color="white"
              size={20}
            />
          }
        >
          {t("buttons.brokers")}
        </Button>
        <Button
          variant="warning"
          size="lg"
          fullWidth
          onPress={() => router.push("/stock")}
          leftIcon={
            <Icon
              family="MaterialIcons"
              name="assessment"
              color="white"
              size={20}
            />
          }
        >
          {t("buttons.reports")}
        </Button>
      </View>
    </Container>
  );
}
