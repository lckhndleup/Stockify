// app/products.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, Alert, TouchableOpacity, FlatList, ScrollView } from "react-native";
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/RootNavigator';

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
import { useAppStore } from "@/src/stores/appStore";
import logger from "@/src/utils/logger";
import type { DropdownProps } from "@/src/types/ui";
import { useActiveCategories, useCreateCategory } from "@/src/hooks/api/useCategories";

// Backend hooks - UPDATED: usePassiveProducts eklendi
import {
  useProductsPaginated,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/src/hooks/api/useProducts";
import { ProductFormData, ProductUpdateData, ProductDisplayItem } from "@/src/types/product";

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
          <Typography variant="caption" weight="medium" className="mb-2 text-stock-dark">
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
        <Typography variant="caption" weight="medium" className="mb-2 text-stock-dark">
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
          activeOpacity={0.95}
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
            color={options.length === 0 && showAddButton ? "#E3001B" : "#6D706F"}
          />
        </TouchableOpacity>

        {isOpen && options.length > 0 && (
          <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-stock-border rounded-lg shadow-lg z-50">
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 200 }}>
              {showAddButton && onAddCategory && (
                <>
                  <TouchableOpacity
                    className="px-4 py-3 border-b border-stock-border bg-stock-gray"
                    onPress={() => {
                      setIsOpen(false);
                      onAddCategory();
                    }}
                    activeOpacity={0.95}
                  >
                    <View className="flex-row items-center">
                      <Icon
                        family="MaterialIcons"
                        name="add"
                        size={18}
                        color="#E3001B"
                        containerClassName="mr-2"
                      />
                      <Typography variant="body" className="text-stock-red" weight="semibold">
                        Kategori Yönetimi
                      </Typography>
                    </View>
                  </TouchableOpacity>
                  {options.length > 0 && <View className="h-1 bg-stock-border" />}
                </>
              )}

              {options.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  className={`px-4 py-3 ${index !== options.length - 1 ? "border-b border-stock-border" : ""} ${value === option.value ? "bg-stock-gray" : "bg-white"}`}
                  onPress={() => {
                    onSelect(option.value);
                    setIsOpen(false);
                  }}
                  activeOpacity={0.95}
                >
                  <Typography
                    variant="body"
                    className={value === option.value ? "text-stock-red" : "text-stock-dark"}
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
  const navigation = useNavigation<any>();

  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  // Product Modal States
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [isEditProductModalVisible, setIsEditProductModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDisplayItem | null>(null);

  // Category Modal States
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

  // Product Form States - sadece kategori ve ürün adı
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [productName, setProductName] = useState("");

  // Category Form States
  const [categoryName, setCategoryName] = useState("");
  const [taxRate, setTaxRate] = useState("");

  // Validation Error States
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // BACKEND HOOKS
  // React Query Hook - BACKEND CATEGORIES
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    error: categoriesErrorMessage,
    refetch: refetchCategories,
  } = useActiveCategories();

  const PAGE_SIZE = 5;

  // Pagination States
  const [activePage, setActivePage] = useState(0);
  const [activeRefreshKey, setActiveRefreshKey] = useState(0);
  const [activeProductsData, setActiveProductsData] = useState<ProductDisplayItem[]>([]);
  const [activeTotalPages, setActiveTotalPages] = useState(1);
  const [activeLast, setActiveLast] = useState(false);

  const [passivePage, setPassivePage] = useState(0);
  const [passiveRefreshKey, setPassiveRefreshKey] = useState(0);
  const [passiveProductsData, setPassiveProductsData] = useState<ProductDisplayItem[]>([]);
  const [passiveTotalPages, setPassiveTotalPages] = useState(1);
  const [passiveLast, setPassiveLast] = useState(false);
  const [passiveInitialized, setPassiveInitialized] = useState(false);

  const [loadingMoreActive, setLoadingMoreActive] = useState(false);
  const [loadingMorePassive, setLoadingMorePassive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTarget, setRefreshTarget] = useState<"active" | "passive" | null>(null);

  // Memoized query params to keep query keys stable
  const activeQueryParams = useMemo(
    () => ({
      status: "ACTIVE" as const,
      page: activePage,
      size: PAGE_SIZE,
      refreshKey: activeRefreshKey,
    }),
    [activePage, activeRefreshKey],
  );

  const passiveQueryParams = useMemo(
    () => ({
      status: "PASSIVE" as const,
      page: passivePage,
      size: PAGE_SIZE,
      refreshKey: passiveRefreshKey,
    }),
    [passivePage, passiveRefreshKey],
  );

  // Paginated product queries
  const {
    data: activePageData,
    isLoading: activePageLoading,
    isFetching: activeIsFetching,
    error: activeError,
  } = useProductsPaginated(activeQueryParams, { enabled: true });

  const {
    data: passivePageData,
    isLoading: passivePageLoading,
    isFetching: passiveIsFetching,
    error: passiveError,
  } = useProductsPaginated(passiveQueryParams, { enabled: passiveInitialized });

  // Active tab data aggregation
  useEffect(() => {
    if (!activePageData) {
      return;
    }

    setActiveTotalPages(activePageData.totalPages ?? 1);
    setActiveLast(activePageData.last ?? true);

    if (activePage === 0) {
      setActiveProductsData(activePageData.content);
    } else {
      setActiveProductsData((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const merged = activePageData.content.filter((item) => !existingIds.has(item.id));
        return [...prev, ...merged];
      });
    }

    if (refreshTarget === "active") {
      setRefreshing(false);
      setRefreshTarget(null);
    }

    if (loadingMoreActive) {
      setLoadingMoreActive(false);
    }
  }, [activePageData, activePage, refreshTarget, loadingMoreActive]);

  // Passive tab data aggregation (lazy initialized)
  useEffect(() => {
    if (!passivePageData) {
      return;
    }

    setPassiveTotalPages(passivePageData.totalPages ?? 1);
    setPassiveLast(passivePageData.last ?? true);

    if (passivePage === 0) {
      setPassiveProductsData(passivePageData.content);
    } else {
      setPassiveProductsData((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const merged = passivePageData.content.filter((item) => !existingIds.has(item.id));
        return [...prev, ...merged];
      });
    }

    if (refreshTarget === "passive") {
      setRefreshing(false);
      setRefreshTarget(null);
    }

    if (loadingMorePassive) {
      setLoadingMorePassive(false);
    }
  }, [passivePageData, passivePage, refreshTarget, loadingMorePassive]);

  // Enable passive fetch when tab becomes active
  useEffect(() => {
    if (activeTab === "passive" && !passiveInitialized) {
      setPassiveInitialized(true);
    }
  }, [activeTab, passiveInitialized]);

  // Reset loading flags when errors occur
  useEffect(() => {
    if (activeError && loadingMoreActive) {
      setLoadingMoreActive(false);
    }
    if (activeError && refreshTarget === "active") {
      setRefreshing(false);
      setRefreshTarget(null);
    }
  }, [activeError, loadingMoreActive, refreshTarget]);

  useEffect(() => {
    if (passiveError && loadingMorePassive) {
      setLoadingMorePassive(false);
    }
    if (passiveError && refreshTarget === "passive") {
      setRefreshing(false);
      setRefreshTarget(null);
    }
  }, [passiveError, loadingMorePassive, refreshTarget]);

  // Backend Mutations
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const createCategoryMutation = useCreateCategory();

  // Toast
  const { toast, showError, hideToast } = useToast();
  const { globalToast, showGlobalToast, hideGlobalToast } = useAppStore();

  // Tab tanımları
  const tabs = [
    { id: "active", label: "Aktif Ürünler" },
    { id: "passive", label: "Pasif Ürünler" },
  ];

  const handleSearch = (text: string) => {
    setSearchText(text);
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
            onPress: () => navigation.navigate('Categories'),
          },
        ],
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
            onPress: () => navigation.navigate('Categories'),
          },
        ],
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

              logger.debug("💾 Saving product to backend:", productFormData);

              const result = await createProductMutation.mutateAsync(productFormData);

              if (result && result.productId) {
                handleProductModalClose();
                showGlobalToast("Ürün başarıyla eklendi!", "success");

                // Aktif ürün listesini sıfırdan yükle
                refreshActiveList();
              } else {
                throw new Error("Backend'den geçersiz yanıt alındı");
              }
            } catch (error) {
              logger.error("❌ Product save error:", error);
              showError("Ürün eklenirken bir hata oluştu!");
            }
          },
        },
      ],
    );
  };

  const refreshActiveList = () => {
    setActivePage(0);
    setActiveProductsData([]);
    setActiveRefreshKey((key) => key + 1);
  };

  const refreshPassiveList = () => {
    setPassivePage(0);
    setPassiveProductsData([]);
    setPassiveRefreshKey((key) => key + 1);
    setPassiveInitialized(true);
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

              logger.debug("✏️ Updating product in backend:", productUpdateData);

              await updateProductMutation.mutateAsync(productUpdateData);

              handleEditProductModalClose();
              showGlobalToast("Ürün başarıyla güncellendi!", "success");

              // Tab'a göre ilgili ürünleri yenile
              if (activeTab === "active") {
                refreshActiveList();
              } else {
                refreshPassiveList();
              }
            } catch (error) {
              logger.error("❌ Product update error:", error);
              showError("Ürün güncellenirken bir hata oluştu!");
            }
          },
        },
      ],
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
              logger.debug("🗑️ Deleting product from backend:", product.id);

              // Backend'den sil (status PASSIVE yapılır)
              await deleteProductMutation.mutateAsync(Number(product.id));

              showGlobalToast("Ürün başarıyla silindi!", "success");

              // Her iki listeyi de yenile (aktif listeden çıkar, pasif listeye girer)
              refreshActiveList();
              refreshPassiveList();
            } catch (error) {
              logger.error("❌ Product delete error:", error);
              showError("Ürün silinirken bir hata oluştu!");
            }
          },
        },
      ],
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
  const handleCategoryManagement = useCallback(() => {
    setIsProductModalVisible(false);
    setIsEditProductModalVisible(false);
    setEditingProduct(null);
    setSelectedCategoryId("");
    setProductName("");
    setValidationErrors({});

    setTimeout(() => {
      navigation.navigate('Categories');
    }, 100);
  }, []);

  // const handleAddCategory = () => {
  //   setIsCategoryModalVisible(true);
  // };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleCategoryManagement}
          activeOpacity={0.95}
          style={{
            width: 28,
            height: 28,
            borderRadius: 17,
            backgroundColor: "#222222",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon family="MaterialIcons" name="inventory-2" size={16} color="#FFFEFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleCategoryManagement]);

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
          onPress: async () => {
            try {
              await createCategoryMutation.mutateAsync({
                name: categoryName,
                taxRate: taxRateNumber,
              });

              // Listeyi yenile ve modalı kapat
              await refetchCategories();
              handleCategoryModalClose();
              showGlobalToast("Kategori başarıyla eklendi!", "success");
            } catch {
              showError("Kategori eklenirken bir hata oluştu.");
            }
          },
        },
      ],
    );
  };

  // Filtering and Data - UPDATED: aktif/pasif tab'a göre farklı data source
  const categoryOptions = categories.map((category) => ({
    label: `${category.name} (KDV: %${category.taxRate})`,
    value: category.id,
  }));

  // Filtered data for active and passive lists
  const activeFilteredProducts = useMemo(() => {
    if (!searchText.trim()) {
      return activeProductsData;
    }

    const query = searchText.trim().toLowerCase();
    return activeProductsData.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(query);
      const categoryMatch = product.categoryName.toLowerCase().includes(query);
      return nameMatch || categoryMatch;
    });
  }, [activeProductsData, searchText]);

  const passiveFilteredProducts = useMemo(() => {
    if (!searchText.trim()) {
      return passiveProductsData;
    }

    const query = searchText.trim().toLowerCase();
    return passiveProductsData.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(query);
      const categoryMatch = product.categoryName.toLowerCase().includes(query);
      return nameMatch || categoryMatch;
    });
  }, [passiveProductsData, searchText]);

  const displayedProducts =
    activeTab === "active" ? activeFilteredProducts : passiveFilteredProducts;

  const activeInitialLoading =
    activePage === 0 && activeProductsData.length === 0 && activePageLoading;
  const passiveInitialLoading =
    passiveInitialized &&
    passivePage === 0 &&
    passiveProductsData.length === 0 &&
    passivePageLoading;

  const isProductsLoading = activeTab === "active" ? activeInitialLoading : passiveInitialLoading;
  const isLoading = categoriesLoading || isProductsLoading;

  const currentError = activeTab === "active" ? activeError : passiveError;
  const currentLoadingMore = activeTab === "active" ? loadingMoreActive : loadingMorePassive;
  const currentLast = activeTab === "active" ? activeLast : passiveLast;
  const currentIsFetching = activeTab === "active" ? activeIsFetching : passiveIsFetching;
  const currentPage = activeTab === "active" ? activePage : passivePage;

  const emptyMessage = searchText.trim()
    ? "Arama kriterinize uygun ürün bulunamadı."
    : activeTab === "active"
      ? "Henüz aktif ürün eklenmemiş."
      : "Pasif ürün bulunamadı.";

  const listContentPadding = 120;

  const handleLoadMore = () => {
    if (activeTab === "active") {
      if (loadingMoreActive || activeLast || activeIsFetching) {
        return;
      }

      if (activePage >= activeTotalPages - 1) {
        return;
      }

      setLoadingMoreActive(true);
      setActivePage((prev) => prev + 1);
      return;
    }

    if (!passiveInitialized) {
      setPassiveInitialized(true);
    }

    if (loadingMorePassive || passiveLast || passiveIsFetching) {
      return;
    }

    if (passivePage >= passiveTotalPages - 1) {
      return;
    }

    setLoadingMorePassive(true);
    setPassivePage((prev) => prev + 1);
  };

  const handleRefresh = () => {
    const target = activeTab === "active" ? "active" : "passive";
    setRefreshTarget(target);
    setRefreshing(true);

    if (target === "active") {
      setActivePage(0);
      setActiveProductsData([]);
      setActiveRefreshKey((key) => key + 1);
    } else {
      setPassivePage(0);
      setPassiveProductsData([]);
      setPassiveRefreshKey((key) => key + 1);
      setPassiveInitialized(true);
    }
  };

  const renderProductItem = ({ item }: { item: ProductDisplayItem }) => {
    const category = getCategoryByIdFromAPI(item.categoryId);

    return (
      <Card
        variant="default"
        padding="sm"
        className={`border border-stock-border mb-2 ${!item.isActive ? "opacity-60" : ""}`}
        radius="md"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Typography variant="body" weight="semibold" align="left" className="text-stock-dark">
              {item.name}
            </Typography>
            <Typography variant="caption" size="sm" className="text-stock-text mt-1">
              Kategori: {category?.name || "Kategori bulunamadı"}
              {activeTab === "passive" && (
                <Typography variant="caption" className="text-red-600 ml-2">
                  • Pasif
                </Typography>
              )}
            </Typography>
          </View>

          {activeTab === "active" && (
            <View className="flex-row items-center">
              <Icon
                family="MaterialIcons"
                name="edit"
                size={18}
                color="#67686A"
                pressable
                onPress={() => handleEditProduct(item)}
                containerClassName="mr-2"
              />
              <Icon
                family="MaterialIcons"
                name="delete"
                size={18}
                color="#E3001B"
                pressable
                onPress={() => handleDeleteProduct(item)}
              />
            </View>
          )}
        </View>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Container className="bg-white flex-1" padding="none" safeTop={false}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
        />
        <Toast
          visible={globalToast.visible}
          message={globalToast.message}
          type={globalToast.type}
          onHide={hideGlobalToast}
        />
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
        <Toast
          visible={globalToast.visible}
          message={globalToast.message}
          type={globalToast.type}
          onHide={hideGlobalToast}
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
          <Typography variant="caption" className="text-gray-500 text-center mb-4">
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
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
      <Toast
        visible={globalToast.visible}
        message={globalToast.message}
        type={globalToast.type}
        onHide={hideGlobalToast}
      />

      <View className="flex-1 mt-3">
        {/* Search ve Add Butonu */}
        <View className="flex-row items-center mb-3">
          <SearchBar placeholder="Ürün ara..." onSearch={handleSearch} className="flex-1 mr-3" />
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

        {currentError && (
          <Card
            variant="default"
            padding="md"
            className="bg-red-50 border border-red-200 mb-4"
            radius="md"
          >
            <Typography variant="body" className="text-red-600 text-center" weight="medium">
              ⚠️ Ürünler yüklenirken bir sorun oluştu
            </Typography>
            <Button variant="outline" size="sm" onPress={handleRefresh} className="mt-3">
              <Typography variant="caption" weight="medium">
                Tekrar Dene
              </Typography>
            </Button>
          </Card>
        )}

        <View className="flex-1 mt-3">
          <FlatList
            data={displayedProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: listContentPadding, paddingTop: 4 }}
            ListEmptyComponent={
              currentIsFetching || refreshing ? (
                <View className="items-center justify-center py-12">
                  <Loading size="large" />
                </View>
              ) : (
                <View className="items-center justify-center py-12">
                  <Icon
                    family="MaterialCommunityIcons"
                    name="package-variant"
                    size={64}
                    color="#ECECEC"
                    containerClassName="mb-4"
                  />
                  <Typography variant="body" className="text-stock-text text-center">
                    {emptyMessage}
                  </Typography>
                </View>
              )
            }
            ListFooterComponent={
              !currentLast && (currentLoadingMore || (currentIsFetching && currentPage > 0)) ? (
                <View className="py-6 items-center">
                  <Loading size="small" />
                  <Typography variant="body" weight="medium" className="text-gray-700 mt-3">
                    Daha fazla yükleniyor...
                  </Typography>
                </View>
              ) : null
            }
          />
        </View>
      </View>

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
            placeholder={categories.length === 0 ? "Kategori Ekle" : "Kategori seçiniz..."}
            options={categoryOptions}
            onSelect={setSelectedCategoryId}
            onAddCategory={handleCategoryManagement}
            showAddButton={true}
            loading={categoriesLoading}
            error={categoriesError ? "Kategoriler yüklenemedi" : validationErrors.categoryId}
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
            error={categoriesError ? "Kategoriler yüklenemedi" : validationErrors.categoryId}
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
                {updateProductMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
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
              loading={createCategoryMutation.isPending}
              disabled={createCategoryMutation.isPending}
            >
              <Typography className="text-white">
                {createCategoryMutation.isPending ? "Ekleniyor..." : "Ekle"}
              </Typography>
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
