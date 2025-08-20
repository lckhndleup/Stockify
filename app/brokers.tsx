import React, { useState } from "react";
import { ScrollView, View, Alert, TouchableOpacity } from "react-native";

import {
  Container,
  Typography,
  Card,
  SearchBar,
  Icon,
  Button,
  Modal,
  Input,
  Tab,
} from "@/src/components/ui";

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

// Veri yapıları
interface Transaction {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  date: string;
}

interface Broker {
  id: string;
  name: string;
  surname: string;
  transactions: Transaction[];
  hasReceipt: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  stock: number;
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

  // Mock data - Products
  const [products] = useState<Product[]>([
    {
      id: "1",
      name: "Antep Fıstığı (Çiğ)",
      price: 850,
      unit: "kg",
      stock: 45,
    },
    {
      id: "2",
      name: "Ceviz İçi",
      price: 320,
      unit: "kg",
      stock: 23,
    },
    {
      id: "3",
      name: "Badem (Kabuklu)",
      price: 290,
      unit: "kg",
      stock: 78,
    },
    {
      id: "4",
      name: "Kaju",
      price: 450,
      unit: "kg",
      stock: 12,
    },
  ]);

  // Mock data - Brokers
  const [brokers, setBrokers] = useState<Broker[]>([
    {
      id: "1",
      name: "Ahmet",
      surname: "Yılmaz",
      hasReceipt: true,
      transactions: [
        {
          id: "t1",
          productId: "1",
          productName: "Antep Fıstığı (Çiğ)",
          quantity: 10,
          unitPrice: 850,
          totalAmount: 8500,
          date: "2024-08-20",
        },
        {
          id: "t2",
          productId: "2",
          productName: "Ceviz İçi",
          quantity: 5,
          unitPrice: 320,
          totalAmount: 1600,
          date: "2024-08-19",
        },
      ],
    },
    {
      id: "2",
      name: "Mehmet",
      surname: "Kaya",
      hasReceipt: false,
      transactions: [
        {
          id: "t3",
          productId: "3",
          productName: "Badem (Kabuklu)",
          quantity: 20,
          unitPrice: 290,
          totalAmount: 5800,
          date: "2024-08-18",
        },
      ],
    },
  ]);

  // Tab tanımları
  const tabs = [
    { id: "brokers", label: "Aracılar" },
    { id: "giveProduct", label: "Ürün Ver" },
  ];

  // Options for dropdowns
  const productOptions = products.map((product) => ({
    label: `${product.name} (₺${product.price}/${product.unit})`,
    value: product.id,
    price: product.price,
  }));

  const brokerOptions = brokers.map((broker) => ({
    label: `${broker.name} ${broker.surname}`,
    value: broker.id,
  }));

