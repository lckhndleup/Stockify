// app/reports/index.tsx
import React, { useState, useMemo } from "react";
import { View, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Container, Typography, Icon, SelectBox, Loading, SearchBar } from "@/src/components/ui";
import { useDailyReport } from "@/src/hooks/api";
import { useActiveBrokers } from "@/src/hooks/api/useBrokers";
import { formatCurrency, formatShortDate } from "@/src/types/report";

type DateFilter = "today" | "week" | "month" | "all";

export default function ReportsScreen() {
  const params = useLocalSearchParams();
  const brokerIdFromParams = params.brokerId ? Number(params.brokerId) : undefined;

  const [selectedBrokerId, setSelectedBrokerId] = useState<number | undefined>(brokerIdFromParams);
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [searchText, setSearchText] = useState("");
  const [expandedBrokers, setExpandedBrokers] = useState<Set<number>>(new Set());

  // Calculate date range based on filter
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    switch (dateFilter) {
      case "today":
        return {
          startDate: startOfDay.getTime(),
          endDate: new Date().getTime(),
        };
      case "week": {
        const weekAgo = new Date(startOfDay);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return {
          startDate: weekAgo.getTime(),
          endDate: new Date().getTime(),
        };
      }
      case "month": {
        const monthAgo = new Date(startOfDay);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return {
          startDate: monthAgo.getTime(),
          endDate: new Date().getTime(),
        };
      }
      case "all":
        return { startDate: undefined, endDate: undefined };
    }
  }, [dateFilter]);

  // Fetch brokers for selection
  const { data: brokers = [] } = useActiveBrokers();

  // Broker options for SelectBox
  const brokerOptions = useMemo(() => {
    return [
      { label: "Tüm Brokerlar", value: "" },
      ...brokers.map((broker) => ({
        label: `${broker.name} ${broker.surname}`,
        value: String(broker.id),
      })),
    ];
  }, [brokers]);

  const {
    data: reportData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useDailyReport({
    brokerId: selectedBrokerId,
    startDate,
    endDate,
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleBrokerChange = (value: string) => {
    setSelectedBrokerId(value ? Number(value) : undefined);
  };

  const toggleBrokerExpand = (brokerId: number) => {
    setExpandedBrokers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(brokerId)) {
        newSet.delete(brokerId);
      } else {
        newSet.add(brokerId);
      }
      return newSet;
    });
  };

  console.log("reportData", JSON.stringify(reportData, null, 2));

  // Filter broker reports by search
  const filteredBrokerReports = useMemo(() => {
    if (!reportData?.dailyBrokerReports) return [];
    if (!searchText.trim()) return reportData.dailyBrokerReports;

    const searchLower = searchText.toLowerCase();
    return reportData.dailyBrokerReports.filter((report) =>
      report.brokerFullName.toLowerCase().includes(searchLower),
    );
  }, [reportData, searchText]);

  if (isLoading) {
    return (
      <Container className="bg-white flex-1" padding="none" safeTop={false}>
        <View className="flex-1 justify-center items-center -mt-16">
          <Loading size="large" />
        </View>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container className="bg-white flex-1" padding="none" safeTop={false}>
        <View className="flex-1 justify-center items-center -mt-16">
          <Icon family="MaterialIcons" name="error-outline" size={64} color="#E3001B" />
          <Typography variant="h3" weight="bold" className="text-stock-red mt-4 mb-2">
            Bağlantı Hatası
          </Typography>
          <Typography variant="body" className="text-stock-text text-center mb-6">
            Rapor verileri yüklenirken bir hata oluştu.
          </Typography>
        </View>
      </Container>
    );
  }

  // Show totals in header
  const totalSales = reportData?.totals?.totalSalesAmount || 0;
  const totalPayment = reportData?.totals?.totalPaymentAmount || 0;
  const profitOrLoss = reportData?.totals?.profitOrLoss || 0;
  const isProfitable = profitOrLoss >= 0;

  return (
    <Container className="bg-white" padding="none" safeTop={false}>
      {/* Header with Search and Broker Selection */}
      <View className="px-4 pt-4 pb-3 bg-white border-b border-gray-100">
        {/* Broker Selection - only if no route param */}
        {!brokerIdFromParams && (
          <View className="mb-3">
            <SelectBox
              options={brokerOptions}
              value={selectedBrokerId ? String(selectedBrokerId) : ""}
              onSelect={handleBrokerChange}
              placeholder="Broker seçin"
            />
          </View>
        )}

        {/* Search Bar */}
        <View className="mb-3">
          <SearchBar placeholder="Broker ara..." onSearch={setSearchText} />
        </View>

        {/* Date Filters */}
        <View className="flex-row mb-3" style={{ gap: 8 }}>
          <TouchableOpacity
            onPress={() => setDateFilter("today")}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 6,
              backgroundColor: dateFilter === "today" ? "#DC2626" : "#FFFFFF",
              borderWidth: 1,
              borderColor: dateFilter === "today" ? "#DC2626" : "#E5E7EB",
            }}
          >
            <Typography
              variant="caption"
              weight="semibold"
              style={{
                color: dateFilter === "today" ? "#FFFFFF" : "#6B7280",
                fontSize: 12,
                textAlign: "center",
              }}
            >
              Bugün
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDateFilter("week")}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 6,
              backgroundColor: dateFilter === "week" ? "#DC2626" : "#FFFFFF",
              borderWidth: 1,
              borderColor: dateFilter === "week" ? "#DC2626" : "#E5E7EB",
            }}
          >
            <Typography
              variant="caption"
              weight="semibold"
              style={{
                color: dateFilter === "week" ? "#FFFFFF" : "#6B7280",
                fontSize: 12,
                textAlign: "center",
              }}
            >
              Bu Hafta
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDateFilter("month")}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 6,
              backgroundColor: dateFilter === "month" ? "#DC2626" : "#FFFFFF",
              borderWidth: 1,
              borderColor: dateFilter === "month" ? "#DC2626" : "#E5E7EB",
            }}
          >
            <Typography
              variant="caption"
              weight="semibold"
              style={{
                color: dateFilter === "month" ? "#FFFFFF" : "#6B7280",
                fontSize: 12,
                textAlign: "center",
              }}
            >
              Bu Ay
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDateFilter("all")}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 6,
              backgroundColor: dateFilter === "all" ? "#DC2626" : "#FFFFFF",
              borderWidth: 1,
              borderColor: dateFilter === "all" ? "#DC2626" : "#E5E7EB",
            }}
          >
            <Typography
              variant="caption"
              weight="semibold"
              style={{
                color: dateFilter === "all" ? "#FFFFFF" : "#6B7280",
                fontSize: 12,
                textAlign: "center",
              }}
            >
              Tümü
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Summary Totals */}
        <View
          style={{
            backgroundColor: "#F9FAFB",
            padding: 12,
            borderRadius: 8,
            flexDirection: "row",
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Typography variant="caption" style={{ color: "#6B7280", fontSize: 11 }}>
              Satış
            </Typography>
            <Typography variant="body" weight="semibold" style={{ color: "#16A34A", fontSize: 14 }}>
              {formatCurrency(totalSales)}
            </Typography>
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="caption" style={{ color: "#6B7280", fontSize: 11 }}>
              Tahsilat
            </Typography>
            <Typography variant="body" weight="semibold" style={{ color: "#2563EB", fontSize: 14 }}>
              {formatCurrency(totalPayment)}
            </Typography>
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="caption" style={{ color: "#6B7280", fontSize: 11 }}>
              {isProfitable ? "Kar" : "Zarar"}
            </Typography>
            <Typography
              variant="body"
              weight="bold"
              style={{ color: isProfitable ? "#16A34A" : "#DC2626", fontSize: 14 }}
            >
              {formatCurrency(Math.abs(profitOrLoss))}
            </Typography>
          </View>
        </View>
      </View>

      {/* Broker Reports List */}
      <FlatList
        data={filteredBrokerReports}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={["#DC2626"]}
          />
        }
        contentContainerClassName="gap-0 pb-[120]"
        renderItem={({ item }) => {
          const isExpanded = expandedBrokers.has(item.orderNo);
          const brokerProfitable = item.profitOrLoss >= 0;

          return (
            <TouchableOpacity
              onPress={() => toggleBrokerExpand(item.orderNo)}
              style={{
                backgroundColor: "#FFFFFF",
                padding: 16,
                marginBottom: 1,
                borderBottomWidth: 1,
                borderBottomColor: "#F3F4F6",
              }}
              activeOpacity={0.7}
            >
              {/* Broker Header */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {/* Order Badge */}
                <View
                  style={{
                    backgroundColor: "#DC2626",
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="body"
                    weight="bold"
                    style={{ color: "#FFFFFF", fontSize: 14 }}
                  >
                    {item.orderNo}
                  </Typography>
                </View>

                {/* Broker Info */}
                <View style={{ flex: 1 }}>
                  <Typography
                    variant="body"
                    weight="semibold"
                    style={{ fontSize: 15, color: "#111827" }}
                  >
                    {item.brokerFullName}
                  </Typography>
                  <Typography
                    variant="caption"
                    style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}
                  >
                    {item.dailyDetails.length} günlük veri
                  </Typography>
                </View>

                {/* Expand Icon */}
                <Icon
                  family="MaterialIcons"
                  name={isExpanded ? "expand-less" : "expand-more"}
                  size={24}
                  color="#6B7280"
                />
              </View>

              {/* Broker Summary */}
              <View
                style={{
                  marginTop: 12,
                  backgroundColor: "#F9FAFB",
                  padding: 10,
                  borderRadius: 6,
                  flexDirection: "row",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Typography variant="caption" style={{ color: "#6B7280", fontSize: 11 }}>
                    Satış
                  </Typography>
                  <Typography
                    variant="body"
                    weight="semibold"
                    style={{ color: "#16A34A", fontSize: 13, marginTop: 2 }}
                  >
                    {formatCurrency(item.totalSalesAmount)}
                  </Typography>
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="caption" style={{ color: "#6B7280", fontSize: 11 }}>
                    Tahsilat
                  </Typography>
                  <Typography
                    variant="body"
                    weight="semibold"
                    style={{ color: "#2563EB", fontSize: 13, marginTop: 2 }}
                  >
                    {formatCurrency(item.totalPaymentAmount)}
                  </Typography>
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="caption" style={{ color: "#6B7280", fontSize: 11 }}>
                    {brokerProfitable ? "Kar" : "Zarar"}
                  </Typography>
                  <Typography
                    variant="body"
                    weight="bold"
                    style={{
                      color: brokerProfitable ? "#16A34A" : "#DC2626",
                      fontSize: 13,
                      marginTop: 2,
                    }}
                  >
                    {formatCurrency(Math.abs(item.profitOrLoss))}
                  </Typography>
                </View>
              </View>

              {/* Expanded Daily Details */}
              {isExpanded && item.dailyDetails.length > 0 && (
                <View
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: "#F3F4F6",
                  }}
                >
                  <Typography
                    variant="caption"
                    weight="semibold"
                    style={{ color: "#6B7280", fontSize: 11, marginBottom: 8 }}
                  >
                    GÜNLÜK DETAYLAR
                  </Typography>
                  {item.dailyDetails.map((detail, index) => {
                    const detailProfitable = detail.profitOrLoss >= 0;
                    return (
                      <View
                        key={index}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingVertical: 8,
                          borderBottomWidth: index < item.dailyDetails.length - 1 ? 1 : 0,
                          borderBottomColor: "#F3F4F6",
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Typography variant="caption" style={{ color: "#6B7280", fontSize: 12 }}>
                            {formatShortDate(detail.date)}
                          </Typography>
                          {detail.visitInfo && (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 4,
                                marginTop: 2,
                              }}
                            >
                              <Icon
                                family="MaterialIcons"
                                name={
                                  detail.visitInfo.status === "VISITED"
                                    ? "check-circle"
                                    : detail.visitInfo.status === "SKIPPED"
                                      ? "block"
                                      : "schedule"
                                }
                                size={10}
                                color={
                                  detail.visitInfo.status === "VISITED"
                                    ? "#16A34A"
                                    : detail.visitInfo.status === "SKIPPED"
                                      ? "#6B7280"
                                      : "#F97316"
                                }
                              />
                              <Typography
                                variant="caption"
                                style={{ color: "#9CA3AF", fontSize: 10 }}
                              >
                                {detail.visitInfo.status === "VISITED"
                                  ? "Ziyaret"
                                  : detail.visitInfo.status === "SKIPPED"
                                    ? "Atlandı"
                                    : "Bekliyor"}
                              </Typography>
                            </View>
                          )}
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Typography
                            variant="caption"
                            weight="semibold"
                            style={{
                              color: detailProfitable ? "#16A34A" : "#DC2626",
                              fontSize: 12,
                            }}
                          >
                            {formatCurrency(Math.abs(detail.profitOrLoss))}
                          </Typography>
                          <Typography variant="caption" style={{ color: "#9CA3AF", fontSize: 10 }}>
                            S: {formatCurrency(detail.salesAmount)}
                          </Typography>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item, index) => `${item.orderNo}-${index}`}
        ListEmptyComponent={
          <View style={{ padding: 32, alignItems: "center" }}>
            <Icon family="MaterialIcons" name="inbox" size={48} color="#9CA3AF" />
            <Typography
              variant="body"
              style={{ color: "#6B7280", marginTop: 12, textAlign: "center" }}
            >
              Seçili tarih aralığında rapor bulunamadı.
            </Typography>
          </View>
        }
      />
    </Container>
  );
}
