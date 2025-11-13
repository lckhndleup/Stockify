// app/dashboard/index.tsx
import React, { useMemo } from "react";
import { ScrollView, View, RefreshControl, TouchableOpacity } from "react-native";
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
import { DashboardActionCard, CriticalInventoryItem, DashboardHeader } from "./lib";

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
        {/* Header */}
        <DashboardHeader username={user?.username} onProfilePress={handleProfilePress} />

        {/* Main Content */}
        <View className="px-5 py-6">
          {/* Quick Actions - Modern Grid */}
          <View className="mb-6">
            <View className="gap-3">
              {/* Row 1: Broker & Ürünler */}
              <View className="flex-row gap-3">
                <DashboardActionCard
                  title="Broker'lar"
                  subtitle={`${stats.totalBrokers} aktif`}
                  iconName="people"
                  onPress={() => router.push("/brokers")}
                />
                <DashboardActionCard
                  title="Ürünler"
                  subtitle={`${stats.totalProducts} çeşit`}
                  iconName="shopping-bag"
                  onPress={() => router.push("/products")}
                />
              </View>

              {/* Row 2: Stok & Kategoriler */}
              <View className="flex-row gap-3">
                <DashboardActionCard
                  title="Stok Takip"
                  subtitle={`${stats.totalInventoryItems} kalem`}
                  iconName="inventory-2"
                  onPress={() => router.push("/stock")}
                />
                <DashboardActionCard
                  title="Kategoriler"
                  subtitle="Yönet"
                  iconName="category"
                  onPress={() => router.push("/categories")}
                />
              </View>

              {/* Row 3: Satış İşlemleri */}
              <View className="flex-row gap-3">
                <DashboardActionCard
                  title="Satış Yap"
                  subtitle="Yeni satış"
                  iconName="shopping-cart"
                  onPress={() => router.push("/broker/[id]" as any)}
                />
                <DashboardActionCard
                  title="Tahsilat"
                  subtitle="Ödeme al"
                  iconName="receipt-long"
                  onPress={() => router.push("/broker/[id]" as any)}
                />
              </View>

              {/* Row 4: Ziyaretler & Raporlar */}
              <View className="flex-row gap-3">
                <DashboardActionCard
                  title="Ziyaret Listesi"
                  subtitle="Bugünkü plan"
                  iconName="event-note"
                  onPress={() => router.push("/broker-visits")}
                />
                <DashboardActionCard
                  title="Günlük Rapor"
                  subtitle="İstatistikler"
                  iconName="assessment"
                  onPress={() => router.push("/reports")}
                />
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
                    criticalInventory
                      .slice(0, 5)
                      .map((item, index) => (
                        <CriticalInventoryItem
                          key={item.id || index}
                          productName={item.productName || "Ürün"}
                          productCount={item.productCount}
                          criticalProductCount={item.criticalProductCount}
                          status="critical"
                          showDivider={index < Math.min(4, (criticalInventory?.length || 0) - 1)}
                        />
                      ))}

                  {outOfStockInventory && outOfStockInventory.length > 0 && (
                    <>
                      {criticalInventory && criticalInventory.length > 0 && (
                        <Divider className="my-1" />
                      )}
                      {outOfStockInventory.slice(0, 3).map((item, index) => (
                        <CriticalInventoryItem
                          key={item.id || `out-${index}`}
                          productName={item.productName || "Ürün"}
                          status="outOfStock"
                          showDivider={index < Math.min(2, outOfStockInventory.length - 1)}
                        />
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
            <Card variant="elevated" padding="lg" className="mb-4">
              <View className="items-center py-2">
                <Icon family="MaterialIcons" name="hourglass-empty" size={32} color="#9CA3AF" />
                <Typography variant="body" className="text-gray-500 mt-2">
                  Veriler yükleniyor...
                </Typography>
              </View>
            </Card>
          )}

          {/* Bottom Spacing */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </Container>
  );
}
