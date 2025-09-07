// app/broker/sections/confirmSales.tsx
import React, { useState } from "react";
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

interface SalesItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function ConfirmSales() {
  // URL parametrelerinden satış bilgilerini al
  const params = useLocalSearchParams();
  const { brokerId, salesData, createInvoice } = params;

  // State'ler
  const [isProcessing, setIsProcessing] = useState(false);

  // Hooks
  const {
    brokers,
    getBrokerTotalDebt,
    getBrokerDiscount,
    giveProductToBroker,
  } = useAppStore();
  const { toast, showSuccess, showError } = useToast();

  // Satış verilerini parse et (JSON string olarak gelecek)
  const parsedSalesData: SalesItem[] = salesData
    ? JSON.parse(salesData as string)
    : [];
  const broker = brokers.find((b) => b.id === brokerId);
  const brokerDebt = broker ? getBrokerTotalDebt(broker.id) : 0;
  const brokerDiscount = broker ? getBrokerDiscount(broker.id) : 0;
  const willCreateInvoice = createInvoice === "true";

  // Hesaplamalar
  const calculateSubTotal = () => {
    return parsedSalesData.reduce((total, item) => total + item.totalPrice, 0);
  };

  const calculateDiscountAmount = () => {
    const subTotal = calculateSubTotal();
    return (subTotal * brokerDiscount) / 100;
  };

  const calculateTotalAmount = () => {
    const subTotal = calculateSubTotal();
    const discountAmount = calculateDiscountAmount();
    return subTotal - discountAmount;
  };

  // Buton handlers
  const handleCancel = () => {
    Alert.alert(
      "Satışı İptal Et",
      "Satış işlemini iptal etmek istediğinizden emin misiniz?\n\nTüm eklenen ürünler silinecektir.",
      [
        { text: "Geri Dön", style: "cancel" },
        {
          text: "İptal Et",
          style: "destructive",
          onPress: () => {
            // Aracı detay sayfasına git (satış tamamen iptal)
            router.push({
              pathname: "/broker/brokerDetail",
              params: { brokerId: brokerId },
            });
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    // Düzenleme için satış sayfasına geri dön
    router.back();
  };

  const handleConfirm = async () => {
    if (parsedSalesData.length === 0) {
      showError("Satış yapılacak ürün bulunamadı.");
      return;
    }

    setIsProcessing(true);

    try {
      let allSuccess = true;

      // Her ürün için satış işlemini gerçekleştir
      for (const item of parsedSalesData) {
        const result = giveProductToBroker(
          brokerId as string,
          item.id,
          item.quantity
        );

        if (!result.success) {
          showError(result.error || "Satış işlemi başarısız.");
          allSuccess = false;
          break;
        }
      }

      if (allSuccess) {
        // Başarılı sonuç sayfasına yönlendir
        router.push({
          pathname: "/broker/sections/resultSales",
          params: {
            brokerId: brokerId,
            success: "true",
            totalAmount: calculateTotalAmount().toString(),
            discountAmount: calculateDiscountAmount().toString(),
            createInvoice: createInvoice,
          },
        });
      }
    } catch (error) {
      showError("Beklenmeyen bir hata oluştu.");
    } finally {
      setIsProcessing(false);
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

          {/* Ürün Listesi */}
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

          {/* Hesaplamalar */}
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
                ₺{calculateSubTotal().toLocaleString()}
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
                  -₺{calculateDiscountAmount().toLocaleString()}
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
                ₺{calculateTotalAmount().toLocaleString()}
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
              ₺{brokerDebt.toLocaleString()}
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
              ₺{(brokerDebt + calculateTotalAmount()).toLocaleString()}
            </Typography>
          </View>
        </Card>

        {/* Aksiyon Butonları */}
        <View className="space-y-3 mb-6">
          {/* İptal Butonu */}
          <Button
            variant="outline"
            size="lg"
            fullWidth
            className="border-stock-red"
            onPress={handleCancel}
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

          {/* Onayla Butonu */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="bg-stock-red"
            onPress={handleConfirm}
            loading={isProcessing}
            leftIcon={
              !isProcessing ? (
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
              {isProcessing ? "İŞLEM YAPILIYOR..." : "ONAYLA VE TAMAMLA"}
            </Typography>
          </Button>
        </View>
      </ScrollView>
    </Container>
  );
}
