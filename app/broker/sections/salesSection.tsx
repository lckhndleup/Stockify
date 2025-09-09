// app/broker/sections/salesSection.tsx
import React, { useState, useMemo, useEffect } from "react";
import { View, ScrollView, Alert, TouchableOpacity, Text } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  Container,
  Typography,
  Card,
  SelectBox,
  Input,
  Button,
  Icon,
  Divider,
  Modal,
  Checkbox,
  Loading,
  // @ts-ignore TODOMALİ
  type SelectBoxOption,
  Toast,
} from "@/src/components/ui";
import { useAppStore } from "@/src/stores/appStore";
import { useToast } from "@/src/hooks/useToast";
import { useNavigation } from "@react-navigation/native";

// BACKEND HOOKS
import {
  useActiveBrokers,
  useUpdateBrokerDiscountRate,
} from "@/src/hooks/api/useBrokers";
import { useSalesProducts, useSalesCalculate } from "@/src/hooks/api/useSales";
import {
  useBasket,
  useAddToBasket,
  useRemoveFromBasket,
  useUpdateBasket,
} from "@/src/hooks/api/useBasket";

import { apiService } from "@/src/services/api";
// tipler (swagger ile uyumlu)
import type { SalesSummary } from "@/src/types/sales";

// UI’da kullanılan ara tip
interface AddedProduct {
  id: string; // productId
  name: string;
  quantity: number;
  unitPrice: number;
  /** Kart sağ tarafında gösterilecek toplam için KDV dahil tutarı da taşıyalım */
  totalPrice: number; // geriye dönük; yoksa totalPriceWithTax kullanacağız
  taxRate?: number;
  taxPrice?: number;
  totalPriceWithTax?: number;
}

