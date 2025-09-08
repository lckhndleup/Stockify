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
    summaryJSON, // opsiyonel – confirmSales'ten gönderilirse ürün kalemleri listelenir
  } = params;

  const isSuccess = String(success) === "true";
  const willCreateInvoice = String(createInvoice) === "true";
  const successAnimationRef = useRef<SuccessAnimationRef>(null);

  // Store + Backend brokerları
  const { brokers: storeBrokers, getBrokerTotalDebt } = useAppStore();
  const { data: backendBrokers = [], isLoading: brokersLoading } =
    useActiveBrokers();

  // Broker'ı hem backend'ten hem store'dan bul
  // TODOMali: any kullanılmayacak. Düzenlenece !!!!
  const backendBroker: any = useMemo(
    () =>
      backendBrokers.find((b: any) => String(b.brokerId) === String(brokerId)),
    [backendBrokers, brokerId]
  );
  const storeBroker = useMemo(
    () => storeBrokers.find((b: any) => String(b.id) === String(brokerId)),
    [storeBrokers, brokerId]
  );

  // Görünen isim
  const displayName = backendBroker
    ? `${backendBroker.firstName} ${backendBroker.lastName}`
    : storeBroker
    ? `${storeBroker.name} ${storeBroker.surname}`
    : `Aracı #${brokerId}`;

  // Mevcut bakiye
  const currentBalance =
    typeof backendBroker?.currentBalance === "number"
      ? backendBroker.currentBalance
      : storeBroker
      ? getBrokerTotalDebt(storeBroker.id)
      : 0;

  // Confirm'den gelen özet (varsa)
  const summary: SalesSummary | null = useMemo(() => {
    try {
      return summaryJSON
        ? (JSON.parse(summaryJSON as string) as SalesSummary)
        : null;
    } catch {
      return null;
    }
  }, [summaryJSON]);

  // Toplamlar – parametre veya summary’den
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
          { text: "Kalın", style: "cancel" },
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

  // Sadece broker yüklenirken kısa bir loader
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
        {/* Header */}
        <View className="mb-6 items-center">
          <View className="mb-4 items-center justify-center">
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
            } text-center mb-2`}
          >
            {isSuccess ? "SATIŞ TAMAMLANDI!" : "SATIŞ BAŞARISIZ!"}
          </Typography>

          <Typography variant="body" className="text-stock-text text-center">
            {displayName}
          </Typography>
        </View>

        {isSuccess && (
          <>
            {/* Satış Özeti */}
            <Card
              variant="default"
              padding="lg"
              className="bg-green-50 border border-green-200 mb-4"
              radius="md"
            >
              <View className="flex-row items-center mb-4">
                <Icon
                  family="MaterialIcons"
                  name="receipt"
                  size={24}
                  color="#059669"
                  containerClassName="mr-3"
                />
                <Typography
                  variant="h4"
                  weight="semibold"
                  className="text-green-800"
                >
                  Satış Detayları
                </Typography>
              </View>

              {(summary?.documentNumber || documentNumber) && (
                <View className="flex-row justify-between items-center mb-3">
                  <Typography variant="body" className="text-green-700">
                    Belge No:
                  </Typography>
                  <Typography
                    variant="body"
                    weight="bold"
                    className="text-green-800"
                  >
                    {summary?.documentNumber ?? (documentNumber as string)}
                  </Typography>
                </View>
              )}

              {!!summary?.salesItems?.length && (
                <>
                  <Divider className="my-2" />
                  <View className="mb-3">
                    {summary.salesItems.map((it, idx) => (
                      <Card
                        key={`${it.productId}-${idx}`}
                        variant="default"
                        padding="sm"
                        className="bg-white border border-green-100 mb-2"
                        radius="md"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1">
                            <Typography
                              variant="body"
                              weight="semibold"
                              className="text-green-900 mb-1"
                            >
                              {it.productName}
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-green-700"
                            >
                              {it.productCount} adet × ₺
                              {it.unitPrice.toLocaleString()}
                            </Typography>

                            {/* Kalem KDV bilgisi */}
                            {typeof it.taxRate === "number" && (
                              <Typography
                                variant="caption"
                                className="text-green-700"
                              >
                                KDV %{it.taxRate} = ₺
                                {(it.taxPrice ?? 0).toLocaleString()}
                              </Typography>
                            )}
                          </View>

                          <Typography
                            variant="body"
                            weight="bold"
                            className="text-green-900"
                          >
                            ₺
                            {(
                              it.totalPriceWithTax ?? it.totalPrice
                            ).toLocaleString()}
                          </Typography>
                        </View>
                      </Card>
                    ))}
                  </View>
                </>
              )}

              <Divider className="my-2" />

              {/* Tutarlar */}
              <View className="space-y-2">
                {summary?.subtotalPrice !== undefined && (
                  <View className="flex-row justify-between items-center">
                    <Typography variant="body" className="text-green-700">
                      Alt Toplam:
                    </Typography>
                    <Typography
                      variant="body"
                      weight="bold"
                      className="text-green-800"
                    >
                      ₺{summary.subtotalPrice.toLocaleString()}
                    </Typography>
                  </View>
                )}

                {(summary?.discountPrice ?? discountValue) > 0 && (
                  <View className="flex-row justify-between items-center">
                    <Typography variant="body" className="text-green-700">
                      İskonto
                      {summary?.discountRate
                        ? ` (%${summary.discountRate})`
                        : ""}
                      :
                    </Typography>
                    <Typography
                      variant="body"
                      weight="bold"
                      className="text-green-800"
                    >
                      -₺
                      {(
                        summary?.discountPrice ?? discountValue
                      ).toLocaleString()}
                    </Typography>
                  </View>
                )}

                {/* Ara Toplam (KDV hariç) */}
                {summary?.totalPrice !== undefined && (
                  <View className="flex-row justify-between items-center">
                    <Typography variant="body" className="text-green-700">
                      Ara Toplam (KDV hariç):
                    </Typography>
                    <Typography
                      variant="body"
                      weight="bold"
                      className="text-green-800"
                    >
                      ₺{summary.totalPrice.toLocaleString()}
                    </Typography>
                  </View>
                )}

                {/* Toplam KDV */}
                {summary?.totalTaxPrice !== undefined && (
                  <View className="flex-row justify-between items-center">
                    <Typography variant="body" className="text-green-700">
                      KDV Toplamı:
                    </Typography>
                    <Typography
                      variant="body"
                      weight="bold"
                      className="text-green-800"
                    >
                      ₺{summary.totalTaxPrice.toLocaleString()}
                    </Typography>
                  </View>
                )}

                <Divider className="my-2" />

                <View className="flex-row justify-between items-center">
                  <Typography
                    variant="h4"
                    weight="bold"
                    className="text-green-800"
                  >
                    Genel Toplam (KDV dahil):
                  </Typography>
                  <Typography
                    variant="h3"
                    weight="bold"
                    className="text-green-800"
                  >
                    ₺
                    {(
                      summary?.totalPriceWithTax ?? totalWithTax
                    ).toLocaleString()}
                  </Typography>
                </View>
              </View>

              {((typeof downloadUrl === "string" && downloadUrl) ||
                summary?.downloadUrl) && (
                <View className="mt-4">
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    className="bg-white border border-green-300"
                    onPress={handleOpenInvoice}
                    leftIcon={
                      <Icon
                        family="MaterialIcons"
                        name="download"
                        size={20}
                        color="#059669"
                      />
                    }
                  >
                    <Typography className="text-green-800" weight="bold">
                      PDF/Belgeyi İndir
                    </Typography>
                  </Button>
                </View>
              )}
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

            {/* Bilgi Notu */}
            <Card
              variant="default"
              padding="md"
              className="bg-yellow-50 border border-yellow-200 mb-6"
              radius="md"
            >
              <View className="flex-row items-start">
                <Icon
                  family="MaterialIcons"
                  name="info"
                  size={20}
                  color="#F59E0B"
                  containerClassName="mr-3 mt-0.5"
                />
                <View className="flex-1">
                  <Typography
                    variant="body"
                    className="text-yellow-700"
                    weight="medium"
                  >
                    Satış işlemi başarıyla tamamlandı!
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-yellow-600 mt-1"
                  >
                    Ürün stokları güncellendi ve aracının bakiyesine eklendi.
                  </Typography>
                </View>
              </View>
            </Card>
          </>
        )}

        {/* Aksiyonlar */}
        <View className="space-y-3 mb-6">
          <Button
            variant="outline"
            size="lg"
            fullWidth
            className="border-stock-border"
            onPress={handleGoToHome}
            leftIcon={
              <Icon
                family="MaterialIcons"
                name="home"
                size={20}
                color="#67686A"
              />
            }
          >
            <Typography className="text-stock-dark" weight="bold">
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
