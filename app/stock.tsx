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

// Dropdown Component
interface DropdownProps {
  label?: string;
  value?: string;
  placeholder?: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  className?: string;
}

function Dropdown({
  label,
  value,
  placeholder = "Seçiniz...",
  options,
  onSelect,
  className = "",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View className={`w-full ${className}`}>
      {label && (
        <Typography
          variant="caption"
          weight="medium"
          className="mb-2 text-stock-dark"
        >
          {label}
        </Typography>
      )}

      <View className="relative">
        <TouchableOpacity
          className="flex-row items-center justify-between border border-stock-border rounded-lg px-4 py-3 bg-white"
          onPress={() => setIsOpen(!isOpen)}
          activeOpacity={0.8}
        >
          <Typography
            variant="body"
            className={selectedOption ? "text-stock-dark" : "text-stock-text"}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </Typography>
          <Icon
            family="MaterialIcons"
            name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={20}
            color="#6D706F"
          />
        </TouchableOpacity>

        {isOpen && (
          <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-stock-border rounded-lg shadow-lg z-50">
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                className="px-4 py-3 border-b border-stock-border last:border-b-0"
                onPress={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Typography variant="body" className="text-stock-dark">
                  {option.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// Veri yapıları
interface StockProduct {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  unit: string;
  criticalLevel: number; // Kritik stok seviyesi
  isActive: boolean;
}

interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: "in" | "out"; // giriş veya çıkış
  quantity: number;
  reason: string; // "ürün eklendi", "aracıya verildi", "stok güncellendi"
  date: string;
}

export default function StockPage() {
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isUpdateBottomSheetVisible, setIsUpdateBottomSheetVisible] =
    useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StockProduct | null>(
    null
  );
  const [updateQuantity, setUpdateQuantity] = useState("");
  const [updateReason, setUpdateReason] = useState("");

  // Mock data - Products with stock info
  const [products, setProducts] = useState<StockProduct[]>([
    {
      id: "1",
      name: "Antep Fıstığı (Çiğ)",
      category: "Kuruyemiş",
      stock: 45,
      price: 850,
      unit: "kg",
      criticalLevel: 10,
      isActive: true,
    },
    {
      id: "2",
      name: "Ceviz İçi",
      category: "Kuruyemiş",
      stock: 8, // Kritik seviyede
      price: 320,
      unit: "kg",
      criticalLevel: 10,
      isActive: true,
    },
    {
      id: "3",
      name: "Badem (Kabuklu)",
      category: "Kuruyemiş",
      stock: 78,
      price: 290,
      unit: "kg",
      criticalLevel: 15,
      isActive: true,
    },
    {
      id: "4",
      name: "Kaju",
      category: "Kuruyemiş",
      stock: 5, // Kritik seviyede
      price: 450,
      unit: "kg",
      criticalLevel: 10,
      isActive: true,
    },
    {
      id: "5",
      name: "Fındık İçi",
      category: "Kuruyemiş",
      stock: 0, // Stokta yok
      price: 380,
      unit: "kg",
      criticalLevel: 12,
      isActive: true,
    },
  ]);

  const [stockMovements, setStockMovements] = useState<StockMovement[]>([
    {
      id: "1",
      productId: "2",
      productName: "Ceviz İçi",
      type: "out",
      quantity: 15,
      reason: "Ahmet Yılmaz aracısına verildi",
      date: "2024-08-19",
    },
  ]);

  // Tab tanımları
  const tabs = [
    { id: "all", label: "Tüm Stoklar" },
    { id: "critical", label: "Kritik Stoklar" },
    { id: "outofstock", label: "Tükenenler" },
  ];

  // Product options for dropdown
  const productOptions = products
    .filter((p) => p.isActive)
    .map((product) => ({
      label: `${product.name} (Mevcut: ${product.stock} ${product.unit})`,
      value: product.id,
    }));

  // Helper functions
  const isCriticalStock = (product: StockProduct) => {
    return product.stock > 0 && product.stock <= product.criticalLevel;
  };

  const isOutOfStock = (product: StockProduct) => {
    return product.stock === 0;
  };

  const getStockStatus = (product: StockProduct) => {
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

  const calculateTotalStockValue = () => {
    return products.reduce(
      (total, product) => total + product.stock * product.price,
      0
    );
  };

  const getCriticalProductsCount = () => {
    return products.filter(isCriticalStock).length;
  };

  const getOutOfStockCount = () => {
    return products.filter(isOutOfStock).length;
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const handleUpdateStock = (product: StockProduct) => {
    setSelectedProduct(product);
    setUpdateQuantity(product.stock.toString());
    setUpdateReason("");
    setIsUpdateBottomSheetVisible(true);
  };

  const handleSaveStockUpdate = () => {
    if (!selectedProduct || !updateQuantity.trim()) {
      Alert.alert("Hata", "Lütfen geçerli bir miktar girin.");
      return;
    }

    const newStock = parseInt(updateQuantity);
    const oldStock = selectedProduct.stock;

    if (newStock < 0) {
      Alert.alert("Hata", "Stok miktarı 0'dan küçük olamaz.");
      return;
    }

    Alert.alert(
      "Stok Güncelle",
      `${selectedProduct.name} ürününün stok miktarını ${oldStock} ${selectedProduct.unit}'dan ${newStock} ${selectedProduct.unit}'a güncellemek istediğinizden emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Güncelle",
          onPress: () => {
            // Stok güncelleme
            setProducts((prev) =>
              prev.map((p) =>
                p.id === selectedProduct.id ? { ...p, stock: newStock } : p
              )
            );

            // Stok hareketi kaydet
            const movement: StockMovement = {
              id: Date.now().toString(),
              productId: selectedProduct.id,
              productName: selectedProduct.name,
              type: newStock > oldStock ? "in" : "out",
              quantity: Math.abs(newStock - oldStock),
              reason: updateReason || "Manuel stok güncellemesi",
              date: new Date().toISOString().split("T")[0],
            };

            setStockMovements((prev) => [movement, ...prev]);
            handleCloseUpdateBottomSheet();
            Alert.alert("Başarılı", "Stok güncellendi!");
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
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchText.toLowerCase());

    let matchesTab = true;
    switch (activeTab) {
      case "all":
        matchesTab = product.isActive;
        break;
      case "critical":
        matchesTab = product.isActive && isCriticalStock(product);
        break;
      case "outofstock":
        matchesTab = product.isActive && isOutOfStock(product);
        break;
      default:
        matchesTab = true;
    }

    return matchesSearch && matchesTab;
  });

  return (
    <Container className="bg-white" padding="sm" safeTop={false}>
      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {/* Search Bar */}
        <SearchBar
          placeholder="Ürün ara..."
          onSearch={handleSearch}
          className="mb-3"
        />

        {/* İstatistikler */}
        <View className="flex-row mb-4">
          <View className="flex-1 mr-2">
            <Card
              variant="default"
              padding="sm"
              className="bg-blue-50 border border-blue-200"
              radius="md"
            >
              <Typography
                variant="caption"
                size="xs"
                className="text-blue-700"
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
                ₺{calculateTotalStockValue().toLocaleString()}
              </Typography>
            </Card>
          </View>

          <View className="flex-1 mx-1">
            <Card
              variant="default"
              padding="sm"
              className="bg-yellow-50 border border-yellow-200"
              radius="md"
            >
              <Typography
                variant="caption"
                size="xs"
                className="text-yellow-700"
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
                {getCriticalProductsCount()} Ürün
              </Typography>
            </Card>
          </View>

          <View className="flex-1 ml-2">
            <Card
              variant="default"
              padding="sm"
              className="bg-red-50 border border-red-200"
              radius="md"
            >
              <Typography
                variant="caption"
                size="xs"
                className="text-red-700"
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
                {getOutOfStockCount()} Ürün
              </Typography>
            </Card>
          </View>
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
                          Stok: {product.stock} {product.unit}
                        </Typography>
                        <Typography
                          variant="caption"
                          size="sm"
                          className="text-stock-text"
                        >
                          Fiyat: ₺{product.price}/{product.unit}
                        </Typography>
                        <Typography
                          variant="caption"
                          size="xs"
                          className="text-stock-text"
                        >
                          Kritik Seviye: {product.criticalLevel} {product.unit}
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
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "space-between",
            }}
          >
            <View>
              <View className="bg-stock-gray p-4 rounded-lg mb-4">
                <Typography
                  variant="body"
                  weight="semibold"
                  className="text-stock-dark mb-2"
                >
                  {selectedProduct.name}
                </Typography>
                <Typography variant="caption" className="text-stock-text">
                  Mevcut Stok: {selectedProduct.stock} {selectedProduct.unit}
                </Typography>
                <Typography variant="caption" className="text-stock-text">
                  Kritik Seviye: {selectedProduct.criticalLevel}{" "}
                  {selectedProduct.unit}
                </Typography>
              </View>

              <Input
                label={`Yeni Stok Miktarı (${selectedProduct.unit})`}
                value={updateQuantity}
                onChangeText={setUpdateQuantity}
                placeholder="0"
                variant="outlined"
                keyboardType="numeric"
                className="mb-4"
              />

              <Input
                label="Açıklama (İsteğe Bağlı)"
                value={updateReason}
                onChangeText={setUpdateReason}
                placeholder="Stok güncelleme sebebi..."
                variant="outlined"
                className="mb-4"
              />

              {updateQuantity && (
                <View className="bg-blue-50 p-4 rounded-lg mb-6">
                  <Typography
                    variant="caption"
                    className="text-blue-700"
                    weight="medium"
                  >
                    Değişiklik:{" "}
                    {parseInt(updateQuantity) - selectedProduct.stock}{" "}
                    {selectedProduct.unit}
                  </Typography>
                  <Typography variant="caption" className="text-blue-700">
                    Yeni Değer: ₺
                    {(
                      parseInt(updateQuantity) * selectedProduct.price
                    ).toLocaleString()}
                  </Typography>
                </View>
              )}
            </View>

            <View className="mt-6">
              <Button
                variant="outline"
                className="w-full border-stock-border mb-6"
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
          </ScrollView>
        )}
      </BottomSheet>
    </Container>
  );
}
