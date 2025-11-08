// app/broker/sections/salesSection.tsx
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  Text,
  Switch,
  FlatList,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  Container,
  Typography,
  Card,
  Input,
  Button,
  Icon,
  Divider,
  Modal,
  Loading,
  Toast,
  SearchBar,
} from "@/src/components/ui";
import { useToast } from "@/src/hooks/useToast";
import { useNavigation } from "@react-navigation/native";

// BACKEND HOOKS
import { useActiveBrokers, useUpdateBrokerDiscountRate } from "@/src/hooks/api/useBrokers";
import { useSalesProducts, useSalesCalculate } from "@/src/hooks/api/useSales";
import { validateDiscountRate } from "@/src/validations/brokerValidation";
import {
  useBasket,
  useAddToBasket,
  useRemoveFromBasket,
  useUpdateBasket,
} from "@/src/hooks/api/useBasket";
import { parseApiError } from "@/src/utils/apiError";

// tipler (swagger ile uyumlu)
import type { SalesSummary } from "@/src/types/sales";
import type { AddedProduct } from "@/src/types/salesUI";

export default function SalesSection() {
  const { brokerId } = useLocalSearchParams();
  const brokerIdNum = Number(brokerId);

  const navigation = useNavigation();
  const { toast, showSuccess, showError } = useToast();
  const _discountRef = useRef(null);
  // BACKEND: brokers
  const { data: brokers = [], isLoading: brokersLoading, error: brokersError } = useActiveBrokers();

  // BACKEND: products
  const {
    data: salesProducts = [],
    isLoading: salesProductsLoading,
    error: salesProductsError,
  } = useSalesProducts({ enabled: true });

  // BACKEND: basket (liste)
  const { data: basketItems = [], isLoading: basketLoading } = useBasket(brokerIdNum, {
    enabled: !!brokerIdNum,
  });

  // BACKEND: basket mutations
  const addToBasketMutation = useAddToBasket();
  const removeFromBasketMutation = useRemoveFromBasket();
  const updateBasketMutation = useUpdateBasket();

  // BACKEND: calculate
  const { mutateAsync: calculateSale } = useSalesCalculate();
  const calculateSaleRef = useRef(calculateSale);
  const isRecalculatingRef = useRef(false);
  const [summary, setSummary] = useState<SalesSummary | null>(null);

  useEffect(() => {
    calculateSaleRef.current = calculateSale;
  }, [calculateSale]);

  const updateDiscountRateMutation = useUpdateBrokerDiscountRate();

  // UI State
  const [createInvoice, setCreateInvoice] = useState(true);

  // Add product modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addModalStep, setAddModalStep] = useState<1 | 2>(1);
  const [modalSelectedProduct, setModalSelectedProduct] = useState("");
  const [modalQuantity, setModalQuantity] = useState("");
  const [modalQuantityError, setModalQuantityError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AddedProduct | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editQuantityError, setEditQuantityError] = useState("");

  // Discount inline edit state
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [_validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Find broker from loaded backend data
  const broker = brokers.find((b: any) => String(b.id) === String(brokerId));
  const brokerDebt = broker
    ? ((broker as any)?.currentBalance ?? (broker as any)?.balance ?? 0)
    : 0;

  const brokerDiscount = broker?.discountRate || 0;

  // ---- Helpers (yukarıda olsun ki aşağıda kullanılabilsin) ----
  function getTaxRate(p: unknown): number | undefined {
    if (!p || typeof p !== "object") return undefined;
    const v = (p as any).taxRate;
    return typeof v === "number" ? v : undefined;
  }

  // Header cancel (UI aynı)
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            if (addedProducts.length > 0) {
              Alert.alert(
                "Satışı İptal Et",
                "Satış işlemini iptal edip aracı detayına dönmek istiyor musunuz?",
                [
                  { text: "Satışa devam et", style: "cancel" },
                  {
                    text: "Satışı İptal Et",
                    style: "destructive",
                    onPress: () => {
                      addedProducts.map((product) => {
                        handleRemoveProduct(product.id, true);
                      });

                      router.replace({
                        pathname: "/broker/brokerDetail",
                        params: { brokerId: brokerId },
                      });
                    },
                  },
                ],
              );
            } else {
              router.replace({
                pathname: "/broker/brokerDetail",
                params: { brokerId: brokerId },
              });
            }
          }}
          style={{ paddingLeft: 16 }}
        >
          <Text style={{ color: "#E3001B", fontSize: 16, fontWeight: "600" }}>İptal</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, brokerId]);

  // Sepeti backend’den UI tipine map (KDV bilgilerini de al)
  const addedProducts: AddedProduct[] = useMemo(() => {
    return (basketItems || []).map((i: any) => ({
      id: String(i.id ?? i.productId),
      name: i.name ?? i.productName,
      quantity: i.quantity ?? i.productCount,
      unitPrice: i.unitPrice ?? i.price,
      // Sağdaki toplamda öncelik KDV dahil tutar
      totalPrice: i.totalPriceWithTax ?? i.totalPrice ?? i.total,
      taxRate: i.taxRate,
      taxPrice: i.taxPrice,
      totalPriceWithTax: i.totalPriceWithTax,
    }));
  }, [basketItems]);

  // Ürün seçenekleri (sepette olanları gizle)
  const availableProducts = useMemo(() => {
    const ids = new Set(addedProducts.map((p) => p.id));
    const products = salesProducts || [];
    return (products || []).filter((p: any) => !ids.has(String(p.id ?? p.productId)));
  }, [salesProducts, addedProducts]);

  // Arama yapılmış ürünler
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableProducts;
    }
    const query = searchQuery.toLowerCase().trim();
    return availableProducts.filter((p: any) => p.name.toLowerCase().includes(query));
  }, [availableProducts, searchQuery]);

  /* --------------------- Adet doğrulamaları (yerel) --------------------- */
  const validateQtyFormat = (value: string) => {
    if (!value || !/^\d+$/.test(value)) return "Geçersiz adet";
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) return "Adet 1 veya daha büyük olmalıdır";
    return "";
  };

  const validateQuantity = (value: string, maxStock?: number) => {
    const base = validateQtyFormat(value);
    if (base) return base;
    const qty = Number(value);
    if (maxStock && qty > maxStock) {
      return `Yetersiz stok! Mevcut stok: ${maxStock} adet`;
    }
    return "";
  };

  // Toplamı /sales/calculate ile güncelle
  const recalcTotals = useCallback(async () => {
    if (!brokerIdNum || isRecalculatingRef.current) return;

    isRecalculatingRef.current = true;

    try {
      const result = await calculateSaleRef.current({
        brokerId: brokerIdNum,
        createInvoice,
      });
      setSummary(result);
    } catch (error) {
      const apiError = parseApiError(error);

      if (apiError.status === 404) {
        setSummary(null);
        return;
      }

      if (apiError.status === 0) {
        // Network timeout; keep previous summary but avoid spamming
        return;
      }

      setSummary(null);
    } finally {
      isRecalculatingRef.current = false;
    }
  }, [brokerIdNum, createInvoice]);

  // Modal açma/kapama fonksiyonları
  const handleOpenAddModal = () => {
    setAddModalVisible(true);
    setAddModalStep(1);
    setModalSelectedProduct("");
    setModalQuantity("");
    setModalQuantityError("");
    setSearchQuery("");
  };

  const handleCloseAddModal = () => {
    setAddModalVisible(false);
    setAddModalStep(1);
    setModalSelectedProduct("");
    setModalQuantity("");
    setModalQuantityError("");
    setSearchQuery("");
  };

  const handleModalProductSelect = (productId: string) => {
    setModalSelectedProduct(productId);
  };

  const handleModalNextStep = () => {
    if (modalSelectedProduct) {
      setAddModalStep(2);
      setModalQuantity("");
      setModalQuantityError("");
    }
  };

  const handleModalBackStep = () => {
    setAddModalStep(1);
    setModalQuantity("");
    setModalQuantityError("");
  };

  const handleModalQuantityChange = (text: string) => {
    setModalQuantity(text);
    if (text) {
      const modalProduct = availableProducts.find(
        (p: any) => String(p.id ?? p.productId) === modalSelectedProduct,
      );
      const error = validateQuantity(text, modalProduct?.stock);
      setModalQuantityError(error);
    } else {
      setModalQuantityError("");
    }
  };

  // Seçilen modal ürün bilgisi
  const modalProductData = availableProducts.find(
    (p: any) => String(p.id ?? p.productId) === modalSelectedProduct,
  );

  // Ürün ekle (POST /basket/add)
  const handleAddProduct = async () => {
    if (!modalProductData || !modalQuantity) return;
    const error = validateQuantity(modalQuantity, modalProductData.stock);
    if (error) {
      setModalQuantityError(error);
      return;
    }

    try {
      await addToBasketMutation.mutateAsync({
        brokerId: brokerIdNum,
        productId: Number(modalSelectedProduct),
        productCount: parseInt(modalQuantity, 10),
      });
      handleCloseAddModal();
      await recalcTotals();
      showSuccess("Ürün sepete eklendi.");
    } catch {
      showError("Ürün eklenirken hata oluştu.");
    }
  };

  // Ürün sil (POST /basket/remove)
  const handleRemoveProduct = useCallback(
    async (productId: string, skipAlert?: boolean) => {
      if (skipAlert) {
        try {
          await removeFromBasketMutation.mutateAsync({
            brokerId: brokerIdNum,
            productId: Number(productId),
          });
          await recalcTotals();
          showSuccess("Ürün kaldırıldı.");
        } catch {
          showError("Ürün kaldırılırken hata oluştu.");
        }
      } else {
        Alert.alert("Ürün Kaldır", "Bu ürünü listeden kaldırmak istiyor musunuz?", [
          { text: "İptal", style: "cancel" },
          {
            text: "Kaldır",
            style: "destructive",
            onPress: async () => {
              try {
                await removeFromBasketMutation.mutateAsync({
                  brokerId: brokerIdNum,
                  productId: Number(productId),
                });
                await recalcTotals();
                showSuccess("Ürün kaldırıldı.");
              } catch {
                showError("Ürün kaldırılırken hata oluştu.");
              }
            },
          },
        ]);
      }
    },
    [brokerIdNum, removeFromBasketMutation, recalcTotals, showSuccess, showError],
  );

  // Header cancel (UI aynı)
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            if (addedProducts.length > 0) {
              Alert.alert(
                "Satışı İptal Et",
                "Satış işlemini iptal edip aracı detayına dönmek istiyor musunuz?",
                [
                  { text: "Satışa devam et", style: "cancel" },
                  {
                    text: "Satışı İptal Et",
                    style: "destructive",
                    onPress: () => {
                      addedProducts.map((product) => {
                        handleRemoveProduct(product.id, true);
                      });

                      router.replace({
                        pathname: "/broker/brokerDetail",
                        params: { brokerId: brokerId },
                      });
                    },
                  },
                ],
              );
            } else {
              router.replace({
                pathname: "/broker/brokerDetail",
                params: { brokerId: brokerId },
              });
            }
          }}
          style={{ paddingLeft: 16 }}
        >
          <Text style={{ color: "#E3001B", fontSize: 16, fontWeight: "600" }}>İptal</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, brokerId, addedProducts, handleRemoveProduct]);

  // Edit aç/kapat
  const handleEditProduct = (productId: string) => {
    const product = addedProducts.find((p) => p.id === productId);
    if (!product) return;
    setEditingProduct(product);
    setEditQuantity(String(product.quantity));
    setEditQuantityError("");
    setEditModalVisible(true);
  };

  const handleEditQuantityChange = (text: string) => {
    setEditQuantity(text);
    if (text) {
      const formatErr = validateQtyFormat(text);
      if (formatErr) {
        setEditQuantityError(formatErr);
        return;
      }
      const qty = parseInt(text, 10);
      const original = salesProducts.find(
        (p: any) => String(p.id ?? p.productId) === editingProduct?.id,
      ) as any;
      if (original && qty > original.stock) {
        setEditQuantityError(`Yetersiz stok! Mevcut stok: ${original.stock} adet`);
      } else {
        setEditQuantityError("");
      }
    } else {
      setEditQuantityError("");
    }
  };

  // Ürün adedi güncelle (
  // Not: Sepet güncellemeleri için doğrudan updateBasketMutation kullanılıyor.)

  const handleSaveEdit = async () => {
    if (!editingProduct || !editQuantity || !!editQuantityError) return;
    const qty = parseInt(editQuantity, 10);

    try {
      await updateBasketMutation.mutateAsync({
        brokerId: brokerIdNum,
        productId: Number(editingProduct.id),
        productCount: qty,
      });
      setEditModalVisible(false);
      setEditingProduct(null);
      setEditQuantity("");
      setEditQuantityError("");
      await recalcTotals();
      showSuccess("Adet güncellendi.");
    } catch {
      showError("Adet güncellenemedi.");
    }
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setEditingProduct(null);
    setEditQuantity("");
    setEditQuantityError("");
  };

  // Discount UI
  const handleEditDiscountPress = () => {
    setDiscountValue(String(brokerDiscount ?? 0));
    setDiscountError("");
    setValidationErrors({});
    setIsEditingDiscount(true);
  };

  const handleDiscountChange = (text: string) => {
    setDiscountValue(text);
    const validation = validateDiscountRate(text);
    setValidationErrors(validation.errors);
    setDiscountError(validation.isValid ? "" : validation.errors.discountRate || "Geçersiz değer");
  };

  const handleSaveDiscount = async () => {
    const validation = validateDiscountRate(discountValue);
    setValidationErrors(validation.errors);
    if (!validation.isValid) {
      showError("Lütfen geçerli bir iskonto oranı girin.");
      return;
    }
    const discount = parseFloat(discountValue);
    try {
      await updateDiscountRateMutation.mutateAsync({
        brokerId: brokerId as string,
        discountRate: discount,
      });
      setIsEditingDiscount(false);
      setDiscountValue("");
      setDiscountError("");
      setValidationErrors({});
      showSuccess("İskonto oranı güncellendi!");
      await recalcTotals();
    } catch {
      showError("İskonto oranı güncellenirken bir hata oluştu.");
    }
  };

  const handleCancelDiscountEdit = () => {
    setIsEditingDiscount(false);
    setDiscountValue("");
    setDiscountError("");
    setValidationErrors({});
  };

  // createInvoice veya sepet değişince backend toplamı güncelle
  useEffect(() => {
    if (!brokerIdNum) return;
    if ((basketItems || []).length === 0) {
      setSummary(null);
      return;
    }
    recalcTotals();
  }, [brokerIdNum, basketItems, recalcTotals]);

  // Confirm sayfasına geçiş
  const handleCompleteSale = () => {
    if (!addedProducts.length) {
      Alert.alert("Hata", "Lütfen en az bir ürün ekleyiniz.");
      return;
    }

    router.push({
      pathname: "/broker/sections/confirmSales",
      params: {
        brokerId: brokerId,
        salesData: JSON.stringify(
          addedProducts.map((p) => ({
            id: p.id,
            name: p.name,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            totalPrice: p.totalPriceWithTax ?? p.totalPrice,
            taxRate: p.taxRate,
            taxPrice: p.taxPrice,
          })),
          null,
          0,
        ),
        createInvoice: createInvoice.toString(),
      },
    });
  };

  // Loading state
  if (
    (brokersLoading && !brokersError) ||
    (salesProductsLoading && !salesProductsError) ||
    basketLoading
  ) {
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <View className="items-center justify-center flex-1">
          <Loading size="large" />
        </View>
      </Container>
    );
  }

  if (!broker) {
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <View className="items-center justify-center flex-1">
          <Typography variant="body" className="text-stock-text">
            Aracı bulunamadı...
          </Typography>
        </View>
      </Container>
    );
  }

  return (
    <Container className="bg-white" padding="sm" safeTop={false}>
      {(brokersError || salesProductsError) && (
        <View className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
          <Typography variant="body" className="text-yellow-800 text-center">
            ⚠️ Backend bağlantı hatası - Local veriler gösteriliyor
            {brokersError && " (Broker)"}
            {salesProductsError && " (Ürünler)"}
          </Typography>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {/* Header */}
        <View className="mb-6 items-center">
          <Typography
            variant="h1"
            weight="bold"
            size="3xl"
            className="text-stock-black text-center mb-0"
          >
            {`${broker.name} ${broker.surname}`}
          </Typography>
          <Typography
            variant="body"
            weight="semibold"
            className={`${
              brokerDebt >= 0 ? "text-stock-red" : "text-stock-green"
            } text-center mt-0`}
          >
            Bakiye: {brokerDebt >= 0 ? "" : "-"}₺{Math.abs(brokerDebt).toLocaleString()}
          </Typography>
        </View>

        {/* İskonto & Fatura */}
        <View className="mb-4">
          {/* İskonto Card - Kırmızı Arka Plan */}
          <Card variant="default" padding="sm" className="bg-stock-red border-0 mb-3" radius="md">
            {!isEditingDiscount ? (
              <View className="flex-row items-center justify-between px-2">
                <Typography variant="body" weight="bold" className="text-stock-white">
                  İSKONTO: %{brokerDiscount}
                </Typography>
                <TouchableOpacity onPress={handleEditDiscountPress} activeOpacity={0.7}>
                  <Icon
                    family="MaterialIcons"
                    name="edit"
                    size={20}
                    color="#FFFFFF"
                    containerClassName="p-1"
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <View
                className="flex-row items-center gap-2"
                style={{ minHeight: 48, maxHeight: 48 }}
              >
                <View className="flex-1">
                  <Input
                    placeholder="İskonto %"
                    value={discountValue}
                    onChangeText={handleDiscountChange}
                    numericOnly
                    autoFocus
                    className="mb-0"
                    style={{ backgroundColor: "#FFF", minHeight: 48, maxHeight: 48 }}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSaveDiscount}
                  activeOpacity={0.7}
                  disabled={
                    !discountValue || !!discountError || updateDiscountRateMutation.isPending
                  }
                >
                  <View className="bg-white rounded-full p-2">
                    <Icon family="Ionicons" name="checkmark" size={20} color="#22C55E" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCancelDiscountEdit}
                  activeOpacity={0.7}
                  disabled={updateDiscountRateMutation.isPending}
                >
                  <View className="bg-white rounded-full p-2">
                    <Icon family="Ionicons" name="close" size={20} color="#E3001B" />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <View className="flex-row items-center justify-between mt-5 px-2">
              <Typography variant="body" weight="bold" className="text-stock-white">
                FATURA OLUŞTUR
              </Typography>
              <Switch
                value={createInvoice}
                onValueChange={setCreateInvoice}
                trackColor={{ false: "#D1D5DB", true: "#FFFFFF" }}
                thumbColor={createInvoice ? "#E3001B" : "#F3F4F6"}
                ios_backgroundColor="#D1D5DB"
                style={{ marginRight: 8 }}
              />
            </View>
          </Card>
        </View>

        {/* Hiç ürün yoksa stok takibe yönlendir */}
        {salesProducts.length === 0 && !salesProductsLoading && (
          <View className="mb-4 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <View className="items-center mb-4">
              <Icon
                family="MaterialCommunityIcons"
                name="package-variant-closed"
                size={48}
                color="#EAB308"
                containerClassName="mb-3"
              />
              <Typography
                variant="body"
                className="text-yellow-800 text-center mb-2"
                weight="semibold"
              >
                Stokta Ürün Bulunamadı
              </Typography>
              <Typography variant="caption" className="text-yellow-700 text-center mb-4">
                Satış yapabilmek için önce stok takip sayfasından ürün eklemeniz gerekmektedir.
              </Typography>
            </View>
            <Button
              variant="primary"
              size="md"
              fullWidth
              className="bg-stock-red"
              onPress={() => router.push("/stock")}
            >
              <View className="flex-row items-center justify-center">
                <Icon
                  family="MaterialIcons"
                  name="inventory-2"
                  size={20}
                  color="#FFFFFF"
                  containerClassName="mr-2"
                />
                <Typography className="text-white" weight="semibold">
                  Stok Takibe Git
                </Typography>
              </View>
            </Button>
          </View>
        )}

        {/* Tüm ürünler sepete eklendiğinde gösterilecek mesaj */}
        {availableProducts.length === 0 && addedProducts.length > 0 && (
          <View className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <View className="flex-row items-center justify-center">
              <Icon
                family="Ionicons"
                name="checkmark-circle"
                size={20}
                color="#22C55E"
                containerClassName="mr-2"
              />
              <Typography variant="body" className="text-green-700 text-center" weight="medium">
                Tüm ürünler sepete eklendi
              </Typography>
            </View>
          </View>
        )}

        {/* Divider */}
        {addedProducts.length > 0 && (
          <View className="mb-4">
            <Divider />
          </View>
        )}

        {/* Eklenen Ürünler */}
        {addedProducts.length > 0 ? (
          <View className={`mb-4 ${addedProducts.length >= 3 ? "mb-8" : ""}`}>
            <Typography variant="h4" weight="semibold" className="text-stock-dark mb-4">
              EKLENEN ÜRÜNLER
            </Typography>

            {addedProducts.map((product, index) => (
              <Card
                key={`${product.id}-${index}`}
                variant="default"
                padding="md"
                className="border border-stock-border mb-3"
                radius="md"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Typography variant="body" weight="semibold" className="text-stock-dark mb-1">
                      {product.name}
                    </Typography>

                    <Typography variant="caption" className="text-stock-text">
                      {product.quantity} adet × ₺{product.unitPrice.toLocaleString()}
                    </Typography>

                    {product.taxRate != null && (
                      <Typography variant="caption" className="text-stock-text">
                        KDV %{product.taxRate} = ₺{(product.taxPrice ?? 0).toLocaleString()}
                      </Typography>
                    )}
                  </View>

                  {/* ✅ Aksiyon ikonları */}
                  <View className="flex-row items-center">
                    <Icon
                      family="MaterialIcons"
                      name="edit"
                      size={20}
                      color="#67686A"
                      pressable
                      onPress={() => handleEditProduct(product.id)}
                      containerClassName="mr-3 p-1"
                    />
                    <Icon
                      family="MaterialIcons"
                      name="cancel"
                      size={20}
                      color="#E3001B"
                      pressable
                      onPress={() => handleRemoveProduct(product.id)} // /basket/remove
                      containerClassName="p-1"
                    />
                  </View>
                </View>
              </Card>
            ))}
            <Button
              variant="outline"
              size="lg"
              fullWidth
              className="border-stock-border mb-5"
              onPress={handleOpenAddModal}
            >
              Ürün Ekle
            </Button>

            {/* Toplam Hesaplaması (backend calculate) */}
            <View className="bg-stock-gray p-4 rounded-lg mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Typography variant="body" weight="medium" className="text-stock-dark">
                  Alt Toplam:
                </Typography>
                <Typography variant="body" weight="semibold" className="text-stock-dark">
                  ₺{(summary?.subtotalPrice ?? 0).toLocaleString()}
                </Typography>
              </View>

              {(summary?.discountPrice ?? 0) > 0 && (
                <View className="flex-row justify-between items-center mb-2">
                  <Typography variant="body" weight="medium" className="text-stock-red">
                    İskonto (%{summary?.discountRate ?? brokerDiscount}):
                  </Typography>
                  <Typography variant="body" weight="semibold" className="text-stock-red">
                    -₺{(summary?.discountPrice ?? 0).toLocaleString()}
                  </Typography>
                </View>
              )}

              {/* İskontodan sonraki ara toplam (KDV hariç) */}
              <View className="flex-row justify-between items-center mb-2">
                <Typography variant="body" weight="medium" className="text-stock-dark">
                  Ara Toplam (KDV hariç):
                </Typography>
                <Typography variant="body" weight="semibold" className="text-stock-dark">
                  ₺{(summary?.totalPrice ?? 0).toLocaleString()}
                </Typography>
              </View>

              {/* Toplam KDV */}
              <View className="flex-row justify-between items-center mb-2">
                <Typography variant="body" weight="medium" className="text-stock-dark">
                  KDV Toplamı:
                </Typography>
                <Typography variant="body" weight="semibold" className="text-stock-dark">
                  ₺{(summary?.totalTaxPrice ?? 0).toLocaleString()}
                </Typography>
              </View>

              <Divider className="my-2" />

              <View className="flex-row justify-between items-center">
                <Typography variant="body" weight="bold" className="text-stock-black">
                  Genel Toplam (KDV dahil):
                </Typography>
                <Typography variant="h3" weight="bold" className="text-stock-red">
                  ₺{(summary?.totalPriceWithTax ?? 0).toLocaleString()}
                </Typography>
              </View>
            </View>

            {/* Satışı Tamamla */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="bg-stock-red mb-16"
              onPress={handleCompleteSale}
              leftIcon={<Icon family="Ionicons" name="checkmark-circle" size={20} color="white" />}
            >
              <Typography className="text-white" weight="bold">
                SATIŞI TAMAMLA
              </Typography>
            </Button>
          </View>
        ) : (
          <Button
            variant="outline"
            size="lg"
            fullWidth
            className="border-stock-border"
            onPress={handleOpenAddModal}
          >
            Ürün Ekle
          </Button>
        )}

        {/* Boş durum */}
        {addedProducts.length === 0 && (
          <View className="items-center py-8">
            <Icon
              family="MaterialIcons"
              name="shopping-cart"
              size={48}
              color="#ECECEC"
              containerClassName="mb-4"
            />
            <Typography variant="body" className="text-stock-text text-center">
              Henüz ürün eklenmedi.{"\n"}Yukarıdan ürün seçerek satış listesi oluşturun.
            </Typography>
          </View>
        )}

        {addedProducts.length >= 3 && <View style={{ height: 80 }} />}
      </ScrollView>

      {/* Ürün Ekleme Modalı */}
      <Modal
        visible={addModalVisible}
        onClose={handleCloseAddModal}
        title={addModalStep === 1 ? "Ürün Seçiniz" : "Adet Giriniz"}
        size="lg"
        className="bg-white mx-6"
      >
        <View
          style={
            addModalStep === 1
              ? {
                  maxHeight: Dimensions.get("window").height * 0.7,
                  minHeight: Dimensions.get("window").height * 0.7,
                }
              : {}
          }
        >
          {addModalStep === 1 ? (
            <>
              <SearchBar
                placeholder="Ürün ara..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSearch={setSearchQuery}
                showClearButton={true}
                className="mb-3"
              />

              <FlatList
                data={filteredProducts}
                keyExtractor={(item: any) => String(item.id ?? item.productId)}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 16 }}
                ListEmptyComponent={
                  <View className="items-center py-8">
                    <Icon
                      family="MaterialCommunityIcons"
                      name={searchQuery ? "magnify" : "package-variant"}
                      size={48}
                      color="#D1D5DB"
                      containerClassName="mb-3"
                    />
                    <Typography variant="body" className="text-stock-text text-center">
                      {searchQuery
                        ? `"${searchQuery}" için sonuç bulunamadı`
                        : "Eklenebilecek ürün kalmadı"}
                    </Typography>
                  </View>
                }
                renderItem={({ item }: any) => {
                  const productId = String(item.id ?? item.productId);
                  const isSelected = modalSelectedProduct === productId;
                  const taxRate = getTaxRate(item);

                  return (
                    <TouchableOpacity
                      onPress={() => handleModalProductSelect(productId)}
                      activeOpacity={0.7}
                    >
                      <Card
                        variant="outlined"
                        padding="sm"
                        className={`mb-2 ${
                          isSelected
                            ? "border-2 border-stock-red bg-red-50"
                            : "border border-stock-border"
                        }`}
                        radius="md"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1">
                            <Typography
                              variant="body"
                              weight="semibold"
                              className={isSelected ? "text-stock-red" : "text-stock-dark"}
                            >
                              {item.name}
                            </Typography>
                            <View className="flex-row items-center mt-0.5">
                              <Typography variant="caption" className="text-stock-text">
                                ₺{item.unitPrice.toLocaleString()}
                              </Typography>
                              <Typography
                                variant="caption"
                                className={`ml-3 ${
                                  item.stock > 10 ? "text-green-600" : "text-orange-600"
                                }`}
                              >
                                Stok: {item.stock}
                              </Typography>
                              {taxRate != null && (
                                <Typography variant="caption" className="text-stock-text ml-3">
                                  KDV %{taxRate}
                                </Typography>
                              )}
                            </View>
                          </View>

                          {isSelected && (
                            <View className="bg-stock-red rounded-full p-1 ml-2">
                              <Icon family="Ionicons" name="checkmark" size={18} color="#FFFFFF" />
                            </View>
                          )}
                        </View>
                      </Card>
                    </TouchableOpacity>
                  );
                }}
              />

              <View className="mt-4 pt-4 border-t border-stock-border">
                <Button
                  variant="primary"
                  fullWidth
                  className="bg-stock-red mb-3"
                  onPress={handleModalNextStep}
                  disabled={!modalSelectedProduct}
                >
                  <Typography className="text-white" weight="semibold">
                    İleri
                  </Typography>
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  className="border-stock-border"
                  onPress={handleCloseAddModal}
                >
                  <Typography className="text-stock-dark">İptal</Typography>
                </Button>
              </View>
            </>
          ) : (
            <>
              {modalProductData && (
                <>
                  <View className="bg-gray-50 p-3 rounded-lg mb-4">
                    <Typography variant="body" weight="semibold" className="text-stock-dark mb-1">
                      {modalProductData.name}
                    </Typography>
                    <Typography variant="body" weight="semibold" className="text-stock-dark mb-1">
                      {modalProductData.stock} adet stok mevcut
                    </Typography>
                    <Typography variant="caption" className="text-stock-text">
                      ₺{modalProductData.unitPrice.toLocaleString()} / adet
                    </Typography>
                  </View>

                  <Input
                    label="Adet Giriniz"
                    placeholder="Kaç adet?"
                    value={modalQuantity}
                    onChangeText={handleModalQuantityChange}
                    numericOnly
                    error={modalQuantityError}
                    helperText={
                      !modalQuantityError
                        ? `Mevcut stok: ${modalProductData.stock} adet${
                            getTaxRate(modalProductData) != null
                              ? ` / KDV %${getTaxRate(modalProductData)}`
                              : ""
                          }`
                        : ""
                    }
                    className="mb-4"
                  />

                  {modalQuantity && !modalQuantityError && (
                    <View className="bg-blue-50 p-3 rounded-lg mb-4">
                      <Typography variant="caption" className="text-blue-700" weight="medium">
                        Toplam: ₺
                        {(
                          parseInt(modalQuantity, 10) * modalProductData.unitPrice
                        ).toLocaleString()}
                      </Typography>
                    </View>
                  )}
                </>
              )}

              <View className="mt-6">
                <Button
                  variant="primary"
                  fullWidth
                  className="bg-stock-red mb-3"
                  onPress={handleAddProduct}
                  disabled={!modalQuantity || !!modalQuantityError || addToBasketMutation.isPending}
                  loading={addToBasketMutation.isPending}
                >
                  <Typography className="text-white" weight="semibold">
                    Sepete Ekle
                  </Typography>
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  className="border-stock-border"
                  onPress={handleModalBackStep}
                  disabled={addToBasketMutation.isPending}
                >
                  <Typography className="text-stock-dark">Geri</Typography>
                </Button>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Ürün Düzenleme Modalı */}
      <Modal
        visible={editModalVisible}
        onClose={handleCloseEditModal}
        title="Ürün Düzenle"
        size="lg"
        className="bg-white mx-6"
      >
        <View>
          {editingProduct && (
            <>
              <Typography variant="body" weight="semibold" className="text-stock-dark mb-4">
                {editingProduct.name}
              </Typography>

              <Input
                label="Yeni Adet"
                placeholder="Kaç adet?"
                value={editQuantity}
                onChangeText={handleEditQuantityChange}
                numericOnly
                error={editQuantityError}
                className="mb-4"
              />

              {editQuantity && !editQuantityError && (
                <View className="bg-blue-50 p-3 rounded-lg mb-4">
                  <Typography variant="caption" className="text-blue-700" weight="medium">
                    Yeni Toplam: ₺
                    {(parseInt(editQuantity, 10) * editingProduct.unitPrice).toLocaleString()}
                  </Typography>
                </View>
              )}
            </>
          )}

          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleSaveEdit}
              disabled={!editQuantity || !!editQuantityError}
            >
              <Typography className="text-white">Güncelle</Typography>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="border-stock-border"
              onPress={handleCloseEditModal}
            >
              <Typography className="text-stock-dark">İptal</Typography>
            </Button>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </Container>
  );
}
