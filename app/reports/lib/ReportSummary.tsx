// app/reports/lib/ReportSummary.tsx
import React from "react";
import { View } from "react-native";
import { Card, Typography, Icon } from "@/src/components/ui";
import type { DailyReportResponse } from "@/src/types/report";

interface ReportSummaryProps {
  data: DailyReportResponse;
}

export const ReportSummary: React.FC<ReportSummaryProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`;
  };

  return (
    <View className="gap-3">
      <Typography variant="h4" weight="bold" className="text-gray-900">
        Genel Özet
      </Typography>

      <View className="flex-row gap-3">
        {/* Total Sales */}
        <Card variant="filled" padding="md" className="flex-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Typography variant="caption" className="text-gray-500 mb-1">
                Toplam Satış
              </Typography>
              <Typography variant="h4" weight="bold" className="text-green-600">
                {formatCurrency(data.totals.totalSalesAmount)}
              </Typography>
            </View>
            <View className="bg-green-100 rounded-full p-2">
              <Icon family="MaterialIcons" name="trending-up" size={20} color="#16A34A" />
            </View>
          </View>
        </Card>

        {/* Total Collection */}
        <Card variant="filled" padding="md" className="flex-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Typography variant="caption" className="text-gray-500 mb-1">
                Toplam Tahsilat
              </Typography>
              <Typography variant="h4" weight="bold" className="text-blue-600">
                {formatCurrency(data.totals.totalPaymentAmount)}
              </Typography>
            </View>
            <View className="bg-blue-100 rounded-full p-2">
              <Icon
                family="MaterialIcons"
                name="account-balance-wallet"
                size={20}
                color="#2563EB"
              />
            </View>
          </View>
        </Card>
      </View>

      <View className="flex-row gap-3">
        {/* Profit/Loss */}
        <Card variant="filled" padding="md" className="flex-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Typography variant="caption" className="text-gray-500 mb-1">
                Kar/Zarar
              </Typography>
              <Typography
                variant="h4"
                weight="bold"
                className={data.totals.profitOrLoss >= 0 ? "text-green-600" : "text-red-600"}
              >
                {formatCurrency(Math.abs(data.totals.profitOrLoss))}
              </Typography>
            </View>
            <View
              className={
                data.totals.profitOrLoss >= 0
                  ? "bg-green-100 rounded-full p-2"
                  : "bg-red-100 rounded-full p-2"
              }
            >
              <Icon
                family="MaterialIcons"
                name={data.totals.profitOrLoss >= 0 ? "trending-up" : "trending-down"}
                size={20}
                color={data.totals.profitOrLoss >= 0 ? "#16A34A" : "#DC2626"}
              />
            </View>
          </View>
        </Card>

        {/* Total Brokers */}
        <Card variant="filled" padding="md" className="flex-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Typography variant="caption" className="text-gray-500 mb-1">
                Toplam Bayi
              </Typography>
              <Typography variant="h4" weight="bold" className="text-gray-900">
                {data.dailyBrokerReports.length}
              </Typography>
            </View>
            <View className="bg-gray-200 rounded-full p-2">
              <Icon family="MaterialIcons" name="receipt" size={20} color="#374151" />
            </View>
          </View>
        </Card>
      </View>
    </View>
  );
};
