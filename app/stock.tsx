// app/stock.tsx - API entegrasyonu ile güncellenmiş
import React, { useState, useCallback } from "react";
import { ScrollView, View, TouchableOpacity } from "react-native";
import { router, useFocusEffect } from "expo-router";

import { Container, Typography, Card, SearchBar, Icon, Loading, Button } from "@/src/components/ui";
import Toast from "@/src/components/ui/toast";
import { useToast } from "@/src/hooks/useToast";
import logger from "@/src/utils/logger";

// API Hooks
import {
  useInventoryAll,
  useInventoryCritical,
  useInventoryOutOfStock,
  InventoryDisplayItem,
} from "@/src/hooks/api/useInventory";

export default function StockPage() {
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Toast
  const { toast, hideToast } = useToast();

  // API Hooks
  const {
    data: allInventory = [],
    isLoading: isLoadingAll,
    error: errorAll,
    refetch: refetchAll,
  } = useInventoryAll();

  const {
    data: criticalInventory = [],
    isLoading: isLoadingCritical,
    error: errorCritical,
    refetch: refetchCritical,
  } = useInventoryCritical();

  const {
    data: outOfStockInventory = [],
    isLoading: isLoadingOutOfStock,
    error: errorOutOfStock,
    refetch: refetchOutOfStock,
  } = useInventoryOutOfStock();

  // Sayfa focus olduğunda inventory'leri yenile (ürün eklendiğinde güncellenmesi için)
  useFocusEffect(
    useCallback(() => {
      logger.debug("📦 Stock page focused, refreshing inventory data...");
      refetchAll();
      refetchCritical();
      refetchOutOfStock();
    }, [refetchAll, refetchCritical, refetchOutOfStock]),
  );

  // Tab tanımları
  const tabs = [
    { id: "all", label: "Tüm Stoklar" },
    { id: "critical", label: "Kritik Stoklar" },
    { id: "outofstock", label: "Tükenenler" },
  ];

  // Handler functions
  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const handleProductPress = (inventoryItem: InventoryDisplayItem) => {
    logger.debug("Navigating to stock detail for inventory ID:", inventoryItem.inventoryId);
    router.push(`/stockDetail?id=${inventoryItem.inventoryId}`);
  };

  // Loading ve error durumları
  const isLoading =
    isLoadingAll ||
    (activeTab === "critical" && isLoadingCritical) ||
    (activeTab === "outofstock" && isLoadingOutOfStock);
  const error =
    errorAll ||
    (activeTab === "critical" && errorCritical) ||
    (activeTab === "outofstock" && errorOutOfStock);

  // Data filtering
  const getFilteredInventory = (): InventoryDisplayItem[] => {
    let inventoryToFilter: InventoryDisplayItem[] = [];

    switch (activeTab) {
      case "all":
        inventoryToFilter = allInventory;
        break;
      case "critical":
        inventoryToFilter = criticalInventory;
        break;
      case "outofstock":
        inventoryToFilter = outOfStockInventory;
        break;
      default:
        inventoryToFilter = allInventory;
    }

    // Search filter - productName null/undefined kontrolü eklendi
    return inventoryToFilter.filter((item) => {
      if (!searchText.trim()) return true;

      const searchLower = searchText.toLowerCase();
      const productName = item.productName || "";
      const categoryName = item.categoryName || "";

      return (
        productName.toLowerCase().includes(searchLower) ||
        categoryName.toLowerCase().includes(searchLower)
      );
    });
  };

  const filteredInventory = getFilteredInventory();

  // İstatistik hesaplamaları
  const stats = {
    totalProducts: allInventory.length,
    criticalProducts: allInventory.filter((item) => item.isCritical).length,
    outOfStockProducts: allInventory.filter((item) => item.isOutOfStock).length,
    totalValue: allInventory.reduce((sum, item) => sum + item.totalPrice, 0),
  };

  // Retry function
  const handleRetry = () => {
    refetchAll();
    refetchCritical();
    refetchOutOfStock();
  };

  if (error) {
    return (
      <Container className="bg-white flex-1" padding="none" safeTop={false}>
        <View className="flex-1 justify-center items-center -mt-16">
          <Icon family="MaterialIcons" name="error-outline" size={64} color="#E3001B" />
          <Typography variant="h3" weight="bold" className="text-stock-red mt-4 mb-2">
            Bağlantı Hatası
          </Typography>
          <Typography variant="body" className="text-stock-text text-center mb-6">
            Stok verileri yüklenirken bir hata oluştu. Lütfen tekrar deneyiniz.
          </Typography>
          <Button variant="primary" onPress={handleRetry} className="bg-stock-red">
            Tekrar Dene
          </Button>
        </View>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container className="bg-white flex-1" padding="none" safeTop={false}>
        <View className="flex-1 justify-center items-center -mt-16">
          <Loading size="large" />
        </View>
      </Container>
    );
  }

  return (
    <Container className="bg-white" padding="sm" safeTop={false}>
      {/* Toast Notification */}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {/* Search Bar */}
        <SearchBar placeholder="Ürün ara..." onSearch={handleSearch} className="mb-4" />

        {/* İstatistik Kartları - 2x2 Grid */}
        {!isLoading && (
          <View className="mb-4">
            <View className="flex-row mb-3" style={{ gap: 12 }}>
              <Card
                variant="default"
                padding="md"
                className="flex-1 bg-blue-50 border border-blue-200"
                radius="lg"
              >
                <View className="items-center justify-center py-2">
                  <Typography variant="h1" weight="bold" className="text-blue-600 mb-1">
                    {stats.totalProducts}
                  </Typography>
                  <Typography variant="body" weight="medium" className="text-blue-600">
                    Toplam Ürün
                  </Typography>
                </View>
              </Card>

              <Card
                variant="default"
                padding="md"
                className="flex-1 bg-green-50 border border-green-200"
                radius="lg"
              >
                <View className="items-center justify-center py-2">
                  <Typography
                    variant="h1"
                    weight="bold"
                    className="text-green-600 mb-1"
                    numberOfLines={1}
                  >
                    {(stats.totalValue / 1000).toLocaleString("tr-TR", {
                      maximumFractionDigits: 1,
                    })}
                    k ₺
                  </Typography>
                  <Typography variant="body" weight="medium" className="text-green-600">
                    Toplam Değer
                  </Typography>
                </View>
              </Card>
            </View>

            <View className="flex-row" style={{ gap: 12 }}>
              <Card
                variant="default"
                padding="md"
                className="flex-1 bg-yellow-50 border border-yellow-200"
                radius="lg"
              >
                <View className="items-center justify-center py-2">
                  <Typography variant="h1" weight="bold" className="text-yellow-600 mb-1">
                    {stats.criticalProducts}
                  </Typography>
                  <Typography variant="body" weight="medium" className="text-yellow-600">
                    Kritik Stok
                  </Typography>
                </View>
              </Card>

              <Card
                variant="default"
                padding="md"
                className="flex-1 bg-red-50 border border-red-200"
                radius="lg"
              >
                <View className="items-center justify-center py-2">
                  <Typography variant="h1" weight="bold" className="text-red-600 mb-1">
                    {stats.outOfStockProducts}
                  </Typography>
                  <Typography variant="body" weight="medium" className="text-red-600">
                    Tükenen
                  </Typography>
                </View>
              </Card>
            </View>
          </View>
        )}

        {/* Tab Navigation - Ekstre sayfası gibi modern */}
        <View className="mb-4">
          <View
            className="flex-row p-1"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              gap: 6,
            }}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className="flex-1 py-2.5 items-center justify-center"
                style={{
                  backgroundColor: activeTab === tab.id ? "#222222" : "#FFFFFF",
                  borderRadius: 12,
                }}
                activeOpacity={1.0}
              >
                <Typography
                  variant="body"
                  weight="semibold"
                  style={{
                    color: activeTab === tab.id ? "#FFFEFF" : "#73767A",
                    fontSize: 14,
                  }}
                >
                  {tab.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content */}
        {filteredInventory.length > 0 ? (
          <View className="mb-20">
            {filteredInventory.map((item) => (
              <TouchableOpacity
                key={`inventory-${item.inventoryId}`}
                onPress={() => handleProductPress(item)}
                activeOpacity={0.95}
                className="mb-3"
              >
                <Card
                  variant="default"
                  padding="md"
                  className="border border-gray-200"
                  radius="lg"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  {/* Üst Kısım - Ürün Adı ve Durum Badge */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1 mr-3">
                      <Typography variant="body" weight="bold" className="text-gray-900" size="lg">
                        {item.productName}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500 mt-1">
                        {item.categoryName} • {item.inventoryCode}
                      </Typography>
                    </View>
                    <View
                      className={`px-3 py-1.5 rounded-full ${
                        item.isOutOfStock
                          ? "bg-red-100"
                          : item.isCritical
                            ? "bg-yellow-100"
                            : "bg-green-100"
                      }`}
                    >
                      <Typography
                        variant="caption"
                        className={
                          item.isOutOfStock
                            ? "text-red-700"
                            : item.isCritical
                              ? "text-yellow-700"
                              : "text-green-700"
                        }
                        weight="semibold"
                      >
                        {item.statusText}
                      </Typography>
                    </View>
                  </View>

                  {/* Orta Kısım - Stok ve Fiyat Bilgileri */}
                  <View className="flex-row items-center justify-between py-3 px-3 bg-gray-50 rounded-lg mb-3">
                    <View className="flex-1">
                      <Typography variant="caption" className="text-gray-500 mb-1">
                        Stok Miktarı
                      </Typography>
                      <Typography variant="body" weight="bold" className="text-gray-900">
                        {item.productCount.toLocaleString("tr-TR")} adet
                      </Typography>
                    </View>
                    <View className="flex-1 items-center">
                      <Typography variant="caption" className="text-gray-500 mb-1">
                        Birim Fiyat
                      </Typography>
                      <Typography variant="body" weight="bold" className="text-green-600">
                        {item.price.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        ₺
                      </Typography>
                    </View>
                    <View className="flex-1 items-end">
                      <Typography variant="caption" className="text-gray-500 mb-1">
                        Toplam Değer
                      </Typography>
                      <Typography variant="body" weight="bold" className="text-stock-red">
                        {item.totalPrice.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        ₺
                      </Typography>
                    </View>
                  </View>

                  {/* Alt Kısım - Detay İkonu */}
                  <View className="flex-row items-center justify-end">
                    <Typography variant="caption" className="text-gray-500 mr-2">
                      Detayları Gör
                    </Typography>
                    <Icon
                      family="MaterialIcons"
                      name="arrow-forward-ios"
                      size={14}
                      color="#73767A"
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="items-center justify-center py-12">
            {/* Hiç ürün yoksa (inventory boş) */}
            {allInventory.length === 0 && !searchText ? (
              <View className="w-full">
                <View className="items-center p-8 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <View className="w-20 h-20 rounded-full bg-yellow-100 items-center justify-center mb-4">
                    <Icon
                      family="MaterialCommunityIcons"
                      name="package-variant-closed"
                      size={40}
                      color="#EAB308"
                    />
                  </View>
                  <Typography
                    variant="h3"
                    className="text-yellow-900 text-center mb-2"
                    weight="bold"
                  >
                    Stokta Ürün Yok
                  </Typography>
                  <Typography variant="body" className="text-yellow-700 text-center mb-6">
                    Stok takibi yapabilmek için önce ürün eklemeniz gerekiyor.
                  </Typography>
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    className="bg-stock-red"
                    onPress={() => router.push("/products")}
                  >
                    <View className="flex-row items-center justify-center">
                      <Icon
                        family="MaterialIcons"
                        name="add-shopping-cart"
                        size={20}
                        color="#FFFFFF"
                        containerClassName="mr-2"
                      />
                      <Typography className="text-white" weight="semibold">
                        Ürün Ekle
                      </Typography>
                    </View>
                  </Button>
                </View>
              </View>
            ) : (
              /* Arama/Filtreleme sonucu boş */
              <View className="items-center">
                <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                  <Icon
                    family="MaterialCommunityIcons"
                    name="package-variant-closed"
                    size={40}
                    color="#73767A"
                  />
                </View>
                <Typography variant="h3" className="text-gray-900 text-center mb-2" weight="bold">
                  Ürün Bulunamadı
                </Typography>
                <Typography variant="body" className="text-gray-500 text-center">
                  {searchText
                    ? "Arama kriterinize uygun ürün bulunamadı."
                    : activeTab === "critical"
                      ? "Kritik seviyede ürün yok."
                      : activeTab === "outofstock"
                        ? "Tükenen ürün yok."
                        : "Bu kategoride ürün bulunmuyor."}
                </Typography>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </Container>
  );
}
