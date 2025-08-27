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
} from "@/src/components/ui";
import { useToast } from "@/src/hooks/useToast";
import { useAppStore } from "@/src/stores/appStore";

export default function BrokerDetailPage() {
  console.log("🔍 BrokerDetailPage render started");

  // HOOKS - HER ZAMAN AYNI SIRADA ÇAĞRILMALI
  const { brokerId } = useLocalSearchParams();
  const {
    brokers,
    deleteBroker,
    updateBroker,
    getBrokerTotalDebt,
    showGlobalToast,
  } = useAppStore();

  const { toast, showSuccess, showError, hideToast } = useToast();

  // STATE'LER - HER ZAMAN AYNI SIRADA
  const [isEditBrokerModalVisible, setIsEditBrokerModalVisible] =
    useState(false);
  const [brokerName, setBrokerName] = useState("");
  const [brokerSurname, setBrokerSurname] = useState("");

  console.log("📝 BrokerDetailPage state initialized:", {
    brokerId,
    brokersCount: brokers.length,
    isEditModalVisible: isEditBrokerModalVisible,
  });

  // Broker bilgilerini al
  const broker = brokers.find((b) => b.id === brokerId);
  const totalDebt = broker ? getBrokerTotalDebt(broker.id) : 0;

  console.log("🔎 Broker lookup result:", {
    brokerId,
    brokerFound: !!broker,
    brokerName: broker?.name,
    totalDebt,
  });

  // EFFECT'LER - STATE'LERDEN SONRA
  useEffect(() => {
    console.log("🔄 useEffect - Broker check:", {
      broker: !!broker,
      brokerId,
      shouldNavigate: !broker && brokerId,
    });

    if (!broker && brokerId) {
      console.log("🚀 Navigation triggered - broker not found");
      router.replace("/brokers");
    }
  }, [broker, brokerId]);

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
  };

  const handleUpdateBroker = () => {
    console.log("💾 Update broker:", { brokerName, brokerSurname });

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
          onPress: () => {
            try {
              console.log("🔄 Updating broker in store");
              updateBroker(broker.id, {
                name: brokerName,
                surname: brokerSurname,
              });
              handleCloseEditBrokerModal();
              showSuccess("Aracı başarıyla güncellendi!");
            } catch (error) {
              console.error("❌ Update broker error:", error);
              showError("Aracı güncellenirken bir hata oluştu.");
            }
          },
        },
      ]
    );
  };

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
          onPress: () => {
            try {
              const brokerName = `${broker.name} ${broker.surname}`;

              console.log("🗑️ Step 1: Delete broker from store");
              deleteBroker(broker.id);

              console.log("🚀 Step 2: Navigate to brokers");
              router.push("/brokers");

              console.log("🎉 Step 3: Show global toast after navigation");
              setTimeout(() => {
                showGlobalToast(`${brokerName} başarıyla silindi!`, "success");
              }, 500);
            } catch (error) {
              console.error("❌ Delete broker error:", error);
              showError("Aracı silinirken bir hata oluştu.");
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
            className="text-stock-red text-center mt-0"
          >
            Bakiye: ₺{totalDebt.toLocaleString()}
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
          />

          <Input
            label="Soyad"
            value={brokerSurname}
            onChangeText={setBrokerSurname}
            placeholder="Aracının soyadını girin..."
            variant="outlined"
            className="mb-4"
          />

          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleUpdateBroker}
            >
              <Typography className="text-white">Güncelle</Typography>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="border-stock-border"
              onPress={handleCloseEditBrokerModal}
            >
              <Typography className="text-stock-dark">İptal</Typography>
            </Button>
          </View>
        </View>
      </Modal>
    </Container>
  );
}
