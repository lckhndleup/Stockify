import React, { useState } from "react";
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
import { useAppStore, Broker } from "@/src/stores/appStore";

// Backend hooks - YENİ EKLENEN
import { useActiveBrokers, useCreateBroker } from "@/src/hooks/api/useBrokers";
import { BrokerFormData } from "@/src/types/broker";
import { validateBrokerForm } from "@/src/validations/brokerValidation";

export default function BrokersPage() {
  const [searchText, setSearchText] = useState("");

  // Modal states
  const [isBrokerModalVisible, setIsBrokerModalVisible] = useState(false);
  const [isEditBrokerModalVisible, setIsEditBrokerModalVisible] =
    useState(false);

  // Form states
  const [brokerName, setBrokerName] = useState("");
  const [brokerSurname, setBrokerSurname] = useState("");
  const [brokerDiscount, setBrokerDiscount] = useState(""); // Yeni iskonto alanı
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);

  // Validation Error States
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // BACKEND HOOKS - YENİ EKLENEN
  const {
    data: backendBrokers = [],
    isLoading: brokersLoading,
    error: brokersError,
    refetch: refetchBrokers,
  } = useActiveBrokers();

  const createBrokerMutation = useCreateBroker();

  // LOCAL STORE - Geriye uyumluluk için korundu
  const {
    brokers: localBrokers, // Local store'dan brokers (geçici)
    addBroker,
    updateBroker,
    getBrokerTotalDebt,
    globalToast,
    hideGlobalToast,
  } = useAppStore();

  // Toast
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Backend broker'ları öncelikle kullan, fallback olarak local
  const brokers = brokersError ? localBrokers : backendBrokers;

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const handleAddBroker = () => {
    setIsBrokerModalVisible(true);
  };

  const handleEditBroker = (broker: Broker) => {
    setEditingBroker(broker);
    setBrokerName(broker.name);
    setBrokerSurname(broker.surname);
    setBrokerDiscount(broker.discountRate.toString());
    setIsEditBrokerModalVisible(true);
  };

  const validateDiscount = (value: string) => {
    if (!value) return true; // İsteğe bağlı alan
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 100;
  };

  // BACKEND ENTEGRELİ BROKER EKLEME
  const handleSaveBroker = async () => {
    // Form validation
    const validation = validateBrokerForm(
      brokerName,
      brokerSurname,
      brokerDiscount || "0"
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
              // Backend'e kaydet
              const brokerData: BrokerFormData = {
                firstName: brokerName.trim(),
                lastName: brokerSurname.trim(),
                discountRate: discountRate,
              };

              console.log("🎯 Creating broker with backend:", brokerData);

              await createBrokerMutation.mutateAsync(brokerData);

              console.log("✅ Broker created successfully via backend");
              handleCloseBrokerModal();
              showSuccess("Aracı başarıyla eklendi!");
            } catch (error) {
              console.error("❌ Backend broker creation failed:", error);

              // Backend başarısız olursa local store'a fall back
              try {
                console.log("🔄 Falling back to local store...");
                const newBroker = addBroker({
                  name: brokerName,
                  surname: brokerSurname,
                  email: "", // Backend'de olmayan alanlar boş
                  phone: "",
                  address: "",
                  discountRate: discountRate,
                });
                handleCloseBrokerModal();
                showSuccess("Aracı başarıyla eklendi! (Local)");
              } catch (localError) {
                console.error(
                  "❌ Local broker creation also failed:",
                  localError
                );
                showError("Aracı eklenirken bir hata oluştu.");
              }
            }
          },
        },
      ]
    );
  };

  const handleEditSaveBroker = () => {
    if (!editingBroker) return;

    // Form validation
    const validation = validateBrokerForm(
      brokerName,
      brokerSurname,
      brokerDiscount || "0"
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
          onPress: () => {
            try {
              // Şimdilik local store kullan - sonra backend entegre edilecek
              updateBroker(editingBroker.id, {
                name: brokerName,
                surname: brokerSurname,
                discountRate: discountRate,
              });
              handleCloseEditBrokerModal();
              showSuccess("Aracı başarıyla güncellendi!");
            } catch (error) {
              showError("Aracı güncellenirken bir hata oluştu.");
            }
          },
        },
      ]
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
    `${broker.name} ${broker.surname}`
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  // Loading state
  if (brokersLoading && !brokersError) {
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <View className="items-center justify-center flex-1">
          <Loading size="large" />
          <Typography variant="body" className="text-stock-text mt-4">
            Aracılar yükleniyor...
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
            ⚠️ Backend bağlantı hatası - Local veriler gösteriliyor
          </Typography>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {/* Search Bar */}
        <SearchBar
          placeholder="Aracı ara..."
          onSearch={handleSearch}
          className="mb-4"
        />

        {/* Aracı Grid Listesi */}
        <View
          className="flex-row flex-wrap justify-between"
          style={{ gap: 10 }}
        >
          {filteredBrokers.map((broker) => {
            // Backend broker'ları için balance, local için totalDebt hesapla
            const totalDebt =
              "balance" in broker
                ? (broker as any).balance
                : getBrokerTotalDebt(broker.id);

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

        {/* Yeni Aracı Ekle Butonu */}
        <View className="mt-6 mb-6">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="bg-stock-red"
            onPress={handleAddBroker}
            leftIcon={
              <Icon family="MaterialIcons" name="add" size={18} color="white" />
            }
            disabled={createBrokerMutation.isPending}
          >
            {createBrokerMutation.isPending
              ? "Ekleniyor..."
              : "Yeni Aracı Ekle"}
          </Button>
        </View>
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
