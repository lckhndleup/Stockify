// app/dashboard/lib/CriticalInventoryItem.tsx
import React from "react";
import { View } from "react-native";
import { Typography } from "@/src/components/ui";
import Divider from "@/src/components/ui/divider";

interface CriticalInventoryItemProps {
  productName: string;
  productCount?: number;
  criticalProductCount?: number;
  status: "critical" | "outOfStock";
  showDivider?: boolean;
}

export const CriticalInventoryItem: React.FC<CriticalInventoryItemProps> = ({
  productName,
  productCount,
  criticalProductCount,
  status,
  showDivider = false,
}) => {
  const statusText = status === "critical" ? "Kritik" : "Tükendi";
  const statusColor = "text-red-600";

  return (
    <>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="flex-1">
            <Typography variant="body" weight="semibold" className="text-gray-900">
              {productName}
            </Typography>
            <Typography variant="caption" className="text-gray-500">
              {status === "critical"
                ? `Stok: ${productCount || 0} • Min: ${criticalProductCount || 0}`
                : "Stokta yok"}
            </Typography>
          </View>
        </View>
        <View className="items-end">
          <Typography variant="caption" weight="medium" className={statusColor}>
            {statusText}
          </Typography>
        </View>
      </View>
      {showDivider && <Divider className="mt-3" />}
    </>
  );
};
