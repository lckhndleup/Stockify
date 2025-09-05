// src/types/product.ts - Updated: Stock/Price removed from forms
export interface Product {
  productId: number;
  categoryId: number;
  categoryName: string;
  taxRate: number;
  inventoryCode: string;
  name: string;
  status: "ACTIVE" | "PASSIVE";
  createdDate: number;
  lastModifiedDate: number;
}

// Frontend'de kullanım için form types - UPDATED: sadece categoryId ve name
export interface ProductFormData {
  categoryId: number;
  name: string;
}

export interface ProductUpdateData {
  productId: number;
  categoryId: number;
  name: string;
}

// Query parameters
export interface ProductSearchParams {
  productText?: string;
  status?: "ACTIVE" | "PASSIVE";
}

// UI'da gösterim için adapter - stock/price default 0 olacak
export interface ProductDisplayItem {
  id: string; // productId'yi string'e çevireceğiz
  name: string;
  categoryId: string; // UI için string
  categoryName: string;
  taxRate: number;
  inventoryCode: string;
  status: "ACTIVE" | "PASSIVE";
  stock: number; // Default 0 - kullanıcı girmeyecek
  price: number; // Default 0 - kullanıcı girmeyecek
  createdDate: string;
  lastModifiedDate: string;
  isActive: boolean; // status === "ACTIVE"
}

// API Responses
export interface ProductResponse {
  productId: number;
  categoryId: number;
  categoryName: string;
  taxRate: number;
  inventoryCode: string;
  name: string;
  status: "ACTIVE" | "PASSIVE";
  createdDate: number;
  lastModifiedDate: number;
}

export type ProductsResponse = ProductResponse[];

// Backend'den gelen data'yı UI format'ına çeviren adapter - stock/price default 0
export const adaptProductForUI = (product: Product): ProductDisplayItem => ({
  id: product.productId.toString(),
  name: product.name,
  categoryId: product.categoryId.toString(),
  categoryName: product.categoryName,
  taxRate: product.taxRate,
  inventoryCode: product.inventoryCode,
  status: product.status,
  stock: 0, // Default value - kullanıcı girmeyecek
  price: 0, // Default value - kullanıcı girmeyecek
  createdDate: new Date(product.createdDate).toISOString(),
  lastModifiedDate: new Date(product.lastModifiedDate).toISOString(),
  isActive: product.status === "ACTIVE",
});

// UI'dan backend'e gönderim için adapter - sadece categoryId ve name
export const adaptProductForBackend = (
  formData: ProductFormData
): ProductFormData => ({
  categoryId: formData.categoryId,
  name: formData.name.trim(),
});

export const adaptProductUpdateForBackend = (
  updateData: ProductUpdateData
): ProductUpdateData => ({
  productId: updateData.productId,
  categoryId: updateData.categoryId,
  name: updateData.name.trim(),
});
