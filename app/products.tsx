import React, { useState } from "react";
import { ScrollView, View, Alert } from "react-native";
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
        <View className="flex-row items-center justify-between border border-stock-border rounded-lg px-4 py-3 bg-white">
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
            pressable
            onPress={() => setIsOpen(!isOpen)}
          />
        </View>

        {isOpen && (
          <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-stock-border rounded-lg shadow-lg z-50">
            {options.map((option) => (
              <View
                key={option.value}
                className={`border-b border-stock-border last:border-b-0`}
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start px-4 py-3 rounded-none"
                  onPress={() => {
                    onSelect(option.value);
                    setIsOpen(false);
                  }}
                >
                  <Typography variant="body" className="text-stock-dark">
                    {option.label}
                  </Typography>
                </Button>
              </View>
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
}

export default function ProductsPage() {
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [productName, setProductName] = useState("");

  // Mock ürünler listesi - gerçek uygulamada state management ile gelecek
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Antep Fıstığı (Çiğ)",
      category: "kuruyemis",
      stock: 45,
      price: 850,
      unit: "kg",
    },
    {
      id: "2",
      name: "Ceviz İçi",
      category: "kuruyemis",
      stock: 23,
      price: 320,
      unit: "kg",
    },
    {
      id: "3",
      name: "Badem (Kabuklu)",
      category: "kuruyemis",
      stock: 78,
      price: 290,
      unit: "kg",
    },
    {
      id: "4",
      name: "Kaju",
      category: "kuruyemis",
      stock: 12,
      price: 450,
      unit: "kg",
    },
  ]);

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
  };

  const handleConfirmAdd = () => {
    if (!selectedCategory || !productName.trim()) {
      Alert.alert("Hata", "Lütfen kategori seçin ve ürün adını girin.");
      return;
    }

    Alert.alert(
      "Ürün Ekle",
      `"${productName}" ürününü eklemek istediğinizden emin misiniz?`,
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
              stock: 0,
              price: 0,
              unit: "kg",
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

  const handleEditProduct = (productName: string) => {
    console.log("Ürün düzenle:", productName);
  };

  const handleDeleteProduct = (productName: string) => {
    console.log("Ürün sil:", productName);
  };

  // Arama filtreleme
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Container className="bg-white" padding="none" safeTop={false}>
      <ScrollView showsVerticalScrollIndicator={false} className="px-6">
        {/* Search ve Add Butonu - Boşluk düzeltildi */}
        <View className="flex-row items-center mb-3 mt-4">
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
            containerClassName="bg-gray-100 px-4 py-3 rounded-lg" // SearchBar ile aynı padding
          />
        </View>

        {/* Ürün Listesi */}
        <View>
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
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
                <View className="flex-row items-center">
                  <Icon
                    family="MaterialIcons"
                    name="edit"
                    size={18}
                    color="#67686A"
                    pressable
                    onPress={() => handleEditProduct(product.name)}
                    containerClassName="mr-2"
                  />
                  <Icon
                    family="MaterialIcons"
                    name="delete"
                    size={18}
                    color="#E3001B"
                    pressable
                    onPress={() => handleDeleteProduct(product.name)}
                  />
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Yeni Ürün Ekle Butonu */}
        <View className="mt-4 mb-6">
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
    </Container>
  );
}
