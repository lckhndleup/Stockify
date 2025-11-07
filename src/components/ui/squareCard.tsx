import React from "react";
import { View, TouchableOpacity } from "react-native";
import Typography from "./typography";
import Icon from "./icon";
import type { SquareCardProps } from "@/src/types/ui";

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
        width: "48.5%", // Biraz daha geniş kartlar
        aspectRatio: 1, // Kare şeklinde
        shadowColor: "#E3001B",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
      activeOpacity={0.95}
      {...props}
    >
      {/* Üst kısım - Başlık ve Sil ikonu */}
      <View
        className={`flex-row ${
          !showDeleteIcon ? "justify-center" : "justify-between"
        } items-start mb-2`}
      >
        <View className={`${showDeleteIcon ? "flex-1 mr-2" : "px-2"}`}>
          <Typography
            variant="body"
            weight="semibold"
            className="text-stock-white text-center"
            size="base"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              letterSpacing: -0.2, // Karakterler arasındaki boşluğu hafifçe azalt
            }}
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
            activeOpacity={0.95}
          >
            <Icon family="MaterialIcons" name="delete" size={20} color="#FFFEFF" />
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
      <View className="flex-1 justify-end items-center">
        <Typography
          variant="caption"
          className="text-stock-white mb-1 text-center"
          style={{ opacity: 0.8 }}
        >
          {subtitle}
        </Typography>
        <Typography
          variant="h3"
          weight="bold"
          className="text-stock-white text-center"
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
