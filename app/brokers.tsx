// app/brokers.tsx

import React, { useState, useEffect } from "react";
import { ScrollView, View, Alert, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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
  SelectBox,
  type SelectBoxOption,
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
import { BrokerFormData, BrokerTargetDay } from "@/src/types/broker";
import { validateBrokerForm } from "@/src/validations/brokerValidation";

const TARGET_DAY_OPTIONS: SelectBoxOption[] = [
  { label: "Pazartesi", value: "MONDAY" },
  { label: "Salı", value: "TUESDAY" },
  { label: "Çarşamba", value: "WEDNESDAY" },
  { label: "Perşembe", value: "THURSDAY" },
  { label: "Cuma", value: "FRIDAY" },
  { label: "Cumartesi", value: "SATURDAY" },
  { label: "Pazar", value: "SUNDAY" },
];

// Gün filtreleme seçenekleri
const DAY_FILTER_OPTIONS = {
  ALL: "ALL",
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
  SUNDAY: "SUNDAY",
} as const;

const DAY_FILTER_LABELS = {
  [DAY_FILTER_OPTIONS.ALL]: "Tümü",
  [DAY_FILTER_OPTIONS.MONDAY]: "Pazartesi",
  [DAY_FILTER_OPTIONS.TUESDAY]: "Salı",
  [DAY_FILTER_OPTIONS.WEDNESDAY]: "Çarşamba",
  [DAY_FILTER_OPTIONS.THURSDAY]: "Perşembe",
  [DAY_FILTER_OPTIONS.FRIDAY]: "Cuma",
  [DAY_FILTER_OPTIONS.SATURDAY]: "Cumartesi",
  [DAY_FILTER_OPTIONS.SUNDAY]: "Pazar",
} as const;

function getTargetDayLabel(value: BrokerTargetDay | "") {
  return TARGET_DAY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export default function BrokersPage() {
  const [searchText, setSearchText] = useState("");
  const [selectedDay, setSelectedDay] = useState<string>("ALL"); // Gün filtresi için state
  const [showFilters, setShowFilters] = useState(false); // Filtre görünürlüğü için state

  // Modal states
  const [isBrokerModalVisible, setIsBrokerModalVisible] = useState(false);
  const [isEditBrokerModalVisible, setIsEditBrokerModalVisible] = useState(false);

  // Form states
  const [brokerName, setBrokerName] = useState("");
  const [brokerSurname, setBrokerSurname] = useState("");
  const [brokerEmail, setBrokerEmail] = useState("");
  const [brokerVkn, setBrokerVkn] = useState("");
  const [brokerTkn, setBrokerTkn] = useState("");
  const [brokerTargetDay, setBrokerTargetDay] = useState<BrokerTargetDay | "">("");
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
    setBrokerEmail("");
    setBrokerVkn("");
    setBrokerTkn("");
    setBrokerTargetDay("");
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

    Alert.alert(
      "Aracı Ekle",
      `"${brokerName} ${brokerSurname}" aracısını eklemek istediğinizden emin misiniz?${
        discountRate > 0 ? `\n\nİskonto Oranı: %${discountRate}` : ""
      }${targetDayLabel ? `\n\nTahsilat Günü: ${targetDayLabel}` : ""}`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Ekle",
          onPress: async () => {
            try {
              const brokerData: BrokerFormData = {
                firstName: brokerName.trim(),
                lastName: brokerSurname.trim(),
                email: brokerEmail.trim(),
                vkn: brokerVkn.trim(),
                tkn: brokerTkn.trim(),
                discountRate: discountRate,
                targetDayOfWeek: brokerTargetDay as BrokerTargetDay,
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

    Alert.alert(
      "Aracı Güncelle",
      `"${brokerName} ${brokerSurname}" aracısını güncellemek istediğinizden emin misiniz?${
        discountRate > 0 ? `\n\nİskonto Oranı: %${discountRate}` : ""
      }${targetDayLabel ? `\n\nTahsilat Günü: ${targetDayLabel}` : ""}`,
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
                  email: brokerEmail.trim(),
                  vkn: brokerVkn.trim(),
                  tkn: brokerTkn.trim(),
                  discountRate: discountRate,
                  targetDayOfWeek: brokerTargetDay as BrokerTargetDay,
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
    setBrokerEmail("");
    setBrokerVkn("");
    setBrokerTkn("");
    setBrokerTargetDay("");
    setBrokerDiscount(""); // İskonto alanını da temizle
    setValidationErrors({});
  };

  const handleCloseEditBrokerModal = () => {
    setIsEditBrokerModalVisible(false);
    setEditingBroker(null);
    setBrokerName("");
    setBrokerSurname("");
    setBrokerEmail("");
    setBrokerVkn("");
    setBrokerTkn("");
    setBrokerTargetDay("");
    setBrokerDiscount(""); // İskonto alanını da temizle
    setValidationErrors({});
  };

  // Filtering
  const filteredBrokers = brokers.filter((broker) =>
    `${broker.name} ${broker.surname}`.toLowerCase().includes(searchText.toLowerCase()),
  );

  // Rota günlerine göre gruplandırma
  const groupBrokersByTargetDay = () => {
    const grouped: Record<string, BrokerDisplayItem[]> = {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: [],
      UNASSIGNED: [], // Rota günü olmayan aracılar
    };

    filteredBrokers.forEach((broker) => {
      if (broker.targetDayOfWeek) {
        grouped[broker.targetDayOfWeek].push(broker);
      } else {
        grouped.UNASSIGNED.push(broker);
      }
    });

    return grouped;
  };

  const groupedBrokers = groupBrokersByTargetDay();

  // Loading state
  if (brokersLoading && !brokersError) {
    return (
      <Container className="bg-white flex-1" padding="none" safeTop={false}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
        />
        <Toast
          visible={globalToast.visible}
          message={globalToast.message}
          type={globalToast.type}
          onHide={hideGlobalToast}
        />
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
        <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <Typography variant="body" className="text-red-700 text-center">
            ⚠️ Veriler yüklenemedi
          </Typography>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {/* Search ve Add Butonu ve Filtre */}
        <View className="flex-row items-center mb-4">
          <SearchBar placeholder="Aracı ara..." onSearch={handleSearch} className="flex-1 mr-2" />

          {/* Filter Button */}
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={{
              backgroundColor: showFilters ? "#DC2626" : "#F9FAFB",
              width: 48,
              height: 48,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 8,
              borderWidth: 1,
              borderColor: showFilters ? "#DC2626" : "#E5E7EB",
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="options" size={20} color={showFilters ? "#FFFFFF" : "#6B7280"} />
          </TouchableOpacity>

          {/* Add Button */}
          <TouchableOpacity
            onPress={handleAddBroker}
            style={{
              backgroundColor: "#DC2626",
              width: 48,
              height: 48,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.7}
          >
            <Icon family="MaterialIcons" name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Gün Filtreleme - Horizontal Scroll */}
        {showFilters && (
          <View className="bg-white pb-3 mb-2">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 0 }}
            >
              {Object.entries(DAY_FILTER_LABELS).map(([key, label]) => {
                const isSelected = selectedDay === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setSelectedDay(key)}
                    style={{
                      backgroundColor: isSelected ? "#DC2626" : "#FFFFFF",
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: isSelected ? "#DC2626" : "#E5E7EB",
                    }}
                    activeOpacity={0.7}
                  >
                    <Typography
                      variant="body"
                      weight="semibold"
                      style={{
                        color: isSelected ? "#FFFFFF" : "#6B7280",
                        fontSize: 13,
                      }}
                    >
                      {label}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Rota Günlerine Göre Gruplandırılmış Aracılar */}
        {TARGET_DAY_OPTIONS.map((dayOption) => {
          const dayBrokers = groupedBrokers[dayOption.value as BrokerTargetDay];

          // Gün filtresi aktifse ve seçili gün değilse gösterme
          if (selectedDay !== "ALL" && selectedDay !== dayOption.value) return null;

          if (!dayBrokers || dayBrokers.length === 0) {
            // Sadece belirli bir gün seçiliyse ve aracı yoksa mesaj göster
            if (selectedDay !== "ALL" && selectedDay === dayOption.value) {
              return (
                <View key={dayOption.value} className="items-center justify-center py-12">
                  <Icon
                    family="MaterialCommunityIcons"
                    name="account-group-outline"
                    size={64}
                    color="#ECECEC"
                    containerClassName="mb-4"
                  />
                  <Typography variant="body" className="text-stock-text text-center">
                    {dayOption.label} günü için aracı bulunamadı.
                  </Typography>
                </View>
              );
            }
            return null;
          }

          return (
            <View key={dayOption.value} className="mb-6">
              {/* Gün Başlığı */}
              <View className="flex-row items-center mb-3">
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: "#F3F4F6",
                  }}
                />
                <Typography
                  variant="body"
                  weight="semibold"
                  style={{ color: "#111827", marginHorizontal: 12, fontSize: 16 }}
                >
                  {dayOption.label}
                </Typography>
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: "#F3F4F6",
                  }}
                />
              </View>

              {/* Aracı Grid Listesi - Sıraya göre sıralanmış */}
              <View className="flex-row flex-wrap justify-between" style={{ gap: 10 }}>
                {dayBrokers
                  .sort((a, b) => (a.orderNo || 999) - (b.orderNo || 999))
                  .map((broker) => {
                    const totalDebt = broker.balance || 0;

                    return (
                      <SquareCard
                        key={broker.id}
                        title={`${broker.orderNo ? `#${broker.orderNo} ` : ""}${broker.name} ${broker.surname}`}
                        subtitle="Mevcut Bakiye"
                        amount={`₺${totalDebt.toLocaleString()}`}
                        additionalInfo={`Rota günü: ${dayOption.label}`}
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
            </View>
          );
        })}

        {/* Rota Günü Atanmamış Aracılar */}
        {selectedDay === "ALL" && groupedBrokers.UNASSIGNED.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: "#F3F4F6",
                }}
              />
              <Typography
                variant="body"
                weight="semibold"
                style={{ color: "#6B7280", marginHorizontal: 12, fontSize: 16 }}
              >
                Rota Günü Belirlenmemiş
              </Typography>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: "#F3F4F6",
                }}
              />
            </View>

            <View className="flex-row flex-wrap justify-between" style={{ gap: 10 }}>
              {groupedBrokers.UNASSIGNED.map((broker) => {
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
          </View>
        )}

        {/* Boş durum */}
        {filteredBrokers.length === 0 && (
          <View className="items-center justify-center py-12">
            <Icon
              family="MaterialCommunityIcons"
              name="account-group-outline"
              size={64}
              color="#E5E7EB"
              containerClassName="mb-4"
            />
            <Typography variant="body" className="text-gray-500 text-center">
              {searchText.trim()
                ? "Arama kriterinize uygun aracı bulunamadı."
                : "Henüz aracı eklenmemiş."}
            </Typography>
          </View>
        )}

        {/* Alt boşluk - Bottom Navigation için */}
        <View className="h-24" />
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
