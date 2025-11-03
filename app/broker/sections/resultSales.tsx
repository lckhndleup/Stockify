// app/broker/sections/resultSales.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, BackHandler, ScrollView, View, Linking, Platform } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Container, Typography, Card, Button, Icon, Divider, Loading } from "@/src/components/ui";
import { useActiveBrokers } from "@/src/hooks/api/useBrokers";
import { useSalesCalculate } from "@/src/hooks/api/useSales";
import type { SalesSummaryResult } from "@/src/types/salesUI";
import SuccessAnimation from "@/src/components/svg/successAnimation";
import type { SuccessAnimationRef } from "@/src/types/svg";
import logger from "@/src/utils/logger";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
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

  // ✅ Backend’den calculate sonucu da çek (confirm yoksa buradan göster)
  const [calcSummary, setCalcSummary] = useState<SalesSummaryResult | null>(null);
  const calcMutation = useSalesCalculate();
  const [downloadingDoc, setDownloadingDoc] = useState<"receipt" | "invoice" | null>(null);

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
  const downloadAndOpenDocument = async (url: string, kind: "receipt" | "invoice") => {
    if (!url) {
      Alert.alert("Uyarı", "İndirilecek belge bulunamadı.");
      return;
    }

    const headers = {
      Accept: "application/pdf",
      ...apiService.getAuthHeaders(),
    };
    const sanitizedName = url.split("/").pop() || `${kind}_belgesi.pdf`;
    const fileName = sanitizedName.endsWith(".pdf") ? sanitizedName : `${kind}_${Date.now()}.pdf`;
    setDownloadingDoc(kind);
    try {
      if (Platform.OS === "web") {
        const response = await fetch(url, {
          method: "GET",
          headers,
        });

        if (!response.ok) {
          throw new Error(`Sunucu ${response.status} yanıtı döndürdü`);
        }

        const blob = await response.blob();
        const browser = globalThis as typeof globalThis & {
          document?: any;
          URL?: any;
        };

        if (!browser.document || !browser.URL?.createObjectURL) {
          throw new Error("Tarayıcı indirme desteklenmiyor");
        }

        const blobUrl = browser.URL.createObjectURL(blob);
        const anchor = browser.document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = fileName;
        browser.document.body.appendChild(anchor);
        anchor.click();
        browser.document.body.removeChild(anchor);
        browser.URL.revokeObjectURL(blobUrl);
        return;
      }

      const docDir = FileSystem.documentDirectory ?? null;
      const cacheDir = FileSystem.cacheDirectory ?? null;
      const tempDir = (FileSystem as any).temporaryDirectory ?? null;
      const baseDir = docDir || cacheDir || tempDir;

      logger.debug("📁 Belge indirme dizinleri", {
        platform: Platform.OS,
        docDir,
        cacheDir,
        tempDir,
      });

      if (!baseDir) {
        logger.warn("📁 Yerel dizin bulunamadı, WebView ekranına yönlendiriliyor", {
          platform: Platform.OS,
        });
        router.push({
          pathname: "/broker/sections/documentViewer",
          params: {
            url,
            title: kind === "invoice" ? "Fatura" : "Satış Fişi",
          },
        });
        return;
      }

      const baseWithSlash = baseDir.endsWith("/") ? baseDir : `${baseDir}/`;
      const normalizedDir = `${baseWithSlash}stockify-downloads/`;
      try {
        await FileSystem.makeDirectoryAsync(normalizedDir, { intermediates: true });
      } catch (dirError) {
        // Dizin zaten varsa hata dönebilir, loglayıp devam edelim
        logger.debug("📁 Dizin oluşturma sonucu", dirError?.message ?? dirError);
      }

      const targetPath = `${normalizedDir}${fileName}`;
      const downloadRes = await FileSystem.downloadAsync(url, targetPath, {
        headers,
      });

      if (downloadRes.status && downloadRes.status >= 400) {
        throw new Error(`Sunucu ${downloadRes.status} yanıtı döndürdü`);
      }

      const fileUri = downloadRes.uri;

      // Tercihen paylaş / görüntüle
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
        });
      } else {
        await Linking.openURL(fileUri);
      }
    } catch (error) {
      logger.error("📄 Belge indirme hatası:", error);
      Alert.alert("Hata", "Belge indirilirken bir sorun oluştu.");
    } finally {
      setDownloadingDoc(null);
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

        {/* PDF / BELGE İNDİR – kartın hemen altında */}
        {isSuccess && (receiptUrl || invoiceUrl) && (
          <View className="mb-8 space-y-3">
            {receiptUrl ? (
              <Button
                variant="secondary"
                size="md"
                fullWidth
                className="bg-white border border-stock-border"
                onPress={() => downloadAndOpenDocument(receiptUrl, "receipt")}
                loading={downloadingDoc === "receipt"}
                leftIcon={
                  downloadingDoc === "receipt" ? undefined : (
                    <Icon family="MaterialIcons" name="download" size={20} color="#16A34A" />
                  )
                }
              >
                <Typography className="text-stock-dark" weight="bold">
                  Satış Fişini İndir
                </Typography>
              </Button>
            ) : null}

            {invoiceUrl ? (
              <Button
                variant="secondary"
                size="md"
                fullWidth
                className="bg-white border border-stock-border"
                onPress={() => downloadAndOpenDocument(invoiceUrl, "invoice")}
                loading={downloadingDoc === "invoice"}
                leftIcon={
                  downloadingDoc === "invoice" ? undefined : (
                    <Icon family="MaterialIcons" name="picture-as-pdf" size={20} color="#2563EB" />
                  )
                }
              >
                <Typography className="text-stock-dark" weight="bold">
                  Faturayı İndir
                </Typography>
              </Button>
            ) : null}
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
                <Typography variant="body" className="text-blue-700" weight="medium">
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
            leftIcon={<Icon family="MaterialIcons" name="home" size={20} color="#E3001B" />}
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
                  <Icon family="MaterialIcons" name="add-shopping-cart" size={20} color="#67686A" />
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
                leftIcon={<Icon family="MaterialIcons" name="person" size={20} color="white" />}
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
              leftIcon={<Icon family="MaterialIcons" name="refresh" size={20} color="white" />}
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
