// app/broker/sections/statementSection.tsx
import React, { useState, useMemo, useEffect } from "react";
import { View, ScrollView, TouchableOpacity, FlatList, TextInput } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Container,
  Typography,
  Card,
  Button,
  Loading,
  Toast,
  DocumentModal,
} from "@/src/components/ui";
import { useToast } from "@/src/hooks/useToast";
import { useTransactions } from "@/src/hooks/api/useTransactions";
import { useActiveBrokers } from "@/src/hooks/api/useBrokers";
import type { TransactionItem } from "@/src/services/transaction/type";
import apiService from "@/src/services/api";

// Tab types
type TabType = "bilgiler" | "hareketler" | "ozet";

// Date range presets
const DATE_RANGES = {
  TODAY: "today",
  WEEK: "week",
  MONTH: "month",
  THREE_MONTHS: "threeMonths",
  ALL: "all",
} as const;

const DATE_RANGE_LABELS = {
  [DATE_RANGES.TODAY]: "Bugün",
  [DATE_RANGES.WEEK]: "Son 7 Gün",
  [DATE_RANGES.MONTH]: "Son 30 Gün",
  [DATE_RANGES.THREE_MONTHS]: "Son 3 Ay",
  [DATE_RANGES.ALL]: "Tümü",
} as const;

