import React, { useState } from "react";
import { ScrollView, View, Alert, TouchableOpacity } from "react-native";
import { router } from "expo-router";

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
} from "@/src/components/ui";
import Toast from "@/src/components/ui/toast";
import { useToast } from "@/src/hooks/useToast";
import { useAppStore, Product } from "@/src/stores/appStore";

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

// Kategoriler
const CATEGORIES = [
  { label: "Kuruyemiş", value: "kuruyemis" },
  { label: "Çerez", value: "cerez" },
  { label: "Baharat", value: "baharat" },
  { label: "Kuru Meyve", value: "kuru_meyve" },
];

export default function ProductsPage() {
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [productName, setProductName] = useState("");
  const [productStock, setProductStock] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Global Store
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getActiveProducts,
  } = useAppStore();

  // Toast
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Tab tanımları
  const tabs = [
    { id: "active", label: "Aktif Ürünler" },
    { id: "passive", label: "Pasif Ürünler" },
  ];

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const handleAddProduct = () => {
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedCategory("");
    setProductName("");
    setProductStock("");
    setProductPrice("");
  };

  const handleConfirmAdd = () => {
    if (!selectedCategory || !productName.trim()) {
      showError("Lütfen kategori seçin ve ürün adını girin.");
      return;
    }

    const stock = productStock ? parseInt(productStock) : 0;
    const price = productPrice ? parseFloat(productPrice) : 0;

    if (stock < 0) {
      showError("Stok adedi 0'dan küçük olamaz.");
      return;
    }

    if (price <= 0) {
      showError("Fiyat 0'dan büyük olmalıdır.");
      return;
    }

    Alert.alert(
      "Ürün Ekle",
      `"${productName}" ürününü eklemek istediğinizden emin misiniz?\n\nStok: ${stock} adet\nFiyat: ₺${price}/adet`,
      [
        {
          text: "İptal",
          style: "cancel",
        },
        {
          text: "Ekle",
          style: "default",
          onPress: () => {
            try {
              addProduct({
                name: productName,
                category: selectedCategory,
                stock: stock,
                price: price,
              });

              handleModalClose();
              showSuccess("Ürün başarıyla eklendi!");
            } catch (error) {
              showError("Ürün eklenirken bir hata oluştu.");
            }
          },
        },
      ]
    );
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setSelectedCategory(product.category);
    setProductName(product.name);
    setProductStock(product.stock.toString());
    setProductPrice(product.price.toString());
    setIsEditModalVisible(true);
  };

  const handleUpdateProduct = () => {
    if (!selectedCategory || !productName.trim() || !editingProduct) {
      showError("Lütfen tüm alanları doldurun.");
      return;
    }

    const stock = productStock ? parseInt(productStock) : 0;
    const price = productPrice ? parseFloat(productPrice) : 0;

    if (stock < 0) {
      showError("Stok adedi 0'dan küçük olamaz.");
      return;
    }

    if (price <= 0) {
      showError("Fiyat 0'dan büyük olmalıdır.");
      return;
    }

    Alert.alert(
      "Ürün Güncelle",
      `"${productName}" ürününü güncellemek istediğinizden emin misiniz?\n\nYeni Bilgiler:\nStok: ${stock} adet\nFiyat: ₺${price}/adet`,
      [
        {
          text: "İptal",
          style: "cancel",
        },
        {
          text: "Güncelle",
          style: "default",
          onPress: () => {
            try {
              updateProduct(editingProduct.id, {
                name: productName,
                category: selectedCategory,
                stock: stock,
                price: price,
              });

              handleEditModalClose();
              showSuccess("Ürün başarıyla güncellendi!");
            } catch (error) {
              showError("Ürün güncellenirken bir hata oluştu.");
            }
          },
        },
      ]
    );
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      "Ürün Sil",
      `"${product.name}" ürününü silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`,
      [
        {
          text: "İptal",
          style: "cancel",
        },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => {
            try {
              deleteProduct(product.id);
              showSuccess("Ürün başarıyla silindi!");
            } catch (error) {
              showError("Ürün silinirken bir hata oluştu.");
            }
          },
        },
      ]
    );
  };

  const handleEditModalClose = () => {
    setIsEditModalVisible(false);
    setEditingProduct(null);
    setSelectedCategory("");
    setProductName("");
    setProductStock("");
    setProductPrice("");
  };

  // Arama ve tab filtreleme
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesTab =
      activeTab === "active" ? product.isActive : !product.isActive;
    return matchesSearch && matchesTab;
  });

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
            containerClassName="bg-gray-100 px-4 py-3 rounded-lg"
          />
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
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              variant="default"
              padding="sm"
              className={`border border-stock-border mb-2 ${
                !product.isActive ? "opacity-60" : ""
              }`}
              radius="md"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Typography
                    variant="body"
                    weight="semibold"
                    align="left"
                    className="text-stock-dark"
                  >
                    {product.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    size="sm"
                    className="text-stock-text mt-1"
                  >
                    Stok: {product.stock} adet • Fiyat: ₺{product.price}/adet
                  </Typography>
                </View>

                {/* Sadece aktif ürünlerde edit/delete göster */}
                {product.isActive && (
                  <View className="flex-row items-center">
                    <Icon
                      family="MaterialIcons"
                      name="edit"
                      size={18}
                      color="#67686A"
                      pressable
                      onPress={() => handleEditProduct(product)}
                      containerClassName="mr-2"
                    />
                    <Icon
                      family="MaterialIcons"
                      name="delete"
                      size={18}
                      color="#E3001B"
                      pressable
                      onPress={() => handleDeleteProduct(product)}
                    />
                  </View>
                )}
              </View>
            </Card>
          ))}
        </View>

        {/* Yeni Ürün Ekle Butonu - Sadece Aktif Tab'da */}
        {activeTab === "active" && (
          <View className="mt-4 mb-6">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="bg-stock-red"
              onPress={handleAddProduct}
              leftIcon={
                <Icon
                  family="MaterialIcons"
                  name="add"
                  size={20}
                  color="white"
                />
              }
            >
              Yeni Ürün Ekle
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Ürün Ekleme Modal'ı */}
      <Modal
        visible={isModalVisible}
        onClose={handleModalClose}
        title="Yeni Ürün Ekle"
        size="lg"
        className="bg-white mx-6"
      >
        <View>
          {/* Kategori Seçimi */}
          <Dropdown
            label="Kategori"
            value={selectedCategory}
            placeholder="Kategori seçiniz..."
            options={CATEGORIES}
            onSelect={setSelectedCategory}
            className="mb-4"
          />

          {/* Ürün Adı */}
          <Input
            label="Ürün Adı"
            value={productName}
            onChangeText={setProductName}
            placeholder="Ürün adını girin... (örn: Antep Fıstığı Paketi 200g)"
            variant="outlined"
            className="mb-4"
          />

          {/* Stok Adedi */}
          <Input
            label="Stok Adedi"
            value={productStock}
            onChangeText={setProductStock}
            placeholder="Kaç adet var?"
            variant="outlined"
            keyboardType="numeric"
            className="mb-4"
          />

          {/* Adet Fiyatı */}
          <Input
            label="Adet Fiyatı (₺)"
            value={productPrice}
            onChangeText={setProductPrice}
            placeholder="Bir adet kaç TL?"
            variant="outlined"
            keyboardType="numeric"
            className="mb-4"
          />

          {/* Butonlar */}
          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleConfirmAdd}
            >
              <Typography className="text-white">Ekle</Typography>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="border-stock-border"
              onPress={handleModalClose}
            >
              <Typography className="text-stock-dark">İptal</Typography>
            </Button>
          </View>
        </View>
      </Modal>

      {/* Ürün Düzenleme Modal'ı */}
      <Modal
        visible={isEditModalVisible}
        onClose={handleEditModalClose}
        title="Ürün Düzenle"
        size="lg"
        className="bg-white mx-6"
      >
        <View>
          {/* Kategori Seçimi */}
          <Dropdown
            label="Kategori"
            value={selectedCategory}
            placeholder="Kategori seçiniz..."
            options={CATEGORIES}
            onSelect={setSelectedCategory}
            className="mb-4"
          />

          {/* Ürün Adı */}
          <Input
            label="Ürün Adı"
            value={productName}
            onChangeText={setProductName}
            placeholder="Ürün adını girin..."
            variant="outlined"
            className="mb-4"
          />

          {/* Stok Adedi */}
          <Input
            label="Stok Adedi"
            value={productStock}
            onChangeText={setProductStock}
            placeholder="Kaç adet var?"
            variant="outlined"
            keyboardType="numeric"
            className="mb-4"
          />

          {/* Adet Fiyatı */}
          <Input
            label="Adet Fiyatı (₺)"
            value={productPrice}
            onChangeText={setProductPrice}
            placeholder="Bir adet kaç TL?"
            variant="outlined"
            keyboardType="numeric"
            className="mb-4"
          />

          {/* Butonlar */}
          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleUpdateProduct}
            >
              <Typography className="text-white">Güncelle</Typography>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="border-stock-border"
              onPress={handleEditModalClose}
            >
              <Typography className="text-stock-dark">İptal</Typography>
            </Button>
          </View>
        </View>
      </Modal>
    </Container>
  );
}
