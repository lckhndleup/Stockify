// app/reports/lib/BrokerReportCard.tsx
import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { Card, Typography, Icon } from "@/src/components/ui";
import type { DailyBrokerReport } from "@/src/types/report";
import { formatCurrency, formatDate } from "@/src/types/report";

interface BrokerReportCardProps {
  report: DailyBrokerReport;
}

export const BrokerReportCard: React.FC<BrokerReportCardProps> = ({ report }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isProfitable = report.profitOrLoss >= 0;

  return (
    <Card variant="elevated" padding="none">
      <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} activeOpacity={0.7}>
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="bg-red-600 rounded-full w-10 h-10 items-center justify-center">
                <Typography variant="body" weight="bold" className="text-white">
                  {report.orderNo}
                </Typography>
              </View>
              <View className="flex-1">
                <Typography variant="body" weight="bold" className="text-gray-900">
                  {report.brokerFullName}
                </Typography>
                <Typography variant="caption" className="text-gray-500">
                  {report.dailyDetails.length} günlük veri
                </Typography>
              </View>
            </View>
            <Icon
              family="MaterialIcons"
              name={isExpanded ? "expand-less" : "expand-more"}
              size={24}
              color="#6B7280"
            />
          </View>

          {/* Summary Stats */}
          <View className="gap-2 bg-gray-50 rounded-lg p-3">
            <View className="flex-row items-center justify-between">
              <Typography variant="caption" className="text-gray-600">
                Satış
              </Typography>
              <Typography variant="body" weight="semibold" className="text-green-600">
                {formatCurrency(report.totalSalesAmount)}
              </Typography>
            </View>

            <View className="flex-row items-center justify-between">
              <Typography variant="caption" className="text-gray-600">
                Tahsilat
              </Typography>
              <Typography variant="body" weight="semibold" className="text-blue-600">
                {formatCurrency(report.totalPaymentAmount)}
              </Typography>
            </View>

            <View className="flex-row items-center justify-between">
              <Typography variant="caption" className="text-gray-600">
                {isProfitable ? "Kar" : "Zarar"}
              </Typography>
              <Typography
                variant="body"
                weight="bold"
                className={isProfitable ? "text-green-600" : "text-red-600"}
              >
                {formatCurrency(Math.abs(report.profitOrLoss))}
              </Typography>
            </View>
          </View>

          {/* Expanded Daily Details */}
          {isExpanded && report.dailyDetails.length > 0 && (
            <View className="mt-3 pt-3 border-t border-gray-200">
              <Typography variant="caption" weight="semibold" className="text-gray-700 mb-2">
                Günlük Detaylar
              </Typography>
              {report.dailyDetails.map((detail, index) => {
                const detailIsProfitable = detail.profitOrLoss >= 0;
                return (
                  <View
                    key={index}
                    className="flex-row items-center justify-between py-2 border-b border-gray-100"
                  >
                    <View className="flex-1">
                      <Typography variant="caption" className="text-gray-600">
                        {formatDate(detail.date)}
                      </Typography>
                      {detail.visitInfo && (
                        <View className="flex-row items-center gap-1 mt-1">
                          <Icon
                            family="MaterialIcons"
                            name={
                              detail.visitInfo.status === "VISITED"
                                ? "check-circle"
                                : detail.visitInfo.status === "SKIPPED"
                                  ? "block"
                                  : "schedule"
                            }
                            size={12}
                            color={
                              detail.visitInfo.status === "VISITED"
                                ? "#16A34A"
                                : detail.visitInfo.status === "SKIPPED"
                                  ? "#6B7280"
                                  : "#F97316"
                            }
                          />
                          <Typography variant="caption" className="text-gray-500 text-xs">
                            {detail.visitInfo.status === "VISITED"
                              ? "Ziyaret edildi"
                              : detail.visitInfo.status === "SKIPPED"
                                ? "Atlandı"
                                : "Bekliyor"}
                          </Typography>
                        </View>
                      )}
                    </View>
                    <View className="items-end">
                      <Typography
                        variant="caption"
                        weight="semibold"
                        className={detailIsProfitable ? "text-green-600" : "text-red-600"}
                      >
                        {formatCurrency(Math.abs(detail.profitOrLoss))}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500 text-xs">
                        S: {formatCurrency(detail.salesAmount)}
                      </Typography>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Card>
  );
};
