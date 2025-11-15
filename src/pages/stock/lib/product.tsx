import { Typography, Icon, Input } from "@/src/components/ui";
import { InventoryDisplayItem, useUpdateInventory } from "@/src/hooks/api/useInventory";
import React, { useState } from "react";
import { LayoutAnimation, TouchableOpacity, View } from "react-native";
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/RootNavigator';
import { useToast } from "@/src/hooks/useToast";

interface ProductItemProps {
  item: InventoryDisplayItem;
  index: number;
  toggleExpand: (item: InventoryDisplayItem) => void;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
}

const ProductItem = ({
  item,
  index,
  toggleExpand,
  expandedId,
  setExpandedId,
}: ProductItemProps) => {
  const { mutateAsync: updateInventory, isPending: isSaving } = useUpdateInventory();
  const { showSuccess, showError } = useToast();

  const [tempCount, setTempCount] = useState<number>(0);
  const [tempCritical, setTempCritical] = useState<number>(0);

  const status = item.isOutOfStock ? "out" : item.isCritical ? "critical" : "ok";
  const palette = {
    out: {
      borderColor: "#DC2626",
      bgColor: "#FEF2F2",
      statusText: "#DC2626",
    },
    critical: {
      borderColor: "#F59E0B",
      bgColor: "#FFFBEB",
      statusText: "#F59E0B",
    },
    ok: {
      borderColor: "#10B981",
      bgColor: "#F0FDF4",
      statusText: "#10B981",
    },
  }[status];

  const handleSaveInline = async (inventoryItem: InventoryDisplayItem) => {
    try {
      await updateInventory({
        inventoryId: inventoryItem.inventoryId,
        price: Number(inventoryItem.price) || 0,
        productCount: tempCount,
        criticalProductCount: tempCritical,
        active: true,
      });
      showSuccess("Stok güncellendi");
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedId(null);
    } catch {
      showError("Güncelleme başarısız");
    }
  };

  const _handleDecreaseStock = (inventoryItem: InventoryDisplayItem) => {
    router.push(`/stockDetail?id=${inventoryItem.inventoryId}&action=remove&amount=${1}`);
  };

  return (
    <TouchableOpacity
      key={index}
      className="mx-0"
      onPress={() => toggleExpand(item)}
      activeOpacity={0.9}
      style={{
        backgroundColor: "#1F2937",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 4,
      }}
    >
      {/* Status Badge - Üstte */}
      <View
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          backgroundColor: palette.bgColor,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: palette.borderColor,
        }}
      >
        <Typography
          variant="caption"
          weight="bold"
          style={{ color: palette.statusText, fontSize: 10, letterSpacing: 0.5 }}
        >
          {status === "out" ? "TÜKENDİ" : status === "critical" ? "KRİTİK" : "STOKTA"}
        </Typography>
      </View>

      {/* Ürün Başlığı */}
      <View style={{ marginBottom: 12, paddingRight: 80 }}>
        <Typography
          variant="body"
          weight="bold"
          numberOfLines={2}
          style={{ color: "#FFFFFF", fontSize: 17, lineHeight: 22, marginBottom: 6 }}
        >
          {item.productName || "İsimsiz Ürün"}
        </Typography>
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 6,
            }}
          >
            <Typography
              variant="caption"
              numberOfLines={1}
              style={{ color: "#D1D5DB", fontSize: 11 }}
            >
              {item.categoryName || "Kategori Yok"}
            </Typography>
          </View>
          <View
            style={{
              backgroundColor: "rgba(79, 70, 229, 0.2)",
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 6,
            }}
          >
            <Typography
              variant="caption"
              weight="semibold"
              style={{ color: "#A5B4FC", fontSize: 11 }}
            >
              Stok: {item.productCount || 0}
            </Typography>
          </View>
        </View>
      </View>

      {/* Fiyat Bilgileri */}
      <View
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          padding: 12,
          borderRadius: 12,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Typography
              variant="caption"
              style={{ color: "#9CA3AF", fontSize: 11, marginBottom: 4 }}
            >
              Birim Fiyat
            </Typography>
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Icon family="Feather" name="tag" size={14} color="#D1D5DB" />
              <Typography
                variant="body"
                weight="semibold"
                style={{ color: "#F3F4F6", fontSize: 15 }}
              >
                {`${Number(item.price || 0).toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} ₺`}
              </Typography>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Typography
              variant="caption"
              style={{ color: "#9CA3AF", fontSize: 11, marginBottom: 4 }}
            >
              Toplam Değer
            </Typography>
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Icon family="Feather" name="layers" size={14} color="#34D399" />
              <Typography variant="body" weight="bold" style={{ color: "#34D399", fontSize: 16 }}>
                {`₺${Number(item.totalPrice || 0).toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
              </Typography>
            </View>
          </View>
        </View>
      </View>
      {/* Inline düzenleme alanı */}
      {expandedId === item.id && (
        <View
          className="mt-3 rounded-lg"
          style={{
            backgroundColor: "#F9FAFB",
            borderWidth: 1,
            borderColor: "#E5E7EB",
            padding: 10,
          }}
        >
          {/* Stok miktarı (sadece input) */}
          <View className="mb-2">
            <Typography variant="caption" className="text-stock-text mb-1">
              Stok Miktarı
            </Typography>
            <Input
              value={String(tempCount)}
              onChangeText={(text: string) => {
                if (text === "") return setTempCount(0);
                const v = Number(text.replace(/[^0-9]/g, ""));
                if (!isNaN(v)) setTempCount(v);
              }}
              keyboardType="numeric"
              numericOnly
              autoFocus
              size="sm"
              variant="outlined"
              fullWidth={true}
              returnKeyType="next"
              returnKeyLabel="İleri"
            />
          </View>

          {/* Kritik seviye (sadece input) */}
          <View className="mb-2">
            <Typography variant="caption" className="text-stock-text mb-1">
              Kritik Seviye
            </Typography>
            <Input
              value={String(tempCritical)}
              onChangeText={(text: string) => {
                if (text === "") return setTempCritical(0);
                const v = Number(text.replace(/[^0-9]/g, ""));
                if (!isNaN(v)) setTempCritical(v);
              }}
              keyboardType="numeric"
              numericOnly
              size="sm"
              variant="outlined"
              fullWidth={true}
              returnKeyType="done"
              returnKeyLabel="Kaydet"
              onSubmitEditing={() => handleSaveInline(item)}
            />
          </View>

          {/* Butonlar */}
          <View className="flex-row mt-2" style={{ gap: 6, justifyContent: "flex-end" }}>
            <TouchableOpacity
              onPress={() => {
                // toggleExpand(item);
                // openEditModal(item);
                _handleDecreaseStock(item);
              }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: "#3B82F6",
                backgroundColor: "#EFF6FF",
              }}
            >
              <Typography
                variant="caption"
                weight="medium"
                style={{ color: "#3B82F6", fontSize: 13 }}
              >
                Detaylı Düzenle
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => toggleExpand(item)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Typography
                variant="caption"
                weight="medium"
                style={{ color: "#6B7280", fontSize: 13 }}
              >
                Vazgeç
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleSaveInline(item)}
              disabled={isSaving}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: isSaving ? "#FCA5A5" : "#DC2626",
              }}
            >
              <Typography
                variant="caption"
                weight="semibold"
                style={{ color: "#FFFFFF", fontSize: 13 }}
              >
                {isSaving ? "..." : "Kaydet"}
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default ProductItem;
