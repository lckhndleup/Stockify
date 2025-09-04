// src/types/category.ts
export interface Category {
  categoryId: number;
  name: string;
  taxRate: number;
  createdDate: string;
}

// Frontend'de kullanım için adapter types
export interface CategoryFormData {
  name: string;
  taxRate: number;
}

export interface CategoryUpdateData {
  categoryId: number;
  name: string;
  taxRate: number;
}

// UI'da gösterim için adapter
export interface CategoryDisplayItem {
  id: string; // categoryId'yi string'e çevireceğiz
  name: string;
  taxRate: number;
  createdDate: string;
  isActive: boolean; // Her zaman true olacak (backend'de silinmiş olanlar gelmiyor)
}

// API Responses
export interface CategoryResponse {
  categoryId: number;
  name: string;
  taxRate: number;
  createdDate: string;
}

export type CategoriesResponse = CategoryResponse[];
