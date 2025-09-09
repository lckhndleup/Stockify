// app/broker/sections/resultSales.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, BackHandler, ScrollView, View, Linking } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  Container,
  Typography,
  Card,
  Button,
  Icon,
  Divider,
  Loading,
} from "@/src/components/ui";
import { useAppStore } from "@/src/stores/appStore";
import { useActiveBrokers } from "@/src/hooks/api/useBrokers";
import { useSalesCalculate } from "@/src/hooks/api/useSales";

type SalesItem = {
  salesId?: number;
  productId: number;
  productName: string;
  productCount: number;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
  taxPrice: number;
  totalPriceWithTax: number;
};
type SalesSummary = {
  documentNumber?: string;
  salesItems: SalesItem[];
  subtotalPrice: number;
  discountRate: number;
  discountPrice: number;
  totalPrice: number; // iskonto sonrası ara toplam (KDV hariç)
  totalTaxPrice?: number; // toplam KDV
  totalPriceWithTax: number; // KDV dahil genel toplam
  downloadUrl?: string;
};

import SuccessAnimation, {
  SuccessAnimationRef,
} from "@/src/components/svg/successAnimation";

export default function ResultSales() {
  const params = useLocalSearchParams();
  const {
    brokerId,
    success,
    totalAmount,
    discountAmount,
    createInvoice,
    documentNumber,
    downloadUrl,
    summaryJSON,
  } = params;

  const isSuccess = String(success) === "true";
  const willCreateInvoice = String(createInvoice) === "true";
  const successAnimationRef = useRef<SuccessAnimationRef>(null);

  // Store + Backend brokerları (diğer sayfalardakiyle aynı desen)
  const { brokers: storeBrokers, getBrokerTotalDebt } = useAppStore();
  const {
    data: backendBrokers = [],
    isLoading: brokersLoading,
    error: brokersError,
  } = useActiveBrokers();

  // Backend > Local fallback: aynı id eşlemesi (b.id)
  const backendBroker = useMemo(
    () =>
      (backendBrokers || []).find(
        (b: any) => String(b.id) === String(brokerId)
      ),
    [backendBrokers, brokerId]
  );
  const localBroker = useMemo(
    () =>
      (storeBrokers || []).find((b: any) => String(b.id) === String(brokerId)),
    [storeBrokers, brokerId]
  );
  const broker = backendBroker || localBroker; // görüntülemede öncelik backend

  // Ad Soyad – API > Local
  const displayName = broker
    ? `${broker.name ?? ""} ${broker.surname ?? ""}`.trim()
    : "Aracı";

  // Confirm’den gelen özet (opsiyonel)
  const summary: SalesSummary | null = useMemo(() => {
    try {
      return summaryJSON
        ? (JSON.parse(summaryJSON as string) as SalesSummary)
        : null;
    } catch {
      return null;
    }
  }, [summaryJSON]);

  // ✅ Backend’den calculate sonucu da çek (confirm yoksa buradan göster)
  const [calcSummary, setCalcSummary] = useState<SalesSummary | null>(null);
  const calcMutation = useSalesCalculate();

  useEffect(() => {
    if (!isSuccess || !brokerId) return;
    if (summary) return; // ✅ confirm’den özet geldiyse yeniden hesaplama yapma (sepet boş!)
    (async () => {
      try {
        const res = await calcMutation.mutateAsync({
          brokerId: Number(brokerId),
          createInvoice: willCreateInvoice,
        });
        console.log("🧮 [ResultSales] /sales/calculate response:", res);
        setCalcSummary(res);
      } catch (e) {
        console.log("⚠️ [ResultSales] calculate error:", e);
        setCalcSummary(null);
      }
    })();
  }, [isSuccess, brokerId, willCreateInvoice, summary]);

  // Ekranda kullanılacak özet: önce confirm’den gelen, yoksa backend calculate
  const summaryToShow: SalesSummary | null = summary ?? calcSummary;

  // Toplamlar (parametre/summaryToShow)
  const totalWithTax =
    typeof totalAmount === "string"
      ? Number(totalAmount) || 0
      : summaryToShow?.totalPriceWithTax ?? 0;

  const discountValue =
    typeof discountAmount === "string"
      ? Number(discountAmount) || 0
      : summaryToShow?.discountPrice ?? 0;

  // Yeni bakiye – yalnızca backend currentBalance varsa onu göster, yoksa fallback
  const newBalance =
    typeof (backendBroker as any)?.currentBalance === "number"
      ? (backendBroker as any).currentBalance
      : broker
      ? "balance" in broker
        ? (broker as any).balance
        : getBrokerTotalDebt(broker.id)
      : 0;

  /* =========================
     LOGS (isteğin doğrultusunda)
     ========================= */
  useEffect(() => {
    console.log("🧾 [ResultSales] Broker resolve", {
      brokerId,
      source: backendBroker ? "backendAPI" : "localStore",
      backendFound: !!backendBroker,
      localFound: !!localBroker,
      name: broker?.name,
      surname: broker?.surname,
      backend_currentBalance:
        typeof (backendBroker as any)?.currentBalance === "number"
          ? (backendBroker as any).currentBalance
          : undefined,
      backend_balance:
        typeof (backendBroker as any)?.balance === "number"
          ? (backendBroker as any).balance
          : undefined,
      local_balance:
        typeof (localBroker as any)?.balance === "number"
          ? (localBroker as any).balance
          : undefined,
    });
  }, [brokerId, backendBroker, localBroker, broker]);

  useEffect(() => {
    const parsedParam =
      typeof totalAmount === "string" ? Number(totalAmount) || 0 : 0;
    console.log("🧮 [ResultSales] Totals", {
      totalAmountParam: totalAmount,
      parsedTotalAmount: parsedParam,
      summaryTotalWithTax: summaryToShow?.totalPriceWithTax,
      summaryDiscount: summaryToShow?.discountPrice,
      computedNewBalance: newBalance,
    });
  }, [totalAmount, summaryToShow, newBalance]);

  // Android back – ana sayfaya sorarak dön
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      Alert.alert(
        "Sayfadan Ayrıl",
        "Ana sayfaya dönmek istediğinizden emin misiniz?",
        [
          { text: "Kal", style: "cancel" },
          { text: "Ana Sayfa", onPress: () => router.push("/") },
        ]
      );
      return true;
    });
    return () => sub.remove();
  }, []);

  // Aksiyonlar
  const handleGoToBrokerDetail = () =>
    router.replace({ pathname: "/broker/brokerDetail", params: { brokerId } });
  const handleGoToHome = () => router.replace("/");
  const handleNewSale = () =>
    router.replace({
      pathname: "/broker/sections/salesSection",
      params: { brokerId },
    });
  const handleOpenInvoice = async () => {
    const url =
      (typeof downloadUrl === "string" && downloadUrl) ||
      (summaryToShow?.downloadUrl ?? "");
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Hata", "Belge açılamadı.");
    }
  };

  // Loading guard
  if (brokersLoading && !broker) {
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <View className="items-center justify-center flex-1">
          <Loading size="large" />
        </View>
      </Container>
    );
  }

  return (
    <Container className="bg-white" padding="sm" safeTop={false}>
      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {/* ÜST BİLGİLER: ARACI ADI + YENİ BAKİYE */}
        <View className="items-center mb-2">
          <Typography
            variant="h1"
            size="3xl"
            weight="bold"
            className="text-stock-black text-center"
          >
            {displayName || "Aracı"}
          </Typography>
          <Typography
            variant="caption"
            className="text-stock-text mt-1 text-center"
          >
            Yeni Bakiye: ₺{Number(newBalance).toLocaleString()}
          </Typography>
        </View>

        {/* BAŞARI/BAŞARISIZ GÖRSEL + BAŞLIK */}
        <View className="items-center mt-3 mb-2">
          {isSuccess ? (
            <SuccessAnimation
              ref={successAnimationRef}
              size={80}
              autoPlay
              loop={false}
              speed={1.2}
            />
          ) : (
            <Icon
              family="MaterialIcons"
              name="error"
              size={64}
              color="#EF4444"
              containerClassName="items-center"
            />
          )}
        </View>

        <Typography
          variant="h2"
          weight="bold"
          size="2xl"
          className={`${
            isSuccess ? "text-green-600" : "text-red-600"
          } text-center mb-6`}
        >
          {isSuccess ? "SATIŞ TAMAMLANDI!" : "SATIŞ BAŞARISIZ!"}
        </Typography>

        {/* === TOPLAM KARTI (confirmSales ile birebir) === */}
        {isSuccess && (
          <Card
            variant="default"
            padding="lg"
            radius="md"
            className="border border-stock-border bg-stock-gray mb-4"
          >
            <View className="flex-row justify-between py-1">
              <Typography className="text-stock-dark">Alt Toplam:</Typography>
              <Typography weight="semibold" className="text-stock-dark">
                ₺
                {(
                  summaryToShow?.totalPriceWithTax ?? totalWithTax
                ).toLocaleString()}
              </Typography>
            </View>

            {(summaryToShow?.discountPrice ?? discountValue) > 0 && (
              <View className="flex-row justify-between py-1">
                <Typography className="text-stock-red">
                  İskonto
                  {summaryToShow?.discountRate
                    ? ` (%${summaryToShow.discountRate})`
                    : ""}
                  :
                </Typography>
                <Typography weight="semibold" className="text-stock-red">
                  -₺
                  {(
                    summaryToShow?.discountPrice ?? discountValue
                  ).toLocaleString()}
                </Typography>
              </View>
            )}

            <View className="flex-row justify-between py-1">
              <Typography className="text-stock-dark">
                Ara Toplam (KDV hariç):
              </Typography>
              <Typography weight="semibold" className="text-stock-dark">
                ₺{(summaryToShow?.totalPrice ?? 0).toLocaleString()}
              </Typography>
            </View>

            <View className="flex-row justify-between py-1">
              <Typography className="text-stock-dark">KDV Toplamı:</Typography>
              <Typography weight="semibold" className="text-stock-dark">
                ₺{(summaryToShow?.totalTaxPrice ?? 0).toLocaleString()}
              </Typography>
            </View>

            <Divider className="my-3" />

            <View className="flex-row justify-between items-center">
              <Typography
                variant="h4"
                weight="bold"
                className="text-stock-black"
              >
                Genel Toplam (KDV dahil):
              </Typography>
              <Typography variant="h3" weight="bold" className="text-stock-red">
                ₺
                {(
                  summaryToShow?.totalPriceWithTax ?? totalWithTax
                ).toLocaleString()}
              </Typography>
            </View>
          </Card>
        )}

        {/* PDF / BELGE İNDİR – kartın hemen altında */}
        {isSuccess &&
          ((typeof downloadUrl === "string" && downloadUrl) ||
            summaryToShow?.downloadUrl) && (
            <View className="mb-8">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                className="bg-white border border-stock-border"
                onPress={handleOpenInvoice}
                leftIcon={
                  <Icon
                    family="MaterialIcons"
                    name="download"
                    size={20}
                    color="#16A34A"
                  />
                }
              >
                <Typography className="text-stock-dark" weight="bold">
                  PDF/Belgeyi İndir
                </Typography>
              </Button>
            </View>
          )}

        {/* FATURA OLUŞTURULDU kartı */}
        {isSuccess && willCreateInvoice && (
          <Card
            variant="default"
            padding="md"
            radius="md"
            className="bg-blue-50 border border-blue-200 mb-8"
          >
            <View className="flex-row items-center">
              <Icon
                family="MaterialIcons"
                name="description"
                size={20}
                color="#3B82F6"
                containerClassName="mr-3"
              />
              <View className="flex-1">
                <Typography
                  variant="body"
                  className="text-blue-700"
                  weight="medium"
                >
                  Fatura oluşturuldu
                </Typography>
                <Typography variant="caption" className="text-blue-600">
                  Faturanız elektronik ortamda iletilecektir
                </Typography>
              </View>
            </View>
          </Card>
        )}

        {/* AKSİYON BUTONLARI */}
        <View className="space-y-3 mb-10">
          <Button
            variant="outline"
            size="lg"
            fullWidth
            className="border-stock-red"
            onPress={handleGoToHome}
            leftIcon={
              <Icon
                family="MaterialIcons"
                name="home"
                size={20}
                color="#E3001B"
              />
            }
          >
            <Typography className="text-stock-red" weight="bold">
              ANA SAYFAYA GİT
            </Typography>
          </Button>

          {isSuccess ? (
            <>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                className="bg-stock-gray"
                onPress={handleNewSale}
                leftIcon={
                  <Icon
                    family="MaterialIcons"
                    name="add-shopping-cart"
                    size={20}
                    color="#67686A"
                  />
                }
              >
                <Typography className="text-stock-dark" weight="bold">
                  YENİ SATIŞ YAP
                </Typography>
              </Button>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="bg-stock-red"
                onPress={handleGoToBrokerDetail}
                leftIcon={
                  <Icon
                    family="MaterialIcons"
                    name="person"
                    size={20}
                    color="white"
                  />
                }
              >
                <Typography className="text-white" weight="bold">
                  ARACI DETAYINA GİT
                </Typography>
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="bg-stock-red"
              onPress={handleNewSale}
              leftIcon={
                <Icon
                  family="MaterialIcons"
                  name="refresh"
                  size={20}
                  color="white"
                />
              }
            >
              <Typography className="text-white" weight="bold">
                TEKRAR DENE
              </Typography>
            </Button>
          )}
        </View>
      </ScrollView>
    </Container>
  );
}
