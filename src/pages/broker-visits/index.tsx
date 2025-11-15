// app/broker-visits/index.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal as RNModal,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/RootNavigator';
import Typography from "@/src/components/ui/typography";
import Icon from "@/src/components/ui/icon";
import SearchBar from "@/src/components/ui/searchbar";
import { useTodayBrokerVisitsForUI, useUpdateBrokerVisit } from "@/src/hooks/api/useBrokerVisits";
import type { BrokerVisitDisplayItem, BrokerVisitStatus } from "@/src/types/broker";
import logger from "@/src/utils/logger";
import { useToast } from "@/src/hooks/useToast";

export default function BrokerVisitsScreen() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | BrokerVisitStatus>("ALL");
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<BrokerVisitDisplayItem | null>(null);
  const [noteText, setNoteText] = useState("");

  const { data: visits = [], isLoading, refetch, isFetching } = useTodayBrokerVisitsForUI();
  const updateVisitMutation = useUpdateBrokerVisit();
  const { showSuccess, showError } = useToast();

  // Debug logging
  React.useEffect(() => {
    logger.debug("📊 Broker Visits Data:", {
      visitsCount: visits.length,
      visits: visits.slice(0, 3), // First 3 items
      isLoading,
    });
  }, [visits, isLoading]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = visits.length;
    const visited = visits.filter((v) => v.visitInfo?.status === "VISITED").length;
    const pending = visits.filter(
      (v) => !v.visitInfo?.status || v.visitInfo?.status === "NOT_VISITED",
    ).length;
    const skipped = visits.filter((v) => v.visitInfo?.status === "SKIPPED").length;
    const completionRate = total > 0 ? Math.round((visited / total) * 100) : 0;

    return { total, visited, pending, skipped, completionRate };
  }, [visits]);

  // Filter visits by status and search
  const filteredVisits = useMemo(() => {
    let filtered = [...visits];

    // Status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((visit) => {
        const status = visit.visitInfo?.status || "NOT_VISITED";
        return status === statusFilter;
      });
    }

    // Search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter((visit) => visit.brokerName.toLowerCase().includes(searchLower));
    }

    // Sort by orderNo
    return filtered.sort((a, b) => (a.orderNo || 999) - (b.orderNo || 999));
  }, [visits, statusFilter, searchText]);

  // Handle visit status change
  const handleStatusChange = async (
    brokerId: number,
    newStatus: BrokerVisitStatus,
    currentNote?: string,
  ) => {
    try {
      logger.debug("🔄 Changing visit status:", { brokerId, newStatus, currentNote });

      await updateVisitMutation.mutateAsync({
        brokerId,
        status: newStatus,
        note: currentNote,
      });

      showSuccess(
        newStatus === "VISITED"
          ? "Ziyaret tamamlandı"
          : newStatus === "SKIPPED"
            ? "Ziyaret atlandı"
            : "Ziyaret güncellendi",
      );
    } catch (error) {
      logger.error("❌ Visit status change error:", error);
      showError("Ziyaret güncellenirken bir hata oluştu");
    }
  };

  // Handle note modal open
  const handleOpenNote = (broker: BrokerVisitDisplayItem) => {
    setSelectedBroker(broker);
    setNoteText(broker.visitInfo?.note || "");
    setNoteModalVisible(true);
  };

  // Handle note save
  const handleSaveNote = async () => {
    if (!selectedBroker) return;

    try {
      logger.debug("💾 Saving note:", { brokerId: selectedBroker.brokerId, note: noteText });

      // Get current status, default to NOT_VISITED if no visitInfo
      const currentStatus = selectedBroker.visitInfo?.status || "NOT_VISITED";

      await updateVisitMutation.mutateAsync({
        brokerId: selectedBroker.brokerId,
        status: currentStatus,
        note: noteText.trim() || undefined,
      });

      showSuccess("Not kaydedildi");

      setNoteModalVisible(false);
      setSelectedBroker(null);
      setNoteText("");
    } catch (error) {
      logger.error("❌ Note save error:", error);
      showError("Not kaydedilirken bir hata oluştu");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  // Render broker visit item
  const renderBrokerItem = ({ item }: { item: BrokerVisitDisplayItem }) => {
    const status = item.visitInfo?.status || "NOT_VISITED";
    const hasNote = !!item.visitInfo?.note;

    return (
      <View
        className="mx-4 mb-2 rounded-lg overflow-hidden"
        style={{
          backgroundColor: "#FFF",
          borderWidth: 1,
          borderColor: "#E5E7EB",
        }}
      >
        <View className="px-3 py-2">
          {/* Compact Row */}
          <View className="flex-row items-center justify-between">
            {/* Left: Order + Broker Info */}
            <View className="flex-row items-center flex-1 mr-2">
              {/* Order Badge */}
              {item.orderNo && (
                <View
                  className="mr-2 justify-center items-center"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: "#DC2626",
                  }}
                >
                  <Typography className="text-white font-semibold text-xs">
                    {item.orderNo}
                  </Typography>
                </View>
              )}

              {/* Broker Name */}
              <View className="flex-1">
                <Typography className="text-gray-900 font-semibold text-sm" numberOfLines={1}>
                  {item.brokerName}
                </Typography>
              </View>
            </View>

            {/* Right: Status Badge + Actions */}
            <View className="flex-row items-center" style={{ gap: 6 }}>
              {/* Status Badge */}
              <View
                className="px-2 py-1 rounded-full"
                style={{
                  backgroundColor:
                    status === "VISITED" ? "#F0FDF4" : status === "SKIPPED" ? "#F3F4F6" : "#FFF7ED",
                }}
              >
                <Typography
                  className="text-xs font-medium"
                  style={{
                    color:
                      status === "VISITED"
                        ? "#16A34A"
                        : status === "SKIPPED"
                          ? "#6B7280"
                          : "#F97316",
                  }}
                >
                  {status === "VISITED"
                    ? "Tamamlandı"
                    : status === "SKIPPED"
                      ? "Atlandı"
                      : "Bekliyor"}
                </Typography>
              </View>

              {/* Action Buttons - Inline */}
              {status !== "VISITED" && (
                <TouchableOpacity
                  onPress={() => handleStatusChange(item.brokerId, "VISITED", item.visitInfo?.note)}
                  className="px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: "#16A34A" }}
                >
                  <Typography className="text-white font-medium text-xs">Tamamla</Typography>
                </TouchableOpacity>
              )}

              {status !== "SKIPPED" && status !== "VISITED" && (
                <TouchableOpacity
                  onPress={() => handleStatusChange(item.brokerId, "SKIPPED", item.visitInfo?.note)}
                  className="px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: "#6B7280" }}
                >
                  <Typography className="text-white font-medium text-xs">Atla</Typography>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => handleOpenNote(item)}
                className="p-1.5 rounded-lg"
                style={{ backgroundColor: "#F3F4F6" }}
              >
                <Icon name="note-alt" size={16} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Note Display - Compact */}
          {hasNote && (
            <View className="mt-1.5 pl-8">
              <Typography className="text-gray-600 text-xs" numberOfLines={2}>
                {item.visitInfo?.note}
              </Typography>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200">
        <View className="px-4 pt-14 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3 p-2"
              style={{ marginLeft: -8 }}
            >
              <Icon name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Typography className="text-xl font-bold text-gray-900 flex-1">
              Bugünün Ziyaretleri
            </Typography>
          </View>

          {/* Search Bar */}
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            onSearch={() => {}}
            placeholder="Bayi ara..."
          />
        </View>

        {/* Status Filter Buttons */}
        <View className="px-4 pb-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            <TouchableOpacity
              onPress={() => setStatusFilter("ALL")}
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: statusFilter === "ALL" ? "#DC2626" : "#F3F4F6",
              }}
            >
              <Typography
                className="font-medium text-sm"
                style={{ color: statusFilter === "ALL" ? "#FFF" : "#6B7280" }}
              >
                Tümü ({stats.total})
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStatusFilter("NOT_VISITED")}
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: statusFilter === "NOT_VISITED" ? "#F97316" : "#F3F4F6",
              }}
            >
              <Typography
                className="font-medium text-sm"
                style={{ color: statusFilter === "NOT_VISITED" ? "#FFF" : "#6B7280" }}
              >
                Bekleyen ({stats.pending})
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStatusFilter("VISITED")}
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: statusFilter === "VISITED" ? "#16A34A" : "#F3F4F6",
              }}
            >
              <Typography
                className="font-medium text-sm"
                style={{ color: statusFilter === "VISITED" ? "#FFF" : "#6B7280" }}
              >
                Tamamlandı ({stats.visited})
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStatusFilter("SKIPPED")}
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: statusFilter === "SKIPPED" ? "#6B7280" : "#F3F4F6",
              }}
            >
              <Typography
                className="font-medium text-sm"
                style={{ color: statusFilter === "SKIPPED" ? "#FFF" : "#6B7280" }}
              >
                Atlandı ({stats.skipped})
              </Typography>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Statistics Banner */}
      <View
        className="mx-4 mt-4 mb-2 p-4 bg-white rounded-xl"
        style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 items-center">
            <Typography className="text-2xl font-bold text-gray-900">{stats.total}</Typography>
            <Typography className="text-xs text-gray-500 mt-1">Toplam</Typography>
          </View>
          <View style={{ width: 1, height: 40, backgroundColor: "#E5E7EB" }} />
          <View className="flex-1 items-center">
            <Typography className="text-2xl font-bold text-green-600">{stats.visited}</Typography>
            <Typography className="text-xs text-gray-500 mt-1">Tamamlandı</Typography>
          </View>
          <View style={{ width: 1, height: 40, backgroundColor: "#E5E7EB" }} />
          <View className="flex-1 items-center">
            <Typography className="text-2xl font-bold text-orange-500">{stats.pending}</Typography>
            <Typography className="text-xs text-gray-500 mt-1">Bekleyen</Typography>
          </View>
          <View style={{ width: 1, height: 40, backgroundColor: "#E5E7EB" }} />
          <View className="flex-1 items-center">
            <Typography className="text-2xl font-bold text-blue-600">
              {stats.completionRate}%
            </Typography>
            <Typography className="text-xs text-gray-500 mt-1">İlerleme</Typography>
          </View>
        </View>
      </View>

      {/* Broker List */}
      <FlatList
        data={filteredVisits}
        renderItem={renderBrokerItem}
        keyExtractor={(item) => item.brokerId.toString()}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} colors={["#DC2626"]} />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Icon name="event-busy" size={64} color="#D1D5DB" />
            <Typography className="text-gray-500 text-base mt-4">
              {statusFilter === "ALL" ? "Bugün ziyaret yok" : "Sonuç bulunamadı"}
            </Typography>
          </View>
        }
      />

      {/* Note Modal */}
      <RNModal
        visible={noteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setNoteModalVisible(false)}
        >
          <Pressable
            className="bg-white rounded-2xl mx-4 p-6 w-11/12 max-w-md"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Typography className="text-lg font-bold text-gray-900">Not Ekle</Typography>
              <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Broker Name */}
            {selectedBroker && (
              <View className="mb-4">
                <Typography className="text-gray-700 font-medium">
                  {selectedBroker.brokerName}
                </Typography>
              </View>
            )}

            {/* Note Input */}
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Not girin..."
              multiline
              numberOfLines={4}
              className="border border-gray-300 rounded-lg p-3 text-gray-900 mb-4"
              style={{ minHeight: 100, textAlignVertical: "top" }}
            />

            {/* Action Buttons */}
            <View className="flex-row" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => setNoteModalVisible(false)}
                className="flex-1 py-3 rounded-lg items-center"
                style={{ backgroundColor: "#F3F4F6" }}
              >
                <Typography className="text-gray-700 font-medium">İptal</Typography>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveNote}
                className="flex-1 py-3 rounded-lg items-center"
                style={{ backgroundColor: "#DC2626" }}
                disabled={updateVisitMutation.isPending}
              >
                {updateVisitMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Typography className="text-white font-medium">Kaydet</Typography>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </RNModal>
    </View>
  );
}
