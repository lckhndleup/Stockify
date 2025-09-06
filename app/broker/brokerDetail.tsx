import React, { useState, useEffect } from "react";
import { ScrollView, View, Alert, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

import {
  Container,
  Typography,
  Card,
  Divider,
  Icon,
  Button,
  Toast,
  Modal,
  Input,
  Loading,
} from "@/src/components/ui";
import { useToast } from "@/src/hooks/useToast";
import { useAppStore } from "@/src/stores/appStore";

// Backend hooks - YENİ EKLENEN
import {
  useActiveBrokers,
  useUpdateBroker,
  useDeleteBroker,
} from "@/src/hooks/api/useBrokers";
import { validateBrokerForm } from "@/src/validations/brokerValidation";

export default function BrokerDetailPage() {
  console.log("🔍 BrokerDetailPage render started");

  // HOOKS - HER ZAMAN AYNI SIRADA ÇAĞRILMALI
  const { brokerId } = useLocalSearchParams();

  // BACKEND HOOKS - YENİ EKLENEN
  const {
    data: backendBrokers = [],
    isLoading: brokersLoading,
    error: brokersError,
  } = useActiveBrokers();

  const updateBrokerMutation = useUpdateBroker();
  const deleteBrokerMutation = useDeleteBroker();

  // LOCAL STORE - Geriye uyumluluk için korundu
  const {
    brokers: localBrokers,
    deleteBroker: localDeleteBroker,
    updateBroker: localUpdateBroker,
    getBrokerTotalDebt,
    showGlobalToast,
  } = useAppStore();

  const { toast, showSuccess, showError, hideToast } = useToast();

  // STATE'LER - HER ZAMAN AYNI SIRADA
  const [isEditBrokerModalVisible, setIsEditBrokerModalVisible] =
    useState(false);
  const [brokerName, setBrokerName] = useState("");
  const [brokerSurname, setBrokerSurname] = useState("");

  // Validation Error States - YENİ EKLENEN
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  console.log("📝 BrokerDetailPage state initialized:", {
    brokerId,
    backendBrokersCount: backendBrokers.length,
    localBrokersCount: localBrokers.length,
    isEditModalVisible: isEditBrokerModalVisible,
  });

  // Backend broker'ları öncelikle kullan, fallback olarak local
  const brokers = brokersError ? localBrokers : backendBrokers;

  // Broker bilgilerini al
  const broker = brokers.find((b) => b.id === brokerId);

  // Balance hesaplama - backend'de balance var, local'de totalDebt hesapla
  const totalDebt = broker
    ? "balance" in broker
      ? (broker as any).balance
      : getBrokerTotalDebt(broker.id)
    : 0;

  console.log("🔎 Broker lookup result:", {
    brokerId,
    brokerFound: !!broker,
    brokerName: broker?.name,
    brokerSurname: broker?.surname,
    totalDebt,
    isBackendBroker: !brokersError,
  });

  // EFFECT'LER - STATE'LERDEN SONRA
  useEffect(() => {
    console.log("🔄 useEffect - Broker check:", {
      broker: !!broker,
      brokerId,
      shouldNavigate: !broker && brokerId && !brokersLoading,
    });

    if (!broker && brokerId && !brokersLoading) {
      console.log("🚀 Navigation triggered - broker not found");
      router.replace("/brokers");
    }
  }, [broker, brokerId, brokersLoading]);

  useEffect(() => {
    console.log("🔄 useEffect - Broker state update:", {
      broker: !!broker,
      name: broker?.name,
      surname: broker?.surname,
    });

    if (broker) {
      setBrokerName(broker.name);
      setBrokerSurname(broker.surname);
    }
  }, [broker]);

  // ERKEN RETURN - TÜM HOOKS'LARDAN SONRA
  if (brokersLoading) {
    console.log("⚠️ Early return - brokers loading");
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <View className="items-center justify-center flex-1">
          <Loading size="large" />
          <Typography variant="body" className="text-stock-text mt-4">
            Aracı bilgileri yükleniyor...
          </Typography>
        </View>
      </Container>
    );
  }

  if (!broker) {
    console.log("⚠️ Early return - broker not found, showing loading");
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <View className="items-center justify-center flex-1">
          <Typography variant="body" className="text-stock-text">
            Yükleniyor...
          </Typography>
        </View>
      </Container>
    );
  }

  console.log("✅ Continuing with broker found:", broker.name);

  const handleEditBroker = () => {
    console.log("✏️ Edit broker triggered");
    setIsEditBrokerModalVisible(true);
  };

  const handleCloseEditBrokerModal = () => {
    console.log("❌ Close edit modal");
    setIsEditBrokerModalVisible(false);
    setBrokerName(broker.name);
    setBrokerSurname(broker.surname);
    setValidationErrors({});
  };

  // BACKEND ENTEGRELİ BROKER GÜNCELLEME
  const handleUpdateBroker = async () => {
    console.log("💾 Update broker:", { brokerName, brokerSurname });

    // Form validation
    const validation = validateBrokerForm(brokerName, brokerSurname, "0");
    setValidationErrors(validation.errors);

    if (!brokerName.trim() || !brokerSurname.trim()) {
      showError("Lütfen ad ve soyad alanlarını doldurun.");
      return;
    }

    Alert.alert(
      "Aracı Güncelle",
      `"${brokerName} ${brokerSurname}" olarak güncellemek istediğinizden emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Güncelle",
          onPress: async () => {
            try {
              if (!brokersError) {
                // Backend güncelleme
                console.log("🔄 Updating broker via backend");
                await updateBrokerMutation.mutateAsync({
                  brokerId: broker.id,
                  brokerData: {
                    firstName: brokerName.trim(),
                    lastName: brokerSurname.trim(),
                    discountRate: broker.discountRate || 0,
                  },
                });
                console.log("✅ Broker updated via backend");
              } else {
                // Local fallback
                console.log("🔄 Updating broker via local store");
                localUpdateBroker(broker.id, {
                  name: brokerName,
                  surname: brokerSurname,
                });
                console.log("✅ Broker updated via local store");
              }

              handleCloseEditBrokerModal();
              showSuccess("Aracı başarıyla güncellendi!");
            } catch (error) {
              console.error("❌ Update broker error:", error);

              // Backend başarısız olursa local'e fall back
              try {
                console.log("🔄 Falling back to local store for update...");
                localUpdateBroker(broker.id, {
                  name: brokerName,
                  surname: brokerSurname,
                });
                handleCloseEditBrokerModal();
                showSuccess("Aracı başarıyla güncellendi! (Local)");
              } catch (localError) {
                console.error(
                  "❌ Local broker update also failed:",
                  localError
                );
                showError("Aracı güncellenirken bir hata oluştu.");
              }
            }
          },
        },
      ]
    );
  };

  // BACKEND ENTEGRELİ BROKER SİLME
  const handleDeleteBroker = () => {
    console.log("🗑️ Delete broker triggered:", broker.name);

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

              if (!brokersError) {
                // Backend silme
                console.log("🗑️ Step 1: Delete broker via backend");
                await deleteBrokerMutation.mutateAsync(broker.id);
                console.log("✅ Broker deleted via backend");
              } else {
                // Local fallback
                console.log("🗑️ Step 1: Delete broker via local store");
                localDeleteBroker(broker.id);
                console.log("✅ Broker deleted via local store");
              }

              console.log("🚀 Step 2: Navigate to brokers");
              router.push("/brokers");

              console.log("🎉 Step 3: Show global toast after navigation");
              setTimeout(() => {
                showGlobalToast(`${brokerName} başarıyla silindi!`, "success");
              }, 500);
            } catch (error) {
              console.error("❌ Delete broker error:", error);

              // Backend başarısız olursa local'e fall back
              try {
                console.log("🔄 Falling back to local store for delete...");
                const brokerName = `${broker.name} ${broker.surname}`;
                localDeleteBroker(broker.id);

                router.push("/brokers");
                setTimeout(() => {
                  showGlobalToast(
                    `${brokerName} başarıyla silindi! (Local)`,
                    "success"
                  );
                }, 500);
              } catch (localError) {
                console.error(
                  "❌ Local broker delete also failed:",
                  localError
                );
                showError("Aracı silinirken bir hata oluştu.");
              }
            }
          },
        },
      ]
    );
  };

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

  const handleInvoicePress = () => {
    router.push({
      pathname: "/broker/sections/invoiceSection",
      params: { brokerId: broker.id },
    });
  };

  console.log("🎨 Rendering BrokerDetailPage with broker:", broker.name);

  return (
    <Container className="bg-white" padding="sm" safeTop={false}>
      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      {/* Backend Error Bilgilendirme - YENİ EKLENEN (Opsiyonel) */}
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
            className={`${
              totalDebt >= 0 ? "text-stock-red" : "text-stock-green"
            } text-center mt-0`}
          >
            Bakiye: {totalDebt >= 0 ? "" : "-"}₺
            {Math.abs(totalDebt).toLocaleString()}
          </Typography>
        </View>

        {/* İşlem Kartları */}
        <View>
          {/* Satış Yap Kartı */}
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
                    family="MaterialIcons"
                    name="sell"
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
                  SATIŞ YAP
                </Typography>
              </View>
              <Icon
                family="MaterialIcons"
                name="arrow-forward-ios"
                size={16}
                color="#FFFEFF"
              />
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
                    family="MaterialIcons"
                    name="payments"
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
              <Icon
                family="MaterialIcons"
                name="arrow-forward-ios"
                size={16}
                color="#FFFEFF"
              />
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
              <Icon
                family="MaterialIcons"
                name="arrow-forward-ios"
                size={16}
                color="#FFFEFF"
              />
            </View>
          </Card>

          {/* Faturalar Kartı */}
          <Card
            variant="default"
            padding="none"
            pressable
            onPress={handleInvoicePress}
            className="bg-stock-red border-0 px-4 py-4 mb-3"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="mr-3">
                  <Icon
                    family="MaterialCommunityIcons"
                    name="receipt"
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
                  FATURALAR
                </Typography>
              </View>
              <Icon
                family="MaterialIcons"
                name="arrow-forward-ios"
                size={16}
                color="#FFFEFF"
              />
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
                  <Icon
                    family="MaterialIcons"
                    name="edit"
                    size={22}
                    color="#FFFEFF"
                  />
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
              <Icon
                family="MaterialIcons"
                name="arrow-forward-ios"
                size={16}
                color="#FFFEFF"
              />
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
                  <Icon
                    family="MaterialIcons"
                    name="delete"
                    size={22}
                    color="#FFFEFF"
                  />
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
              <Icon
                family="MaterialIcons"
                name="arrow-forward-ios"
                size={16}
                color="#FFFEFF"
              />
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Aracı Düzenleme Modal'ı */}
      <Modal
        visible={isEditBrokerModalVisible}
        onClose={handleCloseEditBrokerModal}
        title="Aracı Düzenle"
        size="lg"
        className="bg-white mx-6"
      >
        <View>
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

          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleUpdateBroker}
              disabled={updateBrokerMutation.isPending}
            >
              <Typography className="text-white">
                {updateBrokerMutation.isPending
                  ? "Güncelleniyor..."
                  : "Güncelle"}
              </Typography>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="border-stock-border"
              onPress={handleCloseEditBrokerModal}
              disabled={updateBrokerMutation.isPending}
            >
              <Typography className="text-stock-dark">İptal</Typography>
            </Button>
          </View>
        </View>
      </Modal>
    </Container>
  );
}
