// app/index.tsx
import React, { useState } from "react";
import { ScrollView, View, Alert } from "react-native";
import { useTranslation } from "react-i18next";
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
import { useAppStore } from "@/src/stores/appStore"; // Bu satır zaten var
import DebugPanel from "@/src/components/ui/debugPanel";

export default function HomePage() {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");
  const { user, logout } = useAuthStore();
  const { resetStore } = useAppStore(); // Reset fonksiyonu ekle
  const { toast, hideToast } = useToast();

  const handleSearch = (text: string) => {
    setSearchText(text);
    console.log("Arama yapılıyor:", text);
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

              // Logout işlemini başlat (artık async)
              await logout();

              console.log("✅ Logout completed, redirecting...");

              // Login sayfasına yönlendir
              router.replace("/login");
            } catch (error) {
              console.log("❌ Logout error:", error);

              // Hata olsa bile login sayfasına yönlendir
              router.replace("/login");

              // Kullanıcıya bilgi ver
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

  // YENİ: Geçici reset fonksiyonu - eski verileri temizlemek için
  const handleResetStore = () => {
    Alert.alert(
      "Verileri Sıfırla",
      "Tüm kategori, ürün ve aracı verilerini silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sıfırla",
          style: "destructive",
          onPress: () => {
            resetStore();
            Alert.alert("Başarılı", "Tüm veriler sıfırlandı.");
          },
        },
      ]
    );
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
      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with User Info and Logout - DEĞİŞTİ */}
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

          {/* Logout ve Reset Butonları - YENİ */}
          <View className="flex-row items-center">
            {/* Reset Button - Geçici */}
            <Icon
              family="MaterialIcons"
              name="refresh"
              size={18}
              color="#E3001B"
              pressable
              onPress={handleResetStore}
              containerClassName="p-1 mt-1 mr-2"
            />

            {/* Logout Button */}
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

        {/* Debug Panel */}
        {/* <DebugPanel /> */}

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
