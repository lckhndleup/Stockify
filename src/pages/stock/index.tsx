// app/stock.tsx - API entegrasyonu ile güncellenmiş
import React, { useState, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/RootNavigator';

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

type StatusFilter = "all" | "out" | "critical" | "ok";

export default function StockPage() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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

  // Stok güncelleme modal state
  const [isStockUpdateModalOpen, setIsStockUpdateModalOpen] = useState(false);
  const [updatingProduct, setUpdatingProduct] = useState<InventoryDisplayItem | null>(null);
  const [updateStock, setUpdateStock] = useState("");
  const [updateCriticalLevel, setUpdateCriticalLevel] = useState("");

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
  const { mutateAsync: updateInventory } = useUpdateInventory();
  const { mutateAsync: createProduct, isPending: isCreatingProduct } = useCreateProduct();
  const { mutateAsync: updateProduct, isPending: isUpdatingProduct } = useUpdateProduct();

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

  // Stok güncelleme modalını aç
  const openStockUpdateModal = (item: InventoryDisplayItem) => {
    setUpdatingProduct(item);
    setUpdateStock(String(item.productCount || 0));
    setUpdateCriticalLevel(String(item.criticalProductCount || 0));
    setIsStockUpdateModalOpen(true);
  };

  // Stok güncelleme işlemi
  const handleStockUpdate = async () => {
    if (!updatingProduct) {
      return;
    }

    try {
      await updateInventory({
        inventoryId: updatingProduct.inventoryId,
        price: updatingProduct.price || 0,
        productCount: Number(updateStock) || 0,
        criticalProductCount: Number(updateCriticalLevel) || 0,
        active: true,
      });

      showSuccess("Stok başarıyla güncellendi");
      setIsStockUpdateModalOpen(false);
      setUpdatingProduct(null);
      refetchAll();
    } catch (error) {
      logger.error("❌ Stock update error:", error);
      showError("Stok güncellenirken hata oluştu");
    }
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
    <Container className="bg-white" padding="none" safeTop={false}>
      {/* Toast Notification */}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Search Bar + Ürün Ekle Butonu */}
        <View className="mb-4 px-4 pt-4">
          <View className="flex-row mb-3" style={{ gap: 8 }}>
            <View style={{ flex: 1 }}>
              <SearchBar placeholder="Ürün ara..." onSearch={handleSearch} />
            </View>
            <TouchableOpacity
              onPress={() => {
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
                } else {
                  setIsAddProductModalOpen(true);
                }
              }}
              style={{
                backgroundColor: "#DC2626",
                borderRadius: 8,
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
          <View className="flex-row mb-3" style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={() => setStatusFilter("all")}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 6,
                backgroundColor: statusFilter === "all" ? "#DC2626" : "#FFFFFF",
                borderWidth: 1,
                borderColor: statusFilter === "all" ? "#DC2626" : "#E5E7EB",
              }}
            >
              <Typography
                variant="caption"
                weight="semibold"
                style={{
                  color: statusFilter === "all" ? "#FFFFFF" : "#6B7280",
                  fontSize: 12,
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
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 6,
                backgroundColor: statusFilter === "out" ? "#DC2626" : "#FFFFFF",
                borderWidth: 1,
                borderColor: statusFilter === "out" ? "#DC2626" : "#E5E7EB",
              }}
            >
              <Typography
                variant="caption"
                weight="semibold"
                style={{
                  color: statusFilter === "out" ? "#FFFFFF" : "#6B7280",
                  fontSize: 12,
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
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 6,
                backgroundColor: statusFilter === "critical" ? "#DC2626" : "#FFFFFF",
                borderWidth: 1,
                borderColor: statusFilter === "critical" ? "#DC2626" : "#E5E7EB",
              }}
            >
              <Typography
                variant="caption"
                weight="semibold"
                style={{
                  color: statusFilter === "critical" ? "#FFFFFF" : "#6B7280",
                  fontSize: 12,
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
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 6,
                backgroundColor: statusFilter === "ok" ? "#DC2626" : "#FFFFFF",
                borderWidth: 1,
                borderColor: statusFilter === "ok" ? "#DC2626" : "#E5E7EB",
              }}
            >
              <Typography
                variant="caption"
                weight="semibold"
                style={{
                  color: statusFilter === "ok" ? "#FFFFFF" : "#6B7280",
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                Normal
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
        {/* Ürün Listesi - Kompakt Görünüm */}
        <FlatList
          data={filteredInventory}
          contentContainerClassName="gap-0 px-4 pb-[120]"
          renderItem={({ item, index }) => {
            const status = item.isOutOfStock ? "out" : item.isCritical ? "critical" : "ok";
            const statusConfig = {
              out: { color: "#374151", bg: "#F9FAFB", text: "Tükendi" },
              critical: { color: "#374151", bg: "#F9FAFB", text: "Kritik" },
              ok: { color: "#374151", bg: "#F9FAFB", text: "Normal" },
            }[status];

            return (
              <View
                key={index}
                style={{
                  backgroundColor: "#FFFFFF",
                  padding: 16,
                  marginBottom: 1,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F3F4F6",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {/* Sol taraf - Ürün bilgileri */}
                <View style={{ flex: 1, gap: 8 }}>
                  {/* Ürün Adı ve Kategori */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Typography
                      variant="body"
                      weight="semibold"
                      style={{ fontSize: 15, color: "#111827" }}
                    >
                      {item.productName}
                    </Typography>
                    <Typography variant="caption" style={{ fontSize: 12, color: "#9CA3AF" }}>
                      {item.categoryName}
                    </Typography>
                  </View>

                  {/* Alt bilgiler - Fiyat ve Stok */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                    <Typography
                      variant="body"
                      weight="medium"
                      style={{ fontSize: 14, color: "#6B7280" }}
                    >
                      ₺{item.price?.toFixed(2) || "0.00"}
                    </Typography>
                    <View style={{ width: 1, height: 12, backgroundColor: "#E5E7EB" }} />
                    <Typography variant="body" style={{ fontSize: 14, color: "#6B7280" }}>
                      Stok: {item.productCount}
                    </Typography>
                    {(item.isOutOfStock || item.isCritical) && (
                      <>
                        <View style={{ width: 1, height: 12, backgroundColor: "#E5E7EB" }} />
                        <Typography
                          variant="caption"
                          weight="medium"
                          style={{ fontSize: 12, color: "#DC2626" }}
                        >
                          {statusConfig.text}
                        </Typography>
                      </>
                    )}
                  </View>
                </View>

                {/* Sağ taraf - Butonlar */}
                <View style={{ flexDirection: "row", gap: 8, marginLeft: 12 }}>
                  {/* Stok Güncelle */}
                  <TouchableOpacity
                    onPress={() => openStockUpdateModal(item)}
                    style={{
                      backgroundColor: "#DC2626",
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 6,
                    }}
                  >
                    <Icon family="Feather" name="package" size={16} color="#FFFFFF" />
                  </TouchableOpacity>

                  {/* Ürün Düzenle */}
                  <TouchableOpacity
                    onPress={() => openEditModal(item)}
                    style={{
                      backgroundColor: "#F9FAFB",
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                    }}
                  >
                    <Icon family="Feather" name="edit-2" size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          keyExtractor={(item) => item.id}
        />
      </KeyboardAvoidingView>

      {/* Ürün Ekleme Modal */}
      <Modal
        visible={isAddProductModalOpen}
        onClose={() => {
          setIsAddProductModalOpen(false);
          setNewProductName("");
          setSelectedCategoryId("");
          Keyboard.dismiss();
        }}
        title="Yeni Ürün Ekle"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ gap: 16 }}>
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

              {/* Yeni Kategori Ekle */}
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('Categories');
                  setIsAddProductModalOpen(false);
                  Keyboard.dismiss();
                }}
                style={{
                  marginTop: 12,
                  padding: 12,
                  backgroundColor: "#F3F4F6",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderStyle: "dashed",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Icon family="Feather" name="plus-circle" size={18} color="#6B7280" />
                <Typography variant="body" weight="medium" style={{ color: "#6B7280" }}>
                  Yeni Kategori Ekle
                </Typography>
              </TouchableOpacity>
            </View>

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
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
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
                  Keyboard.dismiss();
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
        </TouchableWithoutFeedback>
      </Modal>

      {/* Stok Güncelleme Modal */}
      <Modal
        visible={isStockUpdateModalOpen}
        onClose={() => {
          setIsStockUpdateModalOpen(false);
          setUpdatingProduct(null);
          Keyboard.dismiss();
        }}
        title="Stok Güncelle"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ gap: 16 }}>
            {/* Ürün Bilgisi */}
            <View
              style={{
                backgroundColor: "#F9FAFB",
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Typography variant="body" weight="semibold" style={{ color: "#111827" }}>
                {updatingProduct?.productName}
              </Typography>
              <Typography variant="caption" style={{ color: "#6B7280", marginTop: 4 }}>
                {updatingProduct?.categoryName}
              </Typography>
            </View>

            {/* Stok Miktarı */}
            <View>
              <Typography variant="body" weight="medium" className="mb-2">
                Stok Miktarı
              </Typography>
              <Input
                value={updateStock}
                onChangeText={setUpdateStock}
                placeholder="0"
                keyboardType="numeric"
                numericOnly
                variant="outlined"
                fullWidth
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            {/* Kritik Seviye */}
            <View>
              <Typography variant="body" weight="medium" className="mb-2">
                Kritik Seviye
              </Typography>
              <Input
                value={updateCriticalLevel}
                onChangeText={setUpdateCriticalLevel}
                placeholder="0"
                keyboardType="numeric"
                numericOnly
                variant="outlined"
                fullWidth
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            {/* Butonlar */}
            <View className="flex-row" style={{ gap: 12, marginTop: 8 }}>
              <Button
                variant="outline"
                onPress={() => {
                  setIsStockUpdateModalOpen(false);
                  setUpdatingProduct(null);
                  Keyboard.dismiss();
                }}
                className="flex-1"
              >
                İptal
              </Button>
              <Button
                variant="primary"
                onPress={handleStockUpdate}
                disabled={isUpdatingProduct}
                className="flex-1 bg-stock-red"
              >
                <Typography
                  variant="body"
                  weight="semibold"
                  style={{ color: isUpdatingProduct ? "#6B7280" : "#FFFFFF" }}
                >
                  {isUpdatingProduct ? "Güncelleniyor..." : "Güncelle"}
                </Typography>
              </Button>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Ürün Düzenleme Modal */}
      <Modal
        visible={isEditProductModalOpen}
        onClose={() => {
          setIsEditProductModalOpen(false);
          setEditingProduct(null);
          Keyboard.dismiss();
        }}
        title="Ürün Düzenle"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
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
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
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
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
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
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            {/* Butonlar */}
            <View className="flex-row" style={{ gap: 12, marginTop: 8 }}>
              <Button
                variant="outline"
                onPress={() => {
                  setIsEditProductModalOpen(false);
                  setEditingProduct(null);
                  Keyboard.dismiss();
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
        </TouchableWithoutFeedback>
      </Modal>
    </Container>
  );
}
