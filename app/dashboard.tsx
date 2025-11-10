// app/dashboard.tsx
import React, { useMemo } from "react";
import {
  ScrollView,
  View,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";

import { Container, Typography, Card, Icon } from "@/src/components/ui";
import Divider from "@/src/components/ui/divider";
import Toast from "@/src/components/ui/toast";
import { useToast } from "@/src/hooks/useToast";
import { useAuthStore } from "@/src/stores/authStore";
import { useActiveBrokers } from "@/src/hooks/api/useBrokers";
import { useActiveProducts } from "@/src/hooks/api/useProducts";
import {
  useInventoryAll,
  useInventoryCritical,
  useInventoryOutOfStock,
} from "@/src/hooks/api/useInventory";
import logger from "@/src/utils/logger";

const { width } = Dimensions.get("window");
const isSmallScreen = width < 380;

// Animated Card Component with pulse effect
const AnimatedCard: React.FC<{
  children: React.ReactNode;
  delay?: number;
  onPress?: () => void;
}> = ({ children, onPress }) => {
  const content = <View>{children}</View>;

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="flex-1">
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { toast, hideToast } = useToast();

  // API Queries
  const { data: brokers, isLoading: brokersLoading, refetch: refetchBrokers } = useActiveBrokers();
  const {
    data: products,
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = useActiveProducts();
  const {
    data: inventory,
    isLoading: inventoryLoading,
    refetch: refetchInventory,
  } = useInventoryAll();
  const { data: criticalInventory, refetch: refetchCritical } = useInventoryCritical();
  const { data: outOfStockInventory, refetch: refetchOutOfStock } = useInventoryOutOfStock();

  const [refreshing, setRefreshing] = React.useState(false);

  // Refresh handler
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchBrokers(),
        refetchProducts(),
        refetchInventory(),
        refetchCritical(),
        refetchOutOfStock(),
      ]);
    } catch (error) {
      logger.error("❌ Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchBrokers, refetchProducts, refetchInventory, refetchCritical, refetchOutOfStock]);

  // Statistics
  const stats = useMemo(() => {
    const totalBrokers = brokers?.length || 0;
    const totalProducts = products?.length || 0;
    const totalInventoryItems = inventory?.length || 0;
    const criticalItems = criticalInventory?.length || 0;
    const outOfStockItems = outOfStockInventory?.length || 0;

    const totalInventoryValue =
      inventory?.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;
    const totalBalance = brokers?.reduce((sum, broker) => sum + (broker.balance || 0), 0) || 0;

    const availableItems = totalInventoryItems - criticalItems - outOfStockItems;

    return {
      totalBrokers,
      totalProducts,
      totalInventoryItems,
      criticalItems,
      outOfStockItems,
      availableItems,
      totalInventoryValue,
      totalBalance,
    };
  }, [brokers, products, inventory, criticalInventory, outOfStockInventory]);

  const handleProfilePress = () => {
    router.push("/profile");
  };

  const isLoading = brokersLoading || productsLoading || inventoryLoading;

  return (
    <Container className="bg-white" safeTop={false} padding="none">
      {/* Toast Notification */}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-[50]"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />
        }
      >
        {/* Modern Header */}
        <View className="bg-white pt-14 pb-6 px-5 border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Typography variant="caption" className="text-gray-500 mb-1">
                {new Date().toLocaleDateString("tr-TR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </Typography>
              <Typography
                variant="h1"
                weight="bold"
                size={isSmallScreen ? "xl" : "2xl"}
                className="text-gray-900"
              >
                Dashboard
              </Typography>
              {user && (
                <Typography variant="body" className="text-gray-600 mt-1">
                  Hoş geldin, {user.username}
                </Typography>
              )}
            </View>

            {/* Profile Button */}
            <TouchableOpacity
              onPress={handleProfilePress}
              style={{
                backgroundColor: "#DC2626",
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
              activeOpacity={0.7}
            >
              <Icon family="MaterialIcons" name="person" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <View className="px-5 py-6">
          {/* Quick Actions - Modern Grid */}
          <View className="mb-6">
            <View className="gap-3">
              {/* Row 1: Broker & Ürünler */}
              <View className="flex-row gap-3">
                <AnimatedCard delay={50} onPress={() => router.push("/brokers")}>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "#F3F4F6",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View
                        style={{
                          backgroundColor: "#DC2626",
                          borderRadius: 8,
                          padding: 10,
                        }}
                      >
                        <Icon family="MaterialIcons" name="people" size={20} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography variant="body" weight="semibold" className="text-gray-900">
                          Broker'lar
                        </Typography>
                        <Typography variant="caption" className="text-gray-500">
                          {stats.totalBrokers} aktif
                        </Typography>
                      </View>
                    </View>
                  </View>
                </AnimatedCard>

                <AnimatedCard delay={75} onPress={() => router.push("/products")}>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "#F3F4F6",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View
                        style={{
                          backgroundColor: "#DC2626",
                          borderRadius: 8,
                          padding: 10,
                        }}
                      >
                        <Icon
                          family="MaterialIcons"
                          name="shopping-bag"
                          size={20}
                          color="#FFFFFF"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography variant="body" weight="semibold" className="text-gray-900">
                          Ürünler
                        </Typography>
                        <Typography variant="caption" className="text-gray-500">
                          {stats.totalProducts} çeşit
                        </Typography>
                      </View>
                    </View>
                  </View>
                </AnimatedCard>
              </View>

              {/* Row 2: Stok & Kategoriler */}
              <View className="flex-row gap-3">
                <AnimatedCard delay={100} onPress={() => router.push("/stock")}>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "#F3F4F6",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View
                        style={{
                          backgroundColor: "#DC2626",
                          borderRadius: 8,
                          padding: 10,
                        }}
                      >
                        <Icon family="MaterialIcons" name="inventory-2" size={20} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography variant="body" weight="semibold" className="text-gray-900">
                          Stok Takip
                        </Typography>
                        <Typography variant="caption" className="text-gray-500">
                          {stats.totalInventoryItems} kalem
                        </Typography>
                      </View>
                    </View>
                  </View>
                </AnimatedCard>

                <AnimatedCard delay={125} onPress={() => router.push("/categories")}>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "#F3F4F6",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View
                        style={{
                          backgroundColor: "#DC2626",
                          borderRadius: 8,
                          padding: 10,
                        }}
                      >
                        <Icon family="MaterialIcons" name="category" size={20} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography variant="body" weight="semibold" className="text-gray-900">
                          Kategoriler
                        </Typography>
                        <Typography variant="caption" className="text-gray-500">
                          Yönet
                        </Typography>
                      </View>
                    </View>
                  </View>
                </AnimatedCard>
              </View>

              {/* Row 3: Satış İşlemleri */}
              <View className="flex-row gap-3">
                <AnimatedCard delay={150} onPress={() => router.push("/broker/[id]" as any)}>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "#F3F4F6",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View
                        style={{
                          backgroundColor: "#DC2626",
                          borderRadius: 8,
                          padding: 10,
                        }}
                      >
                        <Icon
                          family="MaterialIcons"
                          name="shopping-cart"
                          size={20}
                          color="#FFFFFF"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography variant="body" weight="semibold" className="text-gray-900">
                          Satış Yap
                        </Typography>
                        <Typography variant="caption" className="text-gray-500">
                          Yeni satış
                        </Typography>
                      </View>
                    </View>
                  </View>
                </AnimatedCard>

                <AnimatedCard delay={175} onPress={() => router.push("/broker/[id]" as any)}>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "#F3F4F6",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View
                        style={{
                          backgroundColor: "#DC2626",
                          borderRadius: 8,
                          padding: 10,
                        }}
                      >
                        <Icon
                          family="MaterialIcons"
                          name="receipt-long"
                          size={20}
                          color="#FFFFFF"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography variant="body" weight="semibold" className="text-gray-900">
                          Tahsilat
                        </Typography>
                        <Typography variant="caption" className="text-gray-500">
                          Ödeme al
                        </Typography>
                      </View>
                    </View>
                  </View>
                </AnimatedCard>
              </View>

              {/* Row 4: Raporlar & Ayarlar */}
              <View className="flex-row gap-3">
                <AnimatedCard delay={200} onPress={() => router.push("/stock")}>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "#F3F4F6",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View
                        style={{
                          backgroundColor: "#DC2626",
                          borderRadius: 8,
                          padding: 10,
                        }}
                      >
                        <Icon family="MaterialIcons" name="assessment" size={20} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography variant="body" weight="semibold" className="text-gray-900">
                          Raporlar
                        </Typography>
                        <Typography variant="caption" className="text-gray-500">
                          Analiz
                        </Typography>
                      </View>
                    </View>
                  </View>
                </AnimatedCard>

                <AnimatedCard
                  delay={225}
                  onPress={() => Alert.alert("Ayarlar", "Yakında eklenecek")}
                >
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "#F3F4F6",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View
                        style={{
                          backgroundColor: "#DC2626",
                          borderRadius: 8,
                          padding: 10,
                        }}
                      >
                        <Icon family="MaterialIcons" name="settings" size={20} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography variant="body" weight="semibold" className="text-gray-900">
                          Ayarlar
                        </Typography>
                        <Typography variant="caption" className="text-gray-500">
                          Yapılandır
                        </Typography>
                      </View>
                    </View>
                  </View>
                </AnimatedCard>
              </View>
            </View>
          </View>

          {/* Divider */}
          <Divider className="my-2" />

          {/* Critical Inventory Items */}
          {!isLoading && (stats.criticalItems > 0 || stats.outOfStockItems > 0) && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Typography variant="body" weight="semibold" className="text-gray-900">
                  Kritik Durum
                </Typography>
                <View className="flex-row items-center gap-2">
                  {stats.criticalItems > 0 && (
                    <View
                      style={{
                        backgroundColor: "#FEF2F2",
                        borderRadius: 12,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <Typography variant="caption" className="text-red-600 text-xs">
                        {stats.criticalItems + stats.outOfStockItems} uyarı
                      </Typography>
                    </View>
                  )}
                </View>
              </View>

              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#F3F4F6",
                }}
              >
                <View className="gap-3">
                  {criticalInventory &&
                    criticalInventory.slice(0, 5).map((item, index) => (
                      <View key={item.id || index}>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1 flex-row items-center gap-3">
                            {/* <View
                              style={{
                                width: 4,
                                height: 40,
                                backgroundColor: "#DC2626",
                                borderRadius: 2,
                              }}
                            /> */}
                            <View className="flex-1">
                              <Typography
                                variant="body"
                                weight="semibold"
                                className="text-gray-900"
                              >
                                {item.productName || "Ürün"}
                              </Typography>
                              <Typography variant="caption" className="text-gray-500">
                                Stok: {item.productCount || 0} • Min:{" "}
                                {item.criticalProductCount || 0}
                              </Typography>
                            </View>
                          </View>
                          <View className="items-end">
                            <Typography variant="caption" weight="medium" className="text-red-600">
                              Kritik
                            </Typography>
                          </View>
                        </View>
                        {index < Math.min(4, (criticalInventory?.length || 0) - 1) && (
                          <Divider className="mt-3" />
                        )}
                      </View>
                    ))}

                  {outOfStockInventory && outOfStockInventory.length > 0 && (
                    <>
                      {criticalInventory && criticalInventory.length > 0 && (
                        <Divider className="my-1" />
                      )}
                      {outOfStockInventory.slice(0, 3).map((item, index) => (
                        <View key={item.id || `out-${index}`}>
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1 flex-row items-center gap-3">
                              {/* <View
                                style={{
                                  width: 4,
                                  height: 40,
                                  backgroundColor: "#DC2626",
                                  borderRadius: 2,
                                }}
                              /> */}
                              <View className="flex-1">
                                <Typography
                                  variant="body"
                                  weight="semibold"
                                  className="text-gray-900"
                                >
                                  {item.productName || "Ürün"}
                                </Typography>
                                <Typography variant="caption" className="text-gray-500">
                                  Stokta yok
                                </Typography>
                              </View>
                            </View>
                            <View className="items-end">
                              <Typography
                                variant="caption"
                                weight="medium"
                                className="text-red-600"
                              >
                                Tükendi
                              </Typography>
                            </View>
                          </View>
                          {index < Math.min(2, outOfStockInventory.length - 1) && (
                            <Divider className="mt-3" />
                          )}
                        </View>
                      ))}
                    </>
                  )}

                  {((criticalInventory && criticalInventory.length > 5) ||
                    (outOfStockInventory && outOfStockInventory.length > 3)) && (
                    <>
                      <Divider className="my-2" />
                      <TouchableOpacity
                        onPress={() => router.push("/stock")}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          paddingVertical: 8,
                        }}
                      >
                        <Typography variant="caption" className="text-red-600">
                          Tümünü Gör
                        </Typography>
                        <Icon
                          family="MaterialIcons"
                          name="arrow-forward"
                          size={14}
                          color="#DC2626"
                        />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Loading state */}
          {isLoading && (
            <AnimatedCard delay={0}>
              <Card variant="elevated" padding="lg" className="mb-4">
                <View className="items-center py-2">
                  <Icon family="MaterialIcons" name="hourglass-empty" size={32} color="#9CA3AF" />
                  <Typography variant="body" className="text-gray-500 mt-2">
                    Veriler yükleniyor...
                  </Typography>
                </View>
              </Card>
            </AnimatedCard>
          )}

          {/* Bottom Spacing */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </Container>
  );
}
