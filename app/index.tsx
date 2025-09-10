// app/index.tsx
import React, { useState } from "react";
import { ScrollView, View, Alert } from "react-native";
import { router } from "expo-router";

import {
  Container,
  Typography,
  Card,
  SearchBar,
  Icon,
  Loading,
} from "@/src/components/ui";
import Toast from "@/src/components/ui/toast";
import { useToast } from "@/src/hooks/useToast";
import { useAuthStore } from "@/src/stores/authStore";

export default function HomePage() {
  const [searchText, setSearchText] = useState("");
  const { user, logout } = useAuthStore();
  const { toast, hideToast } = useToast();

  const handleSearch = (text: string) => {
    setSearchText(text);
    // TODOMali : buraya arama işlevselliği eklenebilir
  };

  const handleLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkış yapmak istediğinizden emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel",
        },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("🔄 Starting logout process...");

              //logout fonksiyonunu çağır(async/await ile)
              await logout();
              router.replace("/login");
            } catch (error) {
              console.log("❌ Logout error:", error);
              // Kullanıcıya bilgi ver
              router.replace("/login");
              Alert.alert(
                "Uyarı",
                "Çıkış yaparken bir sorun oluştu, ancak oturumunuz sonlandırıldı."
              );
            }
          },
        },
      ]
    );
  };

  const handleProducts = () => {
    router.push("/products");
  };

  const handleBrokers = () => {
    router.push("/brokers");
  };

  const handleStock = () => {
    router.push("/stock");
  };

  return (
    <Container className="bg-white" padding="sm">
      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with User Info and Logout */}
        <View className="flex-row items-start justify-between mb-4 mt-1">
          <View className="flex-1">
            <Typography
              variant="h1"
              weight="bold"
              size="xl"
              className="text-stock-red"
            >
              Stockify
            </Typography>
            {user && (
              <Typography variant="caption" className="text-stock-text mt-1">
                Hoş geldin, {user.username}!
              </Typography>
            )}
          </View>

          {/* Logout Button */}
          <View className="flex-row items-center">
            <Icon
              family="MaterialIcons"
              name="logout"
              size={20}
              color="#E3001B"
              pressable
              onPress={handleLogout}
              containerClassName="p-1 mt-1"
            />
          </View>
        </View>

        {/* SearchBar */}
        <SearchBar
          placeholder="Ara..."
          onSearch={handleSearch}
          className="mb-4"
        />

        {/* Ana Menü Kartları */}
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
