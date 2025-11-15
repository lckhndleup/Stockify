// app/broker-visits/lib/VisitHeader.tsx
import React from "react";
import { View } from "react-native";
import { Typography, Icon } from "@/src/components/ui";

export const VisitHeader: React.FC = () => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <View className="flex-row items-center gap-3">
      <View className="bg-red-600 rounded-lg p-3">
        <Icon family="MaterialIcons" name="event-note" size={24} color="#FFFFFF" />
      </View>
      <View className="flex-1">
        <Typography variant="h3" weight="bold" className="text-gray-900">
          Ziyaret Listesi
        </Typography>
        <Typography variant="body" className="text-gray-500 capitalize">
          {formattedDate}
        </Typography>
      </View>
    </View>
  );
};
