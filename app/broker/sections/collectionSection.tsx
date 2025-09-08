// app/broker/sections/confirmSales.tsx
import React, { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  Container,
  Typography,
  Card,
  SelectBox,
  Input,
  Button,
  Divider,
  Toast,
  Loading,
  type SelectBoxOption,
} from "@/src/components/ui";
import { useAppStore } from "@/src/stores/appStore";
import { useToast } from "@/src/hooks/useToast";

// Backend hooks
import { useActiveBrokers } from "@/src/hooks/api/useBrokers";
import { useCreatePayment } from "@/src/hooks/api/usePayments";

// Payment types
import {
  PaymentFormData,
  PAYMENT_TYPE_OPTIONS,
  PAYMENT_TYPE_LABELS,
} from "@/src/types/payment";

export default function CollectionSection() {
  // Hooks
  const { brokerId } = useLocalSearchParams();
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Backend hooks
  const {
    data: backendBrokers = [],
    isLoading: brokersLoading,
    error: brokersError,
  } = useActiveBrokers();

  const createPaymentMutation = useCreatePayment();

  // Local store
  const {
    brokers: localBrokers,
    getBrokerTotalDebt,
    collectFromBroker: localCollectFromBroker,
  } = useAppStore();

  // State'ler
  const [paymentType, setPaymentType] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [amountError, setAmountError] = useState<string>("");

  // Backend broker'ları öncelikle kullan, fallback olarak local
  const brokers = brokersError ? localBrokers : backendBrokers;

  // Broker bilgilerini al
  const broker = brokers.find((b) => b.id === brokerId);

  // Balance hesaplama
  const brokerDebt = broker
    ? "balance" in broker
      ? (broker as any).balance
      : getBrokerTotalDebt(broker.id)
    : 0;

  // Miktar doğrulama
  const validateAmount = (value: string) => {
    if (!value.trim()) {
      return "Tahsilat tutarı gereklidir";
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return "Geçerli bir sayı giriniz";
    }

    if (numValue <= 0) {
      return "Tutar sıfırdan büyük olmalıdır";
    }

    return "";
  };

  // Input değişikliği
  const handleAmountChange = (text: string) => {
    // Sadece sayı ve nokta girişine izin ver
    const sanitizedText = text.replace(/[^0-9.]/g, "");
    setAmount(sanitizedText);

    if (sanitizedText) {
      const error = validateAmount(sanitizedText);
      setAmountError(error);
    } else {
      setAmountError("");
    }
  };

  // Tahsilat işlemini gerçekleştir
  const handleCollection = async () => {
    if (!paymentType) {
      showError("Lütfen ödeme tipini seçiniz");
      return;
    }

    const error = validateAmount(amount);
    if (error) {
      setAmountError(error);
      return;
    }

    const amountValue = parseFloat(amount);
    const paymentTypeLabel =
      PAYMENT_TYPE_LABELS[paymentType as keyof typeof PAYMENT_TYPE_LABELS];

    Alert.alert(
      "Tahsilat Onayı",
      `${broker?.name} ${
        broker?.surname
      } aracısından ${paymentTypeLabel} ile ₺${amountValue.toLocaleString()} tahsilat yapılacak.\n\nOnaylıyor musunuz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Tahsil Et",
          style: "default",
          onPress: async () => {
            try {
              // Backend'e kaydet
              const paymentData: PaymentFormData = {
                amount: amountValue,
                paymentType: paymentType as any,
              };

              console.log("🎯 Creating payment with backend:", {
                brokerId,
                paymentData,
              });

              const result = await createPaymentMutation.mutateAsync({
                brokerId: brokerId as string,
                paymentData,
              });

              console.log(
                "✅ Payment created successfully via backend:",
                result
              );

              showSuccess(
                `₺${amountValue.toLocaleString()} tutarında tahsilat başarıyla alındı!`
              );

              // Formu sıfırla
              setPaymentType("");
              setAmount("");
              setAmountError("");
            } catch (error) {
              console.error("❌ Backend payment creation failed:", error);

              // Backend başarısız olursa local store'a fall back
              try {
                console.log("🔄 Falling back to local store...");
                const result = localCollectFromBroker(
                  brokerId as string,
                  amountValue,
                  paymentType
                );

                if (result.success) {
                  showSuccess(
                    `₺${amountValue.toLocaleString()} tutarında tahsilat başarıyla alındı! (Local)`
                  );
                  setPaymentType("");
                  setAmount("");
                  setAmountError("");
                } else {
                  showError(result.error || "Tahsilat işlemi başarısız oldu.");
                }
              } catch (localError) {
                console.error("❌ Local collection also failed:", localError);
                showError("Tahsilat işlemi başarısız oldu.");
              }
            }
          },
        },
      ]
    );
  };

  // Loading state
  if (brokersLoading) {
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <View className="items-center justify-center flex-1">
          <Loading size="large" />
        </View>
      </Container>
    );
  }

  // Broker not found
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
      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      {/* Backend Error Bilgilendirme */}
      {brokersError && (
        <View className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
          <Typography variant="body" className="text-yellow-800 text-center">
            ⚠️ Backend bağlantı hatası - Local veriler gösteriliyor
          </Typography>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {/* Header - İsim ve Bakiye kısmı */}
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
            className={`${
              brokerDebt >= 0 ? "text-stock-red" : "text-stock-green"
            } text-center mt-0`}
          >
            Bakiye: {brokerDebt >= 0 ? "" : "-"}₺
            {Math.abs(brokerDebt).toLocaleString()}
          </Typography>
        </View>

        {/* Tahsilat Formu */}
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
            TAHSİLAT FORMU
          </Typography>

          {/* Ödeme Tipi */}
          <SelectBox
            label="Ödeme Tipi"
            placeholder="Ödeme tipini seçiniz..."
            options={PAYMENT_TYPE_OPTIONS}
            value={paymentType}
            onSelect={setPaymentType}
            className="mb-4"
          />

          {/* Tahsilat Tutarı */}
          <Input
            label="Tahsilat Tutarı (₺)"
            placeholder="Tahsil edilecek tutarı giriniz..."
            value={amount}
            onChangeText={handleAmountChange}
            numericOnly={true}
            error={amountError}
            helperText={
              !amountError
                ? `Mevcut bakiye: ${brokerDebt >= 0 ? "" : "-"}₺${Math.abs(
                    brokerDebt
                  ).toLocaleString()}`
                : ""
            }
            className="mb-6"
          />

          {/* Bilgi Notu */}
          {paymentType && amount && !amountError && (
            <View className="bg-blue-50 p-3 rounded-lg mb-4">
              <Typography
                variant="caption"
                className="text-blue-700"
                weight="medium"
              >
                {
                  PAYMENT_TYPE_LABELS[
                    paymentType as keyof typeof PAYMENT_TYPE_LABELS
                  ]
                }{" "}
                ile ₺{parseFloat(amount).toLocaleString()} tahsil edilecek.
              </Typography>

              {brokerDebt > 0 && parseFloat(amount) > 0 && (
                <Typography
                  variant="caption"
                  className="text-blue-700 mt-1"
                  weight="medium"
                >
                  Yeni bakiye:{" "}
                  {brokerDebt - parseFloat(amount) >= 0
                    ? `₺${(brokerDebt - parseFloat(amount)).toLocaleString()}`
                    : `-₺${Math.abs(
                        brokerDebt - parseFloat(amount)
                      ).toLocaleString()}`}
                  {brokerDebt - parseFloat(amount) < 0 &&
                    " (Aracının alacağı olacak)"}
                </Typography>
              )}

              {brokerDebt <= 0 && (
                <Typography
                  variant="caption"
                  className="text-blue-700 mt-1"
                  weight="medium"
                >
                  Aracının zaten alacağı var: {brokerDebt >= 0 ? "" : "-"}₺
                  {Math.abs(brokerDebt).toLocaleString()}
                </Typography>
              )}
            </View>
          )}

          {/* Tahsilat Butonu */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="bg-stock-red"
            onPress={handleCollection}
            loading={createPaymentMutation.isPending}
            disabled={
              !paymentType ||
              !amount ||
              !!amountError ||
              createPaymentMutation.isPending
            }
          >
            <Typography className="text-white" weight="bold">
              {createPaymentMutation.isPending
                ? "TAHSİL EDİLİYOR..."
                : "TAHSİLATI TAMAMLA"}
            </Typography>
          </Button>
        </Card>

        {/* Yardım Notu */}
        <View className="items-center py-4 mb-4">
          <Typography variant="caption" className="text-stock-text text-center">
            Bu ekrandan yapılan tahsilatlar, aracının bakiye hesabına otomatik
            olarak yansıtılacaktır.
          </Typography>
        </View>
      </ScrollView>
    </Container>
  );
}
