import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  //@ts-ignore TODOMALİ
  type SelectBoxOption,
  Toast,
} from "@/src/components/ui";
import { useAppStore } from "@/src/stores/appStore";
import { useToast } from "@/src/hooks/useToast";
import {
  salesQuantitySchema,
  editQuantitySchema,
} from "@/src/validations/salesValidation";
import { useNavigation } from "@react-navigation/native";

// Backend hooks - UPDATED IMPORTS
import {
  useActiveBrokers,
  useUpdateBrokerDiscountRate,
} from "@/src/hooks/api/useBrokers";
import { useSales } from "@/src/hooks/api/useSales";
import { useBasket } from "@/src/hooks/api/useBasket";
import { validateDiscountRate } from "@/src/validations/brokerValidation";
import { useAuthStore } from "@/src/stores/authStore";

// Eklenen ürün tipi - AYNI KALDI
interface AddedProduct {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function SalesSection() {
  const { brokerId } = useLocalSearchParams();
  const { user } = useAuthStore();

  // BACKEND HOOKS
  const {
    data: backendBrokers = [],
    isLoading: brokersLoading,
    error: brokersError,
  } = useActiveBrokers();

  const updateDiscountRateMutation = useUpdateBrokerDiscountRate();

  // SALES HOOKS
  const {
    products: backendSalesProducts,
    loadProducts,
    isLoadingProducts: salesProductsLoading,
    error: salesProductsError,
    getProductById,
  } = useSales();

  // STATE'LER - ÖNCE TANIMLA
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [addedProducts, setAddedProducts] = useState<AddedProduct[]>([]);
  const [createInvoice, setCreateInvoice] = useState(true);

  // Modal state'leri
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AddedProduct | null>(
    null
  );
  const [editQuantity, setEditQuantity] = useState("");
  const [editQuantityError, setEditQuantityError] = useState("");

  // İskonto modal state'leri
  const [discountModalVisible, setDiscountModalVisible] = useState(false);
  const [discountValue, setDiscountValue] = useState("");
  const [discountError, setDiscountError] = useState("");

