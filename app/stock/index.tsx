// app/stock.tsx - API entegrasyonu ile güncellenmiş
import React, { useState, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager,
  KeyboardAvoidingView,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import {
  Container,
  Typography,
  SearchBar,
  Icon,
  Loading,
  Button,
  Input,
  Modal,
  SelectBox,
} from "@/src/components/ui";
import Toast from "@/src/components/ui/toast";
import { useToast } from "@/src/hooks/useToast";
import logger from "@/src/utils/logger";

// API Hooks
import {
  useInventoryAll,
  useInventoryCritical,
  useInventoryOutOfStock,
  useUpdateInventory,
  InventoryDisplayItem,
} from "@/src/hooks/api/useInventory";
import { useCreateProduct, useUpdateProduct } from "@/src/hooks/api/useProducts";
import { useActiveCategories } from "@/src/hooks/api/useCategories";
import ProductItem from "./lib/product";

enum TabOption {
  Products = "Ürünler",
  Summary = "Özet",
}

const TABS = [TabOption.Products, TabOption.Summary];

type StatusFilter = "all" | "out" | "critical" | "ok";

export default function StockPage() {
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  // Stok artış/azalış adımı seçimi
  const [adjustStep] = useState<number>(1); // step tutuluyor ama UI'de gizli; ileride tekrar kullanılabilir
  // Kart açma/kapama ve geçici değerler
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tempCount, setTempCount] = useState<number>(0);
  const [tempCritical, setTempCritical] = useState<number>(0);

  // Ürün ekleme modal state
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  // Ürün düzenleme modal state
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryDisplayItem | null>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editCriticalLevel, setEditCriticalLevel] = useState("");

  // Form validasyon kontrolü - ürün ekleme
  const isAddFormValid = newProductName.trim().length > 0 && selectedCategoryId.length > 0;

  // Form validasyon kontrolü - ürün düzenleme
  const isEditFormValid =
    editProductName.trim().length > 0 &&
    editCategoryId.length > 0 &&
    editPrice.trim().length > 0 &&
    !isNaN(Number(editPrice)) &&
    Number(editPrice) >= 0;

  // Toast
  const { toast, hideToast, showSuccess, showError } = useToast();
  const { mutateAsync: updateInventory, isPending: isSaving } = useUpdateInventory();
  const { mutateAsync: createProduct, isPending: isCreatingProduct } = useCreateProduct();
  const { mutateAsync: updateProduct, isPending: isUpdatingProduct } = useUpdateProduct();

  // Android için LayoutAnimation etkinleştir
  if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  // API Hooks
  const {
    data: allInventory = [],
    isLoading: isLoadingAll,
    error: errorAll,
    refetch: refetchAll,
  } = useInventoryAll();

  const { refetch: refetchCritical } = useInventoryCritical();

  const { refetch: refetchOutOfStock } = useInventoryOutOfStock();

  // Kategorileri getir
  const { data: categories = [] } = useActiveCategories();

  // Sayfa focus olduğunda inventory'leri yenile (ürün eklendiğinde güncellenmesi için)
  useFocusEffect(
    useCallback(() => {
      logger.debug("📦 Stock page focused, refreshing inventory data...");
      refetchAll();
      refetchCritical();
      refetchOutOfStock();
    }, [refetchAll, refetchCritical, refetchOutOfStock]),
  );

  // Eski alt filtreler kaldırıldı; iki üst sekme (Ürünler / Özet) kullanılıyor.

  // Handler functions
  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const _handleProductPress = (inventoryItem: InventoryDisplayItem) => {
    // Eski navigasyon fonksiyonu - artık inline edit kullanılıyor
    logger.debug(
      "(Deprecated) Stock detail navigation for inventory ID:",
      inventoryItem.inventoryId,
    );
  };

  const toggleExpand = (inventoryItem: InventoryDisplayItem) => {
    // Eğer fiyat bilgisi yoksa direkt düzenleme modalını aç
    if (!inventoryItem.price || inventoryItem.price === 0) {
      openEditModal(inventoryItem);
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedId === inventoryItem.id) {
      setExpandedId(null);
    } else {
      setExpandedId(inventoryItem.id);
      setTempCount(Number(inventoryItem.productCount) || 0);
      setTempCritical(Number(inventoryItem.criticalProductCount) || 0);
    }
  };

  // Artı/Eksi kaldırıldı; yalnızca Input ile düzenleme yapılıyor

  const handleSaveInline = async (inventoryItem: InventoryDisplayItem) => {
    try {
      await updateInventory({
        inventoryId: inventoryItem.inventoryId,
        price: Number(inventoryItem.price) || 0,
        productCount: tempCount,
        criticalProductCount: tempCritical,
        active: true,
      });
      showSuccess("Stok güncellendi");
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedId(null);
    } catch {
      showError("Güncelleme başarısız");
    }
  };

  // Stok arttırma kısayolu (artı butonu)
  const _handleIncreaseStock = (inventoryItem: InventoryDisplayItem) => {
    logger.debug("Increasing stock shortcut for inventory ID:", inventoryItem.inventoryId);
    // Detay sayfasında ilgili aksiyona yönlendirme (action=add ipucu)
    router.push(`/stockDetail?id=${inventoryItem.inventoryId}&action=add&amount=${adjustStep}`);
  };

  // Stok azaltma kısayolu (eksi butonu)
  const _handleDecreaseStock = (inventoryItem: InventoryDisplayItem) => {
    logger.debug("Decreasing stock shortcut for inventory ID:", inventoryItem.inventoryId);
    router.push(`/stockDetail?id=${inventoryItem.inventoryId}&action=remove&amount=${adjustStep}`);
  };

  // Loading ve error durumları
  const isLoading = isLoadingAll;
  const error = errorAll;

  // Data filtering
  const getFilteredInventory = (): InventoryDisplayItem[] => {
    let inventoryToFilter: InventoryDisplayItem[] = allInventory;

    // Status filter
    if (statusFilter !== "all") {
      inventoryToFilter = inventoryToFilter.filter((item) => {
        if (statusFilter === "out") return item.isOutOfStock;
        if (statusFilter === "critical") return item.isCritical && !item.isOutOfStock;
        if (statusFilter === "ok") return !item.isCritical && !item.isOutOfStock;
        return true;
      });
    }

    // Search filter - productName null/undefined kontrolü eklendi
    return inventoryToFilter.filter((item) => {
      if (!searchText.trim()) return true;

      const searchLower = searchText.toLowerCase();
      const productName = item.productName || "";
      const categoryName = item.categoryName || "";

      return (
        productName.toLowerCase().includes(searchLower) ||
        categoryName.toLowerCase().includes(searchLower)
      );
    });
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

  // Ürün ekleme işlemi
  const handleAddProduct = async () => {
    // Form validasyonları
    const errors: string[] = [];

    if (!newProductName.trim()) {
      errors.push("Ürün adı zorunludur");
    }

    if (!selectedCategoryId || selectedCategoryId === "") {
      errors.push("Kategori seçimi zorunludur");
    }

    if (errors.length > 0) {
      showError(errors.join("\n"));
      return;
    }

    try {
      await createProduct({
        name: newProductName.trim(),
        categoryId: Number(selectedCategoryId),
      });
      showSuccess("Ürün başarıyla eklendi");
      setIsAddProductModalOpen(false);
      setNewProductName("");
      setSelectedCategoryId("");
      // Inventory'yi yenile
      refetchAll();
    } catch {
      showError("Ürün eklenirken hata oluştu");
    }
  };

  // Düzenleme modalını aç
  const openEditModal = (item: InventoryDisplayItem) => {
    setEditingProduct(item);
    setEditProductName(item.productName || "");
    // Kategori adından ID'yi bul
    const category = categories.find((cat) => cat.name === item.categoryName);
    setEditCategoryId(category?.id || "");
    setEditPrice(String(item.price || 0));
    setEditStock(String(item.productCount || 0));
    setEditCriticalLevel(String(item.criticalProductCount || 0));
    setIsEditProductModalOpen(true);
  };

  // Ürün güncelleme işlemi
  const handleUpdateProduct = async () => {
    logger.debug("🔄 handleUpdateProduct called");

    if (!editingProduct) {
      logger.error("❌ editingProduct is null");
      return;
    }

    // Form validasyonları
    const errors: string[] = [];

    if (!editProductName.trim()) {
      errors.push("Ürün adı zorunludur");
    }

    if (!editCategoryId || editCategoryId === "") {
      errors.push("Kategori seçimi zorunludur");
    }

    const priceValue = Number(editPrice);
    if (!editPrice.trim() || isNaN(priceValue) || priceValue < 0) {
      errors.push("Geçerli bir fiyat giriniz");
    }

    if (errors.length > 0) {
      logger.error("❌ Validation errors:", errors);
      showError(errors.join("\n"));
      return;
    }

    logger.debug("✅ Validation passed, starting update...");

    try {
      logger.debug("📝 Updating product:", {
        productId: editingProduct.productId,
        name: editProductName,
        categoryId: editCategoryId,
      });

      // Önce ürün bilgilerini güncelle
      await updateProduct({
        productId: Number(editingProduct.productId),
        name: editProductName.trim(),
        categoryId: Number(editCategoryId),
      });

      logger.debug("📦 Updating inventory:", {
        inventoryId: editingProduct.inventoryId,
        price: editPrice,
        stock: editStock,
        critical: editCriticalLevel,
      });

      // Sonra inventory bilgilerini güncelle
      await updateInventory({
        inventoryId: editingProduct.inventoryId,
        price: Number(editPrice) || 0,
        productCount: Number(editStock) || 0,
        criticalProductCount: Number(editCriticalLevel) || 0,
        active: true,
      });

      showSuccess("Ürün başarıyla güncellendi");
      setIsEditProductModalOpen(false);
      setEditingProduct(null);
      // Inventory'yi yenile
      refetchAll();
      logger.debug("✅ Product updated successfully");
    } catch (error) {
      logger.error("❌ Update error:", error);
      showError("Ürün güncellenirken hata oluştu");
    }
  };

  if (error) {
    return (
      <Container className="bg-white flex-1" padding="none" safeTop={false}>
        <View className="flex-1 justify-center items-center -mt-16">
          <Icon family="MaterialIcons" name="error-outline" size={64} color="#E3001B" />
          <Typography variant="h3" weight="bold" className="text-stock-red mt-4 mb-2">
            Bağlantı Hatası
          </Typography>
          <Typography variant="body" className="text-stock-text text-center mb-6">
            Stok verileri yüklenirken bir hata oluştu. Lütfen tekrar deneyiniz.
          </Typography>
          <Button variant="primary" onPress={handleRetry} className="bg-stock-red">
            Tekrar Dene
          </Button>
        </View>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container className="bg-white flex-1" padding="none" safeTop={false}>
        <View className="flex-1 justify-center items-center -mt-16">
          <Loading size="large" />
        </View>
      </Container>
    );
  }

  return (
    <Container className="bg-[#F8F9FA]" padding="none" safeTop={false}>
      {/* Toast Notification */}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
      {/* Modern Header with Tabs */}
      {/* Küçük düzeltme: sınıf adı boşluğu eksikti */}
      <View className="bg-white pt-4 pb-2 px-2">
        {/* Tabs - Modern Pill Style */}
        <View
          className="flex-row p-1"
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            gap: 6,
          }}
        >
          {TABS.map((tab, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setActiveTab(tab)}
              className="flex-1 py-2 items-center justify-center"
              style={{
                backgroundColor: activeTab === tab ? "#222222" : "#FFFFFF",
                borderRadius: 12,
              }}
              activeOpacity={1.0}
            >
              <Typography
                variant="body"
                weight="semibold"
                style={{
                  color: activeTab === tab ? "#FFFEFF" : "#73767A",
                  fontSize: 14,
                }}
              >
                {tab}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {activeTab === TabOption.Summary && (
        <View className="px-4" style={{ paddingTop: 8 }}>
          {/* Ana Değer Kartı - Büyük ve belirgin */}
          <View
            style={{
              backgroundColor: "#1F2937",
              borderRadius: 20,
              padding: 20,
              marginBottom: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View style={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  weight="medium"
                  style={{ color: "#9CA3AF", marginBottom: 6, fontSize: 12 }}
                >
                  Toplam Stok Değeri
                </Typography>
                <Typography
                  variant="h1"
                  weight="bold"
                  style={{ color: "#34D399", fontSize: 36, marginBottom: 4 }}
                >
                  ₺
                  {(stats.totalValue / 1000).toLocaleString("tr-TR", {
                    maximumFractionDigits: 1,
                  })}
                  k
                </Typography>
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <View
                    style={{
                      backgroundColor: "rgba(96, 165, 250, 0.15)",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Typography
                      variant="caption"
                      weight="semibold"
                      style={{ color: "#60A5FA", fontSize: 11 }}
                    >
                      {stats.totalProducts} Ürün
                    </Typography>
                  </View>
                </View>
              </View>
              <View
                style={{
                  backgroundColor: "rgba(52, 211, 153, 0.15)",
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Icon family="Feather" name="package" size={32} color="#34D399" />
              </View>
            </View>
          </View>

          {/* Alt Kartlar - Kompakt */}
          <View className="flex-row" style={{ gap: 10 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#1F2937",
                borderRadius: 16,
                padding: 14,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View
                  style={{
                    backgroundColor: "rgba(251, 191, 36, 0.15)",
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Icon family="Feather" name="alert-triangle" size={18} color="#FBBF24" />
                </View>
              </View>
              <Typography
                variant="h2"
                weight="bold"
                style={{ color: "#FBBF24", fontSize: 28, marginBottom: 2 }}
              >
                {stats.criticalProducts}
              </Typography>
              <Typography
                variant="caption"
                weight="medium"
                style={{ color: "#FCD34D", fontSize: 11 }}
              >
                Kritik Stok
              </Typography>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "#1F2937",
                borderRadius: 16,
                padding: 14,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View
                  style={{
                    backgroundColor: "rgba(248, 113, 113, 0.15)",
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Icon family="Feather" name="x-circle" size={18} color="#F87171" />
                </View>
              </View>
              <Typography
                variant="h2"
                weight="bold"
                style={{ color: "#F87171", fontSize: 28, marginBottom: 2 }}
              >
                {stats.outOfStockProducts}
              </Typography>
              <Typography
                variant="caption"
                weight="medium"
                style={{ color: "#FCA5A5", fontSize: 11 }}
              >
                Tükenen Ürün
              </Typography>
            </View>
          </View>
        </View>
      )}
      {activeTab === TabOption.Products && (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          {/* Search Bar + Ürün Ekle Butonu */}
          <View className="mb-4 px-4">
            <View className="flex-row mb-3" style={{ gap: 8 }}>
              <View style={{ flex: 1 }}>
                <SearchBar placeholder="Ürün ara..." onSearch={handleSearch} />
              </View>
              <TouchableOpacity
                onPress={() => setIsAddProductModalOpen(true)}
                style={{
                  backgroundColor: "#DC2626",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Icon family="Feather" name="plus" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Status Filtreleri */}
            <View className="flex-row mb-3" style={{ gap: 6 }}>
              <TouchableOpacity
                onPress={() => setStatusFilter("all")}
                style={{
                  flex: 1,
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  backgroundColor: statusFilter === "all" ? "#DC2626" : "rgba(255, 255, 255, 0.08)",
                }}
              >
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{
                    color: statusFilter === "all" ? "#FFFFFF" : "#9CA3AF",
                    fontSize: 11,
                    textAlign: "center",
                  }}
                >
                  Tümü
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStatusFilter("out")}
                style={{
                  flex: 1,
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  backgroundColor: statusFilter === "out" ? "#DC2626" : "rgba(255, 255, 255, 0.08)",
                }}
              >
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{
                    color: statusFilter === "out" ? "#FFFFFF" : "#9CA3AF",
                    fontSize: 11,
                    textAlign: "center",
                  }}
                >
                  Tükenen
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStatusFilter("critical")}
                style={{
                  flex: 1,
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  backgroundColor:
                    statusFilter === "critical" ? "#F59E0B" : "rgba(255, 255, 255, 0.08)",
                }}
              >
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{
                    color: statusFilter === "critical" ? "#FFFFFF" : "#9CA3AF",
                    fontSize: 11,
                    textAlign: "center",
                  }}
                >
                  Kritik
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStatusFilter("ok")}
                style={{
                  flex: 1,
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  backgroundColor: statusFilter === "ok" ? "#10B981" : "rgba(255, 255, 255, 0.08)",
                }}
              >
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{
                    color: statusFilter === "ok" ? "#FFFFFF" : "#9CA3AF",
                    fontSize: 11,
                    textAlign: "center",
                  }}
                >
                  Normal
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
          <FlatList
            data={filteredInventory}
            contentContainerClassName="gap-3 px-4 pb-[120]"
            extraData={{ expandedId, tempCount, tempCritical }}
            renderItem={({ item, index }) => {
              const status = item.isOutOfStock ? "out" : item.isCritical ? "critical" : "ok";
              const palette = {
                out: {
                  borderColor: "#DC2626",
                  bgColor: "#FEF2F2",
                  statusText: "#DC2626",
                },
                critical: {
                  borderColor: "#F59E0B",
                  bgColor: "#FFFBEB",
                  statusText: "#F59E0B",
                },
                ok: {
                  borderColor: "#10B981",
                  bgColor: "#F0FDF4",
                  statusText: "#10B981",
                },
              }[status];

              return (
                <ProductItem
                  item={item}
                  index={index}
                  toggleExpand={toggleExpand}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                />
              );
            }}
          />
        </KeyboardAvoidingView>
      )}

      {/* Ürün Ekleme Modal */}
      <Modal
        visible={isAddProductModalOpen}
        onClose={() => {
          setIsAddProductModalOpen(false);
          setNewProductName("");
          setSelectedCategoryId("");
        }}
        title="Yeni Ürün Ekle"
      >
        <View style={{ gap: 16 }}>
          {/* Ürün Adı */}
          <View>
            <Typography variant="body" weight="medium" className="mb-2">
              Ürün Adı *
            </Typography>
            <Input
              value={newProductName}
              onChangeText={setNewProductName}
              placeholder="Ürün adını giriniz"
              variant="outlined"
              fullWidth
            />
          </View>

          {/* Kategori Seçimi */}
          <View>
            <Typography variant="body" weight="medium" className="mb-2">
              Kategori *
            </Typography>
            <SelectBox
              options={categories.map((cat) => ({
                label: cat.name,
                value: cat.id,
              }))}
              value={selectedCategoryId}
              onSelect={setSelectedCategoryId}
              placeholder="Kategori seçiniz"
            />
          </View>

          {/* Butonlar */}
          <View className="flex-row" style={{ gap: 12, marginTop: 8 }}>
            <Button
              variant="outline"
              onPress={() => {
                setIsAddProductModalOpen(false);
                setNewProductName("");
                setSelectedCategoryId("");
              }}
              className="flex-1"
            >
              İptal
            </Button>
            <Button
              variant="primary"
              onPress={handleAddProduct}
              disabled={!isAddFormValid || isCreatingProduct}
              className="flex-1"
            >
              <Typography
                variant="body"
                weight="semibold"
                style={{ color: !isAddFormValid || isCreatingProduct ? "#6B7280" : "#FFFFFF" }}
              >
                {isCreatingProduct ? "Ekleniyor..." : "Ekle"}
              </Typography>
            </Button>
          </View>
        </View>
      </Modal>

      {/* Ürün Düzenleme Modal */}
      <Modal
        visible={isEditProductModalOpen}
        onClose={() => {
          setIsEditProductModalOpen(false);
          setEditingProduct(null);
        }}
        title="Ürün Düzenle"
      >
        <View style={{ gap: 16 }}>
          {/* Ürün Adı */}
          <View>
            <Typography variant="body" weight="medium" className="mb-2">
              Ürün Adı *
            </Typography>
            <Input
              value={editProductName}
              onChangeText={setEditProductName}
              placeholder="Ürün adını giriniz"
              variant="outlined"
              fullWidth
            />
          </View>

          {/* Kategori Seçimi */}
          <View>
            <Typography variant="body" weight="medium" className="mb-2">
              Kategori *
            </Typography>
            <SelectBox
              options={categories.map((cat) => ({
                label: cat.name,
                value: cat.id,
              }))}
              value={editCategoryId}
              onSelect={setEditCategoryId}
              placeholder="Kategori seçiniz"
            />
          </View>

          {/* Fiyat */}
          <View>
            <Typography variant="body" weight="medium" className="mb-2">
              Birim Fiyat (₺)
            </Typography>
            <Input
              value={editPrice}
              onChangeText={setEditPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
              variant="outlined"
              fullWidth
            />
          </View>

          {/* Stok Miktarı */}
          <View>
            <Typography variant="body" weight="medium" className="mb-2">
              Stok Miktarı
            </Typography>
            <Input
              value={editStock}
              onChangeText={setEditStock}
              placeholder="0"
              keyboardType="numeric"
              numericOnly
              variant="outlined"
              fullWidth
            />
          </View>

          {/* Kritik Seviye */}
          <View>
            <Typography variant="body" weight="medium" className="mb-2">
              Kritik Seviye
            </Typography>
            <Input
              value={editCriticalLevel}
              onChangeText={setEditCriticalLevel}
              placeholder="0"
              keyboardType="numeric"
              numericOnly
              variant="outlined"
              fullWidth
            />
          </View>

          {/* Butonlar */}
          <View className="flex-row" style={{ gap: 12, marginTop: 8 }}>
            <Button
              variant="outline"
              onPress={() => {
                setIsEditProductModalOpen(false);
                setEditingProduct(null);
              }}
              className="flex-1"
            >
              İptal
            </Button>
            <Button
              variant="primary"
              onPress={() => {
                logger.debug("🔘 Güncelle button pressed!");
                logger.debug("🔘 isUpdatingProduct:", isUpdatingProduct);
                logger.debug("🔘 editingProduct:", editingProduct);
                handleUpdateProduct();
              }}
              disabled={!isEditFormValid || isUpdatingProduct}
              className="flex-1"
            >
              <Typography
                variant="body"
                weight="semibold"
                style={{ color: !isEditFormValid || isUpdatingProduct ? "#6B7280" : "#FFFFFF" }}
              >
                {isUpdatingProduct ? "Güncelleniyor..." : "Güncelle"}
              </Typography>
            </Button>
          </View>
        </View>
      </Modal>
    </Container>
  );
}
