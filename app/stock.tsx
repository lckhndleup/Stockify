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
                className="mb-5"
                style={{
                  transform: [{ scale: 1 }],
                }}
              >
                <View
                  className="bg-white rounded-3xl overflow-hidden"
                  style={{
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.18,
                    shadowRadius: 20,
                    elevation: 12,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                  }}
                >
                  {/* Header Section */}
                  <View
                    className="px-5 pt-5 pb-4"
                    style={{
                      backgroundColor: "rgba(249, 250, 251, 0.5)",
                    }}
                  >
                    <View className="flex-row items-start justify-between mb-2.5">
                      <View className="flex-1 mr-4">
                        <Typography variant="h2" weight="bold" className="text-gray-900 mb-2">
                          {item.productName}
                        </Typography>
                        <View className="flex-row items-center gap-2">
                          <View
                            className="px-2.5 py-1 rounded-lg bg-white"
                            style={{
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.05,
                              shadowRadius: 3,
                              elevation: 1,
                            }}
                          >
                            <Typography variant="caption" className="text-gray-600" weight="medium">
                              {item.categoryName}
                            </Typography>
                          </View>
                          <Typography variant="caption" className="text-gray-400">
                            {item.inventoryCode}
                          </Typography>
                        </View>
                      </View>
                      <View
                        className={`px-4 py-2 rounded-xl ${
                          item.isOutOfStock
                            ? "bg-red-500"
                            : item.isCritical
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{
                          shadowColor: item.isOutOfStock
                            ? "#DC2626"
                            : item.isCritical
                              ? "#D97706"
                              : "#059669",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.4,
                          shadowRadius: 8,
                          elevation: 6,
                        }}
                      >
                        <Typography variant="caption" className="text-white" weight="bold">
                          {item.statusText}
                        </Typography>
                      </View>
                    </View>
                  </View>

                  {/* Divider with gradient effect */}
                  <View
                    style={{
                      height: 1,
                      backgroundColor: "#E5E7EB",
                      opacity: 0.4,
                    }}
                  />

                  {/* Stats Grid */}
                  <View className="px-6 py-6 bg-white">
                    <View className="flex-row">
                      {/* Stok Bilgisi */}
                      <View className="flex-1 pr-5">
                        <View
                          className="mb-2 px-3 py-1.5 rounded-lg self-start"
                          style={{
                            backgroundColor: "rgba(249, 250, 251, 0.8)",
                          }}
                        >
                          <Typography variant="caption" className="text-gray-600" weight="semibold">
                            STOK MİKTARI
                          </Typography>
                        </View>
                        <View className="flex-row items-baseline mb-1">
                          <Typography
                            variant="h1"
                            weight="bold"
                            style={{
                              color: "#111827",
                              fontSize: 36,
                              letterSpacing: -1,
                            }}
                          >
                            {item.productCount.toLocaleString("tr-TR")}
                          </Typography>
                          <Typography variant="body" className="text-gray-400 ml-2" weight="medium">
                            adet
                          </Typography>
                        </View>
                      </View>

                      {/* Vertical Divider with gradient */}
                      <View
                        style={{
                          width: 2,
                          backgroundColor: "#E5E7EB",
                          marginHorizontal: 8,
                          opacity: 0.6,
                        }}
                      />

                      {/* Fiyat Bilgileri */}
                      <View className="flex-1 pl-5">
                        {/* Birim Fiyat */}
                        <View className="mb-5">
                          <View
                            className="mb-2 px-3 py-1.5 rounded-lg self-start"
                            style={{
                              backgroundColor: "rgba(16, 185, 129, 0.08)",
                            }}
                          >
                            <Typography
                              variant="caption"
                              className="text-green-700"
                              weight="semibold"
                            >
                              BİRİM FİYAT
                            </Typography>
                          </View>
                          <Typography
                            variant="h3"
                            weight="bold"
                            style={{
                              color: "#059669",
                              fontSize: 20,
                            }}
                          >
                            {item.price.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            ₺
                          </Typography>
                        </View>

                        {/* Toplam Değer */}
                        <View>
                          <View
                            className="mb-2 px-3 py-1.5 rounded-lg self-start"
                            style={{
                              backgroundColor: "rgba(239, 68, 68, 0.08)",
                            }}
                          >
                            <Typography
                              variant="caption"
                              className="text-red-700"
                              weight="semibold"
                            >
                              TOPLAM DEĞER
                            </Typography>
                          </View>
                          <Typography
                            variant="h3"
                            weight="bold"
                            style={{
                              color: "#DC2626",
                              fontSize: 20,
                            }}
                          >
                            {item.totalPrice.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            ₺
                          </Typography>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Footer */}
                  <View
                    className="px-6 py-4 flex-row items-center justify-between"
                    style={{
                      backgroundColor: "rgba(249, 250, 251, 0.6)",
                      borderTopWidth: 1,
                      borderTopColor: "rgba(229, 231, 235, 0.4)",
                    }}
                  >
                    <Typography
                      variant="body"
                      className="text-gray-800"
                      weight="semibold"
                      style={{
                        fontSize: 15,
                      }}
                    >
                      Detayları Görüntüle
                    </Typography>
                    <View
                      className="bg-gray-900 rounded-full"
                      style={{
                        width: 28,
                        height: 28,
                        justifyContent: "center",
                        alignItems: "center",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <Icon family="MaterialIcons" name="arrow-forward" size={18} color="#FFFFFF" />
                    </View>
                  </View>
                </View>
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
