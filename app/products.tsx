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

// Dropdown Component - Tüm alan tıklanabilir
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

// Ürün interface'i
interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  unit: string;
  isActive: boolean; // Aktif/Pasif durumu
}

export default function ProductsPage() {
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("active"); // Tab state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [productName, setProductName] = useState("");
  const [productStock, setProductStock] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Mock ürünler listesi - gerçek uygulamada state management ile gelecek
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Antep Fıstığı (Çiğ)",
      category: "kuruyemis",
      stock: 45,
      price: 850,
      unit: "kg",
      isActive: true,
    },
    {
      id: "2",
      name: "Ceviz İçi",
      category: "kuruyemis",
      stock: 23,
      price: 320,
      unit: "kg",
      isActive: true,
    },
    {
      id: "3",
      name: "Badem (Kabuklu)",
      category: "kuruyemis",
      stock: 78,
      price: 290,
      unit: "kg",
      isActive: true,
    },
    {
      id: "4",
      name: "Kaju",
      category: "kuruyemis",
      stock: 12,
      price: 450,
      unit: "kg",
      isActive: true,
    },
  ]);

  // Tab tanımları
  const tabs = [
    { id: "active", label: "Aktif Ürünler" },
    { id: "passive", label: "Pasif Ürünler" },
    { id: "passisddsve", label: "Pasif Ürünler" },
    { id: "passisddsssve", label: "Pasif Ürünler" },
  ];

  const handleSearch = (text: string) => {
    setSearchText(text);
    console.log("Ürün arama:", text);
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
      Alert.alert("Hata", "Lütfen kategori seçin ve ürün adını girin.");
      return;
    }

    const stock = productStock ? parseInt(productStock) : 0;
    const price = productPrice ? parseFloat(productPrice) : 0;

    Alert.alert(
      "Ürün Ekle",
      `"${productName}" ürününü eklemek istediğinizden emin misiniz?\n\nStok: ${stock} kg\nFiyat: ₺${price}/kg`,
      [
        {
          text: "İptal",
          style: "cancel",
        },
        {
          text: "Ekle",
          style: "default",
          onPress: () => {
            // Yeni ürün oluştur
            const newProduct: Product = {
              id: Date.now().toString(),
              name: productName,
              category: selectedCategory,
              stock: stock,
              price: price,
              unit: "kg",
              isActive: true, // Yeni ürünler varsayılan olarak aktif
            };

            // Listeye en başa ekle
            setProducts((prev) => [newProduct, ...prev]);

            // Modal'ı kapat ve formu temizle
            handleModalClose();

            Alert.alert("Başarılı", "Ürün başarıyla eklendi!");
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
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }

    const stock = productStock ? parseInt(productStock) : 0;
    const price = productPrice ? parseFloat(productPrice) : 0;

    Alert.alert(
      "Ürün Güncelle",
      `"${productName}" ürününü güncellemek istediğinizden emin misiniz?\n\nYeni Bilgiler:\nStok: ${stock} kg\nFiyat: ₺${price}/kg`,
      [
        {
          text: "İptal",
          style: "cancel",
        },
        {
          text: "Güncelle",
          style: "default",
          onPress: () => {
            // Ürünü güncelle
            setProducts((prev) =>
              prev.map((p) =>
                p.id === editingProduct.id
                  ? {
                      ...p,
                      name: productName,
                      category: selectedCategory,
                      stock: stock,
                      price: price,
                    }
                  : p
              )
            );

            // Modal'ı kapat ve formu temizle
            handleEditModalClose();

            Alert.alert("Başarılı", "Ürün başarıyla güncellendi!");
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
            // Ürünü pasif yap
            setProducts((prev) =>
              prev.map((p) =>
                p.id === product.id ? { ...p, isActive: false } : p
              )
            );
            Alert.alert("Başarılı", "Ürün silindi!");
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
      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {/* Search ve Add Butonu - Homepage gibi spacing */}
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
                    Stok: {product.stock} {product.unit} • Fiyat: ₺
                    {product.price}/{product.unit}
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
            placeholder="Ürün adını girin..."
            variant="outlined"
            className="mb-4"
          />

          {/* Stok Miktarı */}
          <Input
            label="Stok Miktarı (kg)"
            value={productStock}
            onChangeText={setProductStock}
            placeholder="0"
            variant="outlined"
            keyboardType="numeric"
            className="mb-4"
          />

          {/* Fiyat */}
          <Input
            label="Fiyat (₺/kg)"
            value={productPrice}
            onChangeText={setProductPrice}
            placeholder="0"
            variant="outlined"
            keyboardType="numeric"
            className="mb-4"
          />

          {/* Butonlar - Alt Alta */}
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

          {/* Stok Miktarı */}
          <Input
            label="Stok Miktarı (kg)"
            value={productStock}
            onChangeText={setProductStock}
            placeholder="0"
            variant="outlined"
            keyboardType="numeric"
            className="mb-4"
          />

          {/* Fiyat */}
          <Input
            label="Fiyat (₺/kg)"
            value={productPrice}
            onChangeText={setProductPrice}
            placeholder="0"
            variant="outlined"
            keyboardType="numeric"
            className="mb-4"
          />

          {/* Butonlar - Alt Alta */}
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
