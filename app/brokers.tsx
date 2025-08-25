import React, { useState } from "react";
import { ScrollView, View, Alert, TouchableOpacity } from "react-native";
import { router } from "expo-router";

import {
  Container,
  Typography,
  Card,
  SquareCard,
  Divider,
  SearchBar,
  Icon,
  Button,
  Modal,
  Input,
  Tab,
} from "@/src/components/ui";
import Toast from "@/src/components/ui/toast";
import { useToast } from "@/src/hooks/useToast";
import { useAppStore, Broker } from "@/src/stores/appStore";

// Dropdown Component (Ürün seçimi için)
interface DropdownProps {
  label?: string;
  value?: string;
  placeholder?: string;
  options: { label: string; value: string; price?: number }[];
  onSelect: (value: string, price?: number) => void;
  className?: string;
}

function Dropdown({
  label,
  value,
  placeholder = "Seçiniz...",
  options,
  onSelect,
  className = "",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View className={`w-full ${className}`}>
      {label && (
        <Typography
          variant="caption"
          weight="medium"
          className="mb-2 text-stock-dark"
        >
          {label}
        </Typography>
      )}

      <View className="relative">
        <TouchableOpacity
          className="flex-row items-center justify-between border border-stock-border rounded-lg px-4 py-3 bg-white"
          onPress={() => setIsOpen(!isOpen)}
          activeOpacity={0.8}
        >
          <Typography
            variant="body"
            className={selectedOption ? "text-stock-dark" : "text-stock-text"}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </Typography>
          <Icon
            family="MaterialIcons"
            name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={20}
            color="#6D706F"
          />
        </TouchableOpacity>

        {isOpen && (
          <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-stock-border rounded-lg shadow-lg z-50">
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                className="px-4 py-3 border-b border-stock-border last:border-b-0"
                onPress={() => {
                  onSelect(option.value, option.price);
                  setIsOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Typography variant="body" className="text-stock-dark">
                  {option.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

export default function BrokersPage() {
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("brokers");

  // Modal states
  const [isBrokerModalVisible, setIsBrokerModalVisible] = useState(false);
  const [isEditBrokerModalVisible, setIsEditBrokerModalVisible] =
    useState(false);
  const [isGiveProductModalVisible, setIsGiveProductModalVisible] =
    useState(false);

  // Form states
  const [brokerName, setBrokerName] = useState("");
  const [brokerSurname, setBrokerSurname] = useState("");
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);

  // Ürün verme form states
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProductPrice, setSelectedProductPrice] = useState(0);
  const [selectedBrokerId, setSelectedBrokerId] = useState("");
  const [productQuantity, setProductQuantity] = useState("");

  // Global Store
  const {
    brokers,
    getActiveProducts,
    getProductById,
    addBroker,
    updateBroker,
    deleteBroker,
    toggleBrokerReceipt,
    giveProductToBroker,
    getBrokerTotalDebt,
  } = useAppStore();

  // Toast
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Tab tanımları
  const tabs = [
    { id: "brokers", label: "Aracılar" },
    { id: "giveProduct", label: "Ürün Ver" },
  ];

  // Options for dropdowns
  const activeProducts = getActiveProducts();
  const productOptions = activeProducts.map((product) => ({
    label: `${product.name} (Stok: ${product.stock}, ₺${product.price}/adet)`,
    value: product.id,
    price: product.price,
  }));

  const brokerOptions = brokers.map((broker) => ({
    label: `${broker.name} ${broker.surname}`,
    value: broker.id,
  }));

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  // Broker CRUD operations
  const handleAddBroker = () => {
    setIsBrokerModalVisible(true);
  };

  const handleEditBroker = (broker: Broker) => {
    setEditingBroker(broker);
    setBrokerName(broker.name);
    setBrokerSurname(broker.surname);
    setIsEditBrokerModalVisible(true);
  };

  const handleDeleteBroker = (broker: Broker) => {
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
              deleteBroker(broker.id);
              showSuccess("Aracı başarıyla silindi!");
            } catch (error) {
              showError("Aracı silinirken bir hata oluştu.");
            }
          },
        },
      ]
    );
  };

  const handleSaveBroker = () => {
    if (!brokerName.trim() || !brokerSurname.trim()) {
      showError("Lütfen ad ve soyad alanlarını doldurun.");
      return;
    }

    Alert.alert(
      "Aracı Ekle",
      `"${brokerName} ${brokerSurname}" aracısını eklemek istediğinizden emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Ekle",
          onPress: () => {
            try {
              addBroker({
                name: brokerName,
                surname: brokerSurname,
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

    Alert.alert(
      "Aracı Güncelle",
      `"${brokerName} ${brokerSurname}" olarak güncellemek istediğinizden emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Güncelle",
          onPress: () => {
            try {
              updateBroker(editingBroker.id, {
                name: brokerName,
                surname: brokerSurname,
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
  };

  const handleCloseEditBrokerModal = () => {
    setIsEditBrokerModalVisible(false);
    setEditingBroker(null);
    setBrokerName("");
    setBrokerSurname("");
  };

  // Product giving operations
  const handleGiveProduct = () => {
    if (!selectedProductId || !selectedBrokerId || !productQuantity.trim()) {
      showError("Lütfen tüm alanları doldurun.");
      return;
    }

    const quantity = parseInt(productQuantity);
    const selectedProduct = getProductById(selectedProductId);
    const selectedBroker = brokers.find((b) => b.id === selectedBrokerId);

    if (!selectedProduct || !selectedBroker) {
      showError("Geçersiz ürün veya aracı seçimi.");
      return;
    }

    if (quantity <= 0) {
      showError("Adet sayısı 0'dan büyük olmalıdır.");
      return;
    }

    const totalAmount = quantity * selectedProduct.price;

    Alert.alert(
      "Ürün Ver",
      `${selectedBroker.name} ${selectedBroker.surname} aracısına ${quantity} adet ${selectedProduct.name} vermek istediğinizden emin misiniz?\n\nToplam Tutar: ₺${totalAmount}`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Ver",
          onPress: () => {
            const result = giveProductToBroker(
              selectedBrokerId,
              selectedProductId,
              quantity
            );

            if (result.success) {
              handleCloseGiveProductModal();
              showSuccess(
                `${selectedBroker.name} ${selectedBroker.surname} aracısına ${quantity} adet ürün başarıyla verildi!`
              );
            } else {
              showError(result.error || "Ürün verilirken bir hata oluştu.");
            }
          },
        },
      ]
    );
  };

  const handleCloseGiveProductModal = () => {
    setIsGiveProductModalVisible(false);
    setSelectedProductId("");
    setSelectedProductPrice(0);
    setSelectedBrokerId("");
    setProductQuantity("");
  };

  const handleToggleReceipt = (brokerId: string) => {
    toggleBrokerReceipt(brokerId);
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

      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {/* Search Bar */}
        <SearchBar
          placeholder="Aracı ara..."
          onSearch={handleSearch}
          className="mb-3"
        />

        {/* Tab'lar */}
        <Tab
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="pills"
          size="md"
          className="mb-4"
        />

        {/* Aracılar Tab Content */}
        {activeTab === "brokers" && (
          <View className="mt-3">
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
                        pathname: "/brokerDetail",
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
                <Typography
                  variant="body"
                  className="text-stock-text text-center"
                >
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
                  <Icon
                    family="MaterialIcons"
                    name="add"
                    size={18}
                    color="white"
                  />
                }
              >
                Yeni Aracı Ekle
              </Button>
            </View>
          </View>
        )}

        {/* Ürün Ver Tab Content */}
        {activeTab === "giveProduct" && (
          <View className="mt-3">
            <Card
              variant="default"
              padding="lg"
              className="border border-stock-border"
              radius="md"
            >
              <Typography
                variant="h4"
                className="text-stock-dark mb-4"
                align="center"
              >
                Aracıya Ürün Ver
              </Typography>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="bg-stock-red"
                onPress={() => setIsGiveProductModalVisible(true)}
                leftIcon={
                  <Icon
                    family="MaterialIcons"
                    name="sell"
                    size={18}
                    color="white"
                  />
                }
              >
                Ürün Ver
              </Button>
            </Card>
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

      {/* Ürün Verme Modal'ı */}
      <Modal
        visible={isGiveProductModalVisible}
        onClose={handleCloseGiveProductModal}
        title="Aracıya Ürün Ver"
        size="lg"
        className="bg-white mx-6"
      >
        <View>
          <Dropdown
            label="Ürün Seçin"
            value={selectedProductId}
            placeholder="Ürün seçiniz..."
            options={productOptions}
            onSelect={(productId, price) => {
              setSelectedProductId(productId);
              setSelectedProductPrice(price || 0);
            }}
            className="mb-4"
          />

          <Input
            label="Adet"
            value={productQuantity}
            onChangeText={setProductQuantity}
            placeholder="Kaç adet verilecek?"
            variant="outlined"
            keyboardType="numeric"
            className="mb-4"
          />

          <Dropdown
            label="Aracı Seçin"
            value={selectedBrokerId}
            placeholder="Aracı seçiniz..."
            options={brokerOptions}
            onSelect={(brokerId) => setSelectedBrokerId(brokerId)}
            className="mb-4"
          />

          {selectedProductId && productQuantity && (
            <View className="bg-stock-gray p-3 rounded-lg mb-4">
              <Typography
                variant="caption"
                className="text-stock-dark"
                weight="medium"
              >
                Toplam Tutar: ₺
                {(
                  parseInt(productQuantity || "0") * selectedProductPrice
                ).toLocaleString()}
              </Typography>
            </View>
          )}

          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleGiveProduct}
            >
              <Typography className="text-white">Ürün Ver</Typography>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="border-stock-border"
              onPress={handleCloseGiveProductModal}
            >
              <Typography className="text-stock-dark">İptal</Typography>
            </Button>
          </View>
        </View>
      </Modal>
    </Container>
  );
}
