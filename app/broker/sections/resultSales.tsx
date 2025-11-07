// app/broker/sections/resultSales.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, BackHandler, ScrollView, View, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Container,
  Typography,
  Card,
  Button,
  Icon,
  Divider,
  Loading,
  DocumentModal,
} from "@/src/components/ui";
import { useActiveBrokers } from "@/src/hooks/api/useBrokers";
import { useSalesCalculate } from "@/src/hooks/api/useSales";
import type { SalesSummaryResult } from "@/src/types/salesUI";
import SuccessAnimation from "@/src/components/svg/successAnimation";
import type { SuccessAnimationRef } from "@/src/types/svg";
import logger from "@/src/utils/logger";
import apiService from "@/src/services/api";

export default function ResultSales() {
  const params = useLocalSearchParams();
  const {
    brokerId,
    success,
    totalAmount,
    discountAmount,
    createInvoice,
    downloadUrl,
    summaryJSON,
  } = params;

  const isSuccess = String(success) === "true";
  const willCreateInvoice = String(createInvoice) === "true";
  const successAnimationRef = useRef<SuccessAnimationRef>(null);

  // Backend brokers
  const { data: brokers = [], isLoading: brokersLoading } = useActiveBrokers();

  // Backend broker
  const broker = useMemo(
    () => (brokers || []).find((b: any) => String(b.id) === String(brokerId)),
    [brokers, brokerId],
  );

  // Ad Soyad – API > Local
  const displayName = broker ? `${broker.name ?? ""} ${broker.surname ?? ""}`.trim() : "Aracı";

  // Confirm’den gelen özet (opsiyonel)
  const summary: SalesSummaryResult | null = useMemo(() => {
    try {
      return summaryJSON ? (JSON.parse(summaryJSON as string) as SalesSummaryResult) : null;
    } catch {
      return null;
    }
  }, [summaryJSON]);

  // ✅ Backend'den calculate sonucu da çek (confirm yoksa buradan göster)
  const [calcSummary, setCalcSummary] = useState<SalesSummaryResult | null>(null);
  const calcMutation = useSalesCalculate();

  // Document Modal State
  const [documentModalVisible, setDocumentModalVisible] = useState(false);
  const [currentDocumentUrl, setCurrentDocumentUrl] = useState("");
  const [currentDocumentTitle, setCurrentDocumentTitle] = useState("");

  useEffect(() => {
    if (!isSuccess || !brokerId) return;
    if (summary) return; // ✅ confirm’den özet geldiyse yeniden hesaplama yapma (sepet boş!)
    (async () => {
      try {
        const res = await calcMutation.mutateAsync({
          brokerId: Number(brokerId),
          createInvoice: willCreateInvoice,
        });
        logger.debug("🧮 [ResultSales] /sales/calculate response:", res);
        setCalcSummary(res);
      } catch (e) {
        logger.error("⚠️ [ResultSales] calculate error:", e);
        setCalcSummary(null);
      }
    })();
  }, [isSuccess, brokerId, willCreateInvoice, summary, calcMutation]);

  // Ekranda kullanılacak özet: önce confirm’den gelen, yoksa backend calculate
  const summaryToShow: SalesSummaryResult | null = summary ?? calcSummary;

  // Toplamlar (parametre/summaryToShow)
  const totalWithTax =
    typeof totalAmount === "string"
      ? Number(totalAmount) || 0
      : (summaryToShow?.totalPriceWithTax ?? 0);

  const discountValue =
    typeof discountAmount === "string"
      ? Number(discountAmount) || 0
      : (summaryToShow?.discountPrice ?? 0);

  // Broker balance - sadece backend'den
  const Balance = broker ? ((broker as any)?.currentBalance ?? (broker as any)?.balance ?? 0) : 0;

  /* =========================
     LOGS (isteğin doğrultusunda)
     ========================= */
  useEffect(() => {
    logger.debug("🧾 [ResultSales] Broker resolve", {
      brokerId,
      source: "API",
      brokerFound: !!broker,
      name: broker?.name,
      surname: broker?.surname,
      currentBalance: (broker as any)?.currentBalance,
      balance: (broker as any)?.balance,
    });
  }, [brokerId, broker]);

  useEffect(() => {
    const parsedParam = typeof totalAmount === "string" ? Number(totalAmount) || 0 : 0;
    logger.debug("🧮 [ResultSales] Totals", {
      totalAmountParam: totalAmount,
      parsedTotalAmount: parsedParam,
      summaryTotalWithTax: summaryToShow?.totalPriceWithTax,
      summaryDiscount: summaryToShow?.discountPrice,
      computedNewBalance: Balance,
    });
  }, [totalAmount, summaryToShow, Balance]);

  // Android back – ana sayfaya sorarak dön
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      Alert.alert("Sayfadan Ayrıl", "Ana sayfaya dönmek istediğinizden emin misiniz?", [
        { text: "Kal", style: "cancel" },
        { text: "Ana Sayfa", onPress: () => router.push("/") },
      ]);
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

  const downloadAndOpenDocument = (url: string, kind: "receipt" | "invoice") => {
    if (!url) {
      Alert.alert("Uyarı", "İndirilecek belge bulunamadı.");
      return;
    }

    const docTitle = kind === "invoice" ? "Fatura" : "Satış Fişi";
    setCurrentDocumentUrl(url);
    setCurrentDocumentTitle(docTitle);
    setDocumentModalVisible(true);
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

  const receiptUrl =
    (typeof downloadUrl === "string" && downloadUrl) || summaryToShow?.downloadUrl || "";
  const invoiceUrl = summaryToShow?.invoiceDownloadUrl || "";

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
        </View>

        {/* BAŞARI/BAŞARISIZ GÖRSEL + BAŞLIK */}
        <View className="items-center mt-3 mb-2">
          {isSuccess ? (
            <SuccessAnimation
              ref={successAnimationRef}
              size={80}
              autoPlay
              loop={true}
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
          className={`${isSuccess ? "text-green-600" : "text-red-600"} text-center mb-6`}
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
                ₺{(summaryToShow?.totalPriceWithTax ?? totalWithTax).toLocaleString()}
              </Typography>
            </View>

            {(summaryToShow?.discountPrice ?? discountValue) > 0 && (
              <View className="flex-row justify-between py-1">
                <Typography className="text-stock-red">
                  İskonto
                  {summaryToShow?.discountRate ? ` (%${summaryToShow.discountRate})` : ""}:
                </Typography>
                <Typography weight="semibold" className="text-stock-red">
                  -₺{(summaryToShow?.discountPrice ?? discountValue).toLocaleString()}
                </Typography>
              </View>
            )}

            <View className="flex-row justify-between py-1">
              <Typography className="text-stock-dark">Ara Toplam (KDV hariç):</Typography>
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
              <Typography variant="body" weight="bold" className="text-stock-black">
                Genel Toplam (KDV dahil):
              </Typography>
              <Typography variant="h3" weight="bold" className="text-stock-red">
                ₺{(summaryToShow?.totalPriceWithTax ?? totalWithTax).toLocaleString()}
              </Typography>
            </View>
          </Card>
        )}

        {/* PDF / BELGE GÖRÜNTÜLE */}
        {isSuccess && (receiptUrl || invoiceUrl) && (
          <View className="mb-8">
            <View className="flex-row items-center justify-between gap-3">
              {receiptUrl && (
                <TouchableOpacity
                  onPress={() => downloadAndOpenDocument(receiptUrl, "receipt")}
                  className="flex-1 flex-row items-center justify-center gap-1 px-4 py-2 rounded-lg"
                  style={{ backgroundColor: "#F3F4F6", minHeight: 36 }}
                  activeOpacity={0.95}
                >
                  <Typography
                    variant="body"
                    weight="medium"
                    className="text-gray-700"
                    style={{ fontSize: 13 }}
                  >
                    Satış Fişi
                  </Typography>
                  <Ionicons name="receipt-outline" size={16} color="#E3001B" />
                </TouchableOpacity>
              )}

              {invoiceUrl && (
                <TouchableOpacity
                  onPress={() => downloadAndOpenDocument(invoiceUrl, "invoice")}
                  className="flex-1 flex-row items-center justify-center gap-1 px-4 py-2 rounded-lg"
                  style={{ backgroundColor: "#F3F4F6", minHeight: 36 }}
                  activeOpacity={0.95}
                >
                  <Typography
                    variant="body"
                    weight="medium"
                    className="text-gray-700"
                    style={{ fontSize: 13 }}
                  >
                    Fatura
                  </Typography>
                  <Ionicons name="document-text-outline" size={16} color="#1F2937" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* FATURA OLUŞTURULDU bilgilendirme */}
        {isSuccess && willCreateInvoice && (
          <View className="flex-row items-center bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-8">
            <Icon
              family="MaterialIcons"
              name="info"
              size={16}
              color="#3B82F6"
              containerClassName="mr-2"
            />
            <Typography variant="caption" className="text-blue-700" style={{ fontSize: 12 }}>
              Fatura oluşturuldu. Faturanız elektronik ortamda iletilecektir.
            </Typography>
          </View>
        )}

        {/* AKSİYON BUTONLARI */}
        <View className="mb-10">
          {isSuccess ? (
            <>
              {/* Ana Aksiyonlar - Yan Yana */}
              <View className="flex-row gap-3 mb-3">
                <TouchableOpacity
                  onPress={handleNewSale}
                  className="flex-1 bg-stock-red rounded-xl px-4 py-4"
                  style={{ minHeight: 72 }}
                  activeOpacity={0.95}
                >
                  <View className="items-center">
                    <Icon
                      family="MaterialIcons"
                      name="add-shopping-cart"
                      size={24}
                      color="white"
                      containerClassName="mb-1"
                    />
                    <Typography variant="body" className="text-white text-center" weight="semibold">
                      Yeni Satış Yap
                    </Typography>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleGoToBrokerDetail}
                  className="flex-1 bg-gray-800 rounded-xl px-4 py-4"
                  style={{ minHeight: 72 }}
                  activeOpacity={0.95}
                >
                  <View className="items-center">
                    <Icon
                      family="MaterialIcons"
                      name="person"
                      size={24}
                      color="white"
                      containerClassName="mb-1"
                    />
                    <Typography variant="body" className="text-white text-center" weight="semibold">
                      Aracı Detayı
                    </Typography>
                  </View>
                </TouchableOpacity>
              </View>

              {/* İkincil Aksiyon - Tek Buton */}
              <TouchableOpacity
                onPress={handleGoToHome}
                className="bg-white border-2 border-stock-red rounded-xl px-4 py-3"
                activeOpacity={0.95}
              >
                <View className="flex-row items-center justify-center">
                  <Icon
                    family="MaterialIcons"
                    name="home"
                    size={20}
                    color="#E3001B"
                    containerClassName="mr-2"
                  />
                  <Typography variant="body" className="text-stock-red" weight="semibold">
                    Ana Sayfaya Git
                  </Typography>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="bg-stock-red"
              onPress={handleNewSale}
              leftIcon={<Icon family="MaterialIcons" name="refresh" size={20} color="white" />}
            >
              <Typography className="text-white" weight="bold">
                TEKRAR DENE
              </Typography>
            </Button>
          )}
        </View>
      </ScrollView>

      {/* Document Modal */}
      <DocumentModal
        visible={documentModalVisible}
        onClose={() => setDocumentModalVisible(false)}
        documentUrl={currentDocumentUrl}
        title={currentDocumentTitle}
        headers={apiService.getAuthHeaders()}
      />
    </Container>
  );
}
