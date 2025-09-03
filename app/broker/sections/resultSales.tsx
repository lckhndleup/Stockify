import React from "react";
import { ScrollView, View } from "react-native";
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

export default function ResultSales() {
  // URL parametrelerinden sonuç bilgilerini al
  const params = useLocalSearchParams();
  const { brokerId, success, totalAmount, discountAmount, createInvoice } =
    params;

  // Hooks
  const { brokers, getBrokerTotalDebt } = useAppStore();

  // Broker bilgilerini al
  const broker = brokers.find((b) => b.id === brokerId);
  const brokerDebt = broker ? getBrokerTotalDebt(broker.id) : 0;
  const isSuccess = success === "true";
  const willCreateInvoice = createInvoice === "true";

  // Buton handlers
  const handleGoToBrokerDetail = () => {
    router.push({
      pathname: "/broker/brokerDetail",
      params: { brokerId: brokerId },
    });
  };

  const handleGoToHome = () => {
    router.push("/");
  };

  const handleNewSale = () => {
    router.push({
      pathname: "/broker/sections/salesSection",
      params: { brokerId: brokerId },
    });
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
      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {/* Header - Başarı Durumu */}
        <View className="mb-6 items-center">
          <View className="mb-4">
            <Icon
              family="MaterialIcons"
              name={isSuccess ? "check-circle" : "error"}
              size={64}
              color={isSuccess ? "#10B981" : "#EF4444"}
              containerClassName="items-center"
            />
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
            {/* Satış Özet Kartı */}
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

                <Divider className="my-2" />

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
                    Ürün stokları otomatik olarak güncellendi ve aracının
                    bakiyesine eklendi.
                  </Typography>
                </View>
              </View>
            </Card>
          </>
        )}

        {/* Aksiyon Butonları */}
        <View className="space-y-3 mb-6">
          {/* Ana Sayfa Butonu */}
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
              {/* Yeni Satış Butonu */}
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

              {/* Aracı Detayına Git Butonu */}
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
            /* Tekrar Dene Butonu */
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
