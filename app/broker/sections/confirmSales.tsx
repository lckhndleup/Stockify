// app/broker/sections/confirmSales.tsx
import React, { useEffect, useMemo, useState } from "react";
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
import {
  useSalesCalculate,
  useSalesConfirm,
  useSalesCancel,
} from "@/src/hooks/api/useSales";
import type { SalesSummary } from "@/src/validations/salesValidations";

interface SalesItemParam {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function ConfirmSales() {
  // URL parametreleri
  const params = useLocalSearchParams();
  const brokerId = params.brokerId as string;
  const createInvoiceParam = params.createInvoice as string | undefined;
  const willCreateInvoice = (createInvoiceParam ?? "true") === "true";

  // Paramdan gelen (UI listesi için) satış kalemleri
  const parsedSalesData: SalesItemParam[] = useMemo(
    () => (params.salesData ? JSON.parse(params.salesData as string) : []),
    [params.salesData]
  );

  // Ekran state
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<SalesSummary | null>(null);

  // Store fallback
  const {
    brokers: localBrokers,
    getBrokerTotalDebt,
    getBrokerDiscount,
  } = useAppStore();
  const { toast, showSuccess, showError } = useToast();

  // Broker (backend > local)
  const {
    data: backendBrokers = [],
    isLoading: brokersLoading,
    error: brokersError,
  } = useActiveBrokers();

  const brokers = brokersError ? localBrokers : backendBrokers;
  const broker = brokers.find((b: any) => String(b.id) === String(brokerId));

  const brokerDebt = broker
    ? "balance" in broker
      ? (broker as any).balance
      : getBrokerTotalDebt(broker.id)
    : 0;

  const brokerDiscount = broker
    ? broker.discountRate || 0
    : getBrokerDiscount(brokerId);

  // Backend mutations
  const calcMutation = useSalesCalculate();
  const confirmMutation = useSalesConfirm();
  const cancelMutation = useSalesCancel();

  // İlk yüklemede (ve brokerId / willCreateInvoice değişince) toplamları backend’den hesapla
  useEffect(() => {
    const run = async () => {
      if (!brokerId) return;
      try {
        const res = await calcMutation.mutateAsync({
          brokerId: Number(brokerId),
          createInvoice: willCreateInvoice,
        });
        setSummary(res);
      } catch (e) {
        setSummary(null);
      }
    };
    run();
  }, [brokerId, willCreateInvoice]);

  // Butonlar
  const handleCancel = () => {
    Alert.alert(
      "Satışı İptal Et",
      "Satış işlemini iptal etmek istediğinizden emin misiniz?\n\nTüm eklenen ürünler silinecektir.",
      [
        { text: "Geri Dön", style: "cancel" },
        {
          text: "İptal Et",
          style: "destructive",
          onPress: async () => {
            try {
              setIsProcessing(true);
              await cancelMutation.mutateAsync({
                brokerId: Number(brokerId),
                createInvoice: willCreateInvoice,
              });
              showSuccess("Satış iptal edildi.");
              // Aracı detay sayfasına git
              router.push({
                pathname: "/broker/brokerDetail",
                params: { brokerId },
              });
            } catch (e) {
              showError("Satış iptal edilirken bir hata oluştu.");
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    // Satış sayfasına geri dön
    router.back();
  };

  const handleConfirm = async () => {
    if (!parsedSalesData.length) {
      showError("Satış yapılacak ürün bulunamadı.");
      return;
    }

    try {
      setIsProcessing(true);
      const res = await confirmMutation.mutateAsync({
        brokerId: Number(brokerId),
        createInvoice: willCreateInvoice,
      });

      // resultSales sayfasına geç — toplam & indirim backend’den
      router.push({
        pathname: "/broker/sections/resultSales",
        params: {
          brokerId,
          success: "true",
          totalAmount: String(res?.totalPriceWithTax ?? 0),
          discountAmount: String(res?.discountPrice ?? 0),
          createInvoice: String(willCreateInvoice),
          documentNumber: res?.documentNumber ?? "",
          downloadUrl: res?.downloadUrl ?? "",
        },
      });
    } catch (e) {
      showError("Satış onaylanırken bir hata oluştu.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (brokersLoading && !broker) {
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

  // UI hesaplamaları (kart görseli için); toplamlar summary’den gösterilecek
  const calcSubTotalLocal = () =>
    parsedSalesData.reduce((sum, i) => sum + i.totalPrice, 0);

  return (
    <Container className="bg-white" padding="sm" safeTop={false}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
      />

      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {/* Header - Aracı Bilgileri */}
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

          {/* Ürün Listesi – UI verisi paramdan */}
          <View className="mb-4">
            {parsedSalesData.map((item, index) => (
              <View key={index} className="mb-3">
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
                        {item.quantity} adet × ₺
                        {item.unitPrice.toLocaleString()}
                      </Typography>
                    </View>
                    <Typography
                      variant="body"
                      weight="bold"
                      className="text-stock-dark"
                    >
                      ₺{item.totalPrice.toLocaleString()}
                    </Typography>
                  </View>
                </Card>
              </View>
            ))}
          </View>

          <Divider className="my-4" />

          {/* Hesaplamalar – backend calculate sonucuna göre */}
          <View className="space-y-2">
            <View className="flex-row justify-between items-center">
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
                ₺
                {(
                  summary?.subtotalPrice ?? calcSubTotalLocal()
                ).toLocaleString()}
              </Typography>
            </View>

            {(summary?.discountPrice ?? 0) > 0 && (
              <View className="flex-row justify-between items-center">
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

            <Divider className="my-2" />

            <View className="flex-row justify-between items-center">
              <Typography
                variant="h4"
                weight="bold"
                className="text-stock-black"
              >
                Toplam:
              </Typography>
              <Typography variant="h3" weight="bold" className="text-stock-red">
                ₺
                {(
                  summary?.totalPriceWithTax ??
                  summary?.totalPrice ??
                  calcSubTotalLocal()
                ).toLocaleString()}
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

        {/* Bakiye Bilgisi */}
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
              ₺{Number(brokerDebt).toLocaleString()}
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
              ₺
              {(
                Number(brokerDebt) + (summary?.totalPriceWithTax ?? 0)
              ).toLocaleString()}
            </Typography>
          </View>
        </Card>

        {/* Aksiyon Butonları */}
        <View className="space-y-3 mb-6">
          {/* İptal */}
          <Button
            variant="outline"
            size="lg"
            fullWidth
            className="border-stock-red"
            onPress={handleCancel}
            loading={isProcessing && cancelMutation.isPending}
            leftIcon={
              !(isProcessing && cancelMutation.isPending) ? (
                <Icon
                  family="MaterialIcons"
                  name="cancel"
                  size={20}
                  color="#E3001B"
                />
              ) : undefined
            }
          >
            <Typography className="text-stock-red" weight="bold">
              {isProcessing && cancelMutation.isPending
                ? "İŞLEM YAPILIYOR..."
                : "İPTAL ET"}
            </Typography>
          </Button>

          {/* Düzenle */}
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            className="bg-stock-gray"
            onPress={handleEdit}
            disabled={isProcessing}
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

          {/* Onayla */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="bg-stock-red"
            onPress={handleConfirm}
            loading={isProcessing && confirmMutation.isPending}
            leftIcon={
              !(isProcessing && confirmMutation.isPending) ? (
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
              {isProcessing && confirmMutation.isPending
                ? "İŞLEM YAPILIYOR..."
                : "ONAYLA VE TAMAMLA"}
            </Typography>
          </Button>
        </View>
      </ScrollView>
    </Container>
  );
}
