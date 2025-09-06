// src/hooks/api/useSalesProducts.ts

import { useQuery } from "@tanstack/react-query";
import { apiService, ApiError } from "@/src/services/api";
import { queryKeys } from "./queryKeys";
import {
  BackendSalesProduct,
  SalesProductDisplayItem,
  SalesProductOption,
  SalesProductsResponse,
  adaptSalesProductsForUI,
  createSalesProductOptions,
} from "@/src/types/salesProduct";

// Types export
export type {
  BackendSalesProduct,
  SalesProductDisplayItem,
  SalesProductOption,
  SalesProductsResponse,
};

// Re-export utility functions
export {
  adaptSalesProductsForUI,
  createSalesProductOptions,
  calculateSelectedProduct,
} from "@/src/types/salesProduct";

// Hooks

// Sales products'ları getir (backend'den direkt)
export const useSalesProducts = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.sales.products(),
    queryFn: async () => {
      console.log("💰 Fetching sales products from API...");
      const products = await apiService.getSalesProducts();
      console.log("✅ Sales products fetched:", products);
      return products as BackendSalesProduct[];
    },
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    gcTime: 10 * 60 * 1000, // 10 dakika memory'de tut
    retry: 2,
    ...options,
  });
};

// Sales products'ları UI formatında getir
export const useSalesProductsForUI = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...queryKeys.sales.products(), "ui-format"],
    queryFn: async () => {
      console.log("💰 Fetching sales products for UI...");
      const products = await apiService.getSalesProducts();
      const adaptedProducts = adaptSalesProductsForUI(products);
      console.log("✅ Sales products adapted for UI:", adaptedProducts.length);
      return adaptedProducts;
    },
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    gcTime: 10 * 60 * 1000, // 10 dakika memory'de tut
    retry: 2,
    ...options,
  });
};

// Available sales products (stok > 0 olanlar)
export const useAvailableSalesProducts = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...queryKeys.sales.products(), "available"],
    queryFn: async () => {
      console.log("💰 Fetching available sales products...");
      const products = await apiService.getSalesProducts();
      const adaptedProducts = adaptSalesProductsForUI(products);
      const availableProducts = adaptedProducts.filter(
        (product) => product.isAvailable
      );
      console.log("✅ Available sales products:", availableProducts.length);
      return availableProducts;
    },
    staleTime: 3 * 60 * 1000, // 3 dakika cache (stok bilgisi daha sık değişebilir)
    gcTime: 10 * 60 * 1000,
    retry: 2,
    ...options,
  });
};

// SelectBox options'ları için hook
export const useSalesProductOptions = (
  excludeIds: string[] = [],
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [...queryKeys.sales.products(), "options", excludeIds],
    queryFn: async () => {
      console.log("💰 Fetching sales product options...");
      const products = await apiService.getSalesProducts();
      const adaptedProducts = adaptSalesProductsForUI(products);
      const productOptions = createSalesProductOptions(
        adaptedProducts,
        excludeIds
      );
      console.log("✅ Sales product options created:", productOptions.length);
      return productOptions;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    ...options,
  });
};

// Specific product bul (ID ile)
export const useSalesProductById = (
  productId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [...queryKeys.sales.products(), "detail", productId],
    queryFn: async () => {
      console.log("💰 Finding sales product by ID:", productId);
      const products = await apiService.getSalesProducts();
      const adaptedProducts = adaptSalesProductsForUI(products);
      const product = adaptedProducts.find((p) => p.id === productId);
      console.log("✅ Sales product found:", product);
      return product || null;
    },
    enabled: !!productId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
};
