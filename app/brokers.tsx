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
} from "@/src/components/ui";
import Toast from "@/src/components/ui/toast";
import { useToast } from "@/src/hooks/useToast";
import { useAppStore, Broker } from "@/src/stores/appStore";

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

  // Global Store
  const {
    brokers,
    addBroker,
    updateBroker,
    getBrokerTotalDebt,
    globalToast,
    hideGlobalToast,
  } = useAppStore();

  // Toast
  const { toast, showSuccess, showError, hideToast } = useToast();

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

  const handleSaveBroker = () => {
    if (!brokerName.trim() || !brokerSurname.trim()) {
      showError("Lütfen ad ve soyad alanlarını doldurun.");
      return;
    }

    if (brokerDiscount && !validateDiscount(brokerDiscount)) {
      showError("İskonto oranı 0-100 arasında olmalıdır.");
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
          onPress: () => {
            try {
              const newBroker = addBroker({
                name: brokerName,
                surname: brokerSurname,
                discountRate: discountRate,
              });
              handleCloseBrokerModal();
              showSuccess("Aracı başarıyla eklendi!");
            } catch (error) {
              showError("Aracı eklenirken bir hata oluştu.");
            }
          },
        },
      ]
    );
  };

  const handleUpdateBroker = () => {
    if (!brokerName.trim() || !brokerSurname.trim() || !editingBroker) {
      showError("Lütfen ad ve soyad alanlarını doldurun.");
      return;
    }

    if (brokerDiscount && !validateDiscount(brokerDiscount)) {
      showError("İskonto oranı 0-100 arasında olmalıdır.");
      return;
    }

    const discountRate = brokerDiscount ? parseFloat(brokerDiscount) : 0;

    Alert.alert(
      "Aracı Güncelle",
      `"${brokerName} ${brokerSurname}" olarak güncellemek istediğinizden emin misiniz?${
        discountRate > 0 ? `\n\nİskonto Oranı: %${discountRate}` : ""
      }`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Güncelle",
          onPress: () => {
            try {
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
  };

  const handleCloseEditBrokerModal = () => {
    setIsEditBrokerModalVisible(false);
    setEditingBroker(null);
    setBrokerName("");
    setBrokerSurname("");
    setBrokerDiscount(""); // İskonto alanını da temizle
  };

  // Filtering
  const filteredBrokers = brokers.filter((broker) =>
    `${broker.name} ${broker.surname}`
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

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
            const totalDebt = getBrokerTotalDebt(broker.id);

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
          >
            Yeni Aracı Ekle
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
          />

          <Input
            label="Soyad"
            value={brokerSurname}
            onChangeText={setBrokerSurname}
            placeholder="Aracının soyadını girin..."
            variant="outlined"
            className="mb-4"
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
          />

          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleSaveBroker}
            >
              <Typography className="text-white">Ekle</Typography>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="border-stock-border"
              onPress={handleCloseBrokerModal}
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
          />

          <Input
            label="Soyad"
            value={brokerSurname}
            onChangeText={setBrokerSurname}
            placeholder="Aracının soyadını girin..."
            variant="outlined"
            className="mb-4"
          />

          <Input
            label="İskonto Oranı (%)"
            value={brokerDiscount}
            onChangeText={setBrokerDiscount}
            placeholder="0-100 arası değer (örn: 20)"
            variant="outlined"
            numericOnly={true}
            className="mb-4"
            helperText="Aracının genel iskonto oranı"
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
