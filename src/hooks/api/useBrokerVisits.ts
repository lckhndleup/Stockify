// src/hooks/api/useBrokerVisits.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/types/apiTypes";
import { getTodayBrokerVisits, updateBrokerVisit } from "@/src/services/visits";
import { updateBrokerOrder } from "@/src/services/broker";
import logger from "@/src/utils/logger";
import { queryKeys } from "./queryKeys";
import {
  adaptBrokerVisitForUI,
  type TodayBrokerVisitItem,
  type BrokerVisitDisplayItem,
  type BrokerVisitUpdateRequest,
  type BrokerOrderUpdateData,
} from "@/src/types/broker";

// Get today's broker visits (returns raw backend data)
export const useTodayBrokerVisits = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.brokerVisits.today(),
    queryFn: async () => {
      logger.debug("📅 Fetching today's broker visits...");
      const result = await getTodayBrokerVisits();
      logger.debug("✅ Today's broker visits fetched:", result);
      return result as TodayBrokerVisitItem[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

// Get today's broker visits in UI format
export const useTodayBrokerVisitsForUI = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.brokerVisits.today(),
    queryFn: async () => {
      logger.debug("📅 Fetching today's broker visits for UI...");
      const result = await getTodayBrokerVisits();
      logger.debug("✅ Today's broker visits fetched:", result);
      // Backend response'u UI format'ına çevir
      const adapted = result.map((item: TodayBrokerVisitItem) => adaptBrokerVisitForUI(item));
      return adapted as BrokerVisitDisplayItem[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

// Update broker visit status
export const useUpdateBrokerVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visitData: BrokerVisitUpdateRequest) => {
      logger.debug("📅 Updating broker visit:", visitData);

      try {
        const result = await updateBrokerVisit(visitData);
        logger.debug("✅ Broker visit updated - RAW RESPONSE:", result);
        return result;
      } catch (error) {
        logger.error("❌ Update broker visit error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      logger.debug("🎉 Broker visit updated successfully:", data);

      // Refresh today's visits and broker lists
      queryClient.invalidateQueries({ queryKey: queryKeys.brokerVisits.today() });
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.all });
    },
    onError: (error: ApiError) => {
      logger.error("❌ Broker visit update failed:", error);
    },
  });
};

// Update broker order
export const useUpdateBrokerOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: BrokerOrderUpdateData) => {
      logger.debug("🔢 Updating broker order:", orderData);

      try {
        const result = await updateBrokerOrder(orderData);
        logger.debug("✅ Broker order updated - RAW RESPONSE:", result);
        return result;
      } catch (error) {
        logger.error("❌ Update broker order error:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      logger.debug("🎉 Broker order updated successfully:", data);

      // Refresh broker lists and detail
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.brokers.detail(variables.brokerId.toString()),
      });
    },
    onError: (error: ApiError) => {
      logger.error("❌ Broker order update failed:", error);
    },
  });
};
