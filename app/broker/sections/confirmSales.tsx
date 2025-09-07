import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ScrollView, View, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  Container,
  Typography,
  Card,
  Button,
  Icon,
  Divider,
  Toast,
} from "@/src/components/ui";
import { useAppStore } from "@/src/stores/appStore";
import { useToast } from "@/src/hooks/useToast";

// Backend hooks
import { useActiveBrokers } from "@/src/hooks/api/useBrokers";
import { useSalesCalculation } from "@/src/hooks/api/useSales";
import { useBasket } from "@/src/hooks/api/useBasket";
import { useAuthStore } from "@/src/stores/authStore";

// UI compatibility için
interface SalesItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate?: number;
  taxAmount?: number;
  totalWithTax?: number;
}

export default function ConfirmSales() {
  const params = useLocalSearchParams();
  const { brokerId, createInvoice } = params;

  // State'ler
  const [isProcessing, setIsProcessing] = useState(false);

  // BACKEND HOOKS
  const { user } = useAuthStore();
  const {
    data: backendBrokers = [],
    isLoading: brokersLoading,
    error: brokersError,
  } = useActiveBrokers();

  const numericBrokerId = useMemo(() => {
    return brokerId ? parseInt(brokerId as string) : 0;
  }, [brokerId]);

  const {
    calculateAndShow,
    confirmAndShow,
    isCalculating,
    isConfirming,
    lastCalculation,
    lastConfirmation,
    clearLastResults,
  } = useSalesCalculation(numericBrokerId);

  const emptyProductInfo = useMemo(() => [], []);

  const {
    items: basketItems,
    summary: basketSummary,
    refreshBasket,
    clearBasket,
    isLoading: basketLoading,
  } = useBasket(numericBrokerId, emptyProductInfo);

  // Fallback için local store (sadece broker bilgileri için)
  const {
    brokers: localBrokers,
    getBrokerTotalDebt,
    getBrokerDiscount,
  } = useAppStore();
  const { toast, showSuccess, showError } = useToast();

  // LOAD DATA ONCE
  useEffect(() => {
    if (numericBrokerId) {
      refreshBasket();
      clearLastResults();
      // Otomatik hesaplama yap
      setTimeout(() => {
        if (basketItems.length > 0) {
          calculateAndShow(createInvoice === "true");
        }
      }, 500);
    }
  }, []);

  // AUTO CALCULATE when basket items change
  useEffect(() => {
    if (basketItems.length > 0 && !lastCalculation) {
      calculateAndShow(createInvoice === "true");
    }
  }, [basketItems.length, lastCalculation, calculateAndShow, createInvoice]);

  // CONVERT BASKET TO UI FORMAT with proper pricing
  const parsedSalesData: SalesItem[] = useMemo(() => {
    return basketItems.map((item) => ({
      id: item.productId.toString(),
      name: item.productName,
      quantity: item.productCount,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      taxRate: item.taxRate || 0,
      taxAmount: item.taxAmount || 0,
      totalWithTax: item.totalWithTax || item.totalPrice,
    }));
  }, [basketItems]);

  // BROKER DATA
  const brokers = useMemo(() => {
    return brokersError ? localBrokers : backendBrokers;
  }, [brokersError, localBrokers, backendBrokers]);

  const broker = useMemo(() => {
    return brokers.find((b) => b.id === brokerId);
  }, [brokers, brokerId]);

  const brokerDebt = useMemo(() => {
    if (!broker) return 0;
    return "balance" in broker
      ? (broker as any).balance
      : getBrokerTotalDebt(broker.id);
  }, [broker, getBrokerTotalDebt]);

  const brokerDiscount = useMemo(() => {
    if (!broker) return 0;
    return broker.discountRate || getBrokerDiscount(broker.id);
  }, [broker, getBrokerDiscount]);

  const willCreateInvoice = useMemo(() => {
    return createInvoice === "true";
  }, [createInvoice]);

  // Hesaplamalar - BACKEND'DEN GEL VEYA BASKET SUMMARY KULLAN
  const calculateSubTotal = useCallback(() => {
    return (
      lastCalculation?.totalPrice ||
      basketSummary.subtotal ||
      parsedSalesData.reduce((total, item) => total + item.totalPrice, 0)
    );
  }, [lastCalculation?.totalPrice, basketSummary.subtotal, parsedSalesData]);

  const calculateTaxAmount = useCallback(() => {
    return (
      lastCalculation?.totalTaxPrice ||
      basketSummary.totalTax ||
      parsedSalesData.reduce((total, item) => total + (item.taxAmount || 0), 0)
    );
  }, [lastCalculation?.totalTaxPrice, basketSummary.totalTax, parsedSalesData]);

  const calculateDiscountAmount = useCallback(() => {
    return (
      lastCalculation?.discountPrice ||
      (calculateSubTotal() * brokerDiscount) / 100
    );
  }, [lastCalculation?.discountPrice, calculateSubTotal, brokerDiscount]);

  const calculateGrandTotal = useCallback(() => {
    return (
      lastCalculation?.totalPriceWithTax ||
      basketSummary.grandTotal ||
      parsedSalesData.reduce(
        (total, item) => total + (item.totalWithTax || item.totalPrice),
        0
      )
    );
  }, [
    lastCalculation?.totalPriceWithTax,
    basketSummary.grandTotal,
    parsedSalesData,
  ]);

  // HANDLERS
  const handleCancel = useCallback(() => {
    Alert.alert(
      "Satışı İptal Et",
      "Satış işlemini iptal etmek istediğinizden emin misiniz?\n\nTüm eklenen ürünler silinecektir.",
      [
        { text: "Geri Dön", style: "cancel" },
        {
          text: "İptal Et",
          style: "destructive",
          onPress: () => {
            router.push({
              pathname: "/broker/brokerDetail",
              params: { brokerId: brokerId },
            });
          },
        },
      ]
    );
  }, [brokerId]);

  const handleEdit = useCallback(() => {
    router.back();
  }, []);

  // BACKEND ONLY CONFIRMATION
  const handleConfirm = useCallback(async () => {
    if (parsedSalesData.length === 0) {
      showError("Satış yapılacak ürün bulunamadı.");
      return;
    }

    setIsProcessing(true);

    try {
      console.log("🔄 Starting sales confirmation...");
      const result = await confirmAndShow(willCreateInvoice);

      if (result) {
        console.log("✅ Sales confirmation successful:", result);

        // Clear basket after successful confirmation
        clearBasket();

        // SAFE PARAMETER EXTRACTION
        const salesIdParam = result.salesId
          ? result.salesId.toString()
          : Date.now().toString();
        const documentNumberParam = result.documentNumber || "N/A";
        const totalAmountParam = result.totalPriceWithTax
          ? result.totalPriceWithTax.toString()
          : "0";
        const itemCountParam = result.salesItems
          ? result.salesItems.length.toString()
          : parsedSalesData.length.toString();

        // Navigate to success page
        router.push({
          pathname: "/broker/sections/resultSales",
          params: {
            brokerId: brokerId,
            success: "true",
            salesId: salesIdParam,
            documentNumber: documentNumberParam,
            totalAmount: totalAmountParam,
            itemCount: itemCountParam,
            discountAmount: calculateDiscountAmount().toString(),
            createInvoice: createInvoice,
          },
        });
      } else {
        showError("Satış onaylanamadı. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error("❌ Confirm sales error:", error);
      showError("Satış onaylanırken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsProcessing(false);
    }
  }, [
    parsedSalesData,
    willCreateInvoice,
    confirmAndShow,
    clearBasket,
    calculateDiscountAmount,
    brokerId,
    createInvoice,
    showError,
  ]);

  // Loading state
  if (brokersLoading && !brokersError) {
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <View className="items-center justify-center flex-1">
          <Typography variant="body" className="text-stock-text">
            Yükleniyor...
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
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
      />

      {/* Backend Error Warning */}
      {brokersError && (
        <View className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
          <Typography variant="body" className="text-yellow-800 text-center">
            ⚠️ Backend bağlantı hatası - Local veriler gösteriliyor
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
            {`${broker.firstName || broker.name} ${
              broker.lastName || broker.surname
            }`}
          </Typography>
          <Typography
            variant="body"
            weight="semibold"
            className="text-stock-text text-center mt-0"
          >
            Satış Onayı
          </Typography>
        </View>

        {/* Satış Özeti Kartı */}
        <Card
          variant="default"
          padding="lg"
          className="border border-stock-border mb-4"
          radius="md"
        >
          <Typography
            variant="h4"
            weight="semibold"
            className="text-stock-dark mb-4 text-center"
          >
            SATIŞ ÖZETİ
          </Typography>

          {/* Ürün Listesi - FİYATLAR İLE */}
          <View className="mb-4">
            {parsedSalesData.map((item, index) => (
              <View key={`${item.id}-${index}`} className="mb-3">
                <Card
                  variant="default"
                  padding="sm"
                  className="bg-stock-gray border-0"
                  radius="md"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Typography
                        variant="body"
                        weight="semibold"
                        className="text-stock-dark mb-1"
                      >
                        {item.name}
                      </Typography>
                      <Typography variant="caption" className="text-stock-text">
                        {item.quantity} adet × ₺{item.unitPrice.toFixed(2)}
                      </Typography>
                      {item.taxRate && item.taxRate > 0 && (
                        <Typography
                          variant="caption"
                          className="text-stock-text"
                        >
                          KDV (%{item.taxRate}): ₺
                          {(item.taxAmount || 0).toFixed(2)}
                        </Typography>
                      )}
                    </View>
                    <View className="items-end">
                      <Typography
                        variant="body"
                        weight="bold"
                        className="text-stock-dark"
                      >
                        ₺{(item.totalWithTax || item.totalPrice).toFixed(2)}
                      </Typography>
                      <Typography variant="caption" className="text-stock-text">
                        (KDV Dahil)
                      </Typography>
                    </View>
                  </View>
                </Card>
              </View>
            ))}
          </View>

          <Divider className="my-4" />

          {/* BACKEND HESAPLAMALARI */}
          <View className="space-y-2">
            <View className="flex-row justify-between items-center">
              <Typography
                variant="body"
                weight="medium"
                className="text-stock-dark"
              >
                Ara Toplam:
              </Typography>
              <Typography
                variant="body"
                weight="semibold"
                className="text-stock-dark"
              >
                ₺{calculateSubTotal().toFixed(2)}
              </Typography>
            </View>

            <View className="flex-row justify-between items-center">
              <Typography
                variant="body"
                weight="medium"
                className="text-stock-dark"
              >
                Toplam KDV:
              </Typography>
              <Typography
                variant="body"
                weight="semibold"
                className="text-stock-dark"
              >
                ₺{calculateTaxAmount().toFixed(2)}
              </Typography>
            </View>

            {brokerDiscount > 0 && (
              <View className="flex-row justify-between items-center">
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
                  -₺{calculateDiscountAmount().toFixed(2)}
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
                Genel Toplam:
              </Typography>
              <Typography variant="h3" weight="bold" className="text-stock-red">
                ₺{calculateGrandTotal().toFixed(2)}
              </Typography>
            </View>
          </View>
        </Card>

        {/* Fatura Bilgisi */}
        {willCreateInvoice && (
          <Card
            variant="default"
            padding="md"
            className="bg-blue-50 border border-blue-200 mb-4"
            radius="md"
          >
            <View className="flex-row items-center">
              <Icon
                family="MaterialIcons"
                name="receipt"
                size={20}
                color="#3B82F6"
                containerClassName="mr-3"
              />
              <Typography
                variant="body"
                className="text-blue-700"
                weight="medium"
              >
                Bu satış için fatura oluşturulacak
              </Typography>
            </View>
          </Card>
        )}

        {/* Calculation Status - OTOMATIK HESAPLAMA */}
        {lastCalculation ? (
          <Card
            variant="default"
            padding="md"
            className="bg-green-50 border border-green-200 mb-4"
            radius="md"
          >
            <View className="flex-row items-center mb-2">
              <Icon
                family="MaterialIcons"
                name="check_circle"
                size={20}
                color="#059669"
                containerClassName="mr-3"
              />
              <Typography
                variant="body"
                className="text-green-700"
                weight="medium"
              >
                Hesaplama Tamamlandı
              </Typography>
            </View>
            <Typography variant="caption" className="text-green-600">
              Toplam: ₺{lastCalculation.totalPriceWithTax.toFixed(2)}
              {lastCalculation.documentNumber &&
                ` - Belge: ${lastCalculation.documentNumber}`}
            </Typography>
          </Card>
        ) : isCalculating ? (
          <Card
            variant="default"
            padding="md"
            className="bg-blue-50 border border-blue-200 mb-4"
            radius="md"
          >
            <View className="flex-row items-center">
              <Icon
                family="MaterialIcons"
                name="calculate"
                size={20}
                color="#3B82F6"
                containerClassName="mr-3"
              />
              <Typography
                variant="body"
                className="text-blue-700"
                weight="medium"
              >
                Hesaplanıyor...
              </Typography>
            </View>
          </Card>
        ) : null}

        {/* Bakiye Bilgisi - UPDATED WITH CORRECT CALCULATION */}
        <Card
          variant="default"
          padding="md"
          className="bg-yellow-50 border border-yellow-200 mb-6"
          radius="md"
        >
          <Typography
            variant="caption"
            className="text-yellow-700 mb-2"
            weight="medium"
          >
            Bakiye Değişimi:
          </Typography>
          <View className="flex-row justify-between items-center mb-1">
            <Typography variant="body" className="text-yellow-700">
              Mevcut Bakiye:
            </Typography>
            <Typography
              variant="body"
              weight="semibold"
              className="text-yellow-700"
            >
              ₺{brokerDebt.toFixed(2)}
            </Typography>
          </View>
          <View className="flex-row justify-between items-center">
            <Typography variant="body" className="text-yellow-700">
              Yeni Bakiye:
            </Typography>
            <Typography
              variant="body"
              weight="bold"
              className="text-yellow-800"
            >
              ₺{(brokerDebt + calculateGrandTotal()).toFixed(2)}
            </Typography>
          </View>
        </Card>

        {/* Aksiyon Butonları - CALCULATE BUTONU KALDIRILDI */}
        <View className="space-y-3 mb-6">
          {/* İptal Butonu */}
          <Button
            variant="outline"
            size="lg"
            fullWidth
            className="border-stock-red"
            onPress={handleCancel}
            disabled={isProcessing || isConfirming}
            leftIcon={
              <Icon
                family="MaterialIcons"
                name="cancel"
                size={20}
                color="#E3001B"
              />
            }
          >
            <Typography className="text-stock-red" weight="bold">
              İPTAL ET
            </Typography>
          </Button>

          {/* Düzenle Butonu */}
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            className="bg-stock-gray"
            onPress={handleEdit}
            disabled={isProcessing || isConfirming}
            leftIcon={
              <Icon
                family="MaterialIcons"
                name="edit"
                size={20}
                color="#67686A"
              />
            }
          >
            <Typography className="text-stock-dark" weight="bold">
              DÜZENLE
            </Typography>
          </Button>

          {/* Onayla Butonu - SADECE BACKEND */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="bg-stock-red"
            onPress={handleConfirm}
            loading={isProcessing || isConfirming}
            disabled={parsedSalesData.length === 0 || !lastCalculation}
            leftIcon={
              !isProcessing && !isConfirming ? (
                <Icon
                  family="MaterialIcons"
                  name="check-circle"
                  size={20}
                  color="white"
                />
              ) : undefined
            }
          >
            <Typography className="text-white" weight="bold">
              {isProcessing || isConfirming
                ? "ONAYLANIYOR..."
                : "ONAYLA VE TAMAMLA"}
            </Typography>
          </Button>
        </View>
      </ScrollView>
    </Container>
  );
}
