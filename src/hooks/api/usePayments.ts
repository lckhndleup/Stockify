// src/hooks/api/usePayments.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService, ApiError } from "@/src/services/api";
import { queryKeys } from "./queryKeys";
import {
  PaymentResponse,
  PaymentSaveRequest,
  PaymentFormData,
} from "@/src/types/payment";

// Payment save mutation hook
export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      brokerId: string;
      paymentData: PaymentFormData;
    }) => {
      console.log("💰 Creating payment:", params);

      try {
        const data: PaymentSaveRequest = {
          brokerId: parseInt(params.brokerId),
          paymentPrice: params.paymentData.amount,
          paymentType: params.paymentData.paymentType,
        };

        const result = await apiService.savePayment(data);
        console.log("✅ Payment created - RAW RESPONSE:", result);

        return result as PaymentResponse;
      } catch (error) {
        console.error("❌ Create payment error:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log("🎉 Payment created successfully:", data);

      // Broker verilerini yenile (balance değişti)
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.brokers.detail(variables.brokerId),
      });
    },
    onError: (error: ApiError) => {
      console.error("❌ Payment creation failed:", error);
    },
  });
};
