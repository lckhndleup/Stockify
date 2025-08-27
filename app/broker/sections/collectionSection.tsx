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
  type SelectBoxOption,
} from "@/src/components/ui";
import { useAppStore } from "@/src/stores/appStore";
import { useToast } from "@/src/hooks/useToast";

export default function CollectionSection() {
  // Hooks
  const { brokerId } = useLocalSearchParams();
  const { brokers, getBrokerTotalDebt, collectFromBroker } = useAppStore();
  const { toast, showSuccess, showError } = useToast();

  // State'ler
  const [paymentType, setPaymentType] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [amountError, setAmountError] = useState<string>("");

  // Broker bilgilerini al
  const broker = brokers.find((b) => b.id === brokerId);
  const brokerDebt = broker ? getBrokerTotalDebt(broker.id) : 0;

  // Ödeme tipi seçenekleri
  const paymentTypeOptions: SelectBoxOption[] = [
    { label: "Nakit", value: "cash" },
    { label: "Kredi Kartı", value: "credit_card" },
    { label: "Havale/EFT", value: "bank_transfer" },
    { label: "Çek", value: "check" },
  ];

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
  const handleCollection = () => {
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

    // Tahsilat işlemini gerçekleştir
    const result = collectFromBroker(
      brokerId as string,
      amountValue,
      paymentType
    );

    if (result.success) {
      showSuccess(
        `₺${amountValue.toLocaleString()} tutarında tahsilat başarıyla alındı`
      );
      // Formu sıfırla
      setPaymentType("");
      setAmount("");
      setAmountError("");
    } else {
      showError(result.error || "Tahsilat işlemi başarısız oldu");
    }
  };

  // Placeholder view
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
            options={paymentTypeOptions}
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
                {paymentType === "cash"
                  ? "Nakit"
                  : paymentType === "credit_card"
                  ? "Kredi Kartı"
                  : paymentType === "bank_transfer"
                  ? "Havale/EFT"
                  : "Çek"}
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
            disabled={!paymentType || !amount || !!amountError}
          >
            <Typography className="text-white" weight="bold">
              TAHSİLATI TAMAMLA
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

      {/* Toast mesajı */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
      />
    </Container>
  );
}
