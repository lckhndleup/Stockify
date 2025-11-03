// src/hooks/api/useProducts.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService, ApiError } from "@/src/services/api";
import logger from "@/src/utils/logger";
import { queryKeys } from "./queryKeys";
import {
  Product,
  ProductFormData,
  ProductUpdateData,
  ProductSearchParams,
  ProductDisplayItem,
  adaptProductForUI,
  adaptProductsResponse,
  adaptProductResponse,
  adaptProduct,
  adaptProductUpdate,
} from "@/src/types/product";

// Types
export type { Product, ProductFormData, ProductUpdateData, ProductSearchParams };

// Backend'den gelen data'yı UI format'ına çevir - stock/price default 0
export const adaptProductsForUI = (products: Product[]): ProductDisplayItem[] => {
  return products.map((product) => adaptProductForUI(product));
};

// Hooks

// Tüm ürünleri getir
export const useProducts = (params?: ProductSearchParams, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: async () => {
      logger.debug("🛍️ Fetching products from API...");
      const products = await apiService.getProducts(params);
      logger.debug("✅ Products fetched:", products);
      return adaptProductsResponse(products);
    },
    ...options,
  });
};

// Aktif ürünleri getir (UI için adapter ile)
export const useActiveProducts = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.products.active(),
    queryFn: async () => {
      logger.debug("🛍️ Fetching active products...");
      const products = await apiService.getProducts({ status: "ACTIVE" });
      const normalized = adaptProductsResponse(products);
      return adaptProductsForUI(normalized);
    },
    ...options,
  });
};

// YENİ: Pasif ürünleri getir (UI için adapter ile)
export const usePassiveProducts = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.products.list({ status: "PASSIVE" }),
    queryFn: async () => {
      logger.debug("🛍️ Fetching passive products...");
      const products = await apiService.getProducts({ status: "PASSIVE" });
      logger.debug("✅ Passive products fetched:", products);
      const normalized = adaptProductsResponse(products);
      return adaptProductsForUI(normalized);
    },
    ...options,
  });
};

// Ürün detayı getir
export const useProductDetail = (productId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: async () => {
      logger.debug("🛍️ Fetching product detail for ID:", productId);
      const product = await apiService.getProductDetail(productId);
      return product ? adaptProductForUI(adaptProductResponse(product)) : null;
    },
    enabled: !!productId && (options?.enabled ?? true),
  });
};

// Ürün arama - YENİ: status parametresi eklendi
export const useSearchProducts = (
  searchText: string,
  status: "ACTIVE" | "PASSIVE" = "ACTIVE",
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: queryKeys.products.search(`${searchText}-${status}`),
    queryFn: async () => {
      logger.debug("🛍️ Searching products", { searchText, status });
      const products = await apiService.getProducts({
        productText: searchText,
        status: status,
      });
      const normalized = adaptProductsResponse(products);
      return adaptProductsForUI(normalized);
    },
    enabled: !!searchText && searchText.length > 0 && (options?.enabled ?? true),
  });
};

// Ürün ekleme mutation - sadece categoryId ve name
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: ProductFormData) => {
      logger.debug("➕ Creating product:", productData);

      try {
        const payload = adaptProduct(productData);
        const result = await apiService.saveProduct(payload);
        logger.debug("✅ Product created - RAW RESPONSE:", result);
        logger.debug("✅ Response type:", typeof result);
        logger.debug("✅ Response keys:", result ? Object.keys(result) : "null");

        return result;
      } catch (error) {
        logger.error("❌ API Error in product creation:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      logger.debug("🎉 Product creation onSuccess called");
      logger.debug("🎉 Success data:", data);
      logger.debug("🎉 Variables used:", variables);

      // Cache'i invalidate et - hem aktif hem pasif ürünler
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.all,
        exact: false,
      });
      logger.debug("🔄 Products cache invalidated");

      // Biraz bekle ve sonra refetch yap
      setTimeout(() => {
        queryClient.refetchQueries({
          queryKey: queryKeys.products.all,
          exact: false,
        });
        logger.debug("🔄 Products force refetched");
      }, 500);
    },
    onError: (error: ApiError, _variables) => {
      logger.debug("❌ Product creation onError called");
      logger.error("❌ Error details:", error);
      logger.debug("❌ Variables used:", _variables);
    },
    onSettled: (data, error, _variables) => {
      logger.debug("⚡ Product creation onSettled called");
      logger.debug("⚡ Final data:", data);
      logger.debug("⚡ Final error:", error);

      // Her durumda cache'i temizle
      if (data && !error) {
        logger.debug("🧹 Cleaning all related product caches...");
        queryClient.removeQueries({
          queryKey: queryKeys.products.all,
          exact: false,
        });
        // Hemen yeniden fetch yap
        queryClient.prefetchQuery({
          queryKey: queryKeys.products.all,
          queryFn: () => apiService.getProducts(),
        });
      }
    },
  });
};

// Ürün güncelleme mutation - sadece categoryId ve name
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: ProductUpdateData) => {
      logger.debug("✏️ Updating product:", productData);
      const payload = adaptProductUpdate(productData);
      const result = await apiService.updateProduct(payload);
      logger.debug("✅ Product updated:", result);
      return result;
    },
    onSuccess: (data, variables) => {
      // Tüm product query'lerini invalidate et - hem aktif hem pasif
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      // Güncellenmiş ürünün detay cache'ini de temizle
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(variables.productId.toString()),
      });
      logger.debug("🔄 Products cache invalidated");
    },
    onError: (error: ApiError) => {
      logger.error("❌ Update product error:", error);
    },
  });
};

// Ürün silme mutation
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string | number) => {
      logger.debug("🗑️ Deleting product:", productId);
      const result = await apiService.deleteProduct(productId);
      logger.debug("✅ Product deleted (status set to PASSIVE):", result);
      return result;
    },
    onSuccess: (data, productId) => {
      // Tüm product query'lerini invalidate et - hem aktif hem pasif
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      // Silinmiş ürünün detay cache'ini de temizle
      queryClient.removeQueries({
        queryKey: queryKeys.products.detail(productId.toString()),
      });
      logger.debug("🔄 Products cache invalidated after deletion");
    },
    onError: (error: ApiError) => {
      logger.error("❌ Delete product error:", error);
    },
  });
};

// Helper functions
export const useInvalidateProducts = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    logger.debug("🔄 Products manually invalidated");
  };
};
