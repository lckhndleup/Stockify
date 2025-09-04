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
  Loading,
} from "@/src/components/ui";
import Toast from "@/src/components/ui/toast";
import { useToast } from "@/src/hooks/useToast";
import { useAppStore, Product, Category } from "@/src/stores/appStore";
import { useActiveCategories } from "@/src/hooks/api/useCategories";

// Backend hooks
import {
  useActiveProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useSearchProducts,
} from "@/src/hooks/api/useProducts";
import { ProductFormData, ProductUpdateData } from "@/src/types/product";

import {
  categorySchema,
  // productSchema, // Bu schema güncellenmeli - stock/price kaldırılmalı
  editCategorySchema,
} from "@/src/validations/salesValidation";

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
interface DropdownProps {
  label?: string;
  value?: string;
  placeholder?: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  className?: string;
  onAddCategory?: () => void;
  showAddButton?: boolean;
  loading?: boolean;
  error?: string;
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
        <View className="flex-row items-center justify-between border border-stock-border rounded-lg px-4 py-3 bg-gray-100">
          <Typography variant="body" className="text-stock-text flex-1">
            Kategoriler yükleniyor...
          </Typography>
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Category Modal States
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isEditCategoryModalVisible, setIsEditCategoryModalVisible] =
    useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Product Form States - UPDATED: sadece kategori ve ürün adı
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [productName, setProductName] = useState("");
  // REMOVED: productStock ve productPrice state'leri kaldırıldı

  // Category Form States
  const [categoryName, setCategoryName] = useState("");
  const [categoryTaxRate, setCategoryTaxRate] = useState("");

  // Validation Error States
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // BACKEND HOOKS
  // React Query Hook - BACKEND CATEGORIES
  const {
    data: backendCategories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    error: categoriesErrorMessage,
    refetch: refetchCategories,
  } = useActiveCategories();

  // React Query Hook - BACKEND PRODUCTS
  const {
    data: backendProducts = [],
    isLoading: productsLoading,
    isError: productsError,
    error: productsErrorMessage,
    refetch: refetchProducts,
  } = useActiveProducts();

  // Search Products - sadece arama yapıldığında
  const {
    data: searchResults = [],
    isLoading: searchLoading,
    refetch: refetchSearch,
  } = useSearchProducts(searchText, { enabled: false });

  // Backend Mutations
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  // Global Store - LOCAL PRODUCTS (eski - compatibility için kalsın)
  const {
    products,
    categories, // Local categories (artık kullanılmıyor)
    addProduct,
    updateProduct,
    deleteProduct,
    getActiveProducts,
    addCategory,
    updateCategory,
    deleteCategory,
    getActiveCategories, // Local function (artık kullanılmıyor)
    getCategoryById, // Local function (güncellendi)
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

    // Arama yapıldığında backend'den ara
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
    if (backendCategories.length === 0) {
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
    // REMOVED: productStock ve productPrice reset'leri kaldırıldı
    setValidationErrors({});
  };

  // Backend kategoriden kategori bulma
  const getCategoryByIdFromAPI = (categoryId: string) => {
    return backendCategories.find((cat) => cat.id === categoryId);
  };

  const handleConfirmAddProduct = async () => {
    // UPDATED: Sadece kategori ve ürün adı validation'ı
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
      `"${productName}" ürününü eklemek istediğinizden emin misiniz?\n\nKategori: ${category.name}`, // UPDATED: stock/price bilgileri kaldırıldı
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Ekle",
          style: "default",
          onPress: async () => {
            try {
              // Backend'e gönder - UPDATED: sadece categoryId ve name
              const productFormData: ProductFormData = {
                categoryId: Number(selectedCategoryId),
                name: productName.trim(),
              };

              console.log("💾 Saving product to backend:", productFormData);

              const backendResult = await createProductMutation.mutateAsync(
                productFormData
              );

              if (backendResult && backendResult.productId) {
                handleProductModalClose();
                showSuccess("Ürün başarıyla eklendi!");

                // Verileri yenile
                refetchProducts();
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

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setSelectedCategoryId(product.categoryId);
    setProductName(product.name);
    // REMOVED: productStock ve productPrice set'leri kaldırıldı
    setValidationErrors({});
    setIsEditProductModalVisible(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) {
      showError("Düzenlenecek ürün bulunamadı.");
      return;
    }

    // UPDATED: Sadece kategori ve ürün adı validation'ı
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
      `"${productName}" ürününü güncellemek istediğinizden emin misiniz?\n\nKategori: ${category.name}`, // UPDATED: stock/price bilgileri kaldırıldı
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Güncelle",
          style: "default",
          onPress: async () => {
            try {
              // Backend'e gönder - UPDATED: sadece categoryId ve name
              const productUpdateData: ProductUpdateData = {
                productId: Number(editingProduct.id),
                categoryId: Number(selectedCategoryId),
                name: productName.trim(),
              };

              console.log("✏️ Updating product in backend:", productUpdateData);

              await updateProductMutation.mutateAsync(productUpdateData);

              handleEditProductModalClose();
              showSuccess("Ürün başarıyla güncellendi!");

              // Verileri yenile
              refetchProducts();
            } catch (error) {
              console.error("❌ Product update error:", error);
              showError("Ürün güncellenirken bir hata oluştu!");
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
          onPress: async () => {
            try {
              console.log("🗑️ Deleting product from backend:", product.id);

              // Backend'den sil
              await deleteProductMutation.mutateAsync(Number(product.id));

              showSuccess("Ürün başarıyla silindi!");

              // Verileri yenile
              refetchProducts();
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
    // REMOVED: productStock ve productPrice reset'leri kaldırıldı
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

  // Filtering and Data - BACKEND ENTEGRELİ HALE GETİRİLDİ
  // Backend kategorilerden seçenekler oluştur
  const categoryOptions = backendCategories.map((category) => ({
    label: `${category.name} (KDV: %${category.taxRate})`,
    value: category.id,
  }));

  // PRODUCTS DATA SOURCE - BACKEND'DEN ALIYOR
  const getFilteredProducts = () => {
    let sourceProducts = backendProducts;

    // Arama sonuçları varsa onları kullan
    if (searchText.trim().length > 0 && searchResults.length > 0) {
      sourceProducts = searchResults;
    }

    // Tab'a göre filtrele ve search'e göre filtrele
    return sourceProducts.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchesTab =
        activeTab === "active" ? product.isActive : !product.isActive;
      return matchesSearch && matchesTab;
    });
  };

  const filteredProducts = getFilteredProducts();

  // Loading state
  if (productsLoading && categoriesLoading) {
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <View className="flex-1 justify-center items-center">
          <Loading size="large" />
          <Typography className="mt-4 text-gray-600">Yükleniyor...</Typography>
        </View>
      </Container>
    );
  }

  // Error state için kategori yüklenirken
  if (
    categoriesError &&
    !backendCategories.length &&
    (isProductModalVisible || isEditProductModalVisible)
  ) {
    // Modal açıkken kategori hatası varsa modal'ı kapat ve hata göster
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
        {searchLoading && searchText.trim().length > 0 ? (
          <View className="items-center py-8">
            <Loading size="large" />
            <Typography className="mt-4 text-gray-600">Aranıyor...</Typography>
          </View>
        ) : productsLoading ? (
          <View className="items-center py-8">
            <Loading size="large" />
            <Typography className="mt-4 text-gray-600">
              Ürünler yükleniyor...
            </Typography>
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
                        {/* REMOVED: Stok ve Fiyat bilgileri kaldırıldı */}
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
        )}

        {/* Empty State */}
        {!productsLoading &&
          !searchLoading &&
          filteredProducts.length === 0 && (
            <View className="items-center justify-center py-12">
              <Icon
                family="MaterialCommunityIcons"
                name="package-variant"
                size={64}
                color="#ECECEC"
                containerClassName="mb-4"
              />
              <Typography
                variant="body"
                className="text-stock-text text-center"
              >
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

      {/* Ürün Ekleme Modal'ı - UPDATED: Sadece kategori ve ürün adı */}
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
              backendCategories.length === 0
                ? "Kategori Ekle"
                : "Kategori seçiniz..."
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

          {/* REMOVED: Stok Adedi ve Adet Fiyatı input'ları kaldırıldı */}

          {/* Butonlar */}
          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleConfirmAddProduct}
              loading={createProductMutation.isPending}
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

      {/* Ürün Düzenleme Modal'ı - UPDATED: Sadece kategori ve ürün adı */}
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

          {/* REMOVED: Stok Adedi ve Adet Fiyatı input'ları kaldırıldı */}

          {/* Butonlar */}
          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleUpdateProduct}
              loading={updateProductMutation.isPending}
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
