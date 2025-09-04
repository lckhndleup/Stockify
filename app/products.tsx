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
import { useAppStore, Product, Category } from "@/src/stores/appStore";
import {
  categorySchema,
  productSchema,
  editCategorySchema,
} from "@/src/validations/salesValidation";

// Dropdown Component - DÜZELTILDI
interface DropdownProps {
  label?: string;
  value?: string;
  placeholder?: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  className?: string;
  onAddCategory?: () => void;
  showAddButton?: boolean;
}

function Dropdown({
  label,
  value,
  placeholder = "Seçiniz...",
  options,
  onSelect,
  className = "",
  onAddCategory,
  showAddButton = false,
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
          onPress={() => {
            // DÜZELTME: Kategori yoksa ve add butonu varsa direkt kategori eklemeye yönlendir
            if (options.length === 0 && showAddButton && onAddCategory) {
              onAddCategory();
            } else {
              setIsOpen(!isOpen);
            }
          }}
          activeOpacity={0.8}
        >
          <Typography
            variant="body"
            className={selectedOption ? "text-stock-dark" : "text-stock-text"}
          >
            {/* DÜZELTME: Kategori yoksa "Kategori Ekle" göster */}
            {options.length === 0 && showAddButton
              ? "Kategori Ekle"
              : selectedOption
              ? selectedOption.label
              : placeholder}
          </Typography>
          <Icon
            family="MaterialIcons"
            name={
              // DÜZELTME: Kategori yoksa "add" ikonu göster
              options.length === 0 && showAddButton
                ? "add"
                : isOpen
                ? "keyboard-arrow-up"
                : "keyboard-arrow-down"
            }
            size={20}
            color={
              options.length === 0 && showAddButton ? "#E3001B" : "#6D706F"
            }
          />
        </TouchableOpacity>

        {/* DÜZELTME: Sadece kategori varken dropdown açılsın */}
        {isOpen && options.length > 0 && (
          <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-stock-border rounded-lg shadow-lg z-50">
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 200 }}
            >
              {/* Kategori ekleme butonu */}
              {showAddButton && onAddCategory && (
                <>
                  <TouchableOpacity
                    className="px-4 py-3 border-b border-stock-border bg-stock-gray"
                    onPress={() => {
                      setIsOpen(false);
                      onAddCategory();
                    }}
                    activeOpacity={0.8}
                  >
                    <View className="flex-row items-center">
                      <Icon
                        family="MaterialIcons"
                        name="add"
                        size={18}
                        color="#E3001B"
                        containerClassName="mr-2"
                      />
                      <Typography
                        variant="body"
                        className="text-stock-red"
                        weight="semibold"
                      >
                        Kategori Yönetimi
                      </Typography>
                    </View>
                  </TouchableOpacity>
                  {options.length > 0 && (
                    <View className="h-1 bg-stock-border" />
                  )}
                </>
              )}

              {options.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  className={`px-4 py-3 ${
                    index !== options.length - 1
                      ? "border-b border-stock-border"
                      : ""
                  } ${value === option.value ? "bg-stock-gray" : "bg-white"}`}
                  onPress={() => {
                    onSelect(option.value);
                    setIsOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Typography
                    variant="body"
                    className={
                      value === option.value
                        ? "text-stock-red"
                        : "text-stock-dark"
                    }
                    weight={value === option.value ? "semibold" : "normal"}
                  >
                    {option.label}
                  </Typography>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

export default function ProductsPage() {
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  // Product Modal States
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [isEditProductModalVisible, setIsEditProductModalVisible] =
    useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Category Modal States
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isEditCategoryModalVisible, setIsEditCategoryModalVisible] =
    useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Product Form States
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [productName, setProductName] = useState("");
  const [productStock, setProductStock] = useState("");
  const [productPrice, setProductPrice] = useState("");

  // Category Form States
  const [categoryName, setCategoryName] = useState("");
  const [categoryTaxRate, setCategoryTaxRate] = useState("");

  // Validation Error States
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Global Store
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    getActiveProducts,
    addCategory,
    updateCategory,
    deleteCategory,
    getActiveCategories,
    getCategoryById,
    getProductsByCategoryId,
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

  // Product Actions
  const handleAddProduct = () => {
    const activeCategories = getActiveCategories();
    if (activeCategories.length === 0) {
      Alert.alert(
        "Kategori Gerekli",
        "Ürün eklemek için önce kategori eklemelisiniz. Kategori ekleme sayfasına gitmek ister misiniz?",
        [
          { text: "İptal", style: "cancel" },
          {
            text: "Kategori Yönetimi",
            onPress: () => router.push("/categories"),
          },
        ]
      );
      return;
    }
    setIsProductModalVisible(true);
  };

  const handleProductModalClose = () => {
    setIsProductModalVisible(false);
    setSelectedCategoryId("");
    setProductName("");
    setProductStock("");
    setProductPrice("");
    setValidationErrors({});
  };

  const validateProductForm = () => {
    try {
      productSchema.parse({
        name: productName,
        categoryId: selectedCategoryId,
        stock: productStock,
        price: productPrice,
      });
      setValidationErrors({});
      return true;
    } catch (error: any) {
      const errors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        errors[err.path[0]] = err.message;
      });
      setValidationErrors(errors);
      return false;
    }
  };

  const handleConfirmAddProduct = () => {
    if (!validateProductForm()) {
      showError("Lütfen form hatalarını düzeltin.");
      return;
    }

    const stock = parseInt(productStock);
    const price = parseFloat(productPrice);
    const category = getCategoryById(selectedCategoryId);

    if (!category) {
      showError("Seçili kategori bulunamadı.");
      return;
    }

    Alert.alert(
      "Ürün Ekle",
      `"${productName}" ürününü eklemek istediğinizden emin misiniz?\n\nKategori: ${category.name}\nStok: ${stock} adet\nFiyat: ₺${price}/adet`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Ekle",
          style: "default",
          onPress: () => {
            try {
              addProduct({
                name: productName,
                categoryId: selectedCategoryId,
                stock: stock,
                price: price,
              });

              handleProductModalClose();
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
    setSelectedCategoryId(product.categoryId);
    setProductName(product.name);
    setProductStock(product.stock.toString());
    setProductPrice(product.price.toString());
    setValidationErrors({});
    setIsEditProductModalVisible(true);
  };

  const handleUpdateProduct = () => {
    if (!validateProductForm() || !editingProduct) {
      showError("Lütfen form hatalarını düzeltin.");
      return;
    }

    const stock = parseInt(productStock);
    const price = parseFloat(productPrice);
    const category = getCategoryById(selectedCategoryId);

    if (!category) {
      showError("Seçili kategori bulunamadı.");
      return;
    }

    Alert.alert(
      "Ürün Güncelle",
      `"${productName}" ürününü güncellemek istediğinizden emin misiniz?\n\nKategori: ${category.name}\nStok: ${stock} adet\nFiyat: ₺${price}/adet`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Güncelle",
          style: "default",
          onPress: () => {
            try {
              updateProduct(editingProduct.id, {
                name: productName,
                categoryId: selectedCategoryId,
                stock: stock,
                price: price,
              });

              handleEditProductModalClose();
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
        { text: "İptal", style: "cancel" },
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

  const handleEditProductModalClose = () => {
    setIsEditProductModalVisible(false);
    setEditingProduct(null);
    setSelectedCategoryId("");
    setProductName("");
    setProductStock("");
    setProductPrice("");
    setValidationErrors({});
  };

  // Category Actions - DÜZELTME: Categories sayfasına yönlendirme
  const handleCategoryManagement = () => {
    // Modal açıksa kapat
    if (isProductModalVisible) {
      setIsProductModalVisible(false);
      setSelectedCategoryId("");
      setProductName("");
      setProductStock("");
      setProductPrice("");
      setValidationErrors({});
    }
    if (isEditProductModalVisible) {
      setIsEditProductModalVisible(false);
      setEditingProduct(null);
      setSelectedCategoryId("");
      setProductName("");
      setProductStock("");
      setProductPrice("");
      setValidationErrors({});
    }

    // Categories sayfasına yönlendir
    setTimeout(() => {
      router.push("/categories");
    }, 100);
  };

  const handleAddCategory = () => {
    setIsCategoryModalVisible(true);
  };

  const handleCategoryModalClose = () => {
    setIsCategoryModalVisible(false);
    setCategoryName("");
    setCategoryTaxRate("");
    setValidationErrors({});
  };

  const validateCategoryForm = () => {
    try {
      categorySchema.parse({
        name: categoryName,
        taxRate: categoryTaxRate,
      });
      setValidationErrors({});
      return true;
    } catch (error: any) {
      const errors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        errors[err.path[0]] = err.message;
      });
      setValidationErrors(errors);
      return false;
    }
  };

  const handleConfirmAddCategory = () => {
    if (!validateCategoryForm()) {
      showError("Lütfen form hatalarını düzeltin.");
      return;
    }

    const taxRate = parseFloat(categoryTaxRate);

    Alert.alert(
      "Kategori Ekle",
      `"${categoryName}" kategorisini eklemek istediğinizden emin misiniz?\n\nKDV Oranı: %${taxRate}`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Ekle",
          style: "default",
          onPress: () => {
            try {
              addCategory({
                name: categoryName,
                taxRate: taxRate,
              });

              handleCategoryModalClose();
              showSuccess("Kategori başarıyla eklendi!");
            } catch (error) {
              showError("Kategori eklenirken bir hata oluştu.");
            }
          },
        },
      ]
    );
  };

  // Filtering and Data
  const activeCategories = getActiveCategories();
  const categoryOptions = activeCategories.map((category) => ({
    label: `${category.name} (KDV: %${category.taxRate})`,
    value: category.id,
  }));

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
          {filteredProducts.map((product) => {
            const category = getCategoryById(product.categoryId);
            return (
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
                      Kategori: {category?.name || "Kategori bulunamadı"} •
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
            );
          })}
        </View>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <View className="items-center justify-center py-12">
            <Icon
              family="MaterialCommunityIcons"
              name="package-variant"
              size={64}
              color="#ECECEC"
              containerClassName="mb-4"
            />
            <Typography variant="body" className="text-stock-text text-center">
              {searchText.trim()
                ? "Arama kriterinize uygun ürün bulunamadı."
                : activeTab === "active"
                ? "Henüz aktif ürün eklenmemiş."
                : "Pasif ürün bulunamadı."}
            </Typography>
          </View>
        )}

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
        visible={isProductModalVisible}
        onClose={handleProductModalClose}
        title="Yeni Ürün Ekle"
        size="lg"
        className="bg-white mx-6"
      >
        <View>
          {/* Kategori Seçimi - DÜZELTME: handleCategoryManagement kullan */}
          <Dropdown
            label="Kategori *"
            value={selectedCategoryId}
            placeholder={
              activeCategories.length === 0
                ? "Kategori Ekle"
                : "Kategori seçiniz..."
            }
            options={categoryOptions}
            onSelect={setSelectedCategoryId}
            onAddCategory={handleCategoryManagement}
            showAddButton={true}
            className="mb-4"
          />
          {validationErrors.categoryId && (
            <Typography variant="caption" className="text-stock-red mt-1 mb-3">
              {validationErrors.categoryId}
            </Typography>
          )}

          {/* Ürün Adı */}
          <Input
            label="Ürün Adı *"
            value={productName}
            onChangeText={setProductName}
            placeholder="Ürün adını girin..."
            variant="outlined"
            error={validationErrors.name}
            className="mb-4"
          />

          {/* Stok Adedi */}
          <Input
            label="Stok Adedi *"
            value={productStock}
            onChangeText={setProductStock}
            placeholder="Kaç adet var?"
            variant="outlined"
            keyboardType="numeric"
            error={validationErrors.stock}
            className="mb-4"
          />

          {/* Adet Fiyatı */}
          <Input
            label="Adet Fiyatı (₺) *"
            value={productPrice}
            onChangeText={setProductPrice}
            placeholder="Bir adet kaç TL?"
            variant="outlined"
            keyboardType="numeric"
            error={validationErrors.price}
            className="mb-4"
          />

          {/* Butonlar */}
          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleConfirmAddProduct}
            >
              <Typography className="text-white">Ekle</Typography>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="border-stock-border"
              onPress={handleProductModalClose}
            >
              <Typography className="text-stock-dark">İptal</Typography>
            </Button>
          </View>
        </View>
      </Modal>

      {/* Ürün Düzenleme Modal'ı */}
      <Modal
        visible={isEditProductModalVisible}
        onClose={handleEditProductModalClose}
        title="Ürün Düzenle"
        size="lg"
        className="bg-white mx-6"
      >
        <View>
          {/* Kategori Seçimi - DÜZELTME: handleCategoryManagement kullan */}
          <Dropdown
            label="Kategori *"
            value={selectedCategoryId}
            placeholder="Kategori seçiniz..."
            options={categoryOptions}
            onSelect={setSelectedCategoryId}
            onAddCategory={handleCategoryManagement}
            showAddButton={true}
            className="mb-4"
          />
          {validationErrors.categoryId && (
            <Typography variant="caption" className="text-stock-red mt-1 mb-3">
              {validationErrors.categoryId}
            </Typography>
          )}

          {/* Ürün Adı */}
          <Input
            label="Ürün Adı *"
            value={productName}
            onChangeText={setProductName}
            placeholder="Ürün adını girin..."
            variant="outlined"
            error={validationErrors.name}
            className="mb-4"
          />

          {/* Stok Adedi */}
          <Input
            label="Stok Adedi *"
            value={productStock}
            onChangeText={setProductStock}
            placeholder="Kaç adet var?"
            variant="outlined"
            keyboardType="numeric"
            error={validationErrors.stock}
            className="mb-4"
          />

          {/* Adet Fiyatı */}
          <Input
            label="Adet Fiyatı (₺) *"
            value={productPrice}
            onChangeText={setProductPrice}
            placeholder="Bir adet kaç TL?"
            variant="outlined"
            keyboardType="numeric"
            error={validationErrors.price}
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
              onPress={handleEditProductModalClose}
            >
              <Typography className="text-stock-dark">İptal</Typography>
            </Button>
          </View>
        </View>
      </Modal>

      {/* Kategori Ekleme Modal'ı - YedEK olarak kalabilir */}
      <Modal
        visible={isCategoryModalVisible}
        onClose={handleCategoryModalClose}
        title="Yeni Kategori Ekle"
        size="lg"
        className="bg-white mx-6"
      >
        <View>
          <Input
            label="Kategori Adı *"
            value={categoryName}
            onChangeText={setCategoryName}
            placeholder="Kategori adını girin..."
            variant="outlined"
            error={validationErrors.name}
            className="mb-4"
          />

          <Input
            label="KDV Oranı (%) *"
            value={categoryTaxRate}
            onChangeText={setCategoryTaxRate}
            placeholder="0-100 arası değer (örn: 18)"
            variant="outlined"
            keyboardType="numeric"
            error={validationErrors.taxRate}
            helperText="KDV oranını yüzde cinsinden girin"
            className="mb-4"
          />

          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleConfirmAddCategory}
            >
              <Typography className="text-white">Ekle</Typography>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="border-stock-border"
              onPress={handleCategoryModalClose}
            >
              <Typography className="text-stock-dark">İptal</Typography>
            </Button>
          </View>
        </View>
      </Modal>
    </Container>
  );
}