  // Validation Error States
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // MEMOIZED PRODUCT INFO - Sonsuz loop önlemek için
  const productInfo = useMemo(() => {
    return backendSalesProducts.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      price: p.price,
      taxRate: p.taxRate,
      isAvailable: p.productCount > 0,
      stockCount: p.productCount,
    }));
  }, [backendSalesProducts]);

  // BASKET HOOKS - Memoized productInfo ile
  const numericBrokerId = brokerId ? parseInt(brokerId as string) : 0;
  const {
    items: basketItems,
    addToBasket,
    removeFromBasket,
    updateBasketItem,
    refreshBasket,
    isLoading: basketLoading,
    getProductQuantity,
    isProductInBasket,
  } = useBasket(numericBrokerId, productInfo);

  // LOCAL STORE - Fallback için
  const {
    brokers: localBrokers,
    getActiveProducts,
    giveProductToBroker,
    getBrokerTotalDebt,
    getBrokerDiscount: getLocalBrokerDiscount,
    updateBrokerDiscount: updateLocalBrokerDiscount,
  } = useAppStore();

  const { toast, showSuccess, showError } = useToast();

  // LOAD PRODUCTS ONLY ONCE
  useEffect(() => {
    loadProducts();
  }, []); // Empty dependency - sadece mount'ta çalış

  // SYNC BASKET WITH ADDED PRODUCTS - OPTIMIZED
  useEffect(() => {
    if (basketItems.length > 0) {
      const convertedProducts: AddedProduct[] = basketItems.map((item) => ({
        id: item.productId.toString(),
        name: item.productName,
        quantity: item.productCount,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      }));

      // Sadece gerçekten değişmişse güncelle
      if (JSON.stringify(convertedProducts) !== JSON.stringify(addedProducts)) {
        setAddedProducts(convertedProducts);
      }
    } else if (addedProducts.length > 0) {
      setAddedProducts([]);
    }
  }, [basketItems]); // Sadece basketItems değiştiğinde

  // Backend broker'ları öncelikle kullan, fallback olarak local
  const brokers = brokersError ? localBrokers : backendBrokers;

  // Backend products'ları öncelikle kullan, fallback olarak local - MEMOIZED
  const activeProducts = useMemo(() => {
    return salesProductsError
      ? getActiveProducts()
      : backendSalesProducts.map((p) => ({
          id: p.productId.toString(),
          name: p.productName,
          stock: p.productCount,
          price: p.price,
        }));
  }, [salesProductsError, backendSalesProducts, getActiveProducts]);

  // Broker bilgisini al
  const broker = brokers.find((b) => b.id === brokerId);
  const brokerDebt = broker
    ? "balance" in broker
      ? (broker as any).balance
      : getBrokerTotalDebt(broker.id)
    : 0;

  // Discount rate - backend'den veya local'den al
  const brokerDiscount = broker
    ? broker.discountRate || 0
    : brokersError
    ? getLocalBrokerDiscount(brokerId as string)
    : 0;

  const navigation = useNavigation();

  // NAVIGATION SETUP - MEMOIZED
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
          <Text
            style={{
              color: "#E3001B",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            İptal
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, brokerId]);

  // Kullanılabilir ürünler - MEMOIZED
  const availableProducts = useMemo(() => {
    const addedProductIds = addedProducts.map((p) => p.id);
    return activeProducts.filter(
      (product) => !addedProductIds.includes(product.id)
    );
  }, [activeProducts, addedProducts]);

  // SelectBox için ürün seçenekleri - MEMOIZED
  const productOptions: SelectBoxOption[] = useMemo(() => {
    return availableProducts.map((product) => ({
      label: `${product.name} (Stok: ${product.stock}, ₺${product.price}/adet)`,
      value: product.id,
    }));
  }, [availableProducts]);

  // Seçilen ürünün bilgilerini al - MEMOIZED
  const selectedProductData = useMemo(() => {
    return availableProducts.find((p) => p.id === selectedProduct);
  }, [availableProducts, selectedProduct]);

  // HANDLERS - MEMOIZED
  const handleProductSelect = useCallback((productId: string) => {
    setSelectedProduct(productId);
    setQuantity("");
    setQuantityError("");
  }, []);

  const validateQuantity = useCallback((value: string, maxStock?: number) => {
    try {
      salesQuantitySchema.parse({ quantity: value });
      const qty = parseInt(value);

      if (maxStock && qty > maxStock) {
        return `Yetersiz stok! Mevcut stok: ${maxStock} adet`;
      }

      return "";
    } catch (error: any) {
      return error.errors?.[0]?.message || "Geçersiz adet";
    }
  }, []);

  const handleQuantityChange = useCallback(
    (text: string) => {
      setQuantity(text);
      if (text && selectedProductData) {
        const error = validateQuantity(text, selectedProductData.stock);
        setQuantityError(error);
      } else {
        setQuantityError("");
      }
    },
    [selectedProductData, validateQuantity]
  );

  // UPDATED - Now uses basket API
  const handleAddProduct = useCallback(async () => {
    if (!selectedProductData || !quantity) return;

    const error = validateQuantity(quantity, selectedProductData.stock);
    if (error) {
      setQuantityError(error);
      return;
    }

    const qty = parseInt(quantity);
    const productId = parseInt(selectedProductData.id);

    // Add to basket via API
    const success = await addToBasket(productId, qty);

    if (success) {
      setSelectedProduct("");
      setQuantity("");
      setQuantityError("");
    }
  }, [selectedProductData, quantity, validateQuantity, addToBasket]);

  // UPDATED - Now uses basket API
  const handleRemoveProduct = useCallback(
    (productId: string) => {
      Alert.alert(
        "Ürün Kaldır",
        "Bu ürünü listeden kaldırmak istediğinizden emin misiniz?",
        [
          { text: "İptal", style: "cancel" },
          {
            text: "Kaldır",
            style: "destructive",
            onPress: async () => {
              await removeFromBasket(parseInt(productId));
            },
          },
        ]
      );
    },
    [removeFromBasket]
  );

  const handleEditProduct = useCallback(
    (productId: string) => {
      const product = addedProducts.find((p) => p.id === productId);
      if (!product) return;

      setEditingProduct(product);
      setEditQuantity(product.quantity.toString());
      setEditQuantityError("");
      setEditModalVisible(true);
    },
    [addedProducts]
  );

  const handleEditQuantityChange = useCallback(
    (text: string) => {
      setEditQuantity(text);
      if (text && editingProduct) {
        try {
          editQuantitySchema.parse({ quantity: text });
          const qty = parseInt(text);
          const originalProduct = activeProducts.find(
            (p) => p.id === editingProduct.id
          );

          if (originalProduct && qty > originalProduct.stock) {
            setEditQuantityError(
              `Yetersiz stok! Mevcut stok: ${originalProduct.stock} adet`
            );
          } else {
            setEditQuantityError("");
          }
        } catch (error: any) {
          setEditQuantityError(error.errors?.[0]?.message || "Geçersiz adet");
        }
      } else {
        setEditQuantityError("");
      }
    },
    [editingProduct, activeProducts]
  );

  // UPDATED - Now uses basket API
  const handleSaveEdit = useCallback(async () => {
    if (!editingProduct || !editQuantity || editQuantityError) return;

    const qty = parseInt(editQuantity);
    const success = await updateBasketItem(parseInt(editingProduct.id), qty);

    if (success) {
      setEditModalVisible(false);
      setEditingProduct(null);
      setEditQuantity("");
      setEditQuantityError("");
    }
  }, [editingProduct, editQuantity, editQuantityError, updateBasketItem]);

  const handleCloseEditModal = useCallback(() => {
    setEditModalVisible(false);
    setEditingProduct(null);
    setEditQuantity("");
    setEditQuantityError("");
  }, []);

  // DISCOUNT HANDLERS - MEMOIZED
  const handleDiscountPress = useCallback(() => {
    setDiscountValue(brokerDiscount.toString());
    setDiscountError("");
    setValidationErrors({});
    setDiscountModalVisible(true);
  }, [brokerDiscount]);

  const handleDiscountChange = useCallback((text: string) => {
    setDiscountValue(text);

    const validation = validateDiscountRate(text);
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      setDiscountError(validation.errors.discountRate || "Geçersiz değer");
    } else {
      setDiscountError("");
    }
  }, []);

  const handleSaveDiscount = useCallback(async () => {
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
      showSuccess("İskonto oranı başarıyla güncellendi!");
    } catch (error) {
      try {
        updateLocalBrokerDiscount(brokerId as string, discount);
        setDiscountModalVisible(false);
        setDiscountValue("");
        setDiscountError("");
        setValidationErrors({});
        showSuccess("İskonto oranı başarıyla güncellendi! (Local)");
      } catch (localError) {
        showError("İskonto oranı güncellenirken bir hata oluştu.");
      }
    }
  }, [
    discountValue,
    brokersError,
    updateDiscountRateMutation,
    brokerId,
    updateLocalBrokerDiscount,
    showSuccess,
    showError,
  ]);

  const handleCloseDiscountModal = useCallback(() => {
    setDiscountModalVisible(false);
    setDiscountValue("");
    setDiscountError("");
    setValidationErrors({});
  }, []);

  // CALCULATION FUNCTIONS - MEMOIZED
  const calculateSubTotal = useCallback(() => {
    return addedProducts.reduce(
      (total, product) => total + product.totalPrice,
      0
    );
  }, [addedProducts]);

  const calculateDiscountAmount = useCallback(() => {
    const subTotal = calculateSubTotal();
    return (subTotal * brokerDiscount) / 100;
  }, [calculateSubTotal, brokerDiscount]);

  const calculateTotalAmount = useCallback(() => {
    const subTotal = calculateSubTotal();
    const discountAmount = calculateDiscountAmount();
    return subTotal - discountAmount;
  }, [calculateSubTotal, calculateDiscountAmount]);

  const handleCompleteSale = useCallback(() => {
    if (addedProducts.length === 0) {
      Alert.alert("Hata", "Lütfen en az bir ürün ekleyiniz.");
      return;
    }

    router.push({
      pathname: "/broker/sections/confirmSales",
      params: {
        brokerId: brokerId,
        createInvoice: createInvoice.toString(),
      },
    });
  }, [addedProducts.length, brokerId, createInvoice]);

  // Loading state kontrolü
  if (
    (brokersLoading && !brokersError) ||
    (salesProductsLoading && !salesProductsError)
  ) {
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <View className="items-center justify-center flex-1">
          <Loading size="large" />
          <Typography variant="body" className="text-stock-text mt-4">
            {brokersLoading ? "Aracı bilgileri" : "Ürün bilgileri"}{" "}
            yükleniyor...
          </Typography>
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
      {/* Backend Error Bilgilendirme */}
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
        {/* Header - İsim ve Bakiye Altlı Üstlü */}
        <View className="mb-6 items-center">
          <Typography
            variant="h1"
            weight="bold"
            size="3xl"
            className="text-stock-black text-center mb-0"
          >
            {`${broker.firstName || broker.name} ${
              broker.lastName || broker.surname
            }`}
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

        {/* İskonto ve Fatura Kartları - Yanyana Kırmızı */}
        <View className="flex-row gap-3 mb-4">
          {/* İskonto Kartı */}
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

          {/* Fatura Kartı */}
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

        {/* Ürün Seçim Formu */}
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
                numericOnly={true}
                error={quantityError}
                helperText={
                  !quantityError && selectedProductData
                    ? `Mevcut stok: ${selectedProductData.stock} adet`
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
                  !quantity ||
                  !!quantityError ||
                  parseInt(quantity) <= 0 ||
                  basketLoading
                }
              >
                <Typography className="text-white" weight="semibold">
                  {basketLoading ? "EKLENIYOR..." : "EKLE"}
                </Typography>
              </Button>
            </>
          )}
        </View>

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

            {addedProducts.map((product) => (
              <Card
                key={product.id}
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
                      {product.quantity} adet × ₺{product.unitPrice} = ₺
                      {product.totalPrice.toLocaleString()}
                    </Typography>
                  </View>

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
                      onPress={() => handleRemoveProduct(product.id)}
                      containerClassName="p-1"
                    />
                  </View>
                </View>
              </Card>
            ))}

            {/* Toplam Hesaplaması */}
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
                  ₺{calculateSubTotal().toLocaleString()}
                </Typography>
              </View>

              {brokerDiscount > 0 && (
                <View className="flex-row justify-between items-center mb-2">
                  <Typography
                    variant="body"
                    weight="medium"
                    className="text-stock-red"
                  >
                    İskonto (%{brokerDiscount}):
                  </Typography>
                  <Typography
                    variant="body"
                    weight="semibold"
                    className="text-stock-red"
                  >
                    -₺{calculateDiscountAmount().toLocaleString()}
                  </Typography>
                </View>
              )}

              <Divider className="my-2" />

              <View className="flex-row justify-between items-center">
                <Typography
                  variant="h4"
                  weight="bold"
                  className="text-stock-black"
                >
                  Toplam:
                </Typography>
                <Typography
                  variant="h3"
                  weight="bold"
                  className="text-stock-red"
                >
                  ₺{calculateTotalAmount().toLocaleString()}
                </Typography>
              </View>
            </View>

            {/* Satışı Tamamla Butonu */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="bg-stock-red"
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

        {/* Boş durum mesajı - ICON FIX */}
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
                numericOnly={true}
                error={editQuantityError}
                className="mb-4"
                helperText={`Birim fiyat: ₺${editingProduct.unitPrice}`}
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
                      parseInt(editQuantity) * editingProduct.unitPrice
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
              disabled={!editQuantity || !!editQuantityError || basketLoading}
            >
              <Typography className="text-white">
                {basketLoading ? "Güncelleniyor..." : "Güncelle"}
              </Typography>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="border-stock-border"
              onPress={handleCloseEditModal}
              disabled={basketLoading}
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
            numericOnly={true}
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

      {/* Toast mesajı */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
      />
    </Container>
  );
}
