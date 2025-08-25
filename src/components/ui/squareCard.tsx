import React from "react";
import { View, TouchableOpacity, TouchableOpacityProps } from "react-native";
import Typography from "./typography";
import Icon from "./icon";

interface SquareCardProps extends TouchableOpacityProps {
  title: string;
  subtitle?: string;
  amount: string;
  onDelete?: () => void;
  showDeleteIcon?: boolean;
  className?: string;
}

export default function SquareCard({
  title,
  subtitle = "Mevcut Bakiye",
  amount,
  onDelete,
  showDeleteIcon = true,
  className = "",
  ...props
}: SquareCardProps) {
  return (
    <TouchableOpacity
      className={`bg-stock-red rounded-lg p-4 ${className}`}
      style={{
        width: "48%", // 2 kart yan yana, aralarında boşluk için %48
        aspectRatio: 1, // Kare şeklinde
        shadowColor: "#E3001B",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
      activeOpacity={0.9}
      {...props}
    >
      {/* Üst kısım - Başlık ve Sil ikonu */}
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-2">
          <Typography
            variant="body"
            weight="semibold"
            className="text-stock-white"
            size="lg"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {title}
          </Typography>
        </View>

        {showDeleteIcon && onDelete && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation(); // Parent tıklamasını engelle
              onDelete();
            }}
            className="p-1"
            activeOpacity={0.7}
          >
            <Icon
              family="MaterialIcons"
              name="delete"
              size={20}
              color="#FFFEFF"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Divider */}
      <View
        className="w-full mb-3"
        style={{
          height: 1,
          backgroundColor: "rgba(255, 254, 255, 0.3)", // Beyazın %30 şeffaflığı
        }}
      />

      {/* Alt kısım - Subtitle ve Miktar */}
      <View className="flex-1 justify-end">
        <Typography
          variant="caption"
          className="text-stock-white mb-1"
          style={{ opacity: 0.8 }}
        >
          {subtitle}
        </Typography>
        <Typography
          variant="h3"
          weight="bold"
          className="text-stock-white"
          size="xl"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {amount}
        </Typography>
      </View>
    </TouchableOpacity>
  );
}
