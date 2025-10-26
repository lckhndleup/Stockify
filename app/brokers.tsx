// app/brokers.tsx

import React, { useState, useEffect } from "react";
import { ScrollView, View, Alert } from "react-native";
import { router } from "expo-router";

import {
  Container,
  Typography,
  SquareCard,
  SearchBar,
  Icon,
  Button,
  Modal,
  Input,
  Loading,
} from "@/src/components/ui";
import Toast from "@/src/components/ui/toast";
import { useToast } from "@/src/hooks/useToast";
import { useAppStore } from "@/src/stores/appStore";
import logger from "@/src/utils/logger";

// Backend hooks
import {
  useActiveBrokers,
  useBrokers,
  useCreateBroker,
  useUpdateBroker,
  BrokerDisplayItem,
} from "@/src/hooks/api/useBrokers";
import { BrokerFormData } from "@/src/types/broker";
import { validateBrokerForm } from "@/src/validations/brokerValidation";

export default function BrokersPage() {
  const [searchText, setSearchText] = useState("");

  // Modal states
  const [isBrokerModalVisible, setIsBrokerModalVisible] = useState(false);
  const [isEditBrokerModalVisible, setIsEditBrokerModalVisible] = useState(false);

  // Form states
  const [brokerName, setBrokerName] = useState("");
  const [brokerSurname, setBrokerSurname] = useState("");
  const [email, setEmail] = useState("");
  const [vkn, setVKN] = useState("");
  const [brokerDiscount, setBrokerDiscount] = useState(""); // Yeni iskonto alanı
  const [editingBroker, setEditingBroker] = useState<BrokerDisplayItem | null>(null);

  // Validation Error States
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Backend hooks
  const { data: brokers = [], isLoading: brokersLoading, error: brokersError } = useActiveBrokers();

  // All brokers için ayrı hook (log amacıyla)
  const { data: allBrokers = [] } = useBrokers();

  // Backend data'sını logla
  useEffect(() => {
    if (brokers && brokers.length > 0) {
      logger.debug("🔍 Backend'den gelen tüm ACTIVE broker data'sı:", brokers);
      logger.debug("📊 Active Broker sayısı:", brokers.length);
      logger.debug("📋 İlk active broker örneği:", brokers[0]);
      logger.debug("📋 Tüm active broker'ların detayı:");
      brokers.forEach((broker, index) => {
        logger.debug(
          `  ${index + 1}. ${broker.name} ${broker.surname} - Balance: ${broker.balance}`,
        );
      });
    } else if (brokers && brokers.length === 0) {
      logger.debug("⚠️ Backend'den ACTIVE broker data'sı geldi ama boş array");
    }
  }, [brokers]);

  // All brokers log
  useEffect(() => {
    if (allBrokers && allBrokers.length > 0) {
      logger.debug("🌍 Backend ALL BROKERS metodu ile gelen data:", allBrokers);
      logger.debug("📊 ALL Broker sayısı:", allBrokers.length);
      logger.debug("📋 İlk ALL broker örneği:", allBrokers[0]);
      logger.debug("📋 Tüm ALL broker'ların detayı:");
      allBrokers.forEach((broker, index) => {
        logger.debug(
          `  ${index + 1}. ${broker.firstName} ${broker.lastName} - Status: ${broker.status} - Balance: ${broker.currentBalance}`,
        );
      });
    } else if (allBrokers && allBrokers.length === 0) {
      logger.debug("⚠️ Backend'den ALL broker data'sı geldi ama boş array");
    }
  }, [allBrokers]);

  const createBrokerMutation = useCreateBroker();
  const updateBrokerMutation = useUpdateBroker();

  // Global toast
  const { globalToast, hideGlobalToast } = useAppStore();

  // Toast
  const { toast, showSuccess, showError, hideToast } = useToast();

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const handleAddBroker = () => {
    setBrokerName("");
    setBrokerSurname("");
    setBrokerDiscount("");
    setValidationErrors({});
    setIsBrokerModalVisible(true);
  };

  // const handleEditBroker = (broker: BrokerDisplayItem) => {
  //   setEditingBroker(broker);
  //   setBrokerName(broker.name);
  //   setBrokerSurname(broker.surname);
  //   setBrokerDiscount(broker.discountRate.toString());
  //   setValidationErrors({});
  //   setIsEditBrokerModalVisible(true);
  // };

  // Not used; discount validation is handled via Zod in validations.

  // Backend entegreli broker ekleme
  const handleSaveBroker = async () => {
    // Form validation
    const validation = validateBrokerForm(
      brokerName,
      brokerSurname,
      brokerDiscount || "0",
      email,
      vkn,
    );
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      showError("Lütfen form hatalarını düzeltin.");
      return;
    }

    const discountRate = brokerDiscount ? parseFloat(brokerDiscount) : 0;

    Alert.alert(
      "Aracı Ekle",
      `"${brokerName} ${brokerSurname}" aracısını eklemek istediğinizden emin misiniz?${
        discountRate > 0 ? `\n\nİskonto Oranı: %${discountRate}` : ""
      }`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Ekle",
          onPress: async () => {
            try {
              const brokerData: BrokerFormData = {
                firstName: brokerName.trim(),
                lastName: brokerSurname.trim(),
                discountRate: discountRate,
                email: email.trim(),
                vkn: vkn.trim(),
              };

              logger.debug("🎯 Creating broker with backend:", brokerData);
              await createBrokerMutation.mutateAsync(brokerData);
              logger.debug("✅ Broker created successfully via backend");

              handleCloseBrokerModal();
              showSuccess("Aracı başarıyla eklendi!");
            } catch (error) {
              logger.error("❌ Backend broker creation failed:", error);
              showError("Aracı eklenirken bir hata oluştu.");
            }
          },
        },
      ],
    );
  };

  // Backend entegreli broker güncelleme
  const handleEditSaveBroker = async () => {
    if (!editingBroker) return;

    // Form validation
    const validation = validateBrokerForm(
      brokerName,
      brokerSurname,
      brokerDiscount || "0",
      email,
      vkn,
    );
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      showError("Lütfen form hatalarını düzeltin.");
      return;
    }

    const discountRate = brokerDiscount ? parseFloat(brokerDiscount) : 0;

    Alert.alert(
      "Aracı Güncelle",
      `"${brokerName} ${brokerSurname}" aracısını güncellemek istediğinizden emin misiniz?${
        discountRate > 0 ? `\n\nİskonto Oranı: %${discountRate}` : ""
      }`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Güncelle",
          onPress: async () => {
            try {
              logger.debug("🔄 Updating broker via backend");
              await updateBrokerMutation.mutateAsync({
                brokerId: editingBroker.id,
                brokerData: {
                  firstName: brokerName.trim(),
                  lastName: brokerSurname.trim(),
                  discountRate: discountRate,
                },
              });
              logger.debug("✅ Broker updated via backend");

              handleCloseEditBrokerModal();
              showSuccess("Aracı başarıyla güncellendi!");
            } catch (error) {
              logger.error("❌ Update broker error:", error);
              showError("Aracı güncellenirken bir hata oluştu.");
            }
          },
        },
      ],
    );
  };

  const handleCloseBrokerModal = () => {
    setIsBrokerModalVisible(false);
    setBrokerName("");
    setBrokerSurname("");
    setBrokerDiscount(""); // İskonto alanını da temizle
    setValidationErrors({});
  };

  const handleCloseEditBrokerModal = () => {
    setIsEditBrokerModalVisible(false);
    setEditingBroker(null);
    setBrokerName("");
    setBrokerSurname("");
    setBrokerDiscount(""); // İskonto alanını da temizle
    setValidationErrors({});
  };

  // Filtering
  const filteredBrokers = brokers.filter((broker) =>
    `${broker.name} ${broker.surname}`.toLowerCase().includes(searchText.toLowerCase()),
  );

  // Loading state
  if (brokersLoading && !brokersError) {
    return (
      <Container className="bg-white flex-1" padding="none" safeTop={false}>
        <View className="flex-1 justify-center items-center -mt-16">
          <Loading size="large" />
        </View>
      </Container>
    );
  }

  return (
    <Container className="bg-white" padding="sm" safeTop={false}>
      {/* Toast Notification */}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
      {/* Global Toast */}
      <Toast
        visible={globalToast.visible}
        message={globalToast.message}
        type={globalToast.type}
        onHide={hideGlobalToast}
      />

      {/* Backend Error Bilgilendirme */}
      {brokersError && (
        <View className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
          <Typography variant="body" className="text-yellow-800 text-center">
            ⚠️ Backend bağlantı hatası - Veriler yüklenemedi
          </Typography>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {/* Search ve Add Butonu */}
        <View className="flex-row items-center mb-4">
          <SearchBar placeholder="Aracı ara..." onSearch={handleSearch} className="flex-1 mr-3" />
          <Icon
            family="MaterialIcons"
            name="add"
            size={28}
            color="#E3001B"
            pressable
            onPress={handleAddBroker}
            containerClassName="bg-gray-100 px-4 py-3 rounded-lg"
          />
        </View>

        {/* Aracı Grid Listesi */}
        <View className="flex-row flex-wrap justify-between mb-10" style={{ gap: 10 }}>
          {filteredBrokers.map((broker) => {
            // Backend broker'ları için balance kullan
            const totalDebt = broker.balance || 0;

            return (
              <SquareCard
                key={broker.id}
                title={`${broker.name} ${broker.surname}`}
                subtitle="Mevcut Bakiye"
                amount={`₺${totalDebt.toLocaleString()}`}
                onPress={() =>
                  router.push({
                    pathname: "/broker/brokerDetail",
                    params: { brokerId: broker.id },
                  })
                }
                showDeleteIcon={false}
                className="mb-2"
              />
            );
          })}
        </View>

        {/* Boş durum */}
        {filteredBrokers.length === 0 && (
          <View className="items-center justify-center py-12">
            <Icon
              family="MaterialCommunityIcons"
              name="account-group-outline"
              size={64}
              color="#ECECEC"
              containerClassName="mb-4"
            />
            <Typography variant="body" className="text-stock-text text-center">
              {searchText.trim()
                ? "Arama kriterinize uygun aracı bulunamadı."
                : "Henüz aracı eklenmemiş."}
            </Typography>
          </View>
        )}
      </ScrollView>

      {/* Aracı Ekleme Modal'ı */}
      <Modal
        visible={isBrokerModalVisible}
        onClose={handleCloseBrokerModal}
        title="Yeni Aracı Ekle"
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

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Aracının email adresini girin..."
            variant="outlined"
            className="mb-4"
            error={validationErrors.email}
          />

          <Input
            label="VKN"
            value={vkn}
            onChangeText={setVKN}
            placeholder="Aracının VKN bilgisini girin..."
            variant="outlined"
            className="mb-4"
            error={validationErrors.vkn}
          />

          <Input
            label="İskonto Oranı (%) - İsteğe Bağlı"
            value={brokerDiscount}
            onChangeText={setBrokerDiscount}
            placeholder="0-100 arası değer (örn: 20)"
            variant="outlined"
            numericOnly={true}
            className="mb-4"
            helperText="Boş bırakırsanız %0 iskonto uygulanır"
            error={validationErrors.discountRate}
          />

          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleSaveBroker}
              loading={createBrokerMutation.isPending}
              disabled={createBrokerMutation.isPending}
            >
              <Typography className="text-white">
                {createBrokerMutation.isPending ? "Ekleniyor..." : "Ekle"}
              </Typography>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="border-stock-border"
              onPress={handleCloseBrokerModal}
              disabled={createBrokerMutation.isPending}
            >
              <Typography className="text-stock-dark">İptal</Typography>
            </Button>
          </View>
        </View>
      </Modal>

      {/* Aracı Düzenleme Modal'ı - ZATEN MEVCUT, SADECE BACKEND ENTEGRASYONu EKLENDİ */}
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

          <Input
            label="İskonto Oranı (%)"
            value={brokerDiscount}
            onChangeText={setBrokerDiscount}
            placeholder="0-100 arası değer"
            variant="outlined"
            numericOnly={true}
            className="mb-4"
            error={validationErrors.discountRate}
          />

          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleEditSaveBroker}
              loading={updateBrokerMutation.isPending}
              disabled={updateBrokerMutation.isPending} // ✅ DÜZELTME: Update mutation loading state'i
            >
              <Typography className="text-white">
                {updateBrokerMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
              </Typography>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="border-stock-border"
              onPress={handleCloseEditBrokerModal}
              disabled={updateBrokerMutation.isPending} // ✅ DÜZELTME: Update mutation loading state'i
            >
              <Typography className="text-stock-dark">İptal</Typography>
            </Button>
          </View>
        </View>
      </Modal>
    </Container>
  );
}
