import React, { useState, useEffect } from "react";
import { ScrollView, View, Alert, TouchableOpacity } from "react-native";

import {
  Container,
  Typography,
  Card,
  SearchBar,
  Icon,
  Button,
  Modal,
  Input,
  Tab,
  BottomSheet,
} from "@/src/components/ui";
import Toast from "@/src/components/ui/toast";
import { useToast } from "@/src/hooks/useToast";
import { useAppStore, Product } from "@/src/stores/appStore";

export default function StockPage() {
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isUpdateBottomSheetVisible, setIsUpdateBottomSheetVisible] =
    useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [updateQuantity, setUpdateQuantity] = useState("");
  const [updateReason, setUpdateReason] = useState("");

  // Global Store
  const {
    getActiveProducts,
    getCriticalProducts,
    getOutOfStockProducts,
    getTotalStockValue,
    updateProductStock,
    stockMovements,
  } = useAppStore();

  // Toast
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Tab tanımları
  const tabs = [
    { id: "all", label: "Tüm Stoklar" },
    { id: "critical", label: "Kritik Stoklar" },
    { id: "outofstock", label: "Tükenenler" },
  ];

  // Helper functions
  const isCriticalStock = (product: Product) => {
    return product.stock > 0 && product.stock <= 50; // Kritik seviye 50
  };

  const isOutOfStock = (product: Product) => {
    return product.stock === 0;
  };

  const getStockStatus = (product: Product) => {
    if (isOutOfStock(product)) {
      return {
        status: "Tükendi",
        color: "bg-red-500",
        textColor: "text-red-700",
      };
    } else if (isCriticalStock(product)) {
      return {
        status: "Kritik",
        color: "bg-yellow-500",
        textColor: "text-yellow-700",
      };
    } else {
      return {
        status: "Normal",
        color: "bg-green-500",
        textColor: "text-green-700",
      };
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const handleUpdateStock = (product: Product) => {
    setSelectedProduct(product);
    setUpdateQuantity(product.stock.toString());
    setUpdateReason("");
    setIsUpdateBottomSheetVisible(true);
  };

  const handleSaveStockUpdate = () => {
    if (!selectedProduct || !updateQuantity.trim()) {
      showError("Lütfen geçerli bir adet girin.");
      return;
    }

    const newStock = parseInt(updateQuantity);
    const oldStock = selectedProduct.stock;

    if (newStock < 0) {
      showError("Stok adedi 0'dan küçük olamaz.");
      return;
    }

    if (isNaN(newStock)) {
      showError("Lütfen geçerli bir sayı girin.");
      return;
    }

    Alert.alert(
      "Stok Güncelle",
      `${selectedProduct.name} ürününün stok adedini ${oldStock} adetten ${newStock} adete güncellemek istediğinizden emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Güncelle",
          onPress: () => {
            try {
              const reason = updateReason || "Manuel stok güncellemesi";
              updateProductStock(selectedProduct.id, newStock, reason);

              handleCloseUpdateBottomSheet();
              showSuccess("Stok başarıyla güncellendi!");
            } catch (error) {
              showError("Stok güncellenirken bir hata oluştu.");
            }
          },
        },
      ]
    );
  };

  const handleCloseUpdateBottomSheet = () => {
    setIsUpdateBottomSheetVisible(false);
    setSelectedProduct(null);
    setUpdateQuantity("");
    setUpdateReason("");
  };

  // Filtering
  const getFilteredProducts = () => {
    const activeProducts = getActiveProducts();

    let filteredByTab: Product[] = [];

    switch (activeTab) {
      case "all":
        filteredByTab = activeProducts;
        break;
      case "critical":
        filteredByTab = getCriticalProducts();
        break;
      case "outofstock":
        filteredByTab = getOutOfStockProducts();
        break;
      default:
        filteredByTab = activeProducts;
    }

    // Search filter
    return filteredByTab.filter((product) =>
      product.name.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const filteredProducts = getFilteredProducts();

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
        <View className="flex-row mb-4 gap-2">
          <Card
            variant="default"
            padding="sm"
            className="flex-1 bg-blue-50 border border-blue-200 h-[90px] justify-center"
            radius="md"
          >
            <View className="items-center">
              <Typography
                variant="caption"
                size="xs"
                className="text-blue-700 mb-1"
                weight="medium"
              >
                TOPLAM DEĞER
              </Typography>
              <Typography
                variant="body"
                size="lg"
                weight="bold"
                className="text-blue-800"
              >
                ₺{getTotalStockValue().toLocaleString()}
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
                variant="caption"
                size="xs"
                className="text-yellow-700 mb-1"
                weight="medium"
              >
                KRİTİK STOK
              </Typography>
              <Typography
                variant="body"
                size="lg"
                weight="bold"
                className="text-yellow-800"
              >
                {getCriticalProducts().length} Ürün
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
              <Typography
                variant="caption"
                size="xs"
                className="text-red-700 mb-1"
                weight="medium"
              >
                TÜKENEN
              </Typography>
              <Typography
                variant="body"
                size="lg"
                weight="bold"
                className="text-red-800"
              >
                {getOutOfStockProducts().length} Ürün
              </Typography>
            </View>
          </Card>
        </View>

        {/* Tab'lar */}
        <Tab
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="pills"
          size="md"
          className="mb-4"
        />

        {/* Ürün Listesi */}
        <View className="mt-3">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product);

            return (
              <Card
                key={product.id}
                variant="default"
                padding="sm"
                className="border border-stock-border mb-3"
                radius="md"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <Typography
                        variant="body"
                        weight="semibold"
                        align="left"
                        className="text-stock-dark flex-1"
                      >
                        {product.name}
                      </Typography>

                      {/* Stok Durumu Badge */}
                      <View
                        className={`px-2 py-1 rounded-full ${
                          stockStatus.status === "Tükendi"
                            ? "bg-red-100"
                            : stockStatus.status === "Kritik"
                            ? "bg-yellow-100"
                            : "bg-green-100"
                        }`}
                      >
                        <Typography
                          variant="caption"
                          size="xs"
                          className={stockStatus.textColor}
                          weight="medium"
                        >
                          {stockStatus.status}
                        </Typography>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Typography
                          variant="caption"
                          size="sm"
                          className="text-stock-text"
                        >
                          Stok: {product.stock} adet
                        </Typography>
                        <Typography
                          variant="caption"
                          size="sm"
                          className="text-stock-text"
                        >
                          Fiyat: ₺{product.price}/adet
                        </Typography>
                        <Typography
                          variant="caption"
                          size="xs"
                          className="text-stock-text"
                        >
                          Kritik Seviye: 50 adet
                        </Typography>
                      </View>

                      <View className="flex-row items-center">
                        <Typography
                          variant="body"
                          weight="bold"
                          className="text-stock-dark mr-3"
                        >
                          ₺{(product.stock * product.price).toLocaleString()}
                        </Typography>

                        <Icon
                          family="MaterialIcons"
                          name="edit"
                          size={18}
                          color="#67686A"
                          pressable
                          onPress={() => handleUpdateStock(product)}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>

        {/* Boş durum */}
        {filteredProducts.length === 0 && (
          <Card
            variant="default"
            padding="lg"
            className="border border-stock-border"
            radius="md"
          >
            <Typography
              variant="body"
              align="center"
              className="text-stock-text"
            >
              {activeTab === "critical"
                ? "Kritik seviyede ürün bulunamadı."
                : activeTab === "outofstock"
                ? "Tükenen ürün bulunamadı."
                : "Ürün bulunamadı."}
            </Typography>
          </Card>
        )}
      </ScrollView>

      {/* Stok Güncelleme BottomSheet */}
      <BottomSheet
        visible={isUpdateBottomSheetVisible}
        onClose={handleCloseUpdateBottomSheet}
        title="Stok Güncelle"
        height="medium"
      >
        {selectedProduct && (
          <View
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* Üst kısım - İçerik */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 4 }}
            >
              <View className="bg-stock-gray p-4 rounded-lg mb-4">
                <Typography
                  variant="body"
                  weight="semibold"
                  className="text-stock-dark mb-2"
                >
                  {selectedProduct.name}
                </Typography>
                <Typography variant="caption" className="text-stock-text">
                  Mevcut Stok: {selectedProduct.stock} adet
                </Typography>
                <Typography variant="caption" className="text-stock-text">
                  Kritik Seviye: 50 adet
                </Typography>
              </View>

              <Input
                label="Yeni Stok Adedi"
                value={updateQuantity}
                onChangeText={setUpdateQuantity}
                placeholder="0"
                variant="outlined"
                keyboardType="numeric"
                className="mb-3"
              />

              <Input
                label="Açıklama (İsteğe Bağlı)"
                value={updateReason}
                onChangeText={setUpdateReason}
                placeholder="Stok güncelleme sebebi..."
                variant="outlined"
                className="mb-3"
              />

              {updateQuantity && !isNaN(parseInt(updateQuantity)) && (
                <View className="bg-blue-50 p-4 rounded-lg mb-4">
                  <Typography
                    variant="caption"
                    className="text-blue-700"
                    weight="medium"
                  >
                    Değişiklik:{" "}
                    {parseInt(updateQuantity) - selectedProduct.stock} adet
                  </Typography>
                  <Typography variant="caption" className="text-blue-700">
                    Yeni Değer: ₺
                    {(
                      parseInt(updateQuantity) * selectedProduct.price
                    ).toLocaleString()}
                  </Typography>
                </View>
              )}
            </ScrollView>

            {/* Alt kısım - Butonlar */}
            <View className="mt-2 mb-2">
              <Button
                variant="outline"
                className="w-full border-stock-border mb-2"
                onPress={handleCloseUpdateBottomSheet}
              >
                <Typography className="text-stock-dark">İptal</Typography>
              </Button>
              <Button
                variant="primary"
                className="w-full bg-stock-red"
                onPress={handleSaveStockUpdate}
              >
                <Typography className="text-white">Güncelle</Typography>
              </Button>
            </View>
          </View>
        )}
      </BottomSheet>
    </Container>
  );
}
