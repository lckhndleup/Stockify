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

// Backend hooks - YENİ EKLENEN
import {
  useActiveBrokers,
  useUpdateBrokerDiscountRate,
} from "@/src/hooks/api/useBrokers";
import {
  useSalesProductsForUI,
  useSalesProductOptions,
} from "@/src/hooks/api/useSalesProducts";
import { validateDiscountRate } from "@/src/validations/brokerValidation";

// Eklenen ürün tipi
interface AddedProduct {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Özel giveProductToBrokerWithDiscount fonksiyonu
const giveProductToBrokerWithDiscount = (
  giveProductToBroker: any,
  updateBrokerDiscount: any,
  brokerId: string,
  productId: string,
  quantity: number,
  discountedAmount: number,
  originalAmount: number
) => {
  // Önce normal işlemi yap
  const result = giveProductToBroker(brokerId, productId, quantity);

  if (result.success) {
    // Transaction'ı bul ve totalAmount'ı güncelle
    // Bu biraz karmaşık olacak, bu yüzden store'a yeni bir fonksiyon eklemek daha iyi
    return { success: true };
  }

  return result;
};

export default function SalesSection() {
  const { brokerId } = useLocalSearchParams();

  // BACKEND HOOKS - YENİ EKLENEN
  const {
    data: backendBrokers = [],
    isLoading: brokersLoading,
    error: brokersError,
  } = useActiveBrokers();

  const updateDiscountRateMutation = useUpdateBrokerDiscountRate();

  // SALES PRODUCTS BACKEND HOOKS - YENİ EKLENEN
  const {
    data: backendSalesProducts = [],
    isLoading: salesProductsLoading,
    error: salesProductsError,
  } = useSalesProductsForUI({ enabled: true });

  // LOCAL STORE - Geriye uyumluluk için korundu
  const {
    brokers: localBrokers,
    getActiveProducts,
    giveProductToBroker,
    getBrokerTotalDebt,
    getBrokerDiscount: getLocalBrokerDiscount,
    updateBrokerDiscount: updateLocalBrokerDiscount,
  } = useAppStore();

  const { toast, showSuccess, showError } = useToast();

  // State'ler
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

  // Validation Error States - YENİ EKLENEN
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Backend broker'ları öncelikle kullan, fallback olarak local
  const brokers = brokersError ? localBrokers : backendBrokers;

  // Backend products'ları öncelikle kullan, fallback olarak local
  const activeProducts = salesProductsError
    ? getActiveProducts()
    : backendSalesProducts;

  // SelectBox için backend options - YENİ EKLENEN
  const addedProductIds = addedProducts.map((p) => p.id);
  const { data: backendProductOptions = [], isLoading: optionsLoading } =
    useSalesProductOptions(addedProductIds, {
      enabled: backendSalesProducts.length > 0,
    });

  // Broker bilgisini al (güncellendi)
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

  // Kullanılabilir ürünler
  const availableProducts = useMemo(() => {
    const addedProductIds = addedProducts.map((p) => p.id);
    return activeProducts.filter(
      (product) => !addedProductIds.includes(product.id)
    );
  }, [activeProducts, addedProducts]);

  // SelectBox için ürün seçenekleri - GÜNCELLENDİ
  const productOptions: SelectBoxOption[] = salesProductsError
    ? availableProducts.map((product) => ({
        label: `${product.name} (Stok: ${product.stock}, ₺${product.price}/adet)`,
        value: product.id,
      }))
    : backendProductOptions;

  // Seçilen ürünün bilgilerini al
  const selectedProductData = availableProducts.find(
    (p) => p.id === selectedProduct
  );

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    setQuantity("");
    setQuantityError("");
  };

