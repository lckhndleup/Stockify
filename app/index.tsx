import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

import {
  Container,
  Typography,
  Card,
  SearchBar,
  Icon,
} from "@/src/components/ui";

export default function HomePage() {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");

  const handleSearch = (text: string) => {
    setSearchText(text);
    console.log("Arama yapılıyor:", text);
  };

  const handleProducts = () => {
    console.log("Ürünler sayfasına gidiliyor...");
    router.push("/products");
  };

  const handleBrokers = () => {
    console.log("Aracılar sayfasına gidiliyor...");
    router.push("/brokers");
  };

  const handleStock = () => {
    console.log("Stok Takip sayfasına gidiliyor...");
    router.push("/stock");
  };

  return (
    <Container className="bg-white" padding="sm">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* SearchBar */}
        <SearchBar
          placeholder="Ara..."
          onSearch={handleSearch}
          className="mb-3"
        />

        {/* Ana Menü Kartları - Ultra Minimal */}
        <View className="space-y-2">
          {/* ÜRÜN Kartı */}
          <Card
            variant="default"
            padding="none"
            pressable
            onPress={handleProducts}
            className="bg-stock-red border-0 px-3 py-2"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="mr-3">
                  <Icon
                    family="MaterialCommunityIcons"
                    name="package-variant"
                    size={18}
                    color="#FFFEFF"
                  />
                </View>
                <View className="flex-1">
                  <Typography
                    variant="body"
                    weight="semibold"
                    size="base"
                    className="text-stock-white"
                  >
                    ÜRÜN
                  </Typography>
                  <Typography
                    variant="caption"
                    size="xs"
                    className="text-stock-white/70"
                  >
                    Kuruyemiş ürünlerinizi yönetin
                  </Typography>
                </View>
              </View>
              <Icon
                family="MaterialIcons"
                name="arrow-forward-ios"
                size={12}
                color="#FFFEFF"
              />
            </View>
          </Card>

          {/* ARACILAR Kartı */}
          <Card
            variant="default"
            padding="none"
            pressable
            onPress={handleBrokers}
            className="bg-stock-red border-0 px-3 py-2"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="mr-3">
                  <Icon
                    family="MaterialCommunityIcons"
                    name="account-group"
                    size={18}
                    color="#FFFEFF"
                  />
                </View>
                <View className="flex-1">
                  <Typography
                    variant="body"
                    weight="semibold"
                    size="base"
                    className="text-stock-white"
                  >
                    ARACILAR
                  </Typography>
                  <Typography
                    variant="caption"
                    size="xs"
                    className="text-stock-white/70"
                  >
                    Aracı ve tedarikçi bilgileri
                  </Typography>
                </View>
              </View>
              <Icon
                family="MaterialIcons"
                name="arrow-forward-ios"
                size={12}
                color="#FFFEFF"
              />
            </View>
          </Card>

          {/* STOK TAKİP Kartı */}
          <Card
            variant="default"
            padding="none"
            pressable
            onPress={handleStock}
            className="bg-stock-red border-0 px-3 py-2"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="mr-3">
                  <Icon
                    family="MaterialCommunityIcons"
                    name="chart-line"
                    size={18}
                    color="#FFFEFF"
                  />
                </View>
                <View className="flex-1">
                  <Typography
                    variant="body"
                    weight="semibold"
                    size="base"
                    className="text-stock-white"
                  >
                    STOK TAKİP
                  </Typography>
                  <Typography
                    variant="caption"
                    size="xs"
                    className="text-stock-white/70"
                  >
                    Stok durumu ve raporlar
                  </Typography>
                </View>
              </View>
              <Icon
                family="MaterialIcons"
                name="arrow-forward-ios"
                size={12}
                color="#FFFEFF"
              />
            </View>
          </Card>
        </View>
      </ScrollView>
    </Container>
  );
}
