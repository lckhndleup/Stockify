// app/broker/sections/statementSection.tsx
import React, { useState, useMemo } from "react";
import { View, ScrollView, TouchableOpacity, FlatList, TextInput, Modal } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { Container, Typography, Card, Button, Loading, Toast, Divider } from "@/src/components/ui";
import { useToast } from "@/src/hooks/useToast";
import { useTransactions } from "@/src/hooks/api/useTransactions";
import { useActiveBrokers } from "@/src/hooks/api/useBrokers";
import type { TransactionItem } from "@/src/services/transaction/type";
import apiService from "@/src/services/api";
import { Paths, File } from "expo-file-system";
import * as Sharing from "expo-sharing";

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
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [currentPdfUri, setCurrentPdfUri] = useState<string | null>(null);

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
  });

  // Get broker info
  const broker = brokers.find((b) => String(b.id) === brokerId);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const transactions: TransactionItem[] = transactionData?.content ?? [];
  const totalPages = transactionData?.totalPages || 0;
  const currentPage = transactionData?.number || 0;

  // Filter transactions based on search
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;

    const query = searchQuery.toLowerCase();
    return transactions.filter((item) => {
      const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
      const price = item.price.toString();
      const balance = item.balance.toString();

      return fullName.includes(query) || price.includes(query) || balance.includes(query);
    });
  }, [transactions, searchQuery]);

  // Calculate summary
  const summary = useMemo(() => {
    const sales = transactions.filter((t) => t.type === "SALE");
    const payments = transactions.filter((t) => t.type === "PAYMENT");

    const totalSales = sales.reduce((sum, t) => sum + t.price, 0);
    const totalPayments = payments.reduce((sum, t) => sum + t.price, 0);

    return {
      totalSales,
      totalPayments,
      salesCount: sales.length,
      paymentsCount: payments.length,
      netBalance: totalSales - totalPayments,
    };
  }, [transactions]);

  // Handle authenticated document download and share/save
  const handleDownload = async (url: string, timestamp: number) => {
    const docId = `${timestamp}`;
    setDownloadingDocId(docId);

    try {
      showSuccess("Belge indiriliyor...");

      // Use the provided URL from backend
      const downloadUrl = url;

      // Create file reference using new API
      const fileName = `hesap_ozeti_${timestamp}.pdf`;
      const file = new File(Paths.document, fileName);

      // Get auth headers
      const headers = apiService.getAuthHeaders();

      // Download using fetch with auth
      const response = await fetch(downloadUrl, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw {
          status: response.status,
          message: "Belge indirilemedi",
        };
      }

      // Get blob and write to file
      const blob = await response.blob();

      // Use FileReader to convert blob to arrayBuffer in React Native
      const reader = new FileReader();
      reader.readAsArrayBuffer(blob);

      await new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const arrayBuffer = reader.result as ArrayBuffer;
            const uint8Array = new Uint8Array(arrayBuffer);
            await file.write(uint8Array);
            resolve(true);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
      });

      // Directly open in viewer without alert
      try {
        hideToast();

        // Read file bytes and convert to base64
        const bytes = await file.bytes();
        const base64 = btoa(String.fromCharCode(...bytes));

        setPdfBase64(base64);
        setCurrentPdfUri(file.uri);
        setPdfModalVisible(true);
      } catch (error) {
        console.error("Base64 conversion error:", error);
        showError("Belge açılamadı");
      }
    } catch (error: any) {
      console.error("❌ Download error:", error);
      if (error?.status === 401) {
        showError("Oturum süresi dolmuş, lütfen tekrar giriş yapın");
      } else if (error?.status === 404) {
        showError("Belge bulunamadı");
      } else if (error?.status === 403) {
        showError("Bu belgeye erişim yetkiniz yok");
      } else {
        showError(error?.message || "İndirme başarısız oldu");
      }
    } finally {
      setDownloadingDocId(null);
    }
  }; // Format date
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
    const hasDocument = item.downloadUrl && item.downloadUrl.length > 0;

    return (
      <View className="bg-white border-b border-gray-200 px-4 py-3">
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

          {/* Balance and Icon Group - Right Aligned */}
          <View className="flex-1 flex-row items-center justify-end gap-3">
            {/* Balance */}
            <Typography
              variant="body"
              weight="medium"
              className="text-gray-900"
              style={{ fontSize: 15 }}
            >
              {formatCurrency(item.balance)}
            </Typography>

            {/* Document Icon */}
            <View className="w-6 items-center">
              {hasDocument && (
                <TouchableOpacity
                  onPress={() => handleDownload(item.downloadUrl, item.createdDate)}
                  disabled={downloadingDocId === `${item.createdDate}`}
                  className="p-1"
                  style={{
                    opacity: downloadingDocId === `${item.createdDate}` ? 0.6 : 1,
                  }}
                >
                  <Ionicons name="document-text-outline" size={20} color="#7C3AED" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Loading state
  if (brokersLoading || transactionsLoading) {
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
    <Container className="bg-white" padding="none" safeTop={false}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      {/* PDF Viewer Modal - 80% Height Bottom Sheet */}
      <Modal
        visible={pdfModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setPdfModalVisible(false);
          setPdfBase64(null);
          setCurrentPdfUri(null);
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl overflow-hidden" style={{ height: "80%" }}>
            {/* Drag Handle */}
            <View className="items-center py-2">
              <View className="w-12 h-1 bg-gray-300 rounded-full" />
            </View>

            {/* Header */}
            <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-200">
              <Typography variant="h3" weight="bold" className="text-stock-dark">
                Belge Görüntüleyici
              </Typography>
              <View className="flex-row gap-3">
                {currentPdfUri && (
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        await Sharing.shareAsync(currentPdfUri, {
                          mimeType: "application/pdf",
                          dialogTitle: "Belgeyi Paylaş",
                          UTI: "com.adobe.pdf",
                        });
                        showSuccess("Paylaşıldı");
                      } catch {
                        showError("Paylaşım başarısız");
                      }
                    }}
                    className="p-2"
                  >
                    <Ionicons name="share-outline" size={24} color="#7C3AED" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    setPdfModalVisible(false);
                    setPdfBase64(null);
                    setCurrentPdfUri(null);
                  }}
                  className="p-2"
                >
                  <Ionicons name="close" size={28} color="#1a1a1a" />
                </TouchableOpacity>
              </View>
            </View>

            {/* PDF WebView with Base64 */}
            {pdfBase64 && (
              <WebView
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes">
                        <style>
                          * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                          }
                          body {
                            background-color: #525659;
                            overflow: auto;
                            touch-action: pan-x pan-y pinch-zoom;
                          }
                          iframe {
                            width: 100vw;
                            height: 100vh;
                            border: none;
                          }
                        </style>
                      </head>
                      <body>
                        <iframe src="data:application/pdf;base64,${pdfBase64}" type="application/pdf"></iframe>
                      </body>
                    </html>
                  `,
                }}
                style={{ flex: 1, backgroundColor: "#525659" }}
                startInLoadingState={true}
                renderLoading={() => (
                  <View className="absolute inset-0 items-center justify-center bg-gray-900">
                    <Loading size="large" />
                    <Typography variant="body" className="text-white mt-4">
                      PDF yükleniyor...
                    </Typography>
                  </View>
                )}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error("WebView error: ", nativeEvent);
                  showError("PDF yüklenemedi");
                }}
                allowFileAccess={true}
                allowUniversalAccessFromFileURLs={true}
                originWhitelist={["*"]}
                scalesPageToFit={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={true}
                bounces={true}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-2">
        {/* Tabs */}
        <View className="flex-row border-b border-gray-200">
          <TouchableOpacity
            onPress={() => setActiveTab("bilgiler")}
            className={`flex-1 py-3 items-center ${
              activeTab === "bilgiler" ? "border-b-2 border-purple-700" : ""
            }`}
          >
            <Typography
              variant="body"
              weight={activeTab === "bilgiler" ? "bold" : "medium"}
              className={activeTab === "bilgiler" ? "text-purple-700" : "text-gray-600"}
            >
              Bilgiler
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("hareketler")}
            className={`flex-1 py-3 items-center ${
              activeTab === "hareketler" ? "border-b-2 border-purple-700" : ""
            }`}
          >
            <Typography
              variant="body"
              weight={activeTab === "hareketler" ? "bold" : "medium"}
              className={activeTab === "hareketler" ? "text-purple-700" : "text-gray-600"}
            >
              Hareketler
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("ozet")}
            className={`flex-1 py-3 items-center ${
              activeTab === "ozet" ? "border-b-2 border-purple-700" : ""
            }`}
          >
            <Typography
              variant="body"
              weight={activeTab === "ozet" ? "bold" : "medium"}
              className={activeTab === "ozet" ? "text-purple-700" : "text-gray-600"}
            >
              Özet
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Search and Filter - Only show in Hareketler tab */}
        {activeTab === "hareketler" && (
          <View className="flex-row items-center gap-2 mt-3">
            <View className="flex-1 flex-row items-center bg-gray-50 rounded-lg px-3 py-2">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Hesap Hareketi Ara"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 ml-2 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              className="bg-purple-700 p-3 rounded-lg"
            >
              <Ionicons name="filter" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content */}
      {brokersLoading || transactionsLoading ? (
        <View className="items-center justify-center flex-1">
          <Loading size="large" />
          <Typography variant="body" className="text-stock-text mt-4">
            Yükleniyor...
          </Typography>
        </View>
      ) : !broker ? (
        <View className="items-center justify-center flex-1">
          <Typography variant="body" className="text-stock-text">
            Aracı bulunamadı...
          </Typography>
        </View>
      ) : (
        <>
          {/* Bilgiler Tab */}
          {activeTab === "bilgiler" && (
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="p-4">
                <Card variant="default" padding="lg" className="border border-gray-200">
                  <View className="mb-4">
                    <Typography variant="caption" className="text-gray-500 mb-1">
                      Aracı Adı
                    </Typography>
                    <Typography variant="h3" weight="bold" className="text-stock-dark">
                      {broker.name} {broker.surname}
                    </Typography>
                  </View>

                  <Divider className="my-4" />

                  <View className="mb-4">
                    <Typography variant="caption" className="text-gray-500 mb-1">
                      İndirim Oranı
                    </Typography>
                    <Typography variant="body" weight="semibold" className="text-stock-dark">
                      %{broker.discountRate || 0}
                    </Typography>
                  </View>

                  <Divider className="my-4" />

                  <View>
                    <Typography variant="caption" className="text-gray-500 mb-1">
                      Güncel Bakiye
                    </Typography>
                    <Typography
                      variant="h2"
                      weight="bold"
                      className={broker.balance >= 0 ? "text-red-600" : "text-green-600"}
                    >
                      {broker.balance >= 0 ? "" : "-"}
                      {formatCurrency(Math.abs(broker.balance))}
                    </Typography>
                  </View>
                </Card>
              </View>
            </ScrollView>
          )}

          {/* Hareketler Tab */}
          {activeTab === "hareketler" && (
            <View className="flex-1">
              {/* Filters */}
              {showFilters && (
                <View className="bg-gray-50 p-4 border-b border-gray-200">
                  <Typography variant="body" weight="semibold" className="mb-3">
                    Tarih Aralığı
                  </Typography>
                  <View className="flex-row flex-wrap gap-2">
                    {Object.entries(DATE_RANGE_LABELS).map(([key, label]) => (
                      <TouchableOpacity
                        key={key}
                        onPress={() => setSelectedRange(key)}
                        className={`px-4 py-2 rounded-lg ${
                          selectedRange === key
                            ? "bg-purple-700"
                            : "bg-white border border-gray-300"
                        }`}
                      >
                        <Typography
                          variant="caption"
                          weight="medium"
                          className={selectedRange === key ? "text-white" : "text-gray-700"}
                        >
                          {label}
                        </Typography>
                      </TouchableOpacity>
                    ))}
                  </View>
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
                <View className="flex-1 flex-row items-center justify-end gap-3">
                  <Typography variant="caption" weight="bold" className="text-gray-700">
                    Bakiye
                  </Typography>
                  <View className="w-6 items-center">
                    <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                  </View>
                </View>
              </View>

              {/* Transactions List - Scrollable */}
              {filteredTransactions.length === 0 ? (
                <View className="p-8 items-center">
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
                  contentContainerStyle={{ flexGrow: 1 }}
                />
              )}

              {/* Export Button */}
              <View className="p-4 bg-white border-t border-gray-200">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="bg-purple-700"
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
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="p-4 gap-4">
                {/* Summary Cards */}
                <Card variant="default" padding="lg" className="border border-gray-200">
                  <Typography variant="h4" weight="bold" className="text-gray-700 mb-4">
                    İşlem Özeti
                  </Typography>

                  <View className="flex-row justify-between items-center mb-3">
                    <Typography variant="body" className="text-gray-600">
                      Toplam Satış ({summary.salesCount} işlem)
                    </Typography>
                    <Typography variant="body" weight="bold" className="text-red-600">
                      -{formatCurrency(summary.totalSales)}
                    </Typography>
                  </View>

                  <View className="flex-row justify-between items-center mb-3">
                    <Typography variant="body" className="text-gray-600">
                      Toplam Tahsilat ({summary.paymentsCount} işlem)
                    </Typography>
                    <Typography variant="body" weight="bold" className="text-green-600">
                      +{formatCurrency(summary.totalPayments)}
                    </Typography>
                  </View>

                  <Divider className="my-3" />

                  <View className="flex-row justify-between items-center">
                    <Typography variant="body" weight="bold" className="text-gray-700">
                      Net Bakiye
                    </Typography>
                    <Typography
                      variant="h3"
                      weight="bold"
                      className={summary.netBalance >= 0 ? "text-red-600" : "text-green-600"}
                    >
                      {summary.netBalance >= 0 ? "" : "-"}
                      {formatCurrency(Math.abs(summary.netBalance))}
                    </Typography>
                  </View>
                </Card>

                <Card variant="default" padding="lg" className="border border-gray-200">
                  <Typography variant="h4" weight="bold" className="text-gray-700 mb-4">
                    Dönem Bilgileri
                  </Typography>

                  <View className="flex-row justify-between items-center mb-3">
                    <Typography variant="body" className="text-gray-600">
                      Toplam İşlem
                    </Typography>
                    <Typography variant="body" weight="bold" className="text-gray-800">
                      {transactionData?.totalElements || 0}
                    </Typography>
                  </View>

                  <View className="flex-row justify-between items-center mb-3">
                    <Typography variant="body" className="text-gray-600">
                      Tarih Aralığı
                    </Typography>
                    <Typography variant="body" weight="bold" className="text-gray-800">
                      {DATE_RANGE_LABELS[selectedRange as keyof typeof DATE_RANGE_LABELS]}
                    </Typography>
                  </View>

                  {totalPages > 1 && (
                    <View className="flex-row justify-between items-center">
                      <Typography variant="body" className="text-gray-600">
                        Sayfa
                      </Typography>
                      <Typography variant="body" weight="bold" className="text-gray-800">
                        {currentPage + 1} / {totalPages}
                      </Typography>
                    </View>
                  )}
                </Card>
              </View>
            </ScrollView>
          )}
        </>
      )}
    </Container>
  );
}
