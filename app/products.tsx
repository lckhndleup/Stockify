// app/products.tsx
import React, { useState, useEffect } from "react";
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
  Loading,
} from "@/src/components/ui";
import Toast from "@/src/components/ui/toast";
import { useToast } from "@/src/hooks/useToast";
import type { DropdownProps } from "@/src/types/ui";
import {
  useActiveCategories,
  useCreateCategory,
} from "@/src/hooks/api/useCategories";

// Backend hooks - UPDATED: usePassiveProducts eklendi
import {
  useActiveProducts,
  usePassiveProducts, // YENİ EKLENEN
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useSearchProducts,
} from "@/src/hooks/api/useProducts";
import {
  ProductFormData,
  ProductUpdateData,
  ProductDisplayItem,
} from "@/src/types/product";
import { CategoryDisplayItem } from "@/src/types/category";

// Basit validation - sadece kategori ve ürün adı için
const validateProductForm = (categoryId: string, name: string) => {
  const errors: Record<string, string> = {};

  if (!categoryId) {
    errors.categoryId = "Kategori seçimi zorunludur";
  }

  if (!name.trim()) {
    errors.name = "Ürün adı zorunludur";
  } else if (name.trim().length < 2) {
    errors.name = "Ürün adı en az 2 karakter olmalıdır";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

// Dropdown Component - AYNEN KORUNDU
function Dropdown({
  label,
  value,
  placeholder = "Seçiniz...",
  options,
  onSelect,
  className = "",
  onAddCategory,
  showAddButton = false,
  loading = false,
  error,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  // Loading state
  if (loading) {
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
        <View className="flex-row items-center justify-center border border-stock-border rounded-lg px-4 py-3 bg-gray-100">
          <Loading size="small" />
        </View>
        {error && (
          <Typography variant="caption" className="mt-1 text-stock-red">
            {error}
          </Typography>
        )}
      </View>
    );
  }

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
            {options.length === 0 && showAddButton
              ? "Kategori Ekle"
              : selectedOption
              ? selectedOption.label
              : placeholder}
          </Typography>
          <Icon
            family="MaterialIcons"
            name={
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

        {isOpen && options.length > 0 && (
          <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-stock-border rounded-lg shadow-lg z-50">
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 200 }}
            >
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

      {error && (
        <Typography variant="caption" className="mt-1 text-stock-red">
          {error}
        </Typography>
      )}
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
  const [editingProduct, setEditingProduct] =
    useState<ProductDisplayItem | null>(null);

  // Category Modal States
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isEditCategoryModalVisible, setIsEditCategoryModalVisible] =
    useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CategoryDisplayItem | null>(null);

  // Product Form States - sadece kategori ve ürün adı
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [productName, setProductName] = useState("");

  // Category Form States
  const [categoryName, setCategoryName] = useState("");
  const [taxRate, setTaxRate] = useState("");

  // Validation Error States
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // BACKEND HOOKS
  // React Query Hook - BACKEND CATEGORIES
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    error: categoriesErrorMessage,
    refetch: refetchCategories,
  } = useActiveCategories();

  // React Query Hook - BACKEND PRODUCTS - UPDATED: aktif ve pasif ayrı hook'lar
  const {
    data: activeProducts = [],
    isLoading: activeProductsLoading,
    isError: activeProductsError,
    error: activeProductsErrorMessage,
    refetch: refetchActiveProducts,
  } = useActiveProducts();

  const {
    data: passiveProducts = [],
    isLoading: passiveProductsLoading,
    isError: passiveProductsError,
    error: passiveProductsErrorMessage,
    refetch: refetchPassiveProducts,
  } = usePassiveProducts();

  // Search Products - UPDATED: status parametresi eklendi
  const {
    data: searchResults = [],
    isLoading: searchLoading,
    refetch: refetchSearch,
  } = useSearchProducts(
    searchText,
    activeTab === "active" ? "ACTIVE" : "PASSIVE",
    { enabled: false }
  );

  // Backend Mutations
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const createCategoryMutation = useCreateCategory();

  // Toast
  const { toast, showSuccess, showError, hideToast } = useToast();

  // LOG ACTIVE PRODUCTS FROM BACKEND API
  useEffect(() => {
    if (activeProducts && activeProducts.length > 0) {
      console.log(
        "🛍️ Backend Active Products:",
        JSON.stringify(activeProducts, null, 2)
      );
    }
  }, [activeProducts]);

  // Tab tanımları
  const tabs = [
    { id: "active", label: "Aktif Ürünler" },
    { id: "passive", label: "Pasif Ürünler" },
  ];

  const handleSearch = (text: string) => {
    setSearchText(text);

    // Arama yapıldığında backend'den ara - UPDATED: aktif tab'a göre status değişir
    if (text.trim().length > 0) {
      refetchSearch();
    }
  };

  // Product Actions - BACKEND ENTEGRELİ HALE GETİRİLDİ
  const handleAddProduct = () => {
    // Kategoriler yükleniyor mu kontrol et
    if (categoriesLoading) {
      showError("Kategoriler yükleniyor, lütfen bekleyiniz.");
      return;
    }

    // Kategori hatası var mı kontrol et
    if (categoriesError) {
      Alert.alert(
        "Kategori Hatası",
        "Kategoriler yüklenemedi. Kategori yönetimi sayfasına gitmek ister misiniz?",
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

    // Kategori yoksa uyarı göster
    if (categories.length === 0) {
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
    setValidationErrors({});
  };

  // Backend kategoriden kategori bulma
  const getCategoryByIdFromAPI = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId);
  };

  const handleConfirmAddProduct = async () => {
    // Sadece kategori ve ürün adı validation'ı
    const validation = validateProductForm(selectedCategoryId, productName);
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      showError("Lütfen form hatalarını düzeltin.");
      return;
    }

    const category = getCategoryByIdFromAPI(selectedCategoryId);

    if (!category) {
      showError("Seçili kategori bulunamadı.");
      return;
    }

    Alert.alert(
      "Ürün Ekle",
      `"${productName}" ürününü eklemek istediğinizden emin misiniz?\n\nKategori: ${category.name}`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Ekle",
          style: "default",
          onPress: async () => {
            try {
              // Backend'e gönder - sadece categoryId ve name
              const productFormData: ProductFormData = {
                categoryId: Number(selectedCategoryId),
                name: productName.trim(),
              };

              console.log("💾 Saving product to backend:", productFormData);

              const result = await createProductMutation.mutateAsync(
                productFormData
              );

              if (result && result.productId) {
                handleProductModalClose();
                showSuccess("Ürün başarıyla eklendi!");

                // Aktif ürünleri yenile
                refetchActiveProducts();
              } else {
                throw new Error("Backend'den geçersiz yanıt alındı");
              }
            } catch (error) {
              console.error("❌ Product save error:", error);
              showError("Ürün eklenirken bir hata oluştu!");
            }
          },
        },
      ]
    );
  };

  const handleEditProduct = (product: ProductDisplayItem) => {
    setEditingProduct(product);
    setSelectedCategoryId(product.categoryId);
    setProductName(product.name);
    setValidationErrors({});
    setIsEditProductModalVisible(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) {
      showError("Düzenlenecek ürün bulunamadı.");
      return;
    }

    // Sadece kategori ve ürün adı validation'ı
    const validation = validateProductForm(selectedCategoryId, productName);
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      showError("Lütfen form hatalarını düzeltin.");
      return;
    }

    const category = getCategoryByIdFromAPI(selectedCategoryId);

    if (!category) {
      showError("Seçili kategori bulunamadı.");
      return;
    }

    Alert.alert(
      "Ürün Güncelle",
      `"${productName}" ürününü güncellemek istediğinizden emin misiniz?\n\nKategori: ${category.name}`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Güncelle",
          style: "default",
          onPress: async () => {
            try {
              // Backend'e gönder - sadece categoryId ve name
              const productUpdateData: ProductUpdateData = {
                productId: Number(editingProduct.id),
                categoryId: Number(selectedCategoryId),
                name: productName.trim(),
              };

              console.log("✏️ Updating product in backend:", productUpdateData);

              await updateProductMutation.mutateAsync(productUpdateData);

              handleEditProductModalClose();
              showSuccess("Ürün başarıyla güncellendi!");

              // Tab'a göre ilgili ürünleri yenile
              if (activeTab === "active") {
                refetchActiveProducts();
              } else {
                refetchPassiveProducts();
              }
            } catch (error) {
              console.error("❌ Product update error:", error);
              showError("Ürün güncellenirken bir hata oluştu!");
            }
          },
        },
      ]
    );
  };

  const handleDeleteProduct = (product: ProductDisplayItem) => {
    Alert.alert(
      "Ürün Sil",
      `"${product.name}" ürününü silmek istediğinizden emin misiniz?\n\nBu işlem ürünü pasif duruma getirecektir.`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("🗑️ Deleting product from backend:", product.id);

              // Backend'den sil (status PASSIVE yapılır)
              await deleteProductMutation.mutateAsync(Number(product.id));

              showSuccess("Ürün başarıyla silindi!");

              // Her iki listeyi de yenile (aktif listeden çıkar, pasif listeye girer)
              refetchActiveProducts();
              refetchPassiveProducts();
            } catch (error) {
              console.error("❌ Product delete error:", error);
              showError("Ürün silinirken bir hata oluştu!");
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
    setValidationErrors({});
  };

  // Category Actions - Categories sayfasına yönlendirme
  const handleCategoryManagement = () => {
    // Modal açıksa kapat
    if (isProductModalVisible) {
      setIsProductModalVisible(false);
      setSelectedCategoryId("");
      setProductName("");
      setValidationErrors({});
    }
    if (isEditProductModalVisible) {
      setIsEditProductModalVisible(false);
      setEditingProduct(null);
      setSelectedCategoryId("");
      setProductName("");
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
    setTaxRate("");
    setValidationErrors({});
  };

  const validateCategoryForm = () => {
    const errors: Record<string, string> = {};

    if (!categoryName.trim()) {
      errors.name = "Kategori adı zorunludur";
    }

    if (!taxRate.trim() || isNaN(Number(taxRate))) {
      errors.taxRate = "Geçerli bir KDV oranı giriniz";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmAddCategory = () => {
    if (!validateCategoryForm()) {
      showError("Lütfen form hatalarını düzeltin.");
      return;
    }

    const taxRateNumber = parseFloat(taxRate);

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
              createCategoryMutation.mutate({
                name: categoryName,
                taxRate: taxRateNumber,
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

  // Filtering and Data - UPDATED: aktif/pasif tab'a göre farklı data source
  const categoryOptions = categories.map((category) => ({
    label: `${category.name} (KDV: %${category.taxRate})`,
    value: category.id,
  }));

  // PRODUCTS DATA SOURCE - UPDATED: Tab'a göre farklı backend data
  const getFilteredProducts = () => {
    let sourceProducts = [];

    // Tab'a göre veri kaynağını belirle
    if (activeTab === "active") {
      sourceProducts = activeProducts;
    } else {
      sourceProducts = passiveProducts;
    }

    // Arama sonuçları varsa onları kullan
    if (searchText.trim().length > 0 && searchResults.length > 0) {
      sourceProducts = searchResults;
    }

    // Search'e göre filtrele
    return sourceProducts.filter((product) =>
      product.name.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const filteredProducts = getFilteredProducts();

  // Loading state - UPDATED: tab'a göre loading
  const isLoading =
    categoriesLoading ||
    (activeTab === "active" ? activeProductsLoading : passiveProductsLoading);

  if (isLoading) {
    return (
      <Container className="bg-white flex-1" padding="none" safeTop={false}>
        <View className="flex-1 justify-center items-center -mt-20">
          <Loading size="large" />
        </View>
      </Container>
    );
  }

  // Error state için kategori yüklenirken
  if (
    categoriesError &&
    !categories.length &&
    (isProductModalVisible || isEditProductModalVisible)
  ) {
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
        />
        <View className="items-center justify-center py-12">
          <Icon
            family="MaterialIcons"
            name="error-outline"
            size={64}
            color="#EF4444"
            containerClassName="mb-4"
          />
          <Typography variant="body" className="text-red-600 text-center mb-4">
            Kategoriler yüklenirken hata oluştu
          </Typography>
          <Typography
            variant="caption"
            className="text-gray-500 text-center mb-4"
          >
            {categoriesErrorMessage?.message || "Bilinmeyen hata"}
          </Typography>
          <Button variant="primary" onPress={() => refetchCategories()}>
            Tekrar Dene
          </Button>
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
        {/* Search ve Add Butonu */}
        <View className="flex-row items-center mb-3">
          <SearchBar
            placeholder="Ürün ara..."
            onSearch={handleSearch}
            className="flex-1 mr-3"
          />
          {/* Sadece aktif tab'da add butonu göster */}
          {activeTab === "active" && (
            <Icon
              family="MaterialIcons"
              name="add"
              size={28}
              color="#E3001B"
              pressable
              onPress={handleAddProduct}
              containerClassName="bg-gray-100 px-4 py-3 rounded-lg"
            />
          )}
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
        {searchLoading && searchText.trim().length > 0 ? (
          <View className="items-center py-8">
            <Loading size="large" />
          </View>
        ) : (
          <View className="mt-3">
            {filteredProducts.map((product) => {
              // Backend kategoriden kategori bilgisi al
              const category = getCategoryByIdFromAPI(product.categoryId);
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
                        Kategori: {category?.name || "Kategori bulunamadı"}
                        {/* Pasif ürünlerde durum bilgisi ekleyelim */}
                        {activeTab === "passive" && (
                          <Typography
                            variant="caption"
                            className="text-red-600 ml-2"
                          >
                            • Pasif
                          </Typography>
                        )}
                      </Typography>
                    </View>

                    {/* Sadece aktif ürünlerde edit/delete göster */}
                    {activeTab === "active" && (
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
        )}

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
              loading={createProductMutation.isPending}
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

      {/* Ürün Ekleme Modal'ı - Sadece kategori ve ürün adı */}
      <Modal
        visible={isProductModalVisible}
        onClose={handleProductModalClose}
        title="Yeni Ürün Ekle"
        size="lg"
        className="bg-white mx-6"
      >
        <View>
          {/* Kategori Seçimi */}
          <Dropdown
            label="Kategori *"
            value={selectedCategoryId}
            placeholder={
              categories.length === 0 ? "Kategori Ekle" : "Kategori seçiniz..."
            }
            options={categoryOptions}
            onSelect={setSelectedCategoryId}
            onAddCategory={handleCategoryManagement}
            showAddButton={true}
            loading={categoriesLoading}
            error={
              categoriesError
                ? "Kategoriler yüklenemedi"
                : validationErrors.categoryId
            }
            className="mb-4"
          />

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

          {/* Butonlar */}
          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleConfirmAddProduct}
              loading={createProductMutation.isPending}
              disabled={createProductMutation.isPending}
            >
              <Typography className="text-white">
                {createProductMutation.isPending ? "Ekleniyor..." : "Ekle"}
              </Typography>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="border-stock-border"
              onPress={handleProductModalClose}
              disabled={createProductMutation.isPending}
            >
              <Typography className="text-stock-dark">İptal</Typography>
            </Button>
          </View>
        </View>
      </Modal>

      {/* Ürün Düzenleme Modal'ı - Sadece kategori ve ürün adı */}
      <Modal
        visible={isEditProductModalVisible}
        onClose={handleEditProductModalClose}
        title="Ürün Düzenle"
        size="lg"
        className="bg-white mx-6"
      >
        <View>
          {/* Kategori Seçimi */}
          <Dropdown
            label="Kategori *"
            value={selectedCategoryId}
            placeholder="Kategori seçiniz..."
            options={categoryOptions}
            onSelect={setSelectedCategoryId}
            onAddCategory={handleCategoryManagement}
            showAddButton={true}
            loading={categoriesLoading}
            error={
              categoriesError
                ? "Kategoriler yüklenemedi"
                : validationErrors.categoryId
            }
            className="mb-4"
          />

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

          {/* Butonlar */}
          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleUpdateProduct}
              loading={updateProductMutation.isPending}
              disabled={updateProductMutation.isPending}
            >
              <Typography className="text-white">
                {updateProductMutation.isPending
                  ? "Güncelleniyor..."
                  : "Güncelle"}
              </Typography>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="border-stock-border"
              onPress={handleEditProductModalClose}
              disabled={updateProductMutation.isPending}
            >
              <Typography className="text-stock-dark">İptal</Typography>
            </Button>
          </View>
        </View>
      </Modal>

      {/* Kategori Ekleme Modal'ı - Yedek olarak kalabilir */}
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
            value={taxRate}
            onChangeText={setTaxRate}
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
              //loading={/* Burada mutation olması gerekiyor */}TODOMali - Mutation eklenmedi
              //disabled={/* Burada mutation olması gerekiyor */}TODOMali - Mutation eklenmedi
            >
              <Typography className="text-white">Ekle</Typography>
              {/* Mutation.isPending ? "Ekleniyor..." : "Ekle" TODO-Mali - Mutation eklenmedi*/}
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
