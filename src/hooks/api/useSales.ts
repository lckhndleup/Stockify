// src/hooks/api/useSales.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSalesProducts, calculateSale, confirmSale, cancelSale } from "@/src/services/sales";
import { queryKeys } from "./queryKeys";
import {
  adaptSalesProductsForUI,
  SalesProductDisplayItem,
  SalesCalculateRequest,
  SalesCancelRequest,
  SalesConfirmRequest,
  SalesSummary,
  SalesCancelResponse,
} from "@/src/types/sales";

// ---------- QUERIES ----------

// GET /sales/products
export const useSalesProducts = (options?: { enabled?: boolean }) =>
  useQuery<SalesProductDisplayItem[]>({
    queryKey: queryKeys.sales.products(),
    queryFn: async () => {
      const products = await getSalesProducts();
      return adaptSalesProductsForUI(products);
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
    mutationFn: (payload) => calculateSale(payload),
    onSuccess: (data, vars) => {
      qc.setQueryData(queryKeys.sales.calculate(vars.brokerId), data);
    },
  });
};

// POST /sales/confirm
export const useSalesConfirm = () => {
  const qc = useQueryClient();
  return useMutation<SalesSummary, unknown, SalesConfirmRequest>({
    mutationFn: (payload) => confirmSale(payload),
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
  return useMutation<SalesCancelResponse, unknown, SalesCancelRequest>({
    mutationFn: (payload) => cancelSale(payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: queryKeys.basket.byBroker(vars.brokerId),
      });
      qc.removeQueries({ queryKey: queryKeys.sales.calculate(vars.brokerId) });
      qc.removeQueries({ queryKey: queryKeys.sales.confirm(vars.brokerId) });
    },
  });
};
