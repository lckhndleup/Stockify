// src/hooks/api/useBasket.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/src/services/api";
import { queryKeys } from "./queryKeys";
import {
  adaptBasketForUI,
  BackendBasketItem,
  BasketAddRequest,
  BasketItemDisplay,
  BasketRemoveRequest,
  BasketUpdateRequest,
} from "@/src/types/basket";

// GET /sales/basket/{brokerId}
export const useBasket = (
  brokerId: number | string,
  options?: { enabled?: boolean }
) =>
  useQuery<BasketItemDisplay[]>({
    queryKey: queryKeys.basket.byBroker(brokerId),
    queryFn: async () => {
      const items = await apiService.getBasket(Number(brokerId));
      return adaptBasketForUI(items as BackendBasketItem[]);
    },
    staleTime: 60_000,
    gcTime: 300_000,
    enabled: !!brokerId && (options?.enabled ?? true),
  });

// POST /basket/add
export const useAddToBasket = () => {
  const qc = useQueryClient();
  return useMutation<
    { success: true; message: string },
    unknown,
    BasketAddRequest
  >({
    mutationFn: (payload) => apiService.addToBasket(payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: queryKeys.basket.byBroker(v.brokerId) });
    },
  });
};

// POST /basket/remove
export const useRemoveFromBasket = () => {
  const qc = useQueryClient();
  return useMutation<
    { success: true; message: string },
    unknown,
    BasketRemoveRequest
  >({
    mutationFn: (payload) => apiService.removeFromBasket(payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: queryKeys.basket.byBroker(v.brokerId) });
    },
  });
};

// POST /basket/update
export const useUpdateBasket = () => {
  const qc = useQueryClient();
  return useMutation<
    { success: true; message: string },
    unknown,
    BasketUpdateRequest
  >({
    mutationFn: (payload) => apiService.updateBasket(payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: queryKeys.basket.byBroker(v.brokerId) });
    },
  });
};