  const validateQuantity = (value: string, maxStock?: number) => {
    try {
      const result = salesQuantitySchema.parse({ quantity: value });
      const qty = parseInt(value);

      if (maxStock && qty > maxStock) {
        return `Yetersiz stok! Mevcut stok: ${maxStock} adet`;
      }

      return "";
    } catch (error: any) {
      return error.errors?.[0]?.message || "Geçersiz adet";
    }
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

  const handleAddProduct = () => {
    if (!selectedProductData || !quantity) return;

    const error = validateQuantity(quantity, selectedProductData.stock);
    if (error) {
      setQuantityError(error);
      return;
    }

    const qty = parseInt(quantity);
    const newProduct: AddedProduct = {
      id: selectedProductData.id,
      name: selectedProductData.name,
      quantity: qty,
      unitPrice: selectedProductData.price,
      totalPrice: qty * selectedProductData.price,
    };

    setAddedProducts((prev) => [...prev, newProduct]);
    setSelectedProduct("");
    setQuantity("");
    setQuantityError("");
  };

  const handleRemoveProduct = (productId: string) => {
    Alert.alert(
      "Ürün Kaldır",
      "Bu ürünü listeden kaldırmak istediğinizden emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Kaldır",
          style: "destructive",
          onPress: () => {
            setAddedProducts((prev) => prev.filter((p) => p.id !== productId));
          },
        },
      ]
    );
  };

  const handleEditProduct = (productId: string) => {
    const product = addedProducts.find((p) => p.id === productId);
    if (!product) return;

    setEditingProduct(product);
    setEditQuantity(product.quantity.toString());
    setEditQuantityError("");
    setEditModalVisible(true);
  };

  const handleEditQuantityChange = (text: string) => {
    setEditQuantity(text);
    if (text) {
      try {
        const result = editQuantitySchema.parse({ quantity: text });
        const qty = parseInt(text);
        const originalProduct = activeProducts.find(
          (p) => p.id === editingProduct?.id
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
  };

  const handleSaveEdit = () => {
    if (!editingProduct || !editQuantity || editQuantityError) return;

    const qty = parseInt(editQuantity);
    const updatedProducts = addedProducts.map((p) =>
      p.id === editingProduct.id
        ? {
            ...p,
            quantity: qty,
            totalPrice: qty * p.unitPrice,
          }
        : p
    );

    setAddedProducts(updatedProducts);
    setEditModalVisible(false);
    setEditingProduct(null);
    setEditQuantity("");
    setEditQuantityError("");
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setEditingProduct(null);
    setEditQuantity("");
    setEditQuantityError("");
  };

  // BACKEND ENTEGRELİ DİSCOUNT RATE GÜNCELLEME - YENİ
  const handleDiscountPress = () => {
    setDiscountValue(brokerDiscount.toString());
    setDiscountError("");
    setValidationErrors({});
    setDiscountModalVisible(true);
  };

  const handleDiscountChange = (text: string) => {
    setDiscountValue(text);

    // Validation
    const validation = validateDiscountRate(text);
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      setDiscountError(validation.errors.discountRate || "Geçersiz değer");
    } else {
      setDiscountError("");
    }
  };

  // BACKEND ENTEGRELİ SAVE DISCOUNT - YENİ
  const handleSaveDiscount = async () => {
    // Form validation
    const validation = validateDiscountRate(discountValue);
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      showError("Lütfen geçerli bir iskonto oranı girin.");
      return;
    }

    const discount = parseFloat(discountValue);

    try {
      if (!brokersError) {
        // Backend güncelleme
        console.log("💰 Updating discount rate via backend");
        await updateDiscountRateMutation.mutateAsync({
          brokerId: brokerId as string,
          discountRate: discount,
        });
        console.log("✅ Discount rate updated via backend");
      } else {
        // Local fallback
        console.log("💰 Updating discount rate via local store");
        updateLocalBrokerDiscount(brokerId as string, discount);
        console.log("✅ Discount rate updated via local store");
      }

      setDiscountModalVisible(false);
      setDiscountValue("");
      setDiscountError("");
      setValidationErrors({});
      showSuccess("İskonto oranı başarıyla güncellendi!");
    } catch (error) {
      console.error("❌ Update discount rate error:", error);

      // Backend başarısız olursa local'e fall back
      try {
        console.log("🔄 Falling back to local store for discount update...");
        updateLocalBrokerDiscount(brokerId as string, discount);
        setDiscountModalVisible(false);
        setDiscountValue("");
        setDiscountError("");
        setValidationErrors({});
        showSuccess("İskonto oranı başarıyla güncellendi! (Local)");
      } catch (localError) {
        console.error("❌ Local discount update also failed:", localError);
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

  const calculateSubTotal = () => {
    return addedProducts.reduce(
      (total, product) => total + product.totalPrice,
      0
    );
  };

  const calculateDiscountAmount = () => {
    const subTotal = calculateSubTotal();
    return (subTotal * brokerDiscount) / 100;
  };

  const calculateTotalAmount = () => {
    const subTotal = calculateSubTotal();
    const discountAmount = calculateDiscountAmount();
    return subTotal - discountAmount;
  };

  const handleCompleteSale = () => {
    if (addedProducts.length === 0) {
      Alert.alert("Hata", "Lütfen en az bir ürün ekleyiniz.");
      return;
    }

    // Confirm sayfasına yönlendir - tüm işlem orada yapılacak
    router.push({
      pathname: "/broker/sections/confirmSales",
      params: {
        brokerId: brokerId,
        salesData: JSON.stringify(
          addedProducts.map((product) => ({
            id: product.id,
            name: product.name,
            quantity: product.quantity,
            unitPrice: product.unitPrice,
            totalPrice: product.totalPrice,
          }))
        ),
        createInvoice: createInvoice.toString(),
      },
    });
  };

  // Loading state kontrolü (güncellendi)
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
      {/* Backend Error Bilgilendirme - GÜNCELLENDİ */}
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
                  !quantity || !!quantityError || parseInt(quantity) <= 0
                }
              >
                <Typography className="text-white" weight="semibold">
                  EKLE
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

        {/* Boş durum mesajı */}
        {addedProducts.length === 0 && (
          <View className="items-center py-8">
            <Icon
              family="MaterialIcons"
              name="shopping_cart"
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

      {/* İskonto Modal'ı - GÜNCELLENDİ */}
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
