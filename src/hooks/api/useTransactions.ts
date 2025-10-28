// src/hooks/api/useTransactions.ts
import { useQuery } from "@tanstack/react-query";
import apiService from "@/src/services/api";
import type {
  TransactionRequest,
  TransactionResponse,
  ApiError,
} from "@/src/types/apiTypes";
import { queryKeys } from "./queryKeys";

/**
 * Hook to fetch broker transactions within a date range
 */
export const useTransactions = (
  request: TransactionRequest,
  enabled: boolean = true
) => {
  return useQuery<TransactionResponse, ApiError>({
    queryKey: queryKeys.transactions.list(request),
    queryFn: () => apiService.getTransactions(request),
    enabled: enabled && request.brokerId > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