  // Helper functions
  const calculateTotalDebt = (transactions: Transaction[]) => {
    return transactions.reduce(
      (total, transaction) => total + transaction.totalAmount,
      0
    );
  };

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
            setBrokers((prev) => prev.filter((b) => b.id !== broker.id));
            Alert.alert("Başarılı", "Aracı silindi!");
          },
        },
      ]
    );
  };

  const handleSaveBroker = () => {
    if (!brokerName.trim() || !brokerSurname.trim()) {
      Alert.alert("Hata", "Lütfen ad ve soyad alanlarını doldurun.");
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
            const newBroker: Broker = {
              id: Date.now().toString(),
              name: brokerName,
              surname: brokerSurname,
              transactions: [],
              hasReceipt: false,
            };
            setBrokers((prev) => [newBroker, ...prev]);
            handleCloseBrokerModal();
            Alert.alert("Başarılı", "Aracı eklendi!");
          },
        },
      ]
    );
  };

  const handleUpdateBroker = () => {
    if (!brokerName.trim() || !brokerSurname.trim() || !editingBroker) {
      Alert.alert("Hata", "Lütfen ad ve soyad alanlarını doldurun.");
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
            setBrokers((prev) =>
              prev.map((b) =>
                b.id === editingBroker.id
                  ? { ...b, name: brokerName, surname: brokerSurname }
                  : b
              )
            );
            handleCloseEditBrokerModal();
            Alert.alert("Başarılı", "Aracı güncellendi!");
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
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }

    const quantity = parseInt(productQuantity);
    const selectedProduct = products.find((p) => p.id === selectedProductId);
    const selectedBroker = brokers.find((b) => b.id === selectedBrokerId);

    if (!selectedProduct || !selectedBroker) {
      Alert.alert("Hata", "Geçersiz ürün veya aracı seçimi.");
      return;
    }

    const totalAmount = quantity * selectedProduct.price;

    Alert.alert(
      "Ürün Ver",
      `${selectedBroker.name} ${selectedBroker.surname} aracısına ${quantity} ${selectedProduct.unit} ${selectedProduct.name} vermek istediğinizden emin misiniz?\n\nTutar: ₺${totalAmount}`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Ver",
          onPress: () => {
            const newTransaction: Transaction = {
              id: Date.now().toString(),
              productId: selectedProduct.id,
              productName: selectedProduct.name,
              quantity: quantity,
              unitPrice: selectedProduct.price,
              totalAmount: totalAmount,
              date: new Date().toISOString().split("T")[0],
            };

            setBrokers((prev) =>
              prev.map((broker) =>
                broker.id === selectedBrokerId
                  ? {
                      ...broker,
                      transactions: [...broker.transactions, newTransaction],
                    }
                  : broker
              )
            );

            handleCloseGiveProductModal();
            Alert.alert("Başarılı", "Ürün verildi!");
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

  const toggleReceipt = (brokerId: string) => {
    setBrokers((prev) =>
      prev.map((broker) =>
        broker.id === brokerId
          ? { ...broker, hasReceipt: !broker.hasReceipt }
          : broker
      )
    );
  };

  // Filtering
  const filteredBrokers = brokers.filter((broker) =>
    `${broker.name} ${broker.surname}`
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  return (
    <Container className="bg-white" padding="sm" safeTop={false}>
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
            {/* Aracı Listesi */}
            {filteredBrokers.map((broker) => {
              const totalDebt = calculateTotalDebt(broker.transactions);

              return (
                <Card
                  key={broker.id}
                  variant="default"
                  padding="sm"
                  className="border border-stock-border mb-3"
                  radius="md"
                >
                  {/* Aracı Header */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1">
                      <Typography
                        variant="body"
                        weight="semibold"
                        align="left"
                        className="text-stock-dark"
                      >
                        {broker.name} {broker.surname}
                      </Typography>
                      <Typography
                        variant="caption"
                        size="sm"
                        className="text-stock-text mt-1"
                      >
                        Toplam Borç: ₺{totalDebt.toLocaleString()}
                      </Typography>
                    </View>

                    <View className="flex-row items-center">
                      {/* Makbuz Durumu */}
                      <TouchableOpacity
                        onPress={() => toggleReceipt(broker.id)}
                        className={`px-2 py-1 rounded mr-2 ${
                          broker.hasReceipt ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        <Typography
                          variant="caption"
                          size="xs"
                          className={
                            broker.hasReceipt
                              ? "text-green-700"
                              : "text-red-700"
                          }
                          weight="medium"
                        >
                          {broker.hasReceipt ? "Makbuz ✓" : "Makbuz ✗"}
                        </Typography>
                      </TouchableOpacity>

                      {/* Edit/Delete */}
                      <Icon
                        family="MaterialIcons"
                        name="edit"
                        size={18}
                        color="#67686A"
                        pressable
                        onPress={() => handleEditBroker(broker)}
                        containerClassName="mr-2"
                      />
                      <Icon
                        family="MaterialIcons"
                        name="delete"
                        size={18}
                        color="#E3001B"
                        pressable
                        onPress={() => handleDeleteBroker(broker)}
                      />
                    </View>
                  </View>

                  {/* İşlemler */}
                  {broker.transactions.length > 0 && (
                    <View className="border-t border-stock-border pt-3">
                      <Typography
                        variant="caption"
                        weight="medium"
                        className="text-stock-dark mb-2"
                      >
                        İşlemler:
                      </Typography>
                      {broker.transactions.map((transaction) => (
                        <View
                          key={transaction.id}
                          className="flex-row justify-between items-center mb-1"
                        >
                          <Typography
                            variant="caption"
                            size="sm"
                            className="text-stock-text flex-1"
                          >
                            {transaction.productName}: {transaction.quantity}{" "}
                            adet
                          </Typography>
                          <Typography
                            variant="caption"
                            size="sm"
                            className="text-stock-dark"
                            weight="medium"
                          >
                            ₺{transaction.totalAmount.toLocaleString()}
                          </Typography>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
              );
            })}

            {/* Yeni Aracı Ekle Butonu */}
            <View className="mt-4 mb-6">
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
            placeholder="Adet girin..."
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