export default function StatementSection() {
  const { brokerId } = useLocalSearchParams();
  const { toast, showSuccess, showError, hideToast } = useToast();

  // State
  const [activeTab, setActiveTab] = useState<TabType>("hareketler");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRange, setSelectedRange] = useState<string>(DATE_RANGES.MONTH);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPageNum, setCurrentPageNum] = useState(0);
  const [allTransactions, setAllTransactions] = useState<TransactionItem[]>([]);

  // Document Modal State
  const [documentModalVisible, setDocumentModalVisible] = useState(false);
  const [currentDocumentUrl, setCurrentDocumentUrl] = useState("");
  const [currentDocumentTitle, setCurrentDocumentTitle] = useState("");

  // Get date range timestamps
  const { startDate, endDate } = useMemo(() => {
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (selectedRange) {
      case DATE_RANGES.TODAY:
        return { startDate: today.getTime(), endDate: now };
      case DATE_RANGES.WEEK:
        return { startDate: now - 7 * 24 * 60 * 60 * 1000, endDate: now };
      case DATE_RANGES.MONTH:
        return { startDate: now - 30 * 24 * 60 * 60 * 1000, endDate: now };
      case DATE_RANGES.THREE_MONTHS:
        return { startDate: now - 90 * 24 * 60 * 60 * 1000, endDate: now };
      case DATE_RANGES.ALL:
        return { startDate: 0, endDate: now };
      default:
        return { startDate: now - 30 * 24 * 60 * 60 * 1000, endDate: now };
    }
  }, [selectedRange]);

  // Fetch data
  const { data: brokers = [], isLoading: brokersLoading } = useActiveBrokers();

  const {
    data: transactionData,
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch,
  } = useTransactions({
    brokerId: Number(brokerId),
    startDate,
    endDate,
    page: currentPageNum,
    size: 20,
  });

  // Get broker info
  const broker = brokers.find((b) => String(b.id) === brokerId);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const transactions: TransactionItem[] = transactionData?.content ?? [];
  const totalPages = transactionData?.totalPages || 0;
  const currentPage = transactionData?.number || 0;

  // Update allTransactions when new data arrives
  useEffect(() => {
    if (transactionData?.content) {
      if (currentPageNum === 0) {
        // First page or refresh - replace all
        setAllTransactions(transactionData.content);
      } else {
        // Pagination - append to existing
        setAllTransactions((prev) => [...prev, ...transactionData.content]);
      }
    }
  }, [transactionData, currentPageNum]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPageNum(0);
    setAllTransactions([]);
  }, [selectedRange, brokerId]);

  // Filter transactions based on search
  const filteredTransactions = useMemo(() => {
    const dataToFilter = allTransactions.length > 0 ? allTransactions : transactions;
    if (!searchQuery.trim()) return dataToFilter;

    const query = searchQuery.toLowerCase();
    return dataToFilter.filter((item) => {
      const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
      const price = item.price.toString();
      const balance = item.balance.toString();
      const paymentType = item.paymentType?.toLowerCase() || "";
      const type = item.type.toLowerCase();

      return (
        fullName.includes(query) ||
        price.includes(query) ||
        balance.includes(query) ||
        paymentType.includes(query) ||
        type.includes(query)
      );
    });
  }, [allTransactions, transactions, searchQuery]);

  // Calculate summary
  const summary = useMemo(() => {
    const dataToSummarize = allTransactions.length > 0 ? allTransactions : transactions;
    const sales = dataToSummarize.filter((t) => t.type === "SALE");
    const payments = dataToSummarize.filter((t) => t.type === "PAYMENT");

    const totalSales = sales.reduce((sum, t) => sum + t.price, 0);
    const totalPayments = payments.reduce((sum, t) => sum + t.price, 0);

    return {
      totalSales,
      totalPayments,
      salesCount: sales.length,
      paymentsCount: payments.length,
      netBalance: totalSales - totalPayments,
    };
  }, [allTransactions, transactions]);

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle document open
  const handleDownload = (url: string, timestamp: number) => {
    if (!url) {
      showError("İndirilecek belge bulunamadı.");
      return;
    }

    const docTitle = `Hesap Özeti - ${formatDate(timestamp)}`;
    setCurrentDocumentUrl(url);
    setCurrentDocumentTitle(docTitle);
    setDocumentModalVisible(true);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setCurrentPageNum(0);
    setAllTransactions([]);
    await refetch();
    setRefreshing(false);
  };

  // Handle load more (pagination)
  const handleLoadMore = () => {
    if (loadingMore || currentPage >= totalPages - 1 || transactionsLoading) return;

    setLoadingMore(true);
    setCurrentPageNum((prev) => prev + 1);

    // Loading state will be reset by useEffect when new data arrives
    setTimeout(() => {
      setLoadingMore(false);
    }, 500);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Render transaction item
  const renderTransactionItem = ({ item }: { item: TransactionItem }) => {
    const isSale = item.type === "SALE";
    const hasDocument =
      item.downloadDocumentUrl &&
      item.downloadDocumentUrl.length > 0 &&
      item.downloadDocumentUrl.startsWith("http");
    const hasInvoice =
      item.downloadInvoiceUrl &&
      item.downloadInvoiceUrl.length > 0 &&
      item.downloadInvoiceUrl.startsWith("http");

    return (
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        {/* Main Row */}
        <View className="flex-row items-center justify-between">
          {/* Date */}
          <View className="flex-1">
            <Typography variant="caption" className="text-gray-600" style={{ fontSize: 13 }}>
              {formatDate(item.createdDate).split(" ")[0]}
            </Typography>
          </View>

          {/* Amount */}
          <View className="flex-1 items-center">
            <Typography
              variant="body"
              weight="semibold"
              className={isSale ? "text-red-600" : "text-green-600"}
              style={{ fontSize: 15, textAlign: "center" }}
            >
              {isSale ? "- " : "+ "}
              {formatCurrency(item.price)}
            </Typography>
          </View>

          {/* Balance and Icons Group - Right Aligned */}
          <View className="flex-1 flex-row items-center justify-end gap-2">
            {/* Balance */}
            <Typography
              variant="body"
              weight="medium"
              className="text-gray-900"
              style={{ fontSize: 15 }}
            >
              {formatCurrency(item.balance)}
            </Typography>

            {/* Document Icons */}
            <View className="flex-row items-center gap-1">
              {/* Receipt/Fiş Icon */}
              {hasDocument && (
                <TouchableOpacity
                  onPress={() => handleDownload(item.downloadDocumentUrl, item.createdDate)}
                  className="p-1"
                  activeOpacity={0.7}
                >
                  <Ionicons name="receipt-outline" size={20} color="#E3001B" />
                </TouchableOpacity>
              )}

              {/* Invoice/Fatura Icon */}
              {hasInvoice && (
                <TouchableOpacity
                  onPress={() => handleDownload(item.downloadInvoiceUrl, item.createdDate)}
                  className="p-1"
                  activeOpacity={0.7}
                >
                  <Ionicons name="document-text" size={20} color="#222222" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Additional Info Row */}
        <View className="flex-row items-center justify-between mt-2">
          {/* Customer Name */}
          <View className="flex-1">
            <Typography variant="caption" className="text-gray-500" style={{ fontSize: 12 }}>
              {item.firstName} {item.lastName}
            </Typography>
          </View>

          {/* Payment Type - Only show for payments */}
          <View className="flex-1 items-center">
            {!isSale && item.paymentType && (
              <View className="px-2 py-1 rounded" style={{ backgroundColor: "#E5E7EB" }}>
                <Typography variant="caption" className="text-gray-700" style={{ fontSize: 11 }}>
                  {item.paymentType === "CASH"
                    ? "Nakit"
                    : item.paymentType === "CARD"
                      ? "Kart"
                      : item.paymentType === "CREDIT_CARD"
                        ? "Kredi Kartı"
                        : item.paymentType === "BANK_TRANSFER"
                          ? "Havale"
                          : item.paymentType === "CHECK"
                            ? "Çek"
                            : item.paymentType}
                </Typography>
              </View>
            )}
          </View>

          {/* Invoice Status */}
          <View className="flex-1 flex-row justify-end">
            {item.requestedInvoice && (
              <View className="bg-green-50 px-2 py-1 rounded">
                <Typography variant="caption" className="text-green-700" style={{ fontSize: 11 }}>
                  Faturalı
                </Typography>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Loading state
  if (brokersLoading || (transactionsLoading && currentPageNum === 0 && !refreshing)) {
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <View className="items-center justify-center flex-1">
          <Loading size="large" />
          <Typography variant="body" className="text-stock-text mt-4">
            Hesap özeti yükleniyor...
          </Typography>
        </View>
      </Container>
    );
  }

  // Broker not found
  if (!broker) {
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <View className="items-center justify-center flex-1">
          <Typography variant="body" className="text-stock-text">
            Aracı bulunamadı...
          </Typography>
        </View>
      </Container>
    );
  }

  return (
    <Container className="bg-[#F8F9FA]" padding="none" safeTop={false}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      {/* Modern Header with Tabs */}
      <View className="bg-white px-4 pt-5 pb-3">
        {/* Tabs - Modern Pill Style */}
        <View
          className="flex-row p-1"
          style={{
            backgroundColor: "#F4F7FB",
            borderRadius: 12,
            gap: 6,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("bilgiler")}
            className="flex-1 py-3 items-center justify-center"
            style={{
              backgroundColor: activeTab === "bilgiler" ? "#222222" : "transparent",
              borderRadius: 10,
            }}
            activeOpacity={0.8}
          >
            <Typography
              variant="body"
              weight="semibold"
              style={{
                color: activeTab === "bilgiler" ? "#FFFEFF" : "#73767A",
                fontSize: 14,
              }}
            >
              Bilgiler
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("hareketler")}
            className="flex-1 py-3 items-center justify-center"
            style={{
              backgroundColor: activeTab === "hareketler" ? "#222222" : "transparent",
              borderRadius: 10,
            }}
            activeOpacity={0.8}
          >
            <Typography
              variant="body"
              weight="semibold"
              style={{
                color: activeTab === "hareketler" ? "#FFFEFF" : "#73767A",
                fontSize: 14,
              }}
            >
              Hareketler
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("ozet")}
            className="flex-1 py-3 items-center justify-center"
            style={{
              backgroundColor: activeTab === "ozet" ? "#222222" : "transparent",
              borderRadius: 10,
            }}
            activeOpacity={0.8}
          >
            <Typography
              variant="body"
              weight="semibold"
              style={{
                color: activeTab === "ozet" ? "#FFFEFF" : "#73767A",
                fontSize: 14,
              }}
            >
              Özet
            </Typography>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {brokersLoading || (transactionsLoading && currentPageNum === 0 && !refreshing) ? (
        <View className="items-center justify-center flex-1">
          <Loading size="large" />
          <Typography variant="body" className="text-gray-600 mt-4">
            Yükleniyor...
          </Typography>
        </View>
      ) : !broker ? (
        <View className="items-center justify-center flex-1">
          <View className="p-6 rounded-3xl" style={{ backgroundColor: "#222222" }}>
            <Typography variant="body" className="text-white text-center">
              Aracı bulunamadı
            </Typography>
          </View>
        </View>
      ) : (
        <>
          {/* Bilgiler Tab */}
          {activeTab === "bilgiler" && (
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 16, gap: 16 }}
            >
              {/* Broker Info Card - Modern Design */}
              <View
                className="p-6 rounded-3xl"
                style={{
                  backgroundColor: "#222222",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 5,
                }}
              >
                <View className="items-center mb-6">
                  <View
                    className="w-20 h-20 rounded-full items-center justify-center mb-4"
                    style={{ backgroundColor: "#E3001B" }}
                  >
                    <Typography variant="h1" weight="bold" className="text-white">
                      {broker.name[0]}
                      {broker.surname[0]}
                    </Typography>
                  </View>
                  <Typography variant="h3" weight="bold" className="text-white text-center">
                    {broker.name} {broker.surname}
                  </Typography>
                </View>

                <View className="rounded-2xl p-4 mb-3" style={{ backgroundColor: "#2A2A2A" }}>
                  <Typography variant="caption" className="text-gray-400 mb-1">
                    İndirim Oranı
                  </Typography>
                  <Typography variant="h3" weight="bold" className="text-white">
                    %{broker.discountRate || 0}
                  </Typography>
                </View>

                <View className="rounded-2xl p-4" style={{ backgroundColor: "#2A2A2A" }}>
                  <Typography variant="caption" className="text-gray-400 mb-2">
                    Güncel Bakiye
                  </Typography>
                  <Typography
                    variant="h1"
                    weight="bold"
                    style={{
                      color: broker.balance >= 0 ? "#E3001B" : "#22c55e",
                    }}
                  >
                    {broker.balance >= 0 ? "" : "-"}
                    {formatCurrency(Math.abs(broker.balance))}
                  </Typography>
                </View>
              </View>

              {/* Quick Stats */}
              <View className="flex-row gap-3">
                <View
                  className="flex-1 p-4 rounded-2xl"
                  style={{
                    backgroundColor: "#fff",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <Ionicons name="trending-up" size={24} color="#E3001B" />
                  <Typography variant="h3" weight="bold" className="text-gray-900 mt-2">
                    {summary.salesCount}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500 mt-1">
                    Satış
                  </Typography>
                </View>

                <View
                  className="flex-1 p-4 rounded-2xl"
                  style={{
                    backgroundColor: "#fff",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <Ionicons name="cash" size={24} color="#22c55e" />
                  <Typography variant="h3" weight="bold" className="text-gray-900 mt-2">
                    {summary.paymentsCount}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500 mt-1">
                    Tahsilat
                  </Typography>
                </View>
              </View>
            </ScrollView>
          )}

          {/* Hareketler Tab */}
          {activeTab === "hareketler" && (
            <View className="flex-1">
              {/* Search and Filter Bar - Modern */}
              <View className="bg-white px-4 py-3">
                <View className="flex-row items-center gap-2">
                  {/* Search Input */}
                  <View
                    className="flex-1 flex-row items-center px-4 py-3 rounded-2xl"
                    style={{ backgroundColor: "#F4F7FB" }}
                  >
                    <Ionicons name="search" size={20} color="#73767A" />
                    <TextInput
                      placeholder="Ara..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      className="flex-1 ml-2 text-base"
                      placeholderTextColor="#73767A"
                      style={{ color: "#1e293b" }}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery("")}>
                        <Ionicons name="close-circle" size={20} color="#73767A" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Filter Button */}
                  <TouchableOpacity
                    onPress={() => setShowFilters(!showFilters)}
                    className="rounded-2xl items-center justify-center"
                    style={{
                      backgroundColor: showFilters ? "#E3001B" : "#222222",
                      width: 48,
                      height: 48,
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="options" size={22} color="#FFFEFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Date Range Filters - Modern Horizontal Scroll */}
              {showFilters && (
                <View className="bg-white px-4 pb-3">
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {Object.entries(DATE_RANGE_LABELS).map(([key, label]) => {
                      const isSelected = selectedRange === key;
                      return (
                        <TouchableOpacity
                          key={key}
                          onPress={() => setSelectedRange(key)}
                          className="px-5 py-2.5 rounded-full"
                          style={{
                            backgroundColor: isSelected ? "#222222" : "#F4F7FB",
                          }}
                          activeOpacity={0.8}
                        >
                          <Typography
                            variant="body"
                            weight={isSelected ? "semibold" : "medium"}
                            style={{
                              color: isSelected ? "#FFFEFF" : "#73767A",
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

              {/* Error State */}
              {transactionsError && (
                <View className="p-4">
                  <Card variant="default" padding="md" className="bg-red-50 border border-red-200">
                    <Typography variant="body" className="text-red-600 text-center" weight="medium">
                      ⚠️ Veriler yüklenirken hata oluştu
                    </Typography>
                    <Button variant="outline" size="sm" onPress={() => refetch()} className="mt-3">
                      <Typography variant="caption" weight="medium">
                        Tekrar Dene
                      </Typography>
                    </Button>
                  </Card>
                </View>
              )}

              {/* Transactions Header - Sticky */}
              <View className="flex-row bg-gray-50 px-4 py-3 border-b border-gray-200 items-center justify-between">
                <View className="flex-1">
                  <Typography variant="caption" weight="bold" className="text-gray-700">
                    Tarih
                  </Typography>
                </View>
                <View className="flex-1 items-center">
                  <Typography
                    variant="caption"
                    weight="bold"
                    className="text-gray-700"
                    style={{ textAlign: "center" }}
                  >
                    Tutar
                  </Typography>
                </View>
                <View className="flex-1 flex-row items-center justify-end">
                  <Typography variant="caption" weight="bold" className="text-gray-700">
                    Bakiye
                  </Typography>
                </View>
              </View>

              {/* Transactions List - Scrollable */}
              {filteredTransactions.length === 0 ? (
                <View className="flex-1 p-8 items-center justify-center">
                  <Typography variant="body" className="text-gray-500 text-center">
                    {searchQuery
                      ? "Arama sonucu bulunamadı"
                      : "Bu tarih aralığında işlem bulunmamaktadır"}
                  </Typography>
                </View>
              ) : (
                <FlatList
                  data={filteredTransactions}
                  renderItem={renderTransactionItem}
                  keyExtractor={(item, index) => `${item.createdDate}-${index}`}
                  scrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  ItemSeparatorComponent={() => null}
                  contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }}
                  // Pull to refresh
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  // Pagination
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={() => {
                    if (loadingMore && currentPage < totalPages - 1) {
                      return (
                        <View className="py-6 items-center bg-white border-t border-gray-200">
                          <Loading size="small" />
                          <Typography variant="body" weight="medium" className="text-gray-700 mt-3">
                            Daha fazla yükleniyor...
                          </Typography>
                        </View>
                      );
                    }
                    return null;
                  }}
                />
              )}

              {/* Fixed Export Button at Bottom */}
              <View
                className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="bg-stock-red"
                  onPress={() => showSuccess("Ekstre gönderme özelliği yakında eklenecek")}
                >
                  <Typography className="text-white" weight="bold">
                    Ekstre Gönder
                  </Typography>
                </Button>
              </View>
            </View>
          )}

          {/* Özet Tab */}
          {activeTab === "ozet" && (
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 16, gap: 16 }}
            >
              {/* Summary Header Card */}
              <View
                className="p-6 rounded-3xl"
                style={{
                  backgroundColor: "#222222",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 5,
                }}
              >
                <Typography variant="caption" className="text-gray-400 mb-2">
                  Net Bakiye
                </Typography>
                <Typography
                  variant="h1"
                  weight="bold"
                  style={{
                    color: summary.netBalance >= 0 ? "#E3001B" : "#22c55e",
                    fontSize: 36,
                  }}
                >
                  {summary.netBalance >= 0 ? "" : "-"}
                  {formatCurrency(Math.abs(summary.netBalance))}
                </Typography>

                <View className="flex-row mt-6 gap-3">
                  <View className="flex-1 rounded-2xl p-3" style={{ backgroundColor: "#2A2A2A" }}>
                    <Ionicons name="arrow-down-circle" size={24} color="#E3001B" />
                    <Typography variant="body" weight="bold" className="text-white mt-2">
                      {formatCurrency(summary.totalSales)}
                    </Typography>
                    <Typography variant="caption" className="text-gray-400 mt-1">
                      Satışlar ({summary.salesCount})
                    </Typography>
                  </View>

                  <View className="flex-1 rounded-2xl p-3" style={{ backgroundColor: "#2A2A2A" }}>
                    <Ionicons name="arrow-up-circle" size={24} color="#22c55e" />
                    <Typography variant="body" weight="bold" className="text-white mt-2">
                      {formatCurrency(summary.totalPayments)}
                    </Typography>
                    <Typography variant="caption" className="text-gray-400 mt-1">
                      Tahsilatlar ({summary.paymentsCount})
                    </Typography>
                  </View>
                </View>
              </View>

              {/* Period Info Card */}
              <View
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: "#fff",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View className="p-4 flex-row items-center justify-between border-b border-gray-100">
                  <Typography variant="body" className="text-gray-600">
                    Toplam İşlem
                  </Typography>
                  <View className="px-4 py-1.5 rounded-full" style={{ backgroundColor: "#F4F7FB" }}>
                    <Typography variant="body" weight="bold" className="text-gray-900">
                      {transactionData?.totalElements || 0}
                    </Typography>
                  </View>
                </View>

                <View className="p-4 flex-row items-center justify-between border-b border-gray-100">
                  <Typography variant="body" className="text-gray-600">
                    Tarih Aralığı
                  </Typography>
                  <View className="px-4 py-1.5 rounded-full" style={{ backgroundColor: "#222222" }}>
                    <Typography variant="caption" weight="semibold" className="text-white">
                      {DATE_RANGE_LABELS[selectedRange as keyof typeof DATE_RANGE_LABELS]}
                    </Typography>
                  </View>
                </View>

                {totalPages > 1 && (
                  <View className="p-4 flex-row items-center justify-between">
                    <Typography variant="body" className="text-gray-600">
                      Sayfa
                    </Typography>
                    <View
                      className="px-4 py-1.5 rounded-full"
                      style={{ backgroundColor: "#F4F7FB" }}
                    >
                      <Typography variant="body" weight="bold" className="text-gray-900">
                        {currentPage + 1} / {totalPages}
                      </Typography>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </>
      )}

      {/* Document Modal */}
      <DocumentModal
        visible={documentModalVisible}
        onClose={() => setDocumentModalVisible(false)}
        documentUrl={currentDocumentUrl}
        title={currentDocumentTitle}
        headers={apiService.getAuthHeaders()}
      />
    </Container>
  );
}
