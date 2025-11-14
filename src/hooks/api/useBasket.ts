// src/hooks/api/useBasket.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBasket, addToBasket, removeFromBasket, updateBasket } from "@/src/services/sales";
import { queryKeys } from "./queryKeys";
import {
  adaptBasketResponseForUI,
  BasketAddRequest,
  BasketItemDisplay,
  BasketMutationResponse,
  BasketRemoveRequest,
  BasketUpdateRequest,
} from "@/src/types/basket";

// GET /sales/basket/{brokerId}
export const useBasket = (brokerId: number | string, options?: { enabled?: boolean }) =>
  useQuery<BasketItemDisplay[]>({
    queryKey: queryKeys.basket.byBroker(brokerId),
    queryFn: async () => {
      const items = await getBasket(Number(brokerId));
      return adaptBasketResponseForUI(items);
    },
    staleTime: 60_000,
    gcTime: 300_000,
    enabled: !!brokerId && (options?.enabled ?? true),
  });

// POST /basket/add
export const useAddToBasket = () => {
  const qc = useQueryClient();
  return useMutation<BasketMutationResponse, unknown, BasketAddRequest>({
    mutationFn: (payload) => addToBasket(payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: queryKeys.basket.byBroker(v.brokerId) });
    },
  });
};

// POST /basket/remove
export const useRemoveFromBasket = () => {
  const qc = useQueryClient();
  return useMutation<BasketMutationResponse, unknown, BasketRemoveRequest>({
    mutationFn: (payload) => removeFromBasket(payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: queryKeys.basket.byBroker(v.brokerId) });
    },
  });
};

// POST /basket/update
export const useUpdateBasket = () => {
  const qc = useQueryClient();
  return useMutation<BasketMutationResponse, unknown, BasketUpdateRequest>({
    mutationFn: (payload) => updateBasket(payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: queryKeys.basket.byBroker(v.brokerId) });
    },
  });
};
