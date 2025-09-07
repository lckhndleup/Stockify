import React, { useEffect, useRef } from "react";
import { Alert, BackHandler, ScrollView, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  Container,
  Typography,
  Card,
  Button,
  Icon,
  Divider,
} from "@/src/components/ui";
import { useAppStore } from "@/src/stores/appStore";

import SuccessAnimation, {
  SuccessAnimationRef,
} from "@/src/components/svg/successAnimation"; // ref tipi de import

export default function ResultSales() {
  // URL parametrelerinden sonuç bilgilerini al - GÜNCELLENDİ
  const params = useLocalSearchParams();
  const {
    brokerId,
    success,
    salesId, // YENİ - API'den gelen
    documentNumber, // YENİ - API'den gelen
    totalAmount,
    itemCount, // YENİ - API'den gelen
    discountAmount,
    createInvoice,
  } = params;

  // Hooks - AYNÎ KALDI
  const { brokers, getBrokerTotalDebt } = useAppStore();
  const successAnimationRef = useRef<SuccessAnimationRef>(null);

  // Android back button handling - AYNÎ KALDI
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        Alert.alert(
          "Sayfadan Ayrıl",
          "Ana sayfaya dönmek istediğinizden emin misiniz?",
          [
            { text: "Kalın", style: "cancel" },
            {
              text: "Ana Sayfa",
              onPress: () => {
                router.push("/");
              },
            },
          ]
        );
        return true; // Geri gitmeyi engelle ve kontrollü yönlendirme yap
      }
    );

    return () => backHandler.remove();
  }, []);

  // Broker bilgilerini al - AYNÎ KALDI
  const broker = brokers.find((b) => b.id === brokerId);
  const brokerDebt = broker ? getBrokerTotalDebt(broker.id) : 0;
  const isSuccess = success === "true";
  const willCreateInvoice = createInvoice === "true";

  // YENİ - API response değerleri
  const hasSalesId = !!salesId;
  const hasDocumentNumber = !!documentNumber;
  const hasItemCount = !!itemCount;

  // Buton handlers - AYNÎ KALDI
  const handleGoToBrokerDetail = () => {
    router.replace({
      pathname: "/broker/brokerDetail",
      params: { brokerId: brokerId },
    });
  };

  const handleGoToHome = () => {
    router.replace("/");
  };

  const handleNewSale = () => {
    router.replace({
      pathname: "/broker/sections/salesSection",
      params: { brokerId: brokerId },
    });
  };

  // YENİ - Fatura görüntüleme butonu
  const handleViewInvoice = () => {
    if (documentNumber) {
      router.push({
        pathname: "/broker/sections/invoiceSection",
        params: {
          brokerId,
          documentNumber,
          salesId,
        },
      });
    }
  };

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
      {/* Backend Error Warning - YENİ EKLENEN */}
      {brokersError && (
        <View className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
          <Typography variant="body" className="text-yellow-800 text-center">
            ⚠️ Backend bağlantı hatası - Local veriler gösteriliyor
          </Typography>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {/* Header - Başarı Durumu - AYNÎ KALDI */}
        <View className="mb-6 items-center">
          <View className="mb-4 items-center justify-center">
            {isSuccess ? (
              <SuccessAnimation
                ref={successAnimationRef}
                size={80}
                autoPlay={true}
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
            {broker.name} {broker.surname}
          </Typography>
        </View>

        {isSuccess && (
          <>
            {/* Satış Özet Kartı - GÜNCELLENDİ */}
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

              <View className="space-y-2">
                {/* YENİ - Satış ID */}
                {hasSalesId && (
                  <View className="flex-row justify-between items-center">
                    <Typography variant="body" className="text-green-700">
                      Satış ID:
                    </Typography>
                    <Typography
                      variant="body"
                      weight="bold"
                      className="text-green-800"
                    >
                      #{salesId}
                    </Typography>
                  </View>
                )}

                {/* YENİ - Belge Numarası */}
                {hasDocumentNumber && (
                  <View className="flex-row justify-between items-center">
                    <Typography variant="body" className="text-green-700">
                      Belge No:
                    </Typography>
                    <Typography
                      variant="body"
                      weight="bold"
                      className="text-green-800"
                    >
                      {documentNumber}
                    </Typography>
                  </View>
                )}

                {/* YENİ - Ürün Adedi */}
                {hasItemCount && (
                  <View className="flex-row justify-between items-center">
                    <Typography variant="body" className="text-green-700">
                      Ürün Adedi:
                    </Typography>
                    <Typography
                      variant="body"
                      weight="bold"
                      className="text-green-800"
                    >
                      {itemCount} adet
                    </Typography>
                  </View>
                )}

                {/* MEVCUT - Satış Tutarı */}
                <View className="flex-row justify-between items-center">
                  <Typography variant="body" className="text-green-700">
                    Satış Tutarı:
                  </Typography>
                  <Typography
                    variant="body"
                    weight="bold"
                    className="text-green-800"
                  >
                    ₺
                    {totalAmount
                      ? parseFloat(totalAmount as string).toLocaleString()
                      : "0"}
                  </Typography>
                </View>

                {/* MEVCUT - İskonto */}
                {discountAmount && parseFloat(discountAmount as string) > 0 && (
                  <View className="flex-row justify-between items-center">
                    <Typography variant="body" className="text-green-700">
                      Uygulanan İskonto:
                    </Typography>
                    <Typography
                      variant="body"
                      weight="bold"
                      className="text-green-800"
                    >
                      -₺{parseFloat(discountAmount as string).toLocaleString()}
                    </Typography>
                  </View>
                )}

                {/* YENİ - Tarih ve Saat */}
                <View className="flex-row justify-between items-center">
                  <Typography variant="body" className="text-green-700">
                    Tarih:
                  </Typography>
                  <Typography
                    variant="body"
                    weight="bold"
                    className="text-green-800"
                  >
                    {new Date().toLocaleDateString("tr-TR")}{" "}
                    {new Date().toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                </View>

                <Divider className="my-2" />

                {/* MEVCUT - Yeni Bakiye */}
                <View className="flex-row justify-between items-center">
                  <Typography
                    variant="body"
                    weight="bold"
                    className="text-green-800"
                  >
                    Yeni Bakiye:
                  </Typography>
                  <Typography
                    variant="h4"
                    weight="bold"
                    className="text-green-800"
                  >
                    ₺{brokerDebt.toLocaleString()}
                  </Typography>
                </View>
              </View>
            </Card>

            {/* Fatura Bilgisi - GÜNCELLENDİ */}
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
                      {hasDocumentNumber
                        ? `Fatura oluşturuldu: ${documentNumber}`
                        : "Fatura oluşturuldu"}
                    </Typography>
                    <Typography variant="caption" className="text-blue-600">
                      Faturanız elektronik ortamda iletilecektir
                    </Typography>
                  </View>
                </View>
              </Card>
            )}

            {/* Bilgi Notu - AYNÎ KALDI */}
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
                    Ürün stokları otomatik olarak güncellendi ve aracının
                    bakiyesine eklendi.
                  </Typography>
                </View>
              </View>
            </Card>
          </>
        )}

        {/* Aksiyon Butonları - GÜNCELLENDİ */}
        <View className="space-y-3 mb-6">
          {/* Ana Sayfa Butonu - AYNÎ KALDI */}
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

          {isSuccess && (
            <>
              {/* YENİ - Fatura Görüntüle Butonu */}
              {willCreateInvoice && hasDocumentNumber && (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="bg-blue-600"
                  onPress={handleViewInvoice}
                  leftIcon={
                    <Icon
                      family="MaterialIcons"
                      name="description"
                      size={20}
                      color="white"
                    />
                  }
                >
                  <Typography className="text-white" weight="bold">
                    FATURAYA GÖRÜNTÜLE
                  </Typography>
                </Button>
              )}

              {/* Yeni Satış Butonu - AYNÎ KALDI */}
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

              {/* Aracı Detayına Git Butonu - AYNÎ KALDI */}
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
          )}

          {!isSuccess && (
            /* Tekrar Dene Butonu - AYNÎ KALDI */
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
