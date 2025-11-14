// src/hooks/api/useProducts.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/types/apiTypes";
import {
  getProducts,
  getProductsPaginated,
  getProductDetail,
  saveProduct,
  updateProduct,
  deleteProduct,
} from "@/src/services/product";
import logger from "@/src/utils/logger";
import { queryKeys } from "./queryKeys";
import {
  Product,
  ProductFormData,
  ProductUpdateData,
  ProductSearchParams,
  ProductDisplayItem,
  ProductPageResponse,
  adaptProductForUI,
  adaptProductsResponse,
  adaptProductResponse,
  adaptProduct,
  adaptProductUpdate,
} from "@/src/types/product";

// Types
export type { Product, ProductFormData, ProductUpdateData, ProductSearchParams };

export interface ProductsPaginatedRequest extends ProductSearchParams {
  page?: number;
  size?: number;
  refreshKey?: number;
}

export interface ProductsPaginatedResult {
  content: ProductDisplayItem[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
}

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
      const products = await getProducts(params);
      logger.debug("✅ Products fetched:", products);
      return adaptProductsResponse(products);
    },
    ...options,
  });
};

export const useProductsPaginated = (
  params: ProductsPaginatedRequest,
  options?: { enabled?: boolean },
) => {
  return useQuery<ProductsPaginatedResult>({
    queryKey: queryKeys.products.list(params),
    queryFn: async () => {
      const { refreshKey: _refreshKey, ...apiParams } = params;
      logger.debug("🛍️ Fetching paginated products with params:", apiParams);

      const response: ProductPageResponse = await getProductsPaginated(apiParams);
      const normalized = adaptProductsResponse(response.content);
      const content = adaptProductsForUI(normalized);

      return {
        content,
        totalPages: response.totalPages ?? 1,
        totalElements: response.totalElements ?? content.length,
        size: response.size ?? apiParams.size ?? content.length,
        number: response.number ?? apiParams.page ?? 0,
        numberOfElements: response.numberOfElements ?? content.length,
        first: response.first ?? (apiParams.page ?? 0) === 0,
        last: response.last ?? true,
      };
    },
    enabled: options?.enabled ?? true,
    ...options,
  });
};

// Aktif ürünleri getir (UI için adapter ile)
export const useActiveProducts = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.products.active(),
    queryFn: async () => {
      logger.debug("🛍️ Fetching active products...");
      const products = await getProducts({ status: "ACTIVE" });
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
      const products = await getProducts({ status: "PASSIVE" });
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
      const product = await getProductDetail(productId);
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
      const products = await getProducts({
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
        const result = await saveProduct(payload);
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

      // ÖNEMLİ: Inventory cache'ini de invalidate et çünkü yeni ürün stok takipte görünmeli
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.all,
        exact: false,
      });
      logger.debug("🔄 Inventory cache invalidated (new product added)");

      // Biraz bekle ve sonra refetch yap
      setTimeout(() => {
        queryClient.refetchQueries({
          queryKey: queryKeys.products.all,
          exact: false,
        });
        queryClient.refetchQueries({
          queryKey: queryKeys.inventory.all,
          exact: false,
        });
        logger.debug("🔄 Products and Inventory force refetched");
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
        logger.debug("🧹 Cleaning all related product and inventory caches...");
        queryClient.removeQueries({
          queryKey: queryKeys.products.all,
          exact: false,
        });
        queryClient.removeQueries({
          queryKey: queryKeys.inventory.all,
          exact: false,
        });
        // Hemen yeniden fetch yap
        queryClient.prefetchQuery({
          queryKey: queryKeys.products.all,
          queryFn: () => getProducts(),
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
      const result = await updateProduct(payload);
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
      // Inventory cache'ini de invalidate et (ürün adı veya kategori değişmiş olabilir)
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      logger.debug("🔄 Products and Inventory cache invalidated");
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
      const result = await deleteProduct(productId);
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
      // Inventory cache'ini de invalidate et (ürün pasif oldu, stokta görünmemeli)
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      logger.debug("🔄 Products and Inventory cache invalidated after deletion");
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
