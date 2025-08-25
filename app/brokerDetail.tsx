import React, { useState } from "react";
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
} from "@/src/components/ui";
import { useToast } from "@/src/hooks/useToast";
import { useAppStore } from "@/src/stores/appStore";

export default function BrokerDetailPage() {
  const { brokerId } = useLocalSearchParams();
  const { brokers, deleteBroker, getBrokerTotalDebt } = useAppStore();
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Broker bilgilerini al
  const broker = brokers.find((b) => b.id === brokerId);

  if (!broker) {
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <View className="items-center justify-center flex-1">
          <Typography variant="body" className="text-stock-text">
            Aracı bulunamadı.
          </Typography>
        </View>
      </Container>
    );
  }

  const totalDebt = getBrokerTotalDebt(broker.id);
  const handleEditBroker = () => {
    // Şimdilik brokers sayfasına geri dönelim
    Alert.alert("Bilgi", "Düzenleme sayfası henüz uygulanmadı");
    // router.push("/brokers");
  };
  const handleDeleteBroker = () => {
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
              router.back();
            } catch (error) {
              showError("Aracı silinirken bir hata oluştu.");
            }
          },
        },
      ]
    );
  };

  const showFeatureNotImplemented = () => {
    Alert.alert("Bilgi", "Bu özellik henüz uygulanmadı");
  };

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
            className="text-stock-black text-center mb-2"
          >
            {`${broker.name} ${broker.surname}`}
          </Typography>

          <Typography
            variant="body"
            weight="semibold"
            className="text-stock-red text-center mt-2"
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
            onPress={showFeatureNotImplemented}
            className="bg-stock-red border-0 px-4 py-4 mb-3"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="mr-4">
                  <Icon
                    family="MaterialIcons"
                    name="sell"
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
                    SATIŞ YAP
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

          {/* Tahsilat Kartı */}
          <Card
            variant="default"
            padding="none"
            pressable
            onPress={showFeatureNotImplemented}
            className="bg-stock-red border-0 px-4 py-4 mb-3"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="mr-4">
                  <Icon
                    family="MaterialIcons"
                    name="payments"
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
                    TAHSİLAT
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

          {/* Ekstreler Kartı */}
          <Card
            variant="default"
            padding="none"
            pressable
            onPress={showFeatureNotImplemented}
            className="bg-stock-red border-0 px-4 py-4 mb-3"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="mr-4">
                  <Icon
                    family="MaterialCommunityIcons"
                    name="file-document-outline"
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
                    EKSTRELER
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

          {/* Faturalar Kartı */}
          <Card
            variant="default"
            padding="none"
            pressable
            onPress={showFeatureNotImplemented}
            className="bg-stock-red border-0 px-4 py-4 mb-3"
            radius="md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="mr-4">
                  <Icon
                    family="MaterialCommunityIcons"
                    name="receipt"
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
                    FATURALAR
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
    </Container>
  );
}
