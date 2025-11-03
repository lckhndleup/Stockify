// src/hooks/api/useTransactions.ts
import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/types/apiTypes";
import { queryKeys } from "./queryKeys";
import { getTransactions } from "@/src/services/transaction";
import { TransactionRequest, TransactionResponse } from "@/src/services/transaction/type";

/**
 * Hook to fetch broker transactions within a date range
 */
export const useTransactions = (request: TransactionRequest, enabled: boolean = true) => {
  return useQuery<TransactionResponse, ApiError>({
    queryKey: queryKeys.transactions.list(request),
    queryFn: () => getTransactions(request),
    enabled: enabled && request.brokerId > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