export default function SalesSection() {
  const { brokerId } = useLocalSearchParams();
  const brokerIdNum = Number(brokerId);

  const navigation = useNavigation();
  const { toast, showSuccess, showError } = useToast();

  // BACKEND: brokers
  const {
    data: backendBrokers = [],
    isLoading: brokersLoading,
    error: brokersError,
  } = useActiveBrokers();

  // BACKEND: products
  const {
    data: salesProducts = [],
    isLoading: salesProductsLoading,
    error: salesProductsError,
  } = useSalesProducts({ enabled: true });

  // BACKEND: basket (liste)
  const { data: basketItems = [], isLoading: basketLoading } = useBasket(
    brokerIdNum,
    { enabled: !!brokerIdNum }
  );

  // BACKEND: basket mutations
  const addToBasketMutation = useAddToBasket();
  const removeFromBasketMutation = useRemoveFromBasket();
  const updateBasketMutation = useUpdateBasket();

  // BACKEND: calculate
  const calcMutation = useSalesCalculate();
  const [summary, setSummary] = useState<SalesSummary | null>(null);

  // LOCAL STORE – sadece fallback için
  const {
    brokers: localBrokers,
    getActiveProducts,
    getBrokerTotalDebt,
    getBrokerDiscount: getLocalBrokerDiscount,
    updateBrokerDiscount: updateLocalBrokerDiscount,
  } = useAppStore();

  const updateDiscountRateMutation = useUpdateBrokerDiscountRate();

  // UI State
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [createInvoice, setCreateInvoice] = useState(true);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AddedProduct | null>(
    null
  );
  const [editQuantity, setEditQuantity] = useState("");
  const [editQuantityError, setEditQuantityError] = useState("");

  // Discount modal state
  const [discountModalVisible, setDiscountModalVisible] = useState(false);
  const [discountValue, setDiscountValue] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Broker seçimi (backend > local)
  const brokers = brokersError ? localBrokers : backendBrokers;
  const broker = brokers.find((b: any) => String(b.id) === String(brokerId));
  const brokerDebt = broker
    ? "balance" in broker
      ? (broker as any).balance
      : getBrokerTotalDebt(broker.id)
    : 0;

  const brokerDiscount = broker
    ? broker.discountRate || 0
    : brokersError
    ? getLocalBrokerDiscount(brokerId as string)
    : 0;

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
            Alert.alert(
              "Satışı İptal Et",
              "Satış işlemini iptal edip aracı detayına dönmek istiyor musunuz?",
              [
                { text: "Devam Et", style: "cancel" },
                {
                  text: "İptal Et",
                  style: "destructive",
                  onPress: () => {
                    router.replace({
                      pathname: "/broker/brokerDetail",
                      params: { brokerId: brokerId },
                    });
                  },
                },
              ]
            );
          }}
          style={{ paddingLeft: 16 }}
        >
          <Text style={{ color: "#E3001B", fontSize: 16, fontWeight: "600" }}>
            İptal
          </Text>
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
  const addedIds = new Set(addedProducts.map((p) => p.id));
  const activeProducts = salesProductsError
    ? getActiveProducts()
    : salesProducts;
  const availableProducts = useMemo(
    () =>
      (activeProducts || []).filter(
        (p: any) => !addedIds.has(String(p.id ?? p.productId))
      ),
    [activeProducts, addedIds]
  );

  const productOptions: SelectBoxOption[] = (availableProducts || []).map(
    (product: any) => {
      const rate = getTaxRate(product);
      return {
        label: `${product.name} (Stok: ${product.stock}, ₺${
          product.unitPrice ?? product.price
        }/adet${rate != null ? ` + KDV %${rate}` : ""})`,
        value: String(product.id ?? product.productId),
      };
    }
  );

  // Seçilen ürün bilgisi
  const selectedProductData = availableProducts.find(
    (p: any) => String(p.id ?? p.productId) === selectedProduct
  );

  /* --------------------- Adet doğrulamaları (yerel) --------------------- */
  const validateQtyFormat = (value: string) => {
    if (!value || !/^\d+$/.test(value)) return "Geçersiz adet";
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0)
      return "Adet 1 veya daha büyük olmalıdır";
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

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    setQuantity("");
    setQuantityError("");
  };

  const handleQuantityChange = (text: string) => {
    setQuantity(text);
    if (text) {
      const error = validateQuantity(text, selectedProductData?.stock);
      setQuantityError(error);
    } else {
      setQuantityError("");
    }
  };

  // Toplamı /sales/calculate ile güncelle
  const recalcTotals = async () => {
    if (!brokerIdNum) return;
    try {
      const res = await calcMutation.mutateAsync({
        brokerId: brokerIdNum,
        createInvoice,
      });
      setSummary(res);
    } catch {
      // sepet boş vs.
      setSummary(null);
    }
  };

  // Ürün ekle (POST /basket/add)
  const handleAddProduct = async () => {
    if (!selectedProductData || !quantity) return;
    const error = validateQuantity(quantity, selectedProductData.stock);
    if (error) {
      setQuantityError(error);
      return;
    }

    try {
      await addToBasketMutation.mutateAsync({
        brokerId: brokerIdNum,
        productId: Number(selectedProduct),
        productCount: parseInt(quantity, 10),
      });
      setSelectedProduct("");
      setQuantity("");
      setQuantityError("");
      await recalcTotals();
      showSuccess("Ürün sepete eklendi.");
    } catch {
      showError("Ürün eklenirken hata oluştu.");
    }
  };

  // Ürün sil (POST /basket/remove)
  const handleRemoveProduct = (productId: string) => {
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
  };

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
        (p: any) => String(p.id ?? p.productId) === editingProduct?.id
      ) as any;
      if (original && qty > original.stock) {
        setEditQuantityError(
          `Yetersiz stok! Mevcut stok: ${original.stock} adet`
        );
      } else {
        setEditQuantityError("");
      }
    } else {
      setEditQuantityError("");
    }
  };

  // Ürün adedi güncelle (öncelik /basket/update, fallback remove→add)
  const updateBasketQuantity = async (
    productId: number,
    productCount: number
  ) => {
    const svc: any = apiService as any;

    // 1) apiService.updateBasket varsa
    if (typeof svc.updateBasket === "function") {
      return await svc.updateBasket({
        brokerId: brokerIdNum,
        productId,
        productCount,
      });
    }

    // 2) Düşük seviye request ile deneyelim
    if (typeof svc.request === "function") {
      try {
        await svc.request("/basket/update", {
          method: "POST",
          body: JSON.stringify({
            brokerId: brokerIdNum,
            productId,
            productCount,
          }),
        });
        return { success: true };
      } catch {
        // fallback'e düş
      }
    }

    // 3) Fallback: remove → add
    await removeFromBasketMutation.mutateAsync({
      brokerId: brokerIdNum,
      productId,
    });
    await addToBasketMutation.mutateAsync({
      brokerId: brokerIdNum,
      productId,
      productCount,
    });
    return { success: true };
  };

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
  const handleDiscountPress = () => {
    setDiscountValue(String(brokerDiscount ?? 0));
    setDiscountError("");
    setValidationErrors({});
    setDiscountModalVisible(true);
  };

  const {
    validateDiscountRate,
  } = require("@/src/validations/brokerValidation");

  const handleDiscountChange = (text: string) => {
    setDiscountValue(text);
    const validation = validateDiscountRate(text);
    setValidationErrors(validation.errors);
    setDiscountError(
      validation.isValid
        ? ""
        : validation.errors.discountRate || "Geçersiz değer"
    );
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
      if (!brokersError) {
        await updateDiscountRateMutation.mutateAsync({
          brokerId: brokerId as string,
          discountRate: discount,
        });
      } else {
        updateLocalBrokerDiscount(brokerId as string, discount);
      }
      setDiscountModalVisible(false);
      setDiscountValue("");
      setDiscountError("");
      setValidationErrors({});
      showSuccess("İskonto oranı güncellendi!");
      await recalcTotals();
    } catch {
      try {
        updateLocalBrokerDiscount(brokerId as string, discount);
        setDiscountModalVisible(false);
        setDiscountValue("");
        setDiscountError("");
        setValidationErrors({});
        showSuccess("İskonto oranı güncellendi! (Local)");
      } catch {
        showError("İskonto oranı güncellenirken bir hata oluştu.");
      }
    }
  };

  const handleCloseDiscountModal = () => {
    setDiscountModalVisible(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createInvoice, basketItems]);

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
          }))
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
            Bakiye: {brokerDebt >= 0 ? "" : "-"}₺
            {Math.abs(brokerDebt).toLocaleString()}
          </Typography>
        </View>

        {/* İskonto & Fatura */}
        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            className="flex-1"
            onPress={handleDiscountPress}
            activeOpacity={0.8}
          >
            <Card
              variant="default"
              padding="sm"
              className="bg-stock-red border-0 justify-center"
              radius="md"
              style={{ height: 48 }}
            >
              <Typography
                variant="caption"
                weight="bold"
                className="text-stock-white text-center"
                numberOfLines={1}
              >
                İSKONTO: %{brokerDiscount}
              </Typography>
            </Card>
          </TouchableOpacity>

          <View className="flex-1">
            <Card
              variant="default"
              padding="sm"
              className="bg-stock-red border-0 justify-center"
              radius="md"
              style={{ height: 48 }}
            >
              <View className="flex-row items-center justify-center">
                <Checkbox
                  checked={createInvoice}
                  onToggle={setCreateInvoice}
                  label=""
                  size="md"
                  className="mr-2"
                />
                <Typography
                  variant="overline"
                  weight="bold"
                  className="text-stock-white text-center"
                  numberOfLines={1}
                >
                  FATURA OLUŞTUR
                </Typography>
              </View>
            </Card>
          </View>
        </View>

        {/* Ürün seçimi - Sadece mevcut ürün varsa göster */}
        {availableProducts.length > 0 && (
          <View className="mb-4">
            <SelectBox
              label="Ürün Seçiniz"
              placeholder="Satılacak ürünü seçiniz..."
              options={productOptions}
              value={selectedProduct}
              onSelect={handleProductSelect}
              className="mb-4"
            />

            {selectedProduct && (
              <>
                <Input
                  label="Adet Giriniz"
                  placeholder="Kaç adet?"
                  value={quantity}
                  onChangeText={handleQuantityChange}
                  numericOnly
                  error={quantityError}
                  helperText={
                    !quantityError && selectedProductData
                      ? `Mevcut stok: ${selectedProductData.stock} adet${
                          getTaxRate(selectedProductData) != null
                            ? ` / KDV %${getTaxRate(selectedProductData)}`
                            : ""
                        }`
                      : ""
                  }
                  className="mb-4"
                />

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="bg-stock-red"
                  onPress={handleAddProduct}
                  disabled={
                    !quantity || !!quantityError || parseInt(quantity, 10) <= 0
                  }
                >
                  <Typography className="text-white" weight="semibold">
                    EKLE
                  </Typography>
                </Button>
              </>
            )}
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
              <Typography
                variant="body"
                className="text-green-700 text-center"
                weight="medium"
              >
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
        {addedProducts.length > 0 && (
          <View className={`mb-4 ${addedProducts.length >= 3 ? "mb-8" : ""}`}>
            <Typography
              variant="h4"
              weight="semibold"
              className="text-stock-dark mb-4"
            >
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
                    <Typography
                      variant="body"
                      weight="semibold"
                      className="text-stock-dark mb-1"
                    >
                      {product.name}
                    </Typography>

                    <Typography variant="caption" className="text-stock-text">
                      {product.quantity} adet × ₺
                      {product.unitPrice.toLocaleString()}
                    </Typography>

                    {product.taxRate != null && (
                      <Typography variant="caption" className="text-stock-text">
                        KDV %{product.taxRate} = ₺
                        {(product.taxPrice ?? 0).toLocaleString()}
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

            {/* Toplam Hesaplaması (backend calculate) */}
            <View className="bg-stock-gray p-4 rounded-lg mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Typography
                  variant="body"
                  weight="medium"
                  className="text-stock-dark"
                >
                  Alt Toplam:
                </Typography>
                <Typography
                  variant="body"
                  weight="semibold"
                  className="text-stock-dark"
                >
                  ₺{(summary?.subtotalPrice ?? 0).toLocaleString()}
                </Typography>
              </View>

              {(summary?.discountPrice ?? 0) > 0 && (
                <View className="flex-row justify-between items-center mb-2">
                  <Typography
                    variant="body"
                    weight="medium"
                    className="text-stock-red"
                  >
                    İskonto (%{summary?.discountRate ?? brokerDiscount}):
                  </Typography>
                  <Typography
                    variant="body"
                    weight="semibold"
                    className="text-stock-red"
                  >
                    -₺{(summary?.discountPrice ?? 0).toLocaleString()}
                  </Typography>
                </View>
              )}

              {/* İskontodan sonraki ara toplam (KDV hariç) */}
              <View className="flex-row justify-between items-center mb-2">
                <Typography
                  variant="body"
                  weight="medium"
                  className="text-stock-dark"
                >
                  Ara Toplam (KDV hariç):
                </Typography>
                <Typography
                  variant="body"
                  weight="semibold"
                  className="text-stock-dark"
                >
                  ₺{(summary?.totalPrice ?? 0).toLocaleString()}
                </Typography>
              </View>

              {/* Toplam KDV */}
              <View className="flex-row justify-between items-center mb-2">
                <Typography
                  variant="body"
                  weight="medium"
                  className="text-stock-dark"
                >
                  KDV Toplamı:
                </Typography>
                <Typography
                  variant="body"
                  weight="semibold"
                  className="text-stock-dark"
                >
                  ₺{(summary?.totalTaxPrice ?? 0).toLocaleString()}
                </Typography>
              </View>

              <Divider className="my-2" />

              <View className="flex-row justify-between items-center">
                <Typography
                  variant="body"
                  weight="bold"
                  className="text-stock-black"
                >
                  Genel Toplam (KDV dahil):
                </Typography>
                <Typography
                  variant="h3"
                  weight="bold"
                  className="text-stock-red"
                >
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
              leftIcon={
                <Icon
                  family="Ionicons"
                  name="checkmark-circle"
                  size={20}
                  color="white"
                />
              }
            >
              <Typography className="text-white" weight="bold">
                SATIŞI TAMAMLA
              </Typography>
            </Button>
          </View>
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
              Henüz ürün eklenmedi.{"\n"}Yukarıdan ürün seçerek satış listesi
              oluşturun.
            </Typography>
          </View>
        )}

        {addedProducts.length >= 3 && <View style={{ height: 80 }} />}
      </ScrollView>

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
              <Typography
                variant="body"
                weight="semibold"
                className="text-stock-dark mb-4"
              >
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
                helperText={
                  !quantityError && selectedProductData
                    ? `Mevcut stok: ${selectedProductData.stock} adet${
                        getTaxRate(selectedProductData) != null
                          ? ` / KDV %${getTaxRate(selectedProductData)}`
                          : ""
                      }`
                    : ""
                }
              />

              {editQuantity && !editQuantityError && (
                <View className="bg-blue-50 p-3 rounded-lg mb-4">
                  <Typography
                    variant="caption"
                    className="text-blue-700"
                    weight="medium"
                  >
                    Yeni Toplam: ₺
                    {(
                      parseInt(editQuantity, 10) * editingProduct.unitPrice
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

      {/* İskonto Modal'ı */}
      <Modal
        visible={discountModalVisible}
        onClose={handleCloseDiscountModal}
        title="İskonto Oranı Değiştir"
        size="lg"
        className="bg-white mx-6"
      >
        <View>
          <Input
            label="İskonto Oranı (%)"
            placeholder="0-100 arası değer girin"
            value={discountValue}
            onChangeText={handleDiscountChange}
            numericOnly
            error={validationErrors.discountRate || discountError}
            className="mb-4"
            helperText="İskonto oranını % cinsinden girin (örn: 20)"
          />

          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleSaveDiscount}
              loading={updateDiscountRateMutation.isPending}
              disabled={
                !discountValue ||
                !!discountError ||
                !!validationErrors.discountRate ||
                updateDiscountRateMutation.isPending
              }
            >
              <Typography className="text-white">
                {updateDiscountRateMutation.isPending
                  ? "Güncelleniyor..."
                  : "Güncelle"}
              </Typography>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="border-stock-border"
              onPress={handleCloseDiscountModal}
              disabled={updateDiscountRateMutation.isPending}
            >
              <Typography className="text-stock-dark">İptal</Typography>
            </Button>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
      />
    </Container>
  );
}
