// src/hooks/api/useProducts.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService, ApiError } from "@/src/services/api";
import { queryKeys } from "./queryKeys";
import {
  Product,
  ProductFormData,
  ProductUpdateData,
  ProductSearchParams,
  ProductDisplayItem,
  adaptProductForUI,
} from "@/src/types/product";

// Types
export type {
  Product,
  ProductFormData,
  ProductUpdateData,
  ProductSearchParams,
};

// Backend'den gelen data'yı UI format'ına çevir - stock/price default 0
export const adaptProductsForUI = (
  products: Product[]
): ProductDisplayItem[] => {
  return products.map((product) => adaptProductForUI(product));
};

// Hooks

// Tüm ürünleri getir
export const useProducts = (
  params?: ProductSearchParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: async () => {
      console.log("🛍️ Fetching products from API...");
      const products = await apiService.getProducts(params);
      console.log("✅ Products fetched:", products);
      return products as Product[];
    },
    ...options,
  });
};

// Aktif ürünleri getir (UI için adapter ile)
export const useActiveProducts = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.products.active(),
    queryFn: async () => {
      console.log("🛍️ Fetching active products...");
      const products = await apiService.getProducts({ status: "ACTIVE" });
      return adaptProductsForUI(products);
    },
    ...options,
  });
};

// YENİ: Pasif ürünleri getir (UI için adapter ile)
export const usePassiveProducts = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.products.list({ status: "PASSIVE" }),
    queryFn: async () => {
      console.log("🛍️ Fetching passive products...");
      const products = await apiService.getProducts({ status: "PASSIVE" });
      console.log("✅ Passive products fetched:", products);
      return adaptProductsForUI(products);
    },
    ...options,
  });
};

// Ürün detayı getir
export const useProductDetail = (
  productId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: async () => {
      console.log("🛍️ Fetching product detail for ID:", productId);
      const product = await apiService.getProductDetail(productId);
      return product ? adaptProductForUI(product) : null;
    },
    enabled: !!productId && (options?.enabled ?? true),
  });
};

// Ürün arama - YENİ: status parametresi eklendi
export const useSearchProducts = (
  searchText: string,
  status: "ACTIVE" | "PASSIVE" = "ACTIVE",
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.products.search(`${searchText}-${status}`),
    queryFn: async () => {
      console.log(
        "🛍️ Searching products with text:",
        searchText,
        "status:",
        status
      );
      const products = await apiService.getProducts({
        productText: searchText,
        status: status,
      });
      return adaptProductsForUI(products);
    },
    enabled:
      !!searchText && searchText.length > 0 && (options?.enabled ?? true),
  });
};

// Ürün ekleme mutation - sadece categoryId ve name
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: ProductFormData) => {
      console.log("➕ Creating product:", productData);

      try {
        const result = await apiService.saveProduct(productData);
        console.log("✅ Product created - RAW RESPONSE:", result);
        console.log("✅ Response type:", typeof result);
        console.log("✅ Response keys:", result ? Object.keys(result) : "null");

        return result;
      } catch (error) {
        console.log("❌ API Error in product creation:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log("🎉 Product creation onSuccess called");
      console.log("🎉 Success data:", data);
      console.log("🎉 Variables used:", variables);

      // Cache'i invalidate et - hem aktif hem pasif ürünler
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.all,
        exact: false,
      });
      console.log("🔄 Products cache invalidated");

      // Biraz bekle ve sonra refetch yap
      setTimeout(() => {
        queryClient.refetchQueries({
          queryKey: queryKeys.products.all,
          exact: false,
        });
        console.log("🔄 Products force refetched");
      }, 500);
    },
    onError: (error: ApiError, variables) => {
      console.log("❌ Product creation onError called");
      console.log("❌ Error details:", error);
      console.log("❌ Variables used:", variables);
    },
    onSettled: (data, error, variables) => {
      console.log("⚡ Product creation onSettled called");
      console.log("⚡ Final data:", data);
      console.log("⚡ Final error:", error);

      // Her durumda cache'i temizle
      if (data && !error) {
        console.log("🧹 Cleaning all related product caches...");
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
      console.log("✏️ Updating product:", productData);
      const result = await apiService.updateProduct(productData);
      console.log("✅ Product updated:", result);
      return result;
    },
    onSuccess: (data, variables) => {
      // Tüm product query'lerini invalidate et - hem aktif hem pasif
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      // Güncellenmiş ürünün detay cache'ini de temizle
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(variables.productId.toString()),
      });
      console.log("🔄 Products cache invalidated");
    },
    onError: (error: ApiError) => {
      console.log("❌ Update product error:", error);
    },
  });
};

// Ürün silme mutation
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string | number) => {
      console.log("🗑️ Deleting product:", productId);
      const result = await apiService.deleteProduct(productId);
      console.log("✅ Product deleted (status set to PASSIVE):", result);
      return result;
    },
    onSuccess: (data, productId) => {
      // Tüm product query'lerini invalidate et - hem aktif hem pasif
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      // Silinmiş ürünün detay cache'ini de temizle
      queryClient.removeQueries({
        queryKey: queryKeys.products.detail(productId.toString()),
      });
      console.log("🔄 Products cache invalidated after deletion");
    },
    onError: (error: ApiError) => {
      console.log("❌ Delete product error:", error);
    },
  });
};

// Helper functions
export const useInvalidateProducts = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    console.log("🔄 Products manually invalidated");
  };
};
