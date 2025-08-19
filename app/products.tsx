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

export default function ProductsPage() {
  const handleSearch = (text: string) => {
    console.log("Ürün arama:", text);
  };

  const handleAddProduct = () => {
    console.log("Yeni ürün ekle");
  };

  const handleEditProduct = (productName: string) => {
    console.log("Ürün düzenle:", productName);
  };

  const handleDeleteProduct = (productName: string) => {
    console.log("Ürün sil:", productName);
  };

  return (
    <Container className="bg-white" padding="sm">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search ve Add Butonu */}
        <View className="flex-row items-center mb-3">
          <SearchBar
            placeholder="Ürün ara..."
            onSearch={handleSearch}
            className="flex-1 mr-3"
          />
          <Icon
            family="MaterialIcons"
            name="add"
            size={28}
            color="#E3001B"
            pressable
            onPress={handleAddProduct}
            containerClassName="bg-gray-100 p-2 rounded-lg"
          />
        </View>

        {/* Ürün Listesi */}
        <View>
          {/* Örnek Ürün 1 */}
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
                  Stok: 45 kg • Fiyat: ₺850/kg
                </Typography>
              </View>
              <View className="flex-row items-center">
                <Icon
                  family="MaterialIcons"
                  name="edit"
                  size={18}
                  color="#67686A"
                  pressable
                  onPress={() => handleEditProduct("Antep Fıstığı")}
                  containerClassName="mr-2"
                />
                <Icon
                  family="MaterialIcons"
                  name="delete"
                  size={18}
                  color="#E3001B"
                  pressable
                  onPress={() => handleDeleteProduct("Antep Fıstığı")}
                />
              </View>
            </View>
          </Card>

          {/* Örnek Ürün 2 */}
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
                  Ceviz İçi
                </Typography>
                <Typography
                  variant="caption"
                  size="sm"
                  className="text-stock-text mt-1"
                >
                  Stok: 23 kg • Fiyat: ₺320/kg
                </Typography>
              </View>
              <View className="flex-row items-center">
                <Icon
                  family="MaterialIcons"
                  name="edit"
                  size={18}
                  color="#67686A"
                  pressable
                  onPress={() => handleEditProduct("Ceviz İçi")}
                  containerClassName="mr-2"
                />
                <Icon
                  family="MaterialIcons"
                  name="delete"
                  size={18}
                  color="#E3001B"
                  pressable
                  onPress={() => handleDeleteProduct("Ceviz İçi")}
                />
              </View>
            </View>
          </Card>

          {/* Örnek Ürün 3 */}
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
                  Stok: 78 kg • Fiyat: ₺290/kg
                </Typography>
              </View>
              <View className="flex-row items-center">
                <Icon
                  family="MaterialIcons"
                  name="edit"
                  size={18}
                  color="#67686A"
                  pressable
                  onPress={() => handleEditProduct("Badem")}
                  containerClassName="mr-2"
                />
                <Icon
                  family="MaterialIcons"
                  name="delete"
                  size={18}
                  color="#E3001B"
                  pressable
                  onPress={() => handleDeleteProduct("Badem")}
                />
              </View>
            </View>
          </Card>

          {/* Örnek Ürün 4 */}
          <Card
            variant="default"
            padding="sm"
            className="border border-stock-border"
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
                  className="text-stock-text mt-1"
                >
                  Stok: 12 kg • Fiyat: ₺450/kg
                </Typography>
              </View>
              <View className="flex-row items-center">
                <Icon
                  family="MaterialIcons"
                  name="edit"
                  size={18}
                  color="#67686A"
                  pressable
                  onPress={() => handleEditProduct("Kaju")}
                  containerClassName="mr-2"
                />
                <Icon
                  family="MaterialIcons"
                  name="delete"
                  size={18}
                  color="#E3001B"
                  pressable
                  onPress={() => handleDeleteProduct("Kaju")}
                />
              </View>
            </View>
          </Card>
        </View>

        {/* Yeni Ürün Ekle Butonu */}
        <View className="mt-4">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="bg-stock-red"
            onPress={handleAddProduct}
            leftIcon={
              <Icon family="MaterialIcons" name="add" size={20} color="white" />
            }
          >
            Yeni Ürün Ekle
          </Button>
        </View>
      </ScrollView>
    </Container>
  );
}
