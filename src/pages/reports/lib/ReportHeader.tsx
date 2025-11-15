// app/reports/lib/ReportHeader.tsx
import React from "react";
import { View } from "react-native";
import { Typography, Icon } from "@/src/components/ui";

export const ReportHeader: React.FC = () => {
  return (
    <View className="flex-row items-center gap-3">
      <View className="bg-red-600 rounded-lg p-3">
        <Icon family="MaterialIcons" name="assessment" size={24} color="#FFFFFF" />
      </View>
      <View className="flex-1">
        <Typography variant="h3" weight="bold" className="text-gray-900">
          Günlük Rapor
        </Typography>
        <Typography variant="body" className="text-gray-500">
          Günlük satış ve tahsilat özeti
        </Typography>
      </View>
    </View>
  );
};
