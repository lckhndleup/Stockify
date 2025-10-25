// src/hooks/api/useSales.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/src/services/api";
import { queryKeys } from "./queryKeys";
import {
  adaptSalesProductsForUI,
  SalesProduct,
  SalesProductDisplayItem,
  SalesCalculateRequest,
  SalesCancelRequest,
  SalesConfirmRequest,
  SalesSummary,
} from "@/src/types/sales";

// ---------- QUERIES ----------

// GET /sales/products
export const useSalesProducts = (options?: { enabled?: boolean }) =>
  useQuery<SalesProductDisplayItem[]>({
    queryKey: queryKeys.sales.products(),
    queryFn: async () => {
      const products = await apiService.getSalesProducts();
      return adaptSalesProductsForUI(products as SalesProduct[]);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    ...options,
  });

// ---------- MUTATIONS ----------

// POST /sales/calculate
export const useSalesCalculate = () => {
  const qc = useQueryClient();
  return useMutation<SalesSummary, unknown, SalesCalculateRequest>({
    mutationFn: (payload) => apiService.calculateSale(payload),
    onSuccess: (data, vars) => {
      qc.setQueryData(queryKeys.sales.calculate(vars.brokerId), data);
    },
  });
};

// POST /sales/confirm
export const useSalesConfirm = () => {
  const qc = useQueryClient();
  return useMutation<SalesSummary, unknown, SalesConfirmRequest>({
    mutationFn: (payload) => apiService.confirmSale(payload),
    onSuccess: (data, vars) => {
      // Sepet ve etkilenebilecek listeler invalidate
      qc.invalidateQueries({
        queryKey: queryKeys.basket.byBroker(vars.brokerId),
      });
      qc.invalidateQueries({ queryKey: queryKeys.brokers.all });
      qc.invalidateQueries({ queryKey: queryKeys.inventory.all });
      qc.setQueryData(queryKeys.sales.confirm(vars.brokerId), data);
    },
  });
};

// POST /sales/cancel
export const useSalesCancel = () => {
  const qc = useQueryClient();
  return useMutation<
    { success: true; message: string },
    unknown,
    SalesCancelRequest
  >({
    mutationFn: (payload) => apiService.cancelSale(payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: queryKeys.basket.byBroker(vars.brokerId),
      });
      qc.removeQueries({ queryKey: queryKeys.sales.calculate(vars.brokerId) });
      qc.removeQueries({ queryKey: queryKeys.sales.confirm(vars.brokerId) });
    },
  });
};
