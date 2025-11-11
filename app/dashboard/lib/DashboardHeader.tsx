// app/dashboard/lib/DashboardHeader.tsx
import React from "react";
import { View, TouchableOpacity, Dimensions } from "react-native";
import { Typography, Icon } from "@/src/components/ui";

const { width } = Dimensions.get("window");
const isSmallScreen = width < 380;

interface DashboardHeaderProps {
  username?: string;
  onProfilePress: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ username, onProfilePress }) => {
  return (
    <View className="bg-white pt-14 pb-6 px-5 border-b border-gray-100">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Typography variant="caption" className="text-gray-500 mb-1">
            {new Date().toLocaleDateString("tr-TR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Typography>
          <Typography
            variant="h1"
            weight="bold"
            size={isSmallScreen ? "xl" : "2xl"}
            className="text-gray-900"
          >
            Dashboard
          </Typography>
          {username && (
            <Typography variant="body" className="text-gray-600 mt-1">
              Hoş geldin, {username}
            </Typography>
          )}
        </View>

        {/* Profile Button */}
        <TouchableOpacity
          onPress={onProfilePress}
          style={{
            backgroundColor: "#DC2626",
            borderRadius: 8,
            padding: 12,
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
          activeOpacity={0.7}
        >
          <Icon family="MaterialIcons" name="person" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
