import React from "react";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";

import {
  Container,
  Typography,
  Card,
  SearchBar,
  Icon,
  Button,
} from "@/src/components/ui";

export default function StockPage() {
  const handleSearch = (text: string) => {
    console.log("Stok arama:", text);
  };

  const handleExportReport = () => {
    console.log("Rapor dışa aktar");
  };

  return (
    <Container className="bg-white" padding="sm">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search ve Export Butonu */}
        <View className="flex-row items-center mb-3">
          <SearchBar
            placeholder="Stok ara..."
            onSearch={handleSearch}
            className="flex-1 mr-3"
          />
          <Icon
            family="MaterialCommunityIcons"
            name="file-export"
            size={26}
            color="#E3001B"
            pressable
            onPress={handleExportReport}
            containerClassName="bg-gray-100 p-2 rounded-lg"
          />
        </View>

        {/* Özet Kartları */}
        <View className="flex-row mb-3 space-x-2">
          <Card
            variant="default"
            padding="sm"
            className="flex-1 bg-green-50 border border-green-200"
            radius="md"
          >
            <Typography
              variant="caption"
              size="xs"
              className="text-green-700 mb-1"
            >
              Toplam Ürün
            </Typography>
            <Typography variant="h4" weight="bold" className="text-green-600">
              24
            </Typography>
          </Card>

          <Card
            variant="default"
            padding="sm"
            className="flex-1 bg-red-50 border border-red-200"
            radius="md"
          >
            <Typography
              variant="caption"
              size="xs"
              className="text-red-700 mb-1"
            >
              Düşük Stok
            </Typography>
            <Typography variant="h4" weight="bold" className="text-red-600">
              3
            </Typography>
          </Card>

          <Card
            variant="default"
            padding="sm"
            className="flex-1 bg-blue-50 border border-blue-200"
            radius="md"
          >
            <Typography
              variant="caption"
              size="xs"
              className="text-blue-700 mb-1"
            >
              Toplam Değer
            </Typography>
            <Typography variant="h4" weight="bold" className="text-blue-600">
              ₺45K
            </Typography>
          </Card>
        </View>

        {/* Stok Listesi */}
        <View>
          {/* Düşük Stok - Kritik */}
          <Card
            variant="default"
            padding="sm"
            className="border-l-4 border-l-red-500 bg-red-50 mb-2"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Typography
                  variant="body"
                  weight="semibold"
                  className="text-stock-dark"
                >
                  Kaju
                </Typography>
                <Typography
                  variant="caption"
                  size="sm"
                  className="text-red-600 mt-1"
                >
                  Stok: 12 kg (Kritik Seviye!) • Değer: ₺5.400
                </Typography>
              </View>
              <View className="items-center">
                <Icon
                  family="MaterialIcons"
                  name="warning"
                  size={20}
                  color="#DC2626"
                />
                <Typography
                  variant="caption"
                  size="xs"
                  className="text-red-600 mt-1"
                >
                  DİKKAT
                </Typography>
              </View>
            </View>
          </Card>

          {/* Normal Stok */}
          <Card
            variant="default"
            padding="sm"
            className="border border-stock-border mb-2"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Typography
                  variant="body"
                  weight="semibold"
                  className="text-stock-dark"
                >
                  Antep Fıstığı (Çiğ)
                </Typography>
                <Typography
                  variant="caption"
                  size="sm"
                  className="text-stock-text mt-1"
                >
                  Stok: 45 kg • Değer: ₺38.250
                </Typography>
              </View>
              <View className="items-center">
                <Icon
                  family="MaterialIcons"
                  name="check-circle"
                  size={18}
                  color="#16A34A"
                />
                <Typography
                  variant="caption"
                  size="xs"
                  className="text-green-600 mt-1"
                >
                  NORMAL
                </Typography>
              </View>
            </View>
          </Card>

          {/* Normal Stok */}
          <Card
            variant="default"
            padding="sm"
            className="border border-stock-border mb-2"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Typography
                  variant="body"
                  weight="semibold"
                  className="text-stock-dark"
                >
                  Badem (Kabuklu)
                </Typography>
                <Typography
                  variant="caption"
                  size="sm"
                  className="text-stock-text mt-1"
                >
                  Stok: 78 kg • Değer: ₺22.620
                </Typography>
              </View>
              <View className="items-center">
                <Icon
                  family="MaterialIcons"
                  name="check-circle"
                  size={18}
                  color="#16A34A"
                />
                <Typography
                  variant="caption"
                  size="xs"
                  className="text-green-600 mt-1"
                >
                  NORMAL
                </Typography>
              </View>
            </View>
          </Card>

          {/* Düşük Stok */}
          <Card
            variant="default"
            padding="sm"
            className="border-l-4 border-l-yellow-500 bg-yellow-50"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Typography
                  variant="body"
                  weight="semibold"
                  className="text-stock-dark"
                >
                  Ceviz İçi
                </Typography>
                <Typography
                  variant="caption"
                  size="sm"
                  className="text-yellow-700 mt-1"
                >
                  Stok: 23 kg (Düşük Seviye) • Değer: ₺7.360
                </Typography>
              </View>
              <View className="items-center">
                <Icon
                  family="MaterialIcons"
                  name="info"
                  size={18}
                  color="#D97706"
                />
                <Typography
                  variant="caption"
                  size="xs"
                  className="text-yellow-600 mt-1"
                >
                  DÜŞÜK
                </Typography>
              </View>
            </View>
          </Card>
        </View>

        {/* Rapor Butonu */}
        <View className="mt-4">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="bg-stock-red"
            onPress={handleExportReport}
            leftIcon={
              <Icon
                family="MaterialCommunityIcons"
                name="file-export"
                size={20}
                color="white"
              />
            }
          >
            Detaylı Rapor Oluştur
          </Button>
        </View>
      </ScrollView>
    </Container>
  );
}
