// app/stock.tsx - API entegrasyonu ile güncellenmiş
import React, { useState } from "react";
import { ScrollView, View, TouchableOpacity } from "react-native";
import { router } from "expo-router";

import {
  Container,
  Typography,
  Card,
  SearchBar,
  Icon,
  Tab,
  Loading,
  Button,
} from "@/src/components/ui";
import Toast from "@/src/components/ui/toast";
import { useToast } from "@/src/hooks/useToast";

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
  const { toast, showSuccess, showError, hideToast } = useToast();

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
    console.log(
      "Navigating to stock detail for inventory ID:",
      inventoryItem.inventoryId
    );
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

    // Search filter
    return inventoryToFilter.filter((item) =>
      item.productName.toLowerCase().includes(searchText.toLowerCase())
    );
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
        <View className="flex-1 justify-center items-center">
          <Icon
            family="MaterialIcons"
            name="error-outline"
            size={64}
            color="#E3001B"
          />
          <Typography
            variant="h3"
            weight="bold"
            className="text-stock-red mt-4 mb-2"
          >
            Bağlantı Hatası
          </Typography>
          <Typography
            variant="body"
            className="text-stock-text text-center mb-6"
          >
            Stok verileri yüklenirken bir hata oluştu. Lütfen tekrar deneyiniz.
          </Typography>
          <Button
            variant="primary"
            onPress={handleRetry}
            className="bg-stock-red"
          >
            Tekrar Dene
          </Button>
        </View>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container className="bg-white flex-1" padding="none" safeTop={false}>
        <View className="flex-1 justify-center items-center">
          <Loading size="large" />
        </View>
      </Container>
    );
  }

  return (
    <Container className="bg-white" padding="sm" safeTop={false}>
      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {/* Search Bar */}
        <SearchBar
          placeholder="Ürün ara..."
          onSearch={handleSearch}
          className="mb-3"
        />

        {/* İstatistikler */}
        {!isLoading && (
          <View className="flex-row mb-4 gap-2">
            <Card
              variant="default"
              padding="sm"
              className="flex-1 bg-blue-50 border border-blue-200 h-[90px] justify-center"
              radius="md"
            >
              <View className="items-center">
                <Typography
                  variant="h3"
                  weight="bold"
                  className="text-blue-600"
                >
                  {stats.totalProducts}
                </Typography>
                <Typography
                  variant="caption"
                  className="text-blue-500 text-center"
                >
                  Toplam Ürün
                </Typography>
              </View>
            </Card>

            <Card
              variant="default"
              padding="sm"
              className="flex-1 bg-green-50 border border-green-200 h-[90px] justify-center"
              radius="md"
            >
              <View className="items-center">
                <Typography
                  variant="h3"
                  weight="bold"
                  className="text-green-600"
                >
                  {stats.totalValue.toLocaleString("tr-TR", {
                    maximumFractionDigits: 0,
                  })}{" "}
                  ₺
                </Typography>
                <Typography
                  variant="caption"
                  className="text-green-500 text-center"
                >
                  Toplam Değer
                </Typography>
              </View>
            </Card>

            <Card
              variant="default"
              padding="sm"
              className="flex-1 bg-yellow-50 border border-yellow-200 h-[90px] justify-center"
              radius="md"
            >
              <View className="items-center">
                <Typography
                  variant="h3"
                  weight="bold"
                  className="text-yellow-600"
                >
                  {stats.criticalProducts}
                </Typography>
                <Typography
                  variant="caption"
                  className="text-yellow-500 text-center"
                >
                  Kritik Stok
                </Typography>
              </View>
            </Card>

            <Card
              variant="default"
              padding="sm"
              className="flex-1 bg-red-50 border border-red-200 h-[90px] justify-center"
              radius="md"
            >
              <View className="items-center">
                <Typography variant="h3" weight="bold" className="text-red-600">
                  {stats.outOfStockProducts}
                </Typography>
                <Typography
                  variant="caption"
                  className="text-red-500 text-center"
                >
                  Tükenen
                </Typography>
              </View>
            </Card>
          </View>
        )}

        {/* Tab Navigation */}
        <View className="mb-4">
          <Tab
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="pills"
          />
        </View>

        {/* Content */}
        {filteredInventory.length > 0 ? (
          <View className="space-y-3 mb-6">
            {filteredInventory.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleProductPress(item)}
                activeOpacity={0.7}
              >
                <Card
                  variant="default"
                  padding="md"
                  className="border border-stock-border"
                  radius="md"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                      {/* Ürün Bilgileri */}
                      <View className="flex-row items-center mb-2">
                        <Typography
                          variant="body"
                          weight="semibold"
                          className="text-stock-dark flex-1"
                        >
                          {item.productName}
                        </Typography>
                        <View
                          className={`px-2 py-1 rounded-full ${
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
                            weight="medium"
                          >
                            {item.statusText}
                          </Typography>
                        </View>
                      </View>

                      {/* Alt Bilgiler */}
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Typography
                            variant="caption"
                            className="text-stock-text"
                          >
                            {item.categoryName} • {item.inventoryCode}
                          </Typography>
                          <View className="flex-row items-center mt-1">
                            <Typography
                              variant="caption"
                              className="text-stock-dark"
                              weight="medium"
                            >
                              {item.productCount.toLocaleString("tr-TR")}{" "}
                              adet
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-stock-text mx-1"
                            >
                              •
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-green-600"
                              weight="medium"
                            >
                              {item.price.toLocaleString("tr-TR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              TL
                            </Typography>
                          </View>
                        </View>

                        {/* Toplam Değer */}
                        <View className="items-end">
                          <Typography
                            variant="caption"
                            className="text-stock-text"
                          >
                            Toplam Değer
                          </Typography>
                          <Typography
                            variant="body"
                            weight="bold"
                            className="text-stock-red"
                          >
                            {item.totalPrice.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            TL
                          </Typography>
                        </View>
                      </View>
                    </View>

                    {/* Arrow Icon */}
                    <Icon
                      family="MaterialIcons"
                      name="arrow-forward-ios"
                      size={16}
                      color="#73767A"
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Card
            variant="default"
            padding="lg"
            className="border border-stock-border"
            radius="md"
          >
            <View className="items-center">
              <Icon
                family="MaterialCommunityIcons"
                name="package-variant-closed"
                size={48}
                color="#73767A"
              />
              <Typography
                variant="body"
                className="text-stock-text text-center mt-3"
              >
                {searchText
                  ? "Arama kriterlerine uygun ürün bulunamadı."
                  : activeTab === "critical"
                  ? "Kritik seviyede ürün bulunamadı."
                  : activeTab === "outofstock"
                  ? "Tükenen ürün bulunamadı."
                  : "Ürün bulunamadı."}
              </Typography>
            </View>
          </Card>
        )}
      </ScrollView>
    </Container>
  );
}
