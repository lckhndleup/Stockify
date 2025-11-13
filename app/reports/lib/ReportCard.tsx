// app/reports/lib/ReportCard.tsx
import React from "react";
import { View } from "react-native";
import { Card, Typography, Icon } from "@/src/components/ui";
import type { DailyReportItem } from "@/src/types/report";
import { router } from "expo-router";

interface ReportCardProps {
  report: DailyReportItem;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`;
  };

  const handlePress = () => {
    router.push({
      pathname: "/broker/brokerDetail",
      params: { brokerId: report.brokerId.toString() },
    });
  };

  return (
    <Card variant="elevated" padding="none" pressable onPress={handlePress}>
      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-3 flex-1">
            <View className="bg-red-100 rounded-full p-2">
              <Icon family="MaterialIcons" name="person" size={20} color="#DC2626" />
            </View>
            <View className="flex-1">
              <Typography variant="body" weight="bold" className="text-gray-900">
                {report.brokerName}
              </Typography>
              <Typography variant="caption" className="text-gray-500">
                {report.transactionCount} İşlem
              </Typography>
            </View>
          </View>
          <Icon family="MaterialIcons" name="chevron-right" size={24} color="#9CA3AF" />
        </View>

        {/* Stats */}
        <View className="gap-2 bg-gray-50 rounded-lg p-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Icon family="MaterialIcons" name="attach-money" size={16} color="#16A34A" />
              <Typography variant="caption" className="text-gray-600">
                Satış
              </Typography>
            </View>
            <Typography variant="body" weight="semibold" className="text-green-600">
              {formatCurrency(report.totalSales)}
            </Typography>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Icon
                family="MaterialIcons"
                name="account-balance-wallet"
                size={16}
                color="#2563EB"
              />
              <Typography variant="caption" className="text-gray-600">
                Tahsilat
              </Typography>
            </View>
            <Typography variant="body" weight="semibold" className="text-blue-600">
              {formatCurrency(report.totalCollection)}
            </Typography>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Icon family="MaterialIcons" name="credit-card" size={16} color="#DC2626" />
              <Typography variant="caption" className="text-gray-600">
                Borç
              </Typography>
            </View>
            <Typography variant="body" weight="semibold" className="text-red-600">
              {formatCurrency(report.totalDebt)}
            </Typography>
          </View>
        </View>
      </View>
    </Card>
  );
};
