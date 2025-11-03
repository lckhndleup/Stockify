// src/types/category.ts

export const CATEGORY_STATUS_VALUES = ["ACTIVE", "PASSIVE"] as const;

export type CategoryStatus = (typeof CATEGORY_STATUS_VALUES)[number];

// Backend DTO (Swagger: CategoryDto)
export interface CategoryResponse {
  categoryId: number;
  name: string;
  status?: CategoryStatus | null;
  taxRate: number;
  createdDate?: number | string | null;
}

// Domain modeli (frontend içerisinde kullanılacak)
export interface Category {
  categoryId: number;
  name: string;
  status: CategoryStatus;
  taxRate: number;
  createdDate: number;
}

// Frontend formları için tipler
export interface CategoryFormData {
  name: string;
  taxRate: number;
}

export interface CategoryUpdateData {
  categoryId: number;
  name: string;
  taxRate: number;
}

export type CategoryCreateRequest = CategoryFormData;
export type CategoryUpdateRequest = CategoryUpdateData;

// UI'da gösterim için adapter tipi
export interface CategoryDisplayItem {
  id: string;
  name: string;
  taxRate: number;
  createdDate: string;
  isActive: boolean;
}

export type CategoriesResponse = CategoryResponse[];

const parseCreatedDate = (value: number | string | null | undefined): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
      return numeric;
    }

    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
};

// Backend DTO -> Domain modeli
export const adaptCategoryResponse = (category: CategoryResponse): Category => ({
  categoryId: category.categoryId,
  name: category.name,
  status: category.status ?? "ACTIVE",
  taxRate: category.taxRate,
  createdDate: parseCreatedDate(category.createdDate),
});

// Domain modeli -> UI gösterimi
export const adaptCategoryForUI = (category: Category): CategoryDisplayItem => {
  let createdDate = "";

  if (category.createdDate) {
    const date = new Date(category.createdDate);
    createdDate = Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  return {
    id: category.categoryId.toString(),
    name: category.name,
    taxRate: category.taxRate,
    createdDate,
    isActive: category.status === "ACTIVE",
  };
};

export const adaptCategoriesForUI = (categories: Category[]): CategoryDisplayItem[] =>
  categories.map(adaptCategoryForUI);
