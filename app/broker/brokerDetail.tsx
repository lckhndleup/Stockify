// app/broker/brokerDetail.tsx

import React, { useState, useEffect } from "react";
import { ScrollView, View, Alert, Dimensions } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import logger from "@/src/utils/logger";

import {
  Container,
  Typography,
  Card,
  Icon,
  Button,
  Toast,
  Modal,
  Input,
  Loading,
  SelectBox,
  type SelectBoxOption,
} from "@/src/components/ui";
import { useToast } from "@/src/hooks/useToast";

// Backend hooks
import {
  useActiveBrokers,
  useUpdateBroker,
  useDeleteBroker,
  useUpdateBrokerDiscountRate,
} from "@/src/hooks/api/useBrokers";
import { validateBrokerForm } from "@/src/validations/brokerValidation";
import { BrokerTargetDay } from "@/src/types/broker";
import { useAppStore } from "@/src/stores/appStore";
import BrokerHeader from "@/src/components/broker/BrokerHeader";

const TARGET_DAY_OPTIONS: SelectBoxOption[] = [
  { label: "Pazartesi", value: "MONDAY" },
  { label: "Salı", value: "TUESDAY" },
  { label: "Çarşamba", value: "WEDNESDAY" },
  { label: "Perşembe", value: "THURSDAY" },
  { label: "Cuma", value: "FRIDAY" },
  { label: "Cumartesi", value: "SATURDAY" },
  { label: "Pazar", value: "SUNDAY" },
];

const getTargetDayLabel = (value: BrokerTargetDay | "") =>
  TARGET_DAY_OPTIONS.find((option) => option.value === value)?.label ?? value;

