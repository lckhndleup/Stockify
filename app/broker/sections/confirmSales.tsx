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
  Loading,
} from "@/src/components/ui";
import { useAppStore } from "@/src/stores/appStore";
import { useToast } from "@/src/hooks/useToast";
import { useActiveBrokers } from "@/src/hooks/api/useBrokers";
import {
  useSalesCalculate,
  useSalesConfirm,
  useSalesCancel,
} from "@/src/hooks/api/useSales";
import type { SalesSummary } from "@/src/types/sales";

type SalesItemParam = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate?: number;
  taxPrice?: number;
  totalPriceWithTax?: number;
};

export default function ConfirmSales() {
  // --- Params & state (LOGIC AYNI) ---
  const params = useLocalSearchParams();
  const brokerId = params.brokerId as string;
  const createInvoiceParam = params.createInvoice as string | undefined;
  const willCreateInvoice = (createInvoiceParam ?? "true") === "true";

  const parsedSalesData: SalesItemParam[] = useMemo(
    () => (params.salesData ? JSON.parse(params.salesData as string) : []),
    [params.salesData]
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<SalesSummary | null>(null);

  const {
    brokers: localBrokers,
    getBrokerTotalDebt,
    getBrokerDiscount,
  } = useAppStore();
  const { toast, showSuccess, showError } = useToast();

  const {
    data: backendBrokers = [],
    isLoading: brokersLoading,
    error: brokersError,
  } = useActiveBrokers();

  const brokers = brokersError ? localBrokers : backendBrokers;
  const broker = brokers.find((b: any) => String(b.id) === String(brokerId));

  const brokerDebt = broker
    ? typeof (broker as any).currentBalance === "number"
      ? (broker as any).currentBalance
      : "balance" in broker
      ? (broker as any).balance
      : getBrokerTotalDebt(broker.id)
    : 0;

  const brokerDiscount = broker
    ? broker.discountRate || 0
    : getBrokerDiscount(brokerId);

  // Mutations (LOGIC AYNI)
  const calcMutation = useSalesCalculate();
  const confirmMutation = useSalesConfirm();
  const cancelMutation = useSalesCancel();

  useEffect(() => {
    const run = async () => {
      if (!brokerId) return;
      try {
        const res = await calcMutation.mutateAsync({
          brokerId: Number(brokerId),
          createInvoice: willCreateInvoice,
        });
        setSummary(res);
      } catch {
        setSummary(null);
      }
    };
    run();
  }, [brokerId, willCreateInvoice]);

  const handleCancel = () => {
    Alert.alert(
      "Satışı İptal Et",
      "Satış işlemini iptal etmek istediğinize emin misiniz?",
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
              router.push({
                pathname: "/broker/brokerDetail",
                params: { brokerId },
              });
            } catch {
              showError("Satış iptal edilirken hata oluştu.");
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => router.back();

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
          // ✅ eklenen alan: resultSales’te ara toplam ve KDV’nin 0 gelmemesi için
          summaryJSON: JSON.stringify(res),
        },
      });
    } catch {
      showError("Satış onaylanırken hata oluştu.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (brokersLoading && !broker) {
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <View className="flex-1 items-center justify-center">
          <Loading size="large" />
        </View>
      </Container>
    );
  }

  if (!broker) {
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <View className="flex-1 items-center justify-center">
          <Typography className="text-stock-text">
            Aracı bulunamadı...
          </Typography>
        </View>
      </Container>
    );
  }

  // --- UI ---
  const subTotalLocal = parsedSalesData.reduce(
    (s, i) => s + (i.totalPriceWithTax ?? i.totalPrice),
    0
  );

  return (
    <Container className="bg-white" padding="sm" safeTop={false}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
      />
      <ScrollView showsVerticalScrollIndicator={false} className="mt-4">
        {/* 1) ARACI İSMİ */}
        <View className="items-center mb-4">
          <Typography
            variant="h1"
            size="3xl"
            weight="bold"
            className="text-stock-black text-center"
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
        {/* 2) BAKİYE SATIRI (| ile iki sütun) */}
        {/* <View className="border border-stock-border rounded-lg bg-white mb-4 overflow-hidden">
          <View className="flex-row">
            <View className="flex-1 px-4 py-3">
              <Typography className="text-stock-text">
                onceki bakiye :
              </Typography>
              <Typography weight="semibold" className="text-stock-dark mt-0.5">
                ₺{Number(brokerDebt).toLocaleString()}
              </Typography>
            </View>
            <View className="w-px bg-stock-border" />
            <View className="flex-1 px-4 py-3">
              <Typography className="text-stock-text">yeni bakiye :</Typography>
              <Typography weight="bold" className="text-stock-dark mt-0.5">
                ₺{Number(brokerDebt).toLocaleString()}
              </Typography>
            </View>
          </View>
        </View> */}
        {/* 3) FATURA BİLGİ ŞERİDİ */}
        {willCreateInvoice && (
          <View className="border border-stock-border rounded-lg px-4 py-3 bg-white mb-4">
            <Typography weight="medium" className="text-stock-dark">
              fatura oluşturulacak
            </Typography>
          </View>
        )}
        {/* 4) ÜRÜNLER BAŞLIĞI */}
        <Typography className="text-stock-text mb-4 ml-2" weight="medium">
          ÜRÜNLER
        </Typography>
        {/* 5) ÜRÜN SATIRLARI (kutu kutu) */}
        <View className="">
          {parsedSalesData.map((item, idx) => (
            <View
              key={`${item.id}-${idx}`}
              className="border border-stock-border rounded-lg px-3 py-2 mb-4 bg-white"
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-1 pr-3">
                  <Typography weight="semibold" className="text-stock-dark">
                    {item.name}
                  </Typography>
                  <Typography className="text-stock-text mt-0.5">
                    {item.quantity} adet × ₺{item.unitPrice.toLocaleString()}
                  </Typography>
                  {item.taxRate != null && (
                    <Typography className="text-stock-text">
                      KDV %{item.taxRate} = ₺
                      {(item.taxPrice ?? 0).toLocaleString()}
                    </Typography>
                  )}
                </View>
                <Typography weight="bold" className="text-stock-dark">
                  ₺
                  {(item.totalPriceWithTax ?? item.totalPrice).toLocaleString()}
                </Typography>
              </View>
            </View>
          ))}
        </View>
        {/* 6) TOPLAM KARTI (SalesSection mizanpajı) */}
        <Card
          variant="default"
          padding="lg"
          radius="md"
          className="border border-stock-border bg-stock-gray mb-4"
        >
          <View className="flex-row justify-between py-1">
            <Typography className="text-stock-dark">Alt Toplam:</Typography>
            <Typography weight="semibold" className="text-stock-dark">
              ₺{(summary?.totalPriceWithTax ?? subTotalLocal).toLocaleString()}
            </Typography>
          </View>

          {(summary?.discountPrice ?? 0) > 0 && (
            <View className="flex-row justify-between py-1">
              <Typography className="text-stock-red">
                İskonto (%{summary?.discountRate ?? brokerDiscount}):
              </Typography>
              <Typography weight="semibold" className="text-stock-red">
                -₺{(summary?.discountPrice ?? 0).toLocaleString()}
              </Typography>
            </View>
          )}

          <View className="flex-row justify-between py-1">
            <Typography className="text-stock-dark">
              Ara Toplam (KDV hariç):
            </Typography>
            <Typography weight="semibold" className="text-stock-dark">
              ₺{(summary?.totalPrice ?? 0).toLocaleString()}
            </Typography>
          </View>

          <View className="flex-row justify-between py-1">
            <Typography className="text-stock-dark">KDV Toplamı:</Typography>
            <Typography weight="semibold" className="text-stock-dark">
              ₺{(summary?.totalTaxPrice ?? 0).toLocaleString()}
            </Typography>
          </View>

          <Divider className="my-3" />

          <View className="flex-row justify-between items-center">
            <Typography
              variant="body"
              weight="bold"
              className="text-stock-black"
            >
              Genel Toplam (KDV dahil):
            </Typography>
            <Typography variant="h3" weight="bold" className="text-stock-red">
              ₺
              {(
                summary?.totalPriceWithTax ??
                summary?.totalPrice ??
                subTotalLocal
              ).toLocaleString()}
            </Typography>
          </View>
        </Card>
        {/* 7) YAN YANA BUTONLAR: DÜZENLE | İPTAL ET */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              className="bg-stock-gray"
              disabled={isProcessing}
              onPress={handleEdit}
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
          </View>

          <View className="flex-1">
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
                  ? "İŞLEM..."
                  : "İPTAL ET"}
              </Typography>
            </Button>
          </View>
        </View>
        {/* 8) ALTTA TAM GENİŞLİK: ONAYLA VE DEVAM ET */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          className="bg-stock-red mb-16"
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
              ? "İŞLEM..."
              : "ONAYLA VE DEVAM ET"}
          </Typography>
        </Button>
      </ScrollView>
    </Container>
  );
}
