// src/hooks/api/useBrokers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService, ApiError } from "@/src/services/api";
import { queryKeys } from "./QueryKeys";
import {
  BackendBroker,
  BrokerDisplayItem,
  BrokerFormData,
  BrokerUpdateData,
  BrokerDiscountRateUpdateData,
  adaptBrokerForUI,
  adaptBrokerForBackend,
  adaptBrokerUpdateForBackend,
} from "@/src/types/broker";

// Types export
export type {
  BackendBroker,
  BrokerDisplayItem,
  BrokerFormData,
  BrokerUpdateData,
  BrokerDiscountRateUpdateData,
};

// Backend'den gelen data'yı UI format'ına çevir
export const adaptBrokersForUI = (
  brokers: BackendBroker[]
): BrokerDisplayItem[] => {
  return brokers.map((broker) => adaptBrokerForUI(broker));
};

// Hooks

// Tüm broker'ları getir (aktif olanlar)
export const useBrokers = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.brokers.all,
    queryFn: async () => {
      console.log("👥 Fetching brokers from API...");
      const brokers = await apiService.getBrokers();
      console.log("✅ Brokers fetched:", brokers);
      return brokers as BackendBroker[];
    },
    ...options,
  });
};

// Aktif broker'ları UI formatında getir
export const useActiveBrokers = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.brokers.lists(),
    queryFn: async () => {
      console.log("👥 Fetching active brokers...");
      const brokers = await apiService.getBrokers();
      // Backend'den gelen tüm broker'ları aktif kabul ediyoruz (status: "ACTIVE" olanlar)
      const activeBrokers = brokers.filter(
        (broker: BackendBroker) => broker.status === "ACTIVE"
      );
      return adaptBrokersForUI(activeBrokers);
    },
    ...options,
  });
};

// Broker detayı getir
export const useBrokerDetail = (
  brokerId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.brokers.detail(brokerId),
    queryFn: async () => {
      console.log("👥 Fetching broker detail for ID:", brokerId);
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
      console.log("➕ Creating broker:", brokerData);

      try {
        const backendData = adaptBrokerForBackend(brokerData);
        const result = await apiService.saveBroker(backendData);
        console.log("✅ Broker created - RAW RESPONSE:", result);
        console.log("✅ Response type:", typeof result);
        console.log("✅ Response keys:", result ? Object.keys(result) : "null");

        return result;
      } catch (error) {
        console.error("❌ Create broker error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("🎉 Broker created successfully:", data);

      // Broker listelerini yenile
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.lists() });
    },
    onError: (error: ApiError) => {
      console.error("❌ Broker creation failed:", error);
    },
  });
};

// Broker güncelleme mutation
export const useUpdateBroker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      brokerId: string;
      brokerData: { firstName: string; lastName: string; discountRate: number };
    }) => {
      console.log("✏️ Updating broker:", params);

      try {
        const brokerId = parseInt(params.brokerId);
        const backendData = adaptBrokerUpdateForBackend(
          brokerId,
          params.brokerData
        );
        const result = await apiService.updateBroker(backendData);
        console.log("✅ Broker updated - RAW RESPONSE:", result);

        return result;
      } catch (error) {
        console.error("❌ Update broker error:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log("🎉 Broker updated successfully:", data);

      // Broker listelerini ve detayını yenile
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.brokers.detail(variables.brokerId),
      });
    },
    onError: (error: ApiError) => {
      console.error("❌ Broker update failed:", error);
    },
  });
};

// Broker silme mutation
export const useDeleteBroker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brokerId: string) => {
      console.log("🗑️ Deleting broker ID:", brokerId);

      try {
        const result = await apiService.deleteBroker(brokerId);
        console.log("✅ Broker deleted - RAW RESPONSE:", result);

        return result;
      } catch (error) {
        console.error("❌ Delete broker error:", error);
        throw error;
      }
    },
    onSuccess: (data, brokerId) => {
      console.log("🎉 Broker deleted successfully:", data);

      // Broker listelerini yenile
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.lists() });
      // Detay cache'ini de temizle
      queryClient.removeQueries({
        queryKey: queryKeys.brokers.detail(brokerId),
      });
    },
    onError: (error: ApiError) => {
      console.error("❌ Broker deletion failed:", error);
    },
  });
};

// Broker discount rate güncelleme mutation
export const useUpdateBrokerDiscountRate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { brokerId: string; discountRate: number }) => {
      console.log("💰 Updating broker discount rate:", params);

      try {
        const discountData: BrokerDiscountRateUpdateData = {
          brokerId: parseInt(params.brokerId),
          discountRate: params.discountRate,
        };
        const result = await apiService.updateBrokerDiscountRate(discountData);
        console.log("✅ Broker discount rate updated - RAW RESPONSE:", result);

        return result;
      } catch (error) {
        console.error("❌ Update broker discount rate error:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log("🎉 Broker discount rate updated successfully:", data);

      // Broker listelerini ve detayını yenile
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.brokers.detail(variables.brokerId),
      });
    },
    onError: (error: ApiError) => {
      console.error("❌ Broker discount rate update failed:", error);
    },
  });
};
