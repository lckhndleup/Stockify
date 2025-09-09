// app/broker/sections/resultSales.tsx
import React, { useEffect, useMemo, useRef } from "react";
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

  // Store + Backend brokerları
  const { brokers: storeBrokers, getBrokerTotalDebt } = useAppStore();
  const { data: backendBrokers = [], isLoading: brokersLoading } =
    useActiveBrokers();

  // Broker (backend/store)
  const backendBroker: any = useMemo(
    () =>
      backendBrokers.find((b: any) => String(b.brokerId) === String(brokerId)),
    [backendBrokers, brokerId]
  );
  const storeBroker = useMemo(
    () => storeBrokers.find((b: any) => String(b.id) === String(brokerId)),
    [storeBrokers, brokerId]
  );

  const displayName = backendBroker
    ? `${backendBroker.firstName} ${backendBroker.lastName}`
    : storeBroker
    ? `${storeBroker.name} ${storeBroker.surname}`
    : `Aracı`;

  const currentBalance =
    typeof backendBroker?.currentBalance === "number"
      ? backendBroker.currentBalance
      : storeBroker
      ? getBrokerTotalDebt(storeBroker.id)
      : 0;

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

  // Toplamlar (parametre/summary)
  const totalWithTax =
    typeof totalAmount === "string"
      ? Number(totalAmount) || 0
      : summary?.totalPriceWithTax ?? 0;

  const discountValue =
    typeof discountAmount === "string"
      ? Number(discountAmount) || 0
      : summary?.discountPrice ?? 0;

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
      (summary?.downloadUrl ?? "");
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Hata", "Belge açılamadı.");
    }
  };

  // Loading
  if (brokersLoading && !backendBroker && !storeBroker) {
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
        {/* ÜST BİLGİLER: ARACI ADI + BAKİYE */}
        <View className="items-center mb-2">
          <Typography
            variant="h1"
            size="3xl"
            weight="bold"
            className="text-stock-black text-center"
          >
            {displayName}
          </Typography>
          <Typography
            variant="caption"
            className="text-stock-text mt-1 text-center"
          >
            Bakiye: ₺{Number(currentBalance).toLocaleString()}
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
                ₺{(summary?.totalPriceWithTax ?? totalWithTax).toLocaleString()}
              </Typography>
            </View>

            {(summary?.discountPrice ?? discountValue) > 0 && (
              <View className="flex-row justify-between py-1">
                <Typography className="text-stock-red">
                  İskonto
                  {summary?.discountRate ? ` (%${summary.discountRate})` : ""}:
                </Typography>
                <Typography weight="semibold" className="text-stock-red">
                  -₺{(summary?.discountPrice ?? discountValue).toLocaleString()}
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
                variant="h4"
                weight="bold"
                className="text-stock-black"
              >
                Genel Toplam (KDV dahil):
              </Typography>
              <Typography variant="h3" weight="bold" className="text-stock-red">
                ₺{(summary?.totalPriceWithTax ?? totalWithTax).toLocaleString()}
              </Typography>
            </View>
          </Card>
        )}

        {/* PDF / BELGE İNDİR – TOPLAM KARTININ HEMEN ALTINDA AYRI BLOK */}
        {isSuccess &&
          ((typeof downloadUrl === "string" && downloadUrl) ||
            summary?.downloadUrl) && (
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

        {/* FATURA OLUŞTURULDU BİLGİSİ */}
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

        {/* AKSİYON BUTONLARI (aynı akış) */}
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
