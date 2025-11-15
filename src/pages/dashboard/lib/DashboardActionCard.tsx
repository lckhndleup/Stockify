// app/dashboard/lib/DashboardActionCard.tsx
import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Typography, Icon } from "@/src/components/ui";
import type { IconFamily } from "@/src/types/ui";

interface DashboardActionCardProps {
  title: string;
  subtitle: string;
  iconName: string;
  iconFamily?: IconFamily;
  onPress: () => void;
  delay?: number;
}

export const DashboardActionCard: React.FC<DashboardActionCardProps> = ({
  title,
  subtitle,
  iconName,
  iconFamily = "MaterialIcons",
  onPress,
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="flex-1">
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: "#F3F4F6",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              backgroundColor: "#DC2626",
              borderRadius: 8,
              padding: 10,
            }}
          >
            <Icon family={iconFamily} name={iconName} size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="body" weight="semibold" className="text-gray-900">
              {title}
            </Typography>
            <Typography variant="caption" className="text-gray-500">
              {subtitle}
            </Typography>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
