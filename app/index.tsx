import React, { useState } from "react";
import { ScrollView } from "react-native";
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
    // router.push('/products');
  };

  const handleBrokers = () => {
    console.log("Aracılar sayfasına gidiliyor...");
    // router.push('/brokers');
  };

  const handleStock = () => {
    console.log("Stok Takip sayfasına gidiliyor...");
    // router.push('/stock');
  };

  return (
    <Container className="bg-white" padding="md">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* SearchBar */}
        <SearchBar
          placeholder="Ara..."
          onSearch={handleSearch}
          className="mb-8"
        />

        {/* Ana Menü Kartları - Kırmızı Butonlar */}
        <Container padding="none" className="space-y-4">
          {/* ÜRÜN Kartı */}
          <Card
            variant="default"
            padding="lg"
            pressable
            onPress={handleProducts}
            className="bg-stock-red border-0 shadow-md"
            radius="lg"
          >
            <Container
              padding="none"
              className="flex-row items-center justify-between"
            >
              <Container
                padding="none"
                className="flex-row items-center flex-1"
              >
                <Container padding="none" className="mr-4">
                  <Icon
                    family="MaterialCommunityIcons"
                    name="package-variant"
                    size={32}
                    color="#FFFEFF"
                  />
                </Container>
                <Container padding="none" className="flex-1">
                  <Typography
                    variant="h4"
                    weight="semibold"
                    className="text-stock-white"
                  >
                    ÜRÜN
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-stock-white/80 mt-1"
                  >
                    Kuruyemiş ürünlerinizi yönetin
                  </Typography>
                </Container>
              </Container>
              <Icon
                family="MaterialIcons"
                name="arrow-forward-ios"
                size={20}
                color="#FFFEFF"
              />
            </Container>
          </Card>

          {/* ARACILAR Kartı */}
          <Card
            variant="default"
            padding="lg"
            pressable
            onPress={handleBrokers}
            className="bg-stock-red border-0 shadow-md"
            radius="lg"
          >
            <Container
              padding="none"
              className="flex-row items-center justify-between"
            >
              <Container
                padding="none"
                className="flex-row items-center flex-1"
              >
                <Container padding="none" className="mr-4">
                  <Icon
                    family="MaterialCommunityIcons"
                    name="account-group"
                    size={32}
                    color="#FFFEFF"
                  />
                </Container>
                <Container padding="none" className="flex-1">
                  <Typography
                    variant="h4"
                    weight="semibold"
                    className="text-stock-white"
                  >
                    ARACILAR
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-stock-white/80 mt-1"
                  >
                    Aracı ve tedarikçi bilgileri
                  </Typography>
                </Container>
              </Container>
              <Icon
                family="MaterialIcons"
                name="arrow-forward-ios"
                size={20}
                color="#FFFEFF"
              />
            </Container>
          </Card>

          {/* STOK TAKİP Kartı */}
          <Card
            variant="default"
            padding="lg"
            pressable
            onPress={handleStock}
            className="bg-stock-red border-0 shadow-md"
            radius="lg"
          >
            <Container
              padding="none"
              className="flex-row items-center justify-between"
            >
              <Container
                padding="none"
                className="flex-row items-center flex-1"
              >
                <Container padding="none" className="mr-4">
                  <Icon
                    family="MaterialCommunityIcons"
                    name="chart-line"
                    size={32}
                    color="#FFFEFF"
                  />
                </Container>
                <Container padding="none" className="flex-1">
                  <Typography
                    variant="h4"
                    weight="semibold"
                    className="text-stock-white"
                  >
                    STOK TAKİP
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-stock-white/80 mt-1"
                  >
                    Stok durumu ve raporlar
                  </Typography>
                </Container>
              </Container>
              <Icon
                family="MaterialIcons"
                name="arrow-forward-ios"
                size={20}
                color="#FFFEFF"
              />
            </Container>
          </Card>
        </Container>

        {/* Alt Boşluk */}
        <Container padding="none" className="h-8" children={undefined} />
      </ScrollView>
    </Container>
  );
}
