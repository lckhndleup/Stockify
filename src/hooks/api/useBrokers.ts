// src/hooks/api/useBrokers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService, ApiError } from "@/src/services/api";
import logger from "@/src/utils/logger";
import { queryKeys } from "./queryKeys";
import {
  Broker,
  BrokerDisplayItem,
  BrokerFormData,
  BrokerUpdateData,
  BrokerDiscountRateUpdateData,
  adaptBrokerForUI,
  adaptBroker,
  adaptBrokerUpdate,
} from "@/src/types/broker";

// Types export
export type {
  Broker,
  BrokerDisplayItem,
  BrokerFormData,
  BrokerUpdateData,
  BrokerDiscountRateUpdateData,
};

// Backend'den gelen data'yı UI format'ına çevir
export const adaptBrokersForUI = (brokers: Broker[]): BrokerDisplayItem[] => {
  return brokers.map((broker) => adaptBrokerForUI(broker));
};

// Hooks

// Tüm broker'ları getir (aktif olanlar)
export const useBrokers = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.brokers.all,
    queryFn: async () => {
      logger.debug("👥 Fetching brokers from API...");
      const brokers = await apiService.getBrokers();
      logger.debug("✅ Brokers fetched:", brokers);
      return brokers as Broker[];
    },
    ...options,
  });
};

// Aktif broker'ları UI formatında getir
export const useActiveBrokers = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.brokers.lists(),
    queryFn: async () => {
      logger.debug("👥 Fetching active brokers...");
      const brokers = await apiService.getBrokers();
      // Backend'den gelen tüm broker'ları aktif kabul ediyoruz (status: "ACTIVE" olanlar)
      const activeBrokers = brokers.filter((broker: Broker) => broker.status === "ACTIVE");
      return adaptBrokersForUI(activeBrokers);
    },
    ...options,
  });
};

// Broker detayı getir
export const useBrokerDetail = (brokerId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.brokers.detail(brokerId),
    queryFn: async () => {
      logger.debug("👥 Fetching broker detail for ID:", brokerId);
      const broker = await apiService.getBrokerDetail(brokerId);
      return broker ? adaptBrokerForUI(broker) : null;
    },
    enabled: !!brokerId && (options?.enabled ?? true),
  });
};

// Broker ekleme mutation
export const useCreateBroker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brokerData: BrokerFormData) => {
      logger.debug("➕ Creating broker:", brokerData);

      try {
        const data = adaptBroker(brokerData);
        const result = await apiService.saveBroker(data);
        logger.debug("✅ Broker created - RAW RESPONSE:", result);
        logger.debug("✅ Response type:", typeof result);
        logger.debug("✅ Response keys:", result ? Object.keys(result) : "null");

        return result;
      } catch (error) {
        logger.error("❌ Create broker error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      logger.debug("🎉 Broker created successfully:", data);

      // Broker listelerini yenile
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.lists() });
    },
    onError: (error: ApiError) => {
      logger.error("❌ Broker creation failed:", error);
    },
  });
};

// Broker güncelleme mutation
export const useUpdateBroker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      brokerId: string;
      brokerData: {
        firstName: string;
        lastName: string;
        email: string;
        vkn: string;
        tkn: string;
        targetDayOfWeek: string;
        discountRate: number;
      };
    }) => {
      logger.debug("✏️ Updating broker:", params);

      try {
        const brokerId = parseInt(params.brokerId);
        const data = adaptBrokerUpdate(brokerId, params.brokerData);
        const result = await apiService.updateBroker(data);
        logger.debug("✅ Broker updated - RAW RESPONSE:", result);

        return result;
      } catch (error) {
        logger.error("❌ Update broker error:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      logger.debug("🎉 Broker updated successfully:", data);

      // Broker listelerini ve detayını yenile
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.brokers.detail(variables.brokerId),
      });
    },
    onError: (error: ApiError) => {
      logger.error("❌ Broker update failed:", error);
    },
  });
};

// Broker silme mutation
export const useDeleteBroker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brokerId: string) => {
      logger.debug("🗑️ Deleting broker ID:", brokerId);

      try {
        const result = await apiService.deleteBroker(brokerId);
        logger.debug("✅ Broker deleted - RAW RESPONSE:", result);

        return result;
      } catch (error) {
        logger.error("❌ Delete broker error:", error);
        throw error;
      }
    },
    onSuccess: (data, brokerId) => {
      logger.debug("🎉 Broker deleted successfully:", data);

      // Broker listelerini yenile
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.lists() });
      // Detay cache'ini de temizle
      queryClient.removeQueries({
        queryKey: queryKeys.brokers.detail(brokerId),
      });
    },
    onError: (error: ApiError) => {
      logger.error("❌ Broker deletion failed:", error);
    },
  });
};

// Broker discount rate güncelleme mutation
export const useUpdateBrokerDiscountRate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { brokerId: string; discountRate: number }) => {
      logger.debug("💰 Updating broker discount rate:", params);

      try {
        const discountData: BrokerDiscountRateUpdateData = {
          brokerId: parseInt(params.brokerId),
          discountRate: params.discountRate,
        };
        const result = await apiService.updateBrokerDiscountRate(discountData);
        logger.debug("✅ Broker discount rate updated - RAW RESPONSE:", result);

        return result;
      } catch (error) {
        logger.error("❌ Update broker discount rate error:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      logger.debug("🎉 Broker discount rate updated successfully:", data);

      // Broker listelerini ve detayını yenile
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.brokers.detail(variables.brokerId),
      });
    },
    onError: (error: ApiError) => {
      logger.error("❌ Broker discount rate update failed:", error);
    },
  });
};
