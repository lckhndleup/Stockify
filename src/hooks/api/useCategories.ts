// src/hooks/api/useCategories.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService, ApiError } from "@/src/services/api";
import logger from "@/src/utils/logger";
import { queryKeys } from "./queryKeys";
import type { Category, CategoryFormData, CategoryUpdateData } from "@/src/types/category";

// Backend'den gelen data'yı UI format'ına çevir
export const adaptCategoryForUI = (category: Category) => ({
  id: category.categoryId.toString(),
  name: category.name,
  taxRate: category.taxRate,
  createdDate: category.createdDate,
  isActive: true, // Backend'den gelen tüm kategoriler aktif
});

// Hooks

// Tüm kategorileri getir
export const useCategories = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: async () => {
      logger.debug("🏷️ Fetching categories from API...");
      const categories = await apiService.getCategories();
      logger.debug("✅ Categories fetched:", categories);
      return categories as Category[];
    },
    ...options,
  });
};

// Aktif kategorileri getir (UI için adapter ile)
export const useActiveCategories = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.categories.active(),
    queryFn: async () => {
      logger.debug("🏷️ Fetching active categories...");
      const categories = await apiService.getCategories();
      return categories.map(adaptCategoryForUI);
    },
    ...options,
  });
};

// Kategori ekleme mutation
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData: CategoryFormData) => {
      logger.debug("➕ Creating category:", categoryData);

      try {
        const result = await apiService.saveCategory(categoryData);
        logger.debug("✅ Category created - RAW RESPONSE:", result);
        logger.debug("✅ Response type:", typeof result);
        logger.debug("✅ Response keys:", result ? Object.keys(result) : "null");

        return result;
      } catch (error) {
        logger.error("❌ API Error in mutation:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      logger.debug("🎉 Mutation onSuccess called");
      logger.debug("🎉 Success data:", data);
      logger.debug("🎉 Variables used:", variables);

      // Cache'i invalidate et - daha aggressive
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
        exact: false, // Tüm category query'leri invalidate et
      });
      logger.debug("🔄 Categories cache invalidated (aggressive)");

      // Biraz bekle ve sonra refetch yap
      setTimeout(() => {
        queryClient.refetchQueries({
          queryKey: queryKeys.categories.all,
          exact: false,
        });
        logger.debug("🔄 Categories force refetched (delayed)");
      }, 500);
    },
    onError: (error: ApiError, variables) => {
      logger.debug("❌ Mutation onError called");
      logger.error("❌ Error details:", error);
      logger.debug("❌ Variables used:", variables);
    },
    onSettled: (data, error, _variables) => {
      logger.debug("⚡ Mutation onSettled called");
      logger.debug("⚡ Final data:", data);
      logger.debug("⚡ Final error:", error);

      // Her durumda cache'i temizle
      if (data && !error) {
        logger.debug("🧹 Cleaning all related caches...");
        queryClient.removeQueries({
          queryKey: queryKeys.categories.all,
          exact: false,
        });
        // Hemen yeniden fetch yap
        queryClient.prefetchQuery({
          queryKey: queryKeys.categories.all,
          queryFn: () => apiService.getCategories(),
        });
      }
    },
  });
};

// Kategori güncelleme mutation
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData: CategoryUpdateData) => {
      logger.debug("✏️ Updating category:", categoryData);
      const result = await apiService.updateCategory(categoryData);
      logger.debug("✅ Category updated:", result);
      return result;
    },
    onSuccess: () => {
      // Tüm category query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      logger.debug("🔄 Categories cache invalidated");
    },
    onError: (error: ApiError) => {
      logger.error("❌ Update category error:", error);
    },
  });
};

// Helper functions
export const useInvalidateCategories = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    logger.debug("🔄 Categories manually invalidated");
  };
};

// Category by ID için gelecekte kullanılabilir
export const useCategoryById = (categoryId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.categories.detail(categoryId),
    queryFn: async () => {
      const categories = await apiService.getCategories();
      const category = categories.find((c: Category) => c.categoryId.toString() === categoryId);
      return category ? adaptCategoryForUI(category) : null;
    },
    enabled: !!categoryId && (options?.enabled ?? true),
  });
};

// Kategori silme mutation - YENİ EKLENEN
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string | number) => {
      logger.debug("🗑️ Deleting category:", categoryId);
      const result = await apiService.deleteCategory(categoryId);
      logger.debug("✅ Category deleted:", result);
      return result;
    },
    onSuccess: (data, categoryId) => {
      // Tüm category query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      // Silinmiş kategorinin detay cache'ini de temizle
      queryClient.removeQueries({
        queryKey: queryKeys.categories.detail(categoryId.toString()),
      });
      logger.debug("🔄 Categories cache invalidated after deletion");
    },
    onError: (error: ApiError) => {
      logger.error("❌ Delete category error:", error);
    },
  });
};
