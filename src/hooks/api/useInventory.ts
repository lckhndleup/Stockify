// src/hooks/api/useInventory.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService, ApiError } from "@/src/services/api";
import { queryKeys } from "./queryKeys";
import {
  InventoryItem,
  InventoryUpdateRequest,
  InventoryDisplayItem,
  adaptInventoryListForUI,
  adaptInventoryForUI,
} from "@/src/types/inventory";

// Types export
export type { InventoryItem, InventoryUpdateRequest, InventoryDisplayItem };

// Hooks

// Tüm inventory'leri getir
export const useInventoryAll = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.inventory.all,
    queryFn: async () => {
      console.log("📦 Fetching all inventory from API...");
      const inventory = await apiService.getInventoryAll();
      console.log("✅ All inventory fetched:", inventory);
      return adaptInventoryListForUI(inventory);
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
    ...options,
  });
};

// Kritik inventory'leri getir
export const useInventoryCritical = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.inventory.critical(),
    queryFn: async () => {
      console.log("📦 Fetching critical inventory from API...");
      const inventory = await apiService.getInventoryCritical();
      console.log("✅ Critical inventory fetched:", inventory);
      return adaptInventoryListForUI(inventory);
    },
    staleTime: 2 * 60 * 1000, // 2 dakika
    ...options,
  });
};

// Tükenen inventory'leri getir
export const useInventoryOutOfStock = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.inventory.outOfStock(),
    queryFn: async () => {
      console.log("📦 Fetching out of stock inventory from API...");
      const inventory = await apiService.getInventoryOutOf();
      console.log("✅ Out of stock inventory fetched:", inventory);
      return adaptInventoryListForUI(inventory);
    },
    staleTime: 2 * 60 * 1000, // 2 dakika
    ...options,
  });
};

// Mevcut inventory'leri getir
export const useInventoryAvailable = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.inventory.available(),
    queryFn: async () => {
      console.log("📦 Fetching available inventory from API...");
      const inventory = await apiService.getInventoryAvailable();
      console.log("✅ Available inventory fetched:", inventory);
      return adaptInventoryListForUI(inventory);
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
    ...options,
  });
};

// Inventory detay getir
export const useInventoryDetail = (
  inventoryId: string | number,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.inventory.detail(inventoryId),
    queryFn: async () => {
      console.log("📦 Fetching inventory detail for ID:", inventoryId);
      const inventory = await apiService.getInventoryDetail(inventoryId);
      return inventory ? adaptInventoryForUI(inventory) : null;
    },
    enabled: !!inventoryId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
};

// Inventory güncelleme mutation
export const useUpdateInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inventoryData: InventoryUpdateRequest) => {
      console.log("✏️ Updating inventory:", inventoryData);
      const result = await apiService.updateInventory(inventoryData);
      console.log("✅ Inventory updated:", result);
      return result;
    },
    onSuccess: (data, variables) => {
      // Tüm inventory query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });

      // Güncellenmiş inventory'nin detay cache'ini de temizle
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.detail(variables.inventoryId),
      });

      console.log("🔄 Inventory cache invalidated");
    },
    onError: (error: ApiError) => {
      console.log("❌ Update inventory error:", error);
    },
  });
};

// Cache helper functions
export const useInvalidateInventory = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      console.log("🔄 All inventory cache invalidated");
    },
    invalidateDetail: (inventoryId: string | number) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.detail(inventoryId),
      });
      console.log("🔄 Inventory detail cache invalidated for ID:", inventoryId);
    },
    refetchAll: () => {
      queryClient.refetchQueries({ queryKey: queryKeys.inventory.all });
      console.log("🔄 All inventory cache refetched");
    },
  };
};
