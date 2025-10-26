// src/hooks/api/useInventory.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService, ApiError } from "@/src/services/api";
import { queryKeys } from "./queryKeys";
import logger from "@/src/utils/logger";
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
      logger.debug("📦 Fetching all inventory from API...");
      const inventory = await apiService.getInventoryAll();
      logger.debug("✅ All inventory fetched:", inventory);
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
      logger.debug("📦 Fetching critical inventory from API...");
      const inventory = await apiService.getInventoryCritical();
      logger.debug("✅ Critical inventory fetched:", inventory);
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
      logger.debug("📦 Fetching out of stock inventory from API...");
      const inventory = await apiService.getInventoryOutOf();
      logger.debug("✅ Out of stock inventory fetched:", inventory);
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
      logger.debug("📦 Fetching available inventory from API...");
      const inventory = await apiService.getInventoryAvailable();
      logger.debug("✅ Available inventory fetched:", inventory);
      return adaptInventoryListForUI(inventory);
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
    ...options,
  });
};

// Inventory detay getir
export const useInventoryDetail = (
  inventoryId: string | number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: queryKeys.inventory.detail(inventoryId),
    queryFn: async () => {
      logger.debug("📦 Fetching inventory detail for ID:", inventoryId);
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
      logger.debug("✏️ Updating inventory:", inventoryData);
      const result = await apiService.updateInventory(inventoryData);
      logger.debug("✅ Inventory updated:", result);
      return result;
    },
    onSuccess: (data, variables) => {
      // Tüm inventory query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });

      // Güncellenmiş inventory'nin detay cache'ini de temizle
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.detail(variables.inventoryId),
      });

      logger.debug("🔄 Inventory cache invalidated");
    },
    onError: (error: ApiError) => {
      logger.error("❌ Update inventory error:", error);
    },
  });
};

// Cache helper functions
export const useInvalidateInventory = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      logger.debug("🔄 All inventory cache invalidated");
    },
    invalidateDetail: (inventoryId: string | number) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.detail(inventoryId),
      });
      logger.debug("🔄 Inventory detail cache invalidated for ID:", inventoryId);
    },
    refetchAll: () => {
      queryClient.refetchQueries({ queryKey: queryKeys.inventory.all });
      logger.debug("🔄 All inventory cache refetched");
    },
  };
};
