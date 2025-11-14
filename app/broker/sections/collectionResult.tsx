// app/broker/sections/collectionResult.tsx
import React, { useMemo, useState } from "react";
import { ScrollView, View, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Container,
  Typography,
  Card,
  Button,
  Icon,
  Loading,
  DocumentModal,
} from "@/src/components/ui";
import SuccessAnimation from "@/src/components/svg/successAnimation";
import { useBrokerDetail } from "@/src/hooks/api/useBrokers";
import { PAYMENT_TYPE_LABELS } from "@/src/types/payment";
import { getAuthHeaders } from "@/src/services/base";
import logger from "@/src/utils/logger";

export default function CollectionResult() {
  const params = useLocalSearchParams();
  const brokerIdParam = Array.isArray(params.brokerId) ? params.brokerId[0] : params.brokerId;
  const amountParam = Array.isArray(params.amount) ? params.amount[0] : params.amount;
  const paymentTypeParam = Array.isArray(params.paymentType)
    ? params.paymentType[0]
    : params.paymentType;
  const paymentTypeLabelParam = Array.isArray(params.paymentTypeLabel)
    ? params.paymentTypeLabel[0]
    : params.paymentTypeLabel;
  const downloadUrlParam = Array.isArray(params.downloadUrl)
    ? params.downloadUrl[0]
    : params.downloadUrl;
  const previousBalanceParam = Array.isArray(params.previousBalance)
    ? params.previousBalance[0]
    : params.previousBalance;
  const newBalanceParam = Array.isArray(params.newBalance)
    ? params.newBalance[0]
    : params.newBalance;
  const firstNameParam = Array.isArray(params.firstName) ? params.firstName[0] : params.firstName;
  const lastNameParam = Array.isArray(params.lastName) ? params.lastName[0] : params.lastName;

  const amountValue = useMemo(() => Number(amountParam ?? 0), [amountParam]);
  const previousBalance = useMemo(() => Number(previousBalanceParam ?? 0), [previousBalanceParam]);
  const fallbackNewBalance = useMemo(() => {
    if (newBalanceParam !== undefined) return Number(newBalanceParam);
    return Number((previousBalance - amountValue).toFixed(2));
  }, [newBalanceParam, previousBalance, amountValue]);

  const receiptUrl = typeof downloadUrlParam === "string" ? downloadUrlParam : "";

  const computedPaymentTypeLabel = useMemo(() => {
    if (!paymentTypeParam) return "";

    const mappedLabel =
      PAYMENT_TYPE_LABELS[paymentTypeParam as keyof typeof PAYMENT_TYPE_LABELS] ?? paymentTypeParam;

    return mappedLabel;
  }, [paymentTypeParam]);

  const paymentTypeLabel =
    (paymentTypeLabelParam as string | undefined) || computedPaymentTypeLabel;

  const { data: brokerDetail, isLoading: brokerLoading } = useBrokerDetail(
    String(brokerIdParam ?? ""),
    {
      enabled: !!brokerIdParam,
    },
  );

  const displayName = useMemo(() => {
    if (brokerDetail) {
      return `${brokerDetail.name ?? ""} ${brokerDetail.surname ?? ""}`.trim() || "Aracı";
    }
    const fallbackName = `${firstNameParam ?? ""} ${lastNameParam ?? ""}`.trim();
    return fallbackName || "Aracı";
  }, [brokerDetail, firstNameParam, lastNameParam]);

  const updatedBalance = useMemo(() => {
    if (typeof brokerDetail?.balance === "number") {
      return brokerDetail.balance;
    }
    return fallbackNewBalance;
  }, [brokerDetail, fallbackNewBalance]);

  const [documentModalVisible, setDocumentModalVisible] = useState(false);

  const handleOpenReceipt = () => {
    if (!receiptUrl) return;
    setDocumentModalVisible(true);
  };

  const handleCloseModal = () => setDocumentModalVisible(false);

  const handleNewCollection = () => {
    if (!brokerIdParam) {
      router.replace("/brokers");
      return;
    }
    router.replace({
      pathname: "/broker/sections/collectionSection",
      params: { brokerId: String(brokerIdParam) },
    });
  };

  const handleGoToBrokerDetail = () => {
    if (!brokerIdParam) {
      router.replace("/brokers");
      return;
    }
    router.replace({
      pathname: "/broker/brokerDetail",
      params: { brokerId: String(brokerIdParam) },
    });
  };

  const handleGoHome = () => {
    router.replace("/dashboard");
  };

  logger.debug("🧾 CollectionResult params:", {
    brokerIdParam,
    amountValue,
    paymentTypeParam,
    receiptUrl,
    previousBalance,
    fallbackNewBalance,
  });

  if (!brokerIdParam) {
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <View className="items-center justify-center flex-1">
          <Typography variant="body" className="text-stock-text text-center">
            Aracı bilgisi bulunamadı.
          </Typography>
          <Button variant="primary" className="mt-4" onPress={handleGoHome}>
            Ana Sayfaya Dön
          </Button>
        </View>
      </Container>
    );
  }

  const formattedAmount = `₺${amountValue.toLocaleString()}`;
  const formattedPrevious = `₺${previousBalance.toLocaleString()}`;
  const formattedNewBalance = `₺${updatedBalance.toLocaleString()}`;

  return (
    <Container className="bg-white" padding="sm" safeTop={false}>
      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        <View className="items-center mb-4">
          <Typography
            variant="h1"
            size="3xl"
            weight="bold"
            className="text-stock-black text-center"
          >
            {displayName}
          </Typography>
        </View>

        <Card
          variant="default"
          padding="lg"
          radius="lg"
          className="items-center border border-stock-border/60 bg-white shadow-sm mb-6"
        >
          <SuccessAnimation size={90} autoPlay loop speed={1.1} />
          <Typography
            variant="h2"
            weight="bold"
            size="2xl"
            className="text-green-600 text-center mt-3"
          >
            Tahsilat Tamamlandı!
          </Typography>
          <Typography variant="caption" className="text-gray-600 text-center mt-2">
            Tahsilatınız başarıyla kaydedildi.
          </Typography>
        </Card>

        <Card
          variant="default"
          padding="lg"
          radius="md"
          className="border border-[#E3E8F5] bg-[#F8FAFF] mb-6"
        >
          <View className="flex-row justify-between py-2">
            <Typography weight="medium" className="text-stock-dark">
              Tahsil Edilen Tutar
            </Typography>
            <Typography weight="bold" className="text-stock-red">
              {formattedAmount}
            </Typography>
          </View>

          <View className="flex-row justify-between py-2">
            <Typography weight="medium" className="text-stock-dark">
              Ödeme Tipi
            </Typography>
            <Typography weight="semibold" className="text-stock-dark">
              {paymentTypeLabel || "-"}
            </Typography>
          </View>

          <View className="flex-row justify-between py-2">
            <Typography weight="medium" className="text-stock-dark">
              Önceki Bakiye
            </Typography>
            <Typography weight="semibold" className="text-stock-dark">
              {formattedPrevious}
            </Typography>
          </View>

          <View className="border-t border-[#E3E8F5] my-2" />

          <View className="flex-row justify-between py-2">
            <Typography weight="semibold" className="text-stock-black">
              Güncel Bakiye
            </Typography>
            <Typography weight="bold" className="text-stock-green text-xl">
              {formattedNewBalance}
            </Typography>
          </View>
        </Card>

        {brokerLoading && (
          <View className="items-center mb-4">
            <Loading size="small" />
            <Typography variant="caption" className="text-gray-500 mt-2">
              Güncel bakiye alınıyor...
            </Typography>
          </View>
        )}

        <View className="mb-8">
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            className={`mb-3 bg-[#F3F4F6] border-none ${!receiptUrl ? "opacity-60" : ""}`}
            disabled={!receiptUrl}
            onPress={handleOpenReceipt}
            leftIcon={
              <Ionicons name="cash-outline" size={18} color={receiptUrl ? "#16A34A" : "#9CA3AF"} />
            }
          >
            <Typography variant="body" className="text-gray-700" weight="medium">
              Tahsilat Makbuzu
            </Typography>
          </Button>
          {!receiptUrl && (
            <Typography variant="caption" className="text-gray-500 text-center mt-2">
              Makbuz bağlantısı oluşturulmadı.
            </Typography>
          )}

          <View className="flex-row gap-x-3 mt-4">
            <TouchableOpacity
              onPress={handleNewCollection}
              className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-4 py-4"
              style={{ minHeight: 72 }}
              activeOpacity={0.95}
            >
              <View className="items-center">
                <Icon
                  family="MaterialIcons"
                  name="add-circle-outline"
                  size={24}
                  color="#1F2937"
                  containerClassName="mb-1"
                />
                <Typography variant="body" className="text-gray-900" weight="semibold">
                  Yeni Tahsilat Yap
                </Typography>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGoToBrokerDetail}
              className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-4 py-4"
              style={{ minHeight: 72 }}
              activeOpacity={0.95}
            >
              <View className="items-center">
                <Icon
                  family="MaterialIcons"
                  name="person"
                  size={24}
                  color="#1F2937"
                  containerClassName="mb-1"
                />
                <Typography variant="body" className="text-gray-900" weight="semibold">
                  Aracı Detayına Git
                </Typography>
              </View>
            </TouchableOpacity>
          </View>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="mt-4 bg-stock-red"
            onPress={handleGoHome}
            leftIcon={<Icon family="MaterialIcons" name="home" size={20} color="white" />}
          >
            Ana Sayfaya Git
          </Button>
        </View>
      </ScrollView>

      <DocumentModal
        visible={documentModalVisible}
        onClose={handleCloseModal}
        documentUrl={receiptUrl}
        title="Tahsilat Makbuzu"
        headers={getAuthHeaders()}
      />
    </Container>
  );
}
