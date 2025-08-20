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
        {/* Uygulama Adı */}
        <Typography
          variant="h1"
          weight="bold"
          size="xl"
          className="text-stock-red mb-4 mt-1"
        >
          Stockify
        </Typography>

        {/* SearchBar */}
        <SearchBar
          placeholder="Ara..."
          onSearch={handleSearch}
          className="mb-4"
        />

        {/* Ana Menü Kartları - Her karta margin-bottom ekledim */}
        <View>
          {/* ÜRÜN Kartı */}
          <Card
            variant="default"
            padding="none"
            pressable
            onPress={handleProducts}
            className="bg-stock-red border-0 px-4 py-4 mb-3"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="mr-4">
                  <Icon
                    family="MaterialCommunityIcons"
                    name="package-variant"
                    size={22}
                    color="#FFFEFF"
                  />
                </View>
                <View className="flex-1">
                  <Typography
                    variant="body"
                    weight="semibold"
                    size="lg"
                    className="text-stock-white mb-1"
                  >
                    ÜRÜN
                  </Typography>
                  <Typography
                    variant="caption"
                    size="sm"
                    className="text-stock-white/80"
                  >
                    Kuruyemiş ürünlerinizi yönetin
                  </Typography>
                </View>
              </View>
              <Icon
                family="MaterialIcons"
                name="arrow-forward-ios"
                size={16}
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
            className="bg-stock-red border-0 px-4 py-4 mb-3"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="mr-4">
                  <Icon
                    family="MaterialCommunityIcons"
                    name="account-group"
                    size={22}
                    color="#FFFEFF"
                  />
                </View>
                <View className="flex-1">
                  <Typography
                    variant="body"
                    weight="semibold"
                    size="lg"
                    className="text-stock-white mb-1"
                  >
                    ARACILAR
                  </Typography>
                  <Typography
                    variant="caption"
                    size="sm"
                    className="text-stock-white/80"
                  >
                    Aracı ve tedarikçi bilgileri
                  </Typography>
                </View>
              </View>
              <Icon
                family="MaterialIcons"
                name="arrow-forward-ios"
                size={16}
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
            className="bg-stock-red border-0 px-4 py-4"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="mr-4">
                  <Icon
                    family="MaterialCommunityIcons"
                    name="chart-line"
                    size={22}
                    color="#FFFEFF"
                  />
                </View>
                <View className="flex-1">
                  <Typography
                    variant="body"
                    weight="semibold"
                    size="lg"
                    className="text-stock-white mb-1"
                  >
                    STOK TAKİP
                  </Typography>
                  <Typography
                    variant="caption"
                    size="sm"
                    className="text-stock-white/80"
                  >
                    Stok durumu ve raporlar
                  </Typography>
                </View>
              </View>
              <Icon
                family="MaterialIcons"
                name="arrow-forward-ios"
                size={16}
                color="#FFFEFF"
              />
            </View>
          </Card>
        </View>
      </ScrollView>
    </Container>
  );
}
