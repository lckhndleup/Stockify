// src/hooks/api/usePayments.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService, ApiError } from "@/src/services/api";
import logger from "@/src/utils/logger";
import { queryKeys } from "./queryKeys";
import { PaymentResponse, PaymentSaveRequest, PaymentFormData } from "@/src/types/payment";

// Payment save mutation hook
export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { brokerId: string; paymentData: PaymentFormData }) => {
      logger.debug("💰 Creating payment:", params);

      try {
        const data: PaymentSaveRequest = {
          brokerId: parseInt(params.brokerId),
          paymentPrice: params.paymentData.amount,
          paymentType: params.paymentData.paymentType,
        };

        const result = await apiService.savePayment(data);
        logger.debug("✅ Payment created - RAW RESPONSE:", result);

        return result as PaymentResponse;
      } catch (error) {
        logger.error("❌ Create payment error:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      logger.debug("🎉 Payment created successfully:", data);

      // Broker verilerini yenile (balance değişti)
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.brokers.detail(variables.brokerId),
      });
    },
    onError: (error: ApiError) => {
      logger.error("❌ Payment creation failed:", error);
    },
  });
};