export default function BrokerDetailPage() {
  logger.debug("🔍 BrokerDetailPage render started");

  // ✅ HOOKS - DOĞRU SIRADA ÇAĞRILMALI
  const { brokerId } = useLocalSearchParams();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const { showGlobalToast } = useAppStore();

  // ✅ BACKEND HOOKS - DOĞRU SIRADA
  const {
    data: allBrokers = [],
    isLoading: brokersLoading,
    error: brokersError,
  } = useActiveBrokers();

  const updateBrokerMutation = useUpdateBroker();
  const deleteBrokerMutation = useDeleteBroker();
  const updateDiscountRateMutation = useUpdateBrokerDiscountRate();

  // ✅ STATE'LER - HOOKS'LARDAN SONRA
  const [isEditBrokerModalVisible, setIsEditBrokerModalVisible] = useState(false);
  const [brokerName, setBrokerName] = useState("");
  const [brokerSurname, setBrokerSurname] = useState("");
  const [brokerEmail, setBrokerEmail] = useState("");
  const [brokerVkn, setBrokerVkn] = useState("");
  const [brokerTkn, setBrokerTkn] = useState("");
  const [brokerTargetDay, setBrokerTargetDay] = useState<BrokerTargetDay | "">("");
  const [brokerDiscount, setBrokerDiscount] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  logger.debug("📝 BrokerDetailPage state initialized:", {
    brokerId,
    brokersCount: allBrokers.length,
    isEditModalVisible: isEditBrokerModalVisible,
  });

  // Backend broker'ları kullan
  const brokers = allBrokers;

  // Broker bilgilerini al
  const broker = brokers.find((b) => b.id === brokerId);

  // Balance hesaplama - Backend'den gelen balance kullan
  const totalDebt = broker ? broker.balance : 0;

  logger.debug("🔎 Broker lookup result:", {
    brokerId,
    brokerFound: !!broker,
    brokerName: broker?.name,
    brokerSurname: broker?.surname,
    totalDebt,
    isApiBroker: !brokersError,
  });

  // ✅ EFFECT'LER - STATE'LERDEN SONRA
  useEffect(() => {
    logger.debug("🔄 useEffect - Broker check:", {
      broker: !!broker,
      brokerId,
      shouldNavigate: !broker && brokerId && !brokersLoading,
    });

    if (!broker && brokerId && !brokersLoading) {
      logger.debug("🚀 Navigation triggered - broker not found");
      router.replace("/brokers");
    }
  }, [broker, brokerId, brokersLoading]);

  useEffect(() => {
    logger.debug("🔄 useEffect - Broker state update:", {
      broker: !!broker,
      name: broker?.name,
      surname: broker?.surname,
      discountRate: broker?.discountRate,
    });

    if (broker) {
      setBrokerName(broker.name);
      setBrokerSurname(broker.surname);
      setBrokerEmail((broker as any).email || "");
      setBrokerVkn((broker as any).vkn || "");
      setBrokerTkn((broker as any).tkn || "");
      setBrokerTargetDay((broker as any).targetDayOfWeek || "");
      setBrokerDiscount(broker.discountRate?.toString() || "0");
    }
  }, [broker]);

  // ✅ ERKEN RETURN - TÜM HOOKS'LARDAN SONRA
  if (brokersLoading) {
    logger.debug("⚠️ Early return - brokers loading");
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <View className="items-center justify-center flex-1">
          <Loading size="large" />
        </View>
      </Container>
    );
  }

  if (!broker) {
    logger.debug("⚠️ Early return - broker not found, showing loading");
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <Loading size="large" />
      </Container>
    );
  }

  logger.debug("✅ Continuing with broker found:", broker.name);

  // ✅ HANDLER FUNCTIONS
  const handleEditBroker = () => {
    logger.debug("✏️ Edit broker triggered");
    setBrokerName(broker.name);
    setBrokerSurname(broker.surname);
    setBrokerEmail((broker as any).email || "");
    setBrokerVkn((broker as any).vkn || "");
    setBrokerTkn((broker as any).tkn || "");
    setBrokerTargetDay((broker as any).targetDayOfWeek || "");
    setBrokerDiscount(broker.discountRate?.toString() || "0");
    setValidationErrors({});
    setIsEditBrokerModalVisible(true);
  };

  const handleCloseEditBrokerModal = () => {
    logger.debug("❌ Close edit modal");
    setIsEditBrokerModalVisible(false);
    setBrokerName(broker.name);
    setBrokerSurname(broker.surname);
    setBrokerEmail((broker as any).email || "");
    setBrokerVkn((broker as any).vkn || "");
    setBrokerTkn((broker as any).tkn || "");
    setBrokerTargetDay((broker as any).targetDayOfWeek || "");
    setBrokerDiscount(broker.discountRate?.toString() || "0");
    setValidationErrors({});
  };

  // ✅ AKILLI UPDATE HANDLER
  const handleUpdateBroker = async () => {
    logger.debug("💾 Update broker:", {
      brokerName,
      brokerSurname,
      brokerDiscount,
      brokerTkn,
      brokerTargetDay,
    });

    // Form validation
    const validation = validateBrokerForm(
      brokerName,
      brokerSurname,
      brokerEmail,
      brokerVkn,
      brokerDiscount || "0",
      brokerTkn,
      brokerTargetDay || "",
    );
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      showError("Lütfen form hatalarını düzeltin.");
      return;
    }

    const discountRate = brokerDiscount ? parseFloat(brokerDiscount) : 0;
    const targetDayLabel = getTargetDayLabel(brokerTargetDay);

    // Hangi alanlar değişmiş?
    const isNameChanged =
      brokerName.trim() !== broker.name || brokerSurname.trim() !== broker.surname;
    const isDiscountChanged = discountRate !== (broker.discountRate || 0);
    const currentTkn = ((broker as any).tkn || "").trim();
    const isTknChanged = brokerTkn.trim() !== currentTkn;
    const currentTargetDay = (broker as any).targetDayOfWeek || "";
    const isTargetDayChanged = (brokerTargetDay || "") !== currentTargetDay;

    if (!isNameChanged && !isDiscountChanged && !isTknChanged && !isTargetDayChanged) {
      showError("Hiçbir değişiklik yapılmadı.");
      return;
    }

    Alert.alert(
      "Aracı Güncelle",
      `"${brokerName} ${brokerSurname}" olarak güncellemek istediğinizden emin misiniz?${
        discountRate > 0 ? `\n\nİskonto Oranı: %${discountRate}` : ""
      }${targetDayLabel ? `\n\nTahsilat Günü: ${targetDayLabel}` : ""}`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Güncelle",
          onPress: async () => {
            try {
              // ✅ AKILLI ENDPOINT SEÇİMİ
              if (!isNameChanged && !isTknChanged && !isTargetDayChanged && isDiscountChanged) {
                // Sadece discount rate değişmişse özel endpoint kullan
                logger.debug("💰 Only discount rate changed, using discount endpoint");
                await updateDiscountRateMutation.mutateAsync({
                  brokerId: broker.id,
                  discountRate: discountRate,
                });
                logger.debug("✅ Discount rate updated via backend");
              } else {
                // İsim de değişmişse normal update endpoint
                logger.debug("🔄 Name changed, using full update endpoint");
                await updateBrokerMutation.mutateAsync({
                  brokerId: broker.id,
                  brokerData: {
                    firstName: brokerName.trim(),
                    lastName: brokerSurname.trim(),
                    email: brokerEmail.trim(),
                    vkn: brokerVkn.trim(),
                    tkn: brokerTkn.trim(),
                    discountRate: discountRate,
                    targetDayOfWeek: brokerTargetDay as BrokerTargetDay,
                  },
                });
              }
              logger.debug("✅ Broker updated successfully");
              showSuccess("Aracı başarıyla güncellendi.");
              setIsEditBrokerModalVisible(false);
            } catch (error: any) {
              logger.error("❌ Update broker error:", error);

              // Özel hata handling
              if (
                error?.message?.includes("Broker Name Already Used") ||
                error?.message?.includes("Already Used")
              ) {
                showError(
                  "Bu isimde başka bir aracı zaten mevcut. Lütfen farklı bir isim kullanın.",
                );
                return;
              }

              showError("Aracı güncellenirken bir hata oluştu.");
            }
          },
        },
      ],
    );
  };

  // Delete handler
  const handleDeleteBroker = () => {
    logger.debug("🗑️ Delete broker triggered:", broker.name);

    Alert.alert(
      "Aracı Sil",
      `"${broker.name} ${broker.surname}" aracısını silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              const brokerName = `${broker.name} ${broker.surname}`;

              logger.debug("🗑️ Delete broker via backend");
              await deleteBrokerMutation.mutateAsync(broker.id);
              logger.debug("✅ Broker deleted via backend");

              logger.debug("🚀 Navigate to brokers");
              router.push("/brokers");

              logger.debug("🎉 Show success message");
              showGlobalToast(`${brokerName} başarıyla silindi!`, "success");
            } catch (error) {
              logger.error("❌ Delete broker error:", error);
              showError("Aracı silinirken bir hata oluştu.");
            }
          },
        },
      ],
    );
  };

  // Navigation handlers
  const handleSalesPress = () => {
    router.push({
      pathname: "/broker/sections/salesSection",
      params: { brokerId: broker.id },
    });
  };

  const handleCollectionPress = () => {
    router.push({
      pathname: "/broker/sections/collectionSection",
      params: { brokerId: broker.id },
    });
  };

  const handleStatementPress = () => {
    router.push({
      pathname: "/broker/sections/statementSection",
      params: { brokerId: broker.id },
    });
  };

  logger.debug("🎨 Rendering BrokerDetailPage with broker:", broker.name);

  return (
    <Container className="bg-white" padding="sm" safeTop={false}>
      {/* Toast Notification */}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      {/* Backend Error Bilgilendirme */}
      {brokersError && (
        <View className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
          <Typography variant="body" className="text-yellow-800 text-center">
            ⚠️ Backend bağlantı hatası - Local veriler gösteriliyor
          </Typography>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {/* Aracı Başlık Bilgileri */}
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
            className={`${totalDebt >= 0 ? "text-stock-red" : "text-stock-green"} text-center mt-0`}
          >
            Bakiye: {totalDebt >= 0 ? "" : "-"}₺{Math.abs(totalDebt).toLocaleString()}
          </Typography>
        </View>

        <View className="space-y-3">
          {/* Satış Kartı */}
          <Card
            variant="default"
            padding="none"
            pressable
            onPress={handleSalesPress}
            className="bg-stock-red border-0 px-4 py-4 mb-3"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="mr-3">
                  <Icon
                    family="MaterialCommunityIcons"
                    name="trending-up"
                    size={22}
                    color="#FFFEFF"
                  />
                </View>
                <Typography
                  variant="body"
                  weight="semibold"
                  size="lg"
                  className="text-stock-white flex-1"
                >
                  SATIŞ
                </Typography>
              </View>
              <Icon family="MaterialIcons" name="arrow-forward-ios" size={16} color="#FFFEFF" />
            </View>
          </Card>

          {/* Tahsilat Kartı */}
          <Card
            variant="default"
            padding="none"
            pressable
            onPress={handleCollectionPress}
            className="bg-stock-red border-0 px-4 py-4 mb-3"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="mr-3">
                  <Icon
                    family="MaterialCommunityIcons"
                    name="cash-multiple"
                    size={22}
                    color="#FFFEFF"
                  />
                </View>
                <Typography
                  variant="body"
                  weight="semibold"
                  size="lg"
                  className="text-stock-white flex-1"
                >
                  TAHSİLAT
                </Typography>
              </View>
              <Icon family="MaterialIcons" name="arrow-forward-ios" size={16} color="#FFFEFF" />
            </View>
          </Card>

          {/* Ekstreler Kartı */}
          <Card
            variant="default"
            padding="none"
            pressable
            onPress={handleStatementPress}
            className="bg-stock-red border-0 px-4 py-4 mb-3"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="mr-3">
                  <Icon
                    family="MaterialCommunityIcons"
                    name="file-document-outline"
                    size={22}
                    color="#FFFEFF"
                  />
                </View>
                <Typography
                  variant="body"
                  weight="semibold"
                  size="lg"
                  className="text-stock-white flex-1"
                >
                  EKSTRELER
                </Typography>
              </View>
              <Icon family="MaterialIcons" name="arrow-forward-ios" size={16} color="#FFFEFF" />
            </View>
          </Card>

          {/* Günlük Rapor Kartı */}
          <Card
            variant="default"
            padding="none"
            pressable
            onPress={() =>
              router.push({
                pathname: "/reports",
                params: { brokerId: broker.id },
              })
            }
            className="bg-stock-red border-0 px-4 py-4 mb-3"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="mr-3">
                  <Icon family="MaterialIcons" name="assessment" size={22} color="#FFFEFF" />
                </View>
                <Typography
                  variant="body"
                  weight="semibold"
                  size="lg"
                  className="text-stock-white flex-1"
                >
                  GÜNLÜK RAPOR
                </Typography>
              </View>
              <Icon family="MaterialIcons" name="arrow-forward-ios" size={16} color="#FFFEFF" />
            </View>
          </Card>

          {/* Aracıyı Düzenle Kartı */}
          <Card
            variant="default"
            padding="none"
            pressable
            onPress={handleEditBroker}
            className="bg-stock-red border-0 px-4 py-4 mb-3"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="mr-4">
                  <Icon family="MaterialIcons" name="edit" size={22} color="#FFFEFF" />
                </View>
                <View className="flex-1">
                  <Typography
                    variant="body"
                    weight="semibold"
                    size="lg"
                    className="text-stock-white mb-1"
                  >
                    ARACIYI DÜZENLE
                  </Typography>
                </View>
              </View>
              <Icon family="MaterialIcons" name="arrow-forward-ios" size={16} color="#FFFEFF" />
            </View>
          </Card>

          {/* Aracıyı Sil Kartı */}
          <Card
            variant="default"
            padding="none"
            pressable
            onPress={handleDeleteBroker}
            className="bg-stock-red border-0 px-4 py-4 mb-6"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="mr-4">
                  <Icon family="MaterialIcons" name="delete" size={22} color="#FFFEFF" />
                </View>
                <View className="flex-1">
                  <Typography
                    variant="body"
                    weight="semibold"
                    size="lg"
                    className="text-stock-white mb-1"
                  >
                    ARACIYI SİL
                  </Typography>
                </View>
              </View>
              <Icon family="MaterialIcons" name="arrow-forward-ios" size={16} color="#FFFEFF" />
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={isEditBrokerModalVisible}
        onClose={handleCloseEditBrokerModal}
        title="Aracı Düzenle"
        size="lg"
        className="bg-white mx-6"
      >
        <View className="fle-1 " style={{ maxHeight: Dimensions.get("window").height * 0.8 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Input
              label="Ad"
              value={brokerName}
              onChangeText={setBrokerName}
              placeholder="Aracının adını girin..."
              variant="outlined"
              className="mb-4"
              error={validationErrors.firstName}
            />

            <Input
              label="Soyad"
              value={brokerSurname}
              onChangeText={setBrokerSurname}
              placeholder="Aracının soyadını girin..."
              variant="outlined"
              className="mb-4"
              error={validationErrors.lastName}
            />

            <Input
              label="İskonto Oranı (%)"
              value={brokerDiscount}
              onChangeText={setBrokerDiscount}
              placeholder="0-100 arası değer"
              variant="outlined"
              numericOnly={true}
              className="mb-4"
              error={validationErrors.discountRate}
              // helperText="İskonto oranını % cinsinden girin (örn: 20)"
            />

            <Input
              label="E-posta"
              value={brokerEmail}
              onChangeText={setBrokerEmail}
              placeholder="ornek@domain.com"
              variant="outlined"
              autoCapitalize="none"
              keyboardType="email-address"
              className="mb-4"
              error={validationErrors.email}
            />

            <Input
              label="VKN"
              value={brokerVkn}
              onChangeText={setBrokerVkn}
              placeholder="10-11 haneli vergi kimlik no"
              variant="outlined"
              numericOnly={true}
              className="mb-4"
              error={validationErrors.vkn}
            />

            <Input
              label="TKN"
              value={brokerTkn}
              onChangeText={setBrokerTkn}
              placeholder="Aracının TKN bilgisini girin..."
              variant="outlined"
              className="mb-4"
              error={validationErrors.tkn}
            />

            <SelectBox
              label="Tahsilat Günü"
              value={brokerTargetDay || ""}
              onSelect={(value) => setBrokerTargetDay(value as BrokerTargetDay)}
              options={TARGET_DAY_OPTIONS}
              placeholder="Tahsilat günü seçiniz"
              className="mb-4"
              error={validationErrors.targetDayOfWeek}
            />
          </ScrollView>
          <View className="mt-6 flex-row" style={{ gap: 12 }}>
            <Button
              variant="primary"
              className="bg-stock-red flex-1"
              onPress={handleUpdateBroker}
              loading={updateBrokerMutation.isPending || updateDiscountRateMutation.isPending}
              disabled={updateBrokerMutation.isPending || updateDiscountRateMutation.isPending}
            >
              <Typography className="text-white">
                {updateBrokerMutation.isPending || updateDiscountRateMutation.isPending
                  ? "Güncelleniyor..."
                  : "Güncelle"}
              </Typography>
            </Button>
            <Button
              variant="outline"
              className="border-stock-border flex-1"
              onPress={handleCloseEditBrokerModal}
              disabled={updateBrokerMutation.isPending || updateDiscountRateMutation.isPending}
            >
              <Typography className="text-stock-dark">İptal</Typography>
            </Button>
          </View>
        </View>
      </Modal>
    </Container>
  );
}
