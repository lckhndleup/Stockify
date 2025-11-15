// app/reports/lib/TotalsCard.tsx
import React from "react";
import { View } from "react-native";
import { Card, Typography, Icon } from "@/src/components/ui";
import type { ReportTotals } from "@/src/types/report";
import { formatCurrency } from "@/src/types/report";

interface TotalsCardProps {
  totals: ReportTotals;
}

export const TotalsCard: React.FC<TotalsCardProps> = ({ totals }) => {
  const isProfitable = totals.profitOrLoss >= 0;

  return (
    <Card variant="filled" padding="md" className="bg-red-50">
      <View className="gap-3">
        <Typography variant="h4" weight="bold" className="text-gray-900 mb-2">
          Genel Toplam
        </Typography>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Icon family="MaterialIcons" name="trending-up" size={20} color="#16A34A" />
            <Typography variant="body" className="text-gray-600">
              Toplam Satış
            </Typography>
          </View>
          <Typography variant="body" weight="bold" className="text-green-600">
            {formatCurrency(totals.totalSalesAmount)}
          </Typography>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Icon family="MaterialIcons" name="account-balance-wallet" size={20} color="#2563EB" />
            <Typography variant="body" className="text-gray-600">
              Toplam Tahsilat
            </Typography>
          </View>
          <Typography variant="body" weight="bold" className="text-blue-600">
            {formatCurrency(totals.totalPaymentAmount)}
          </Typography>
        </View>

        <View
          className={`flex-row items-center justify-between p-3 rounded-lg ${
            isProfitable ? "bg-green-100" : "bg-red-100"
          }`}
        >
          <View className="flex-row items-center gap-2">
            <Icon
              family="MaterialIcons"
              name={isProfitable ? "trending-up" : "trending-down"}
              size={20}
              color={isProfitable ? "#16A34A" : "#DC2626"}
            />
            <Typography variant="body" weight="semibold" className="text-gray-700">
              {isProfitable ? "Kar" : "Zarar"}
            </Typography>
          </View>
          <Typography
            variant="h4"
            weight="bold"
            className={isProfitable ? "text-green-700" : "text-red-700"}
          >
            {formatCurrency(Math.abs(totals.profitOrLoss))}
          </Typography>
        </View>
      </View>
    </Card>
  );
};
