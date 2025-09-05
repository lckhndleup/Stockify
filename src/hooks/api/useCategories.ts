// src/hooks/api/useCategories.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService, ApiError } from "@/src/services/api";
import { queryKeys } from "./queryKeys";

// Types
export interface Category {
  categoryId: number;
  name: string;
  taxRate: number;
  createdDate: string;
}

export interface CategoryFormData {
  name: string;
  taxRate: number;
}

export interface CategoryUpdateData {
  categoryId: number;
  name: string;
  taxRate: number;
}

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
      console.log("🏷️ Fetching categories from API...");
      const categories = await apiService.getCategories();
      console.log("✅ Categories fetched:", categories);
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
      console.log("🏷️ Fetching active categories...");
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
      console.log("➕ Creating category:", categoryData);

      try {
        const result = await apiService.saveCategory(categoryData);
        console.log("✅ Category created - RAW RESPONSE:", result);
        console.log("✅ Response type:", typeof result);
        console.log("✅ Response keys:", result ? Object.keys(result) : "null");

        return result;
      } catch (error) {
        console.log("❌ API Error in mutation:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log("🎉 Mutation onSuccess called");
      console.log("🎉 Success data:", data);
      console.log("🎉 Variables used:", variables);

      // Cache'i invalidate et - daha aggressive
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
        exact: false, // Tüm category query'leri invalidate et
      });
      console.log("🔄 Categories cache invalidated (aggressive)");

      // Biraz bekle ve sonra refetch yap
      setTimeout(() => {
        queryClient.refetchQueries({
          queryKey: queryKeys.categories.all,
          exact: false,
        });
        console.log("🔄 Categories force refetched (delayed)");
      }, 500);
    },
    onError: (error: ApiError, variables) => {
      console.log("❌ Mutation onError called");
      console.log("❌ Error details:", error);
      console.log("❌ Variables used:", variables);
    },
    onSettled: (data, error, variables) => {
      console.log("⚡ Mutation onSettled called");
      console.log("⚡ Final data:", data);
      console.log("⚡ Final error:", error);

      // Her durumda cache'i temizle
      if (data && !error) {
        console.log("🧹 Cleaning all related caches...");
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
      console.log("✏️ Updating category:", categoryData);
      const result = await apiService.updateCategory(categoryData);
      console.log("✅ Category updated:", result);
      return result;
    },
    onSuccess: () => {
      // Tüm category query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      console.log("🔄 Categories cache invalidated");
    },
    onError: (error: ApiError) => {
      console.log("❌ Update category error:", error);
    },
  });
};

// Helper functions
export const useInvalidateCategories = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    console.log("🔄 Categories manually invalidated");
  };
};

// Category by ID için gelecekte kullanılabilir
export const useCategoryById = (
  categoryId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.categories.detail(categoryId),
    queryFn: async () => {
      const categories = await apiService.getCategories();
      const category = categories.find(
        (c: Category) => c.categoryId.toString() === categoryId
      );
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
      console.log("🗑️ Deleting category:", categoryId);
      const result = await apiService.deleteCategory(categoryId);
      console.log("✅ Category deleted:", result);
      return result;
    },
    onSuccess: (data, categoryId) => {
      // Tüm category query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      // Silinmiş kategorinin detay cache'ini de temizle
      queryClient.removeQueries({
        queryKey: queryKeys.categories.detail(categoryId.toString()),
      });
      console.log("🔄 Categories cache invalidated after deletion");
    },
    onError: (error: ApiError) => {
      console.log("❌ Delete category error:", error);
    },
  });
};
