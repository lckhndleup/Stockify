// app/stockDetail.tsx
import React, { useState } from "react";
import { ScrollView, View, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

import {
  Container,
  Typography,
  Card,
  Icon,
  Button,
  Input,
  Loading,
} from "@/src/components/ui";
import Toast from "@/src/components/ui/toast";
import { useToast } from "@/src/hooks/useToast";

// Inventory hooks
import {
  useInventoryDetail,
  useUpdateInventory,
  InventoryUpdateRequest,
} from "@/src/hooks/api/useInventory";

export default function StockDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    price: "",
    productCount: "",
    criticalProductCount: "",
  });

  // Toast
  const { toast, showSuccess, showError, hideToast } = useToast();

  // API Hooks
  const {
    data: inventoryDetail,
    isLoading,
    error,
    refetch,
  } = useInventoryDetail(id || "", { enabled: !!id });

  const updateInventoryMutation = useUpdateInventory();

  // Form handlers
  const handleEditToggle = () => {
    if (!editMode && inventoryDetail) {
      // Edit moduna geçerken mevcut değerleri form'a yükle
      setFormData({
        price: inventoryDetail.price.toString(),
        productCount: inventoryDetail.productCount.toString(),
        criticalProductCount: inventoryDetail.criticalProductCount.toString(),
      });
    }
    setEditMode(!editMode);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    const price = parseFloat(formData.price);
    const productCount = parseInt(formData.productCount);
    const criticalProductCount = parseInt(formData.criticalProductCount);

    if (isNaN(price) || price <= 0) {
      errors.push("Fiyat geçerli bir sayı olmalı ve 0'dan büyük olmalıdır");
    }

    if (isNaN(productCount) || productCount < 0) {
      errors.push("Ürün adedi geçerli bir sayı olmalı ve 0'dan küçük olamaz");
    }

    if (isNaN(criticalProductCount) || criticalProductCount < 0) {
      errors.push(
        "Kritik ürün adedi geçerli bir sayı olmalı ve 0'dan küçük olamaz"
      );
    }

    if (productCount < criticalProductCount) {
      errors.push("Ürün adedi kritik ürün adedinden küçük olamaz");
    }

    return errors;
  };

  const handleUpdate = async () => {
    if (!inventoryDetail) return;

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      showError(validationErrors[0]);
      return;
    }

    const updateData: InventoryUpdateRequest = {
      inventoryId: inventoryDetail.inventoryId,
      price: parseFloat(formData.price),
      productCount: parseInt(formData.productCount),
      criticalProductCount: parseInt(formData.criticalProductCount),
    };

    Alert.alert(
      "Stok Güncelle",
      `${inventoryDetail.productName} ürününün stok bilgilerini güncellemek istediğinizden emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Güncelle",
          onPress: async () => {
            try {
              await updateInventoryMutation.mutateAsync(updateData);
              showSuccess("Stok başarıyla güncellendi!");
              setEditMode(false);
              refetch(); // Verileri yenile
            } catch (error) {
              showError("Stok güncellenirken bir hata oluştu.");
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData({
      price: "",
      productCount: "",
      criticalProductCount: "",
    });
  };

  if (isLoading) {
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <Loading size="large" />
      </Container>
    );
  }

  if (error || !inventoryDetail) {
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <View className="flex-1 justify-center items-center">
          <Icon
            family="MaterialIcons"
            name="error-outline"
            size={64}
            color="#E3001B"
          />
          <Typography
            variant="h3"
            weight="bold"
            className="text-stock-red mt-4 mb-2"
          >
            Hata Oluştu
          </Typography>
          <Typography
            variant="body"
            className="text-stock-text text-center mb-6"
          >
            Stok detayı yüklenirken bir hata oluştu.
          </Typography>
          <Button
            variant="primary"
            onPress={() => refetch()}
            className="bg-stock-red"
          >
            Tekrar Dene
          </Button>
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

      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {/* Ürün Bilgileri */}
        <Card
          variant="default"
          padding="md"
          className="bg-stock-gray border-0 mb-4"
          radius="md"
        >
          <View className="flex-row items-center mb-3">
            <Icon
              family="MaterialCommunityIcons"
              name="package-variant"
              size={24}
              color="#E3001B"
            />
            <Typography
              variant="h3"
              weight="bold"
              className="text-stock-dark ml-2"
            >
              {inventoryDetail.productName}
            </Typography>
          </View>

          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Typography variant="caption" className="text-stock-text">
                Kategori:
              </Typography>
              <Typography
                variant="caption"
                weight="medium"
                className="text-stock-dark"
              >
                {inventoryDetail.categoryName}
              </Typography>
            </View>

            <View className="flex-row justify-between">
              <Typography variant="caption" className="text-stock-text">
                Envanter Kodu:
              </Typography>
              <Typography
                variant="caption"
                weight="medium"
                className="text-stock-dark"
              >
                {inventoryDetail.inventoryCode}
              </Typography>
            </View>

            <View className="flex-row justify-between">
              <Typography variant="caption" className="text-stock-text">
                Durum:
              </Typography>
              <View className="flex-row items-center">
                <View
                  className={`w-3 h-3 rounded-full ${inventoryDetail.statusColor} mr-2`}
                />
                <Typography
                  variant="caption"
                  weight="medium"
                  className="text-stock-dark"
                >
                  {inventoryDetail.statusText}
                </Typography>
              </View>
            </View>
          </View>
        </Card>

        {/* Düzenleme Modu Toggle */}
        <View className="flex-row justify-between items-center mb-4">
          <Typography variant="h3" weight="bold" className="text-stock-dark">
            Stok Bilgileri
          </Typography>
          <Button
            variant="outline"
            size="sm"
            onPress={handleEditToggle}
            className="border-stock-red"
            disabled={updateInventoryMutation.isPending}
          >
            <Typography className="text-stock-red" weight="medium">
              {editMode ? "İptal" : "Düzenle"}
            </Typography>
          </Button>
        </View>

        {/* Stok Bilgileri Kartları */}
        <View className="space-y-4 mb-6">
          {/* Fiyat */}
          <Card
            variant="default"
            padding="md"
            className="border border-stock-border"
            radius="md"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Icon
                  family="MaterialIcons"
                  name="attach-money"
                  size={20}
                  color="#0a7029"
                />
                <Typography
                  variant="body"
                  weight="semibold"
                  className="text-stock-dark ml-2"
                >
                  Birim Fiyat
                </Typography>
              </View>
              <View className={`px-3 py-1 rounded-full bg-green-100`}>
                <Typography
                  variant="caption"
                  className="text-green-700"
                  weight="medium"
                >
                  TL
                </Typography>
              </View>
            </View>

            {editMode ? (
              <Input
                value={formData.price}
                onChangeText={(value) => handleInputChange("price", value)}
                placeholder="0.00"
                keyboardType="numeric"
                variant="outlined"
                className="mt-2"
              />
            ) : (
              <Typography variant="h2" weight="bold" className="text-green-700">
                {inventoryDetail.price.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                TL
              </Typography>
            )}

            {!editMode && (
              <Typography variant="caption" className="text-stock-text mt-1">
                Toplam Değer:{" "}
                {inventoryDetail.totalPrice.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                TL
              </Typography>
            )}
          </Card>

          {/* Ürün Adedi */}
          <Card
            variant="default"
            padding="md"
            className="border border-stock-border"
            radius="md"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Icon
                  family="MaterialCommunityIcons"
                  name="counter"
                  size={20}
                  color="#E3001B"
                />
                <Typography
                  variant="body"
                  weight="semibold"
                  className="text-stock-dark ml-2"
                >
                  Ürün Adedi
                </Typography>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  inventoryDetail.isOutOfStock
                    ? "bg-red-100"
                    : inventoryDetail.isCritical
                    ? "bg-yellow-100"
                    : "bg-blue-100"
                }`}
              >
                <Typography
                  variant="caption"
                  className={
                    inventoryDetail.isOutOfStock
                      ? "text-red-700"
                      : inventoryDetail.isCritical
                      ? "text-yellow-700"
                      : "text-blue-700"
                  }
                  weight="medium"
                >
                  {inventoryDetail.statusText}
                </Typography>
              </View>
            </View>

            {editMode ? (
              <Input
                value={formData.productCount}
                onChangeText={(value) =>
                  handleInputChange("productCount", value)
                }
                placeholder="0"
                keyboardType="numeric"
                variant="outlined"
                className="mt-2"
              />
            ) : (
              <Typography variant="h2" weight="bold" className="text-stock-red">
                {inventoryDetail.productCount.toLocaleString("tr-TR")} adet
              </Typography>
            )}
          </Card>

          {/* Kritik Ürün Adedi */}
          <Card
            variant="default"
            padding="md"
            className="border border-stock-border"
            radius="md"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Icon
                  family="MaterialIcons"
                  name="warning"
                  size={20}
                  color="#F59E0B"
                />
                <Typography
                  variant="body"
                  weight="semibold"
                  className="text-stock-dark ml-2"
                >
                  Kritik Seviye
                </Typography>
              </View>
              <View className="px-3 py-1 rounded-full bg-yellow-100">
                <Typography
                  variant="caption"
                  className="text-yellow-700"
                  weight="medium"
                >
                  Uyarı
                </Typography>
              </View>
            </View>

            {editMode ? (
              <Input
                value={formData.criticalProductCount}
                onChangeText={(value) =>
                  handleInputChange("criticalProductCount", value)
                }
                placeholder="0"
                keyboardType="numeric"
                variant="outlined"
                className="mt-2"
              />
            ) : (
              <Typography
                variant="h2"
                weight="bold"
                className="text-yellow-600"
              >
                {inventoryDetail.criticalProductCount.toLocaleString("tr-TR")}{" "}
                adet
              </Typography>
            )}

            {!editMode && (
              <Typography variant="caption" className="text-stock-text mt-1">
                Bu seviyenin altında uyarı verilir
              </Typography>
            )}
          </Card>
        </View>

        {/* Güncelleme Butonu */}
        {editMode && (
          <View className="space-y-3 mb-6">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleUpdate}
              disabled={updateInventoryMutation.isPending}
              className="bg-stock-red"
            >
              {updateInventoryMutation.isPending ? (
                <Typography className="text-white" weight="bold">
                  Güncelleniyor...
                </Typography>
              ) : (
                <Typography className="text-white" weight="bold">
                  GÜNCELLE
                </Typography>
              )}
            </Button>

            <Button
              variant="outline"
              size="lg"
              fullWidth
              onPress={handleCancel}
              className="border-stock-border"
              disabled={updateInventoryMutation.isPending}
            >
              <Typography className="text-stock-dark" weight="bold">
                İPTAL
              </Typography>
            </Button>
          </View>
        )}
      </ScrollView>
    </Container>
  );
}
