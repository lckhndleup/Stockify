// app/broker-visits/lib/VisitStats.tsx
import React from "react";
import { View } from "react-native";
import { Card, Typography, Icon } from "@/src/components/ui";

interface VisitStatsProps {
  stats: {
    total: number;
    visited: number;
    notVisited: number;
    skipped: number;
  };
}

export const VisitStats: React.FC<VisitStatsProps> = ({ stats }) => {
  const completionRate = stats.total > 0 ? Math.round((stats.visited / stats.total) * 100) : 0;

  return (
    <View className="gap-3">
      {/* Completion Rate */}
      <Card variant="filled" padding="md" className="bg-red-50">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Typography variant="caption" className="text-gray-600 mb-1">
              Tamamlanma Oranı
            </Typography>
            <Typography variant="h2" weight="bold" className="text-red-600">
              %{completionRate}
            </Typography>
            <Typography variant="caption" className="text-gray-500 mt-1">
              {stats.visited} / {stats.total} ziyaret tamamlandı
            </Typography>
          </View>
          <View className="bg-red-600 rounded-full p-3">
            <Icon family="MaterialIcons" name="check-circle" size={32} color="#FFFFFF" />
          </View>
        </View>
      </Card>

      {/* Stats Grid */}
      <View className="flex-row gap-3">
        <Card variant="elevated" padding="md" className="flex-1">
          <View className="items-center">
            <View className="bg-green-100 rounded-full p-2 mb-2">
              <Icon family="MaterialIcons" name="check" size={20} color="#16A34A" />
            </View>
            <Typography variant="h3" weight="bold" className="text-green-600">
              {stats.visited}
            </Typography>
            <Typography variant="caption" className="text-gray-500">
              Ziyaret Edildi
            </Typography>
          </View>
        </Card>

        <Card variant="elevated" padding="md" className="flex-1">
          <View className="items-center">
            <View className="bg-orange-100 rounded-full p-2 mb-2">
              <Icon family="MaterialIcons" name="schedule" size={20} color="#F97316" />
            </View>
            <Typography variant="h3" weight="bold" className="text-orange-600">
              {stats.notVisited}
            </Typography>
            <Typography variant="caption" className="text-gray-500">
              Bekliyor
            </Typography>
          </View>
        </Card>

        <Card variant="elevated" padding="md" className="flex-1">
          <View className="items-center">
            <View className="bg-gray-200 rounded-full p-2 mb-2">
              <Icon family="MaterialIcons" name="block" size={20} color="#6B7280" />
            </View>
            <Typography variant="h3" weight="bold" className="text-gray-600">
              {stats.skipped}
            </Typography>
            <Typography variant="caption" className="text-gray-500">
              Atlandı
            </Typography>
          </View>
        </Card>
      </View>
    </View>
  );
};
