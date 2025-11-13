// app/reports/lib/DailySummaryCard.tsx
import React from "react";
import { View } from "react-native";
import { Card, Typography, Icon } from "@/src/components/ui";
import type { DailySummaryReport } from "@/src/types/report";
import { formatCurrency, formatShortDate } from "@/src/types/report";

interface DailySummaryCardProps {
  reports: DailySummaryReport[];
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({ reports }) => {
  if (reports.length === 0) return null;

  return (
    <Card variant="elevated" padding="md">
      <View className="gap-3">
        <Typography variant="h4" weight="bold" className="text-gray-900 mb-1">
          Günlük Özet
        </Typography>

        {reports.map((report, index) => {
          const isProfitable = report.profitOrLoss >= 0;

          return (
            <View
              key={index}
              className={`p-3 rounded-lg border ${index < reports.length - 1 ? "mb-2" : ""} ${
                isProfitable ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Typography variant="body" weight="semibold" className="text-gray-800">
                  {formatShortDate(report.date)}
                </Typography>
                <View className="flex-row items-center gap-1">
                  <Icon
                    family="MaterialIcons"
                    name={isProfitable ? "trending-up" : "trending-down"}
                    size={16}
                    color={isProfitable ? "#16A34A" : "#DC2626"}
                  />
                  <Typography
                    variant="body"
                    weight="bold"
                    className={isProfitable ? "text-green-700" : "text-red-700"}
                  >
                    {formatCurrency(Math.abs(report.profitOrLoss))}
                  </Typography>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Typography variant="caption" className="text-gray-600">
                    Satış
                  </Typography>
                  <Typography variant="body" weight="semibold" className="text-green-600">
                    {formatCurrency(report.totalSalesAmount)}
                  </Typography>
                </View>

                <View className="flex-1 items-end">
                  <Typography variant="caption" className="text-gray-600">
                    Tahsilat
                  </Typography>
                  <Typography variant="body" weight="semibold" className="text-blue-600">
                    {formatCurrency(report.totalPaymentAmount)}
                  </Typography>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
};
