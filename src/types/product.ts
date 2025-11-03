// src/types/product.ts

export const PRODUCT_STATUS_VALUES = ["ACTIVE", "PASSIVE"] as const;

export type ProductStatus = (typeof PRODUCT_STATUS_VALUES)[number];

// Backend DTO (Swagger: ProductDto)
export interface ProductResponse {
  productId: number;
  categoryId: number;
  name: string;
  categoryName?: string | null;
  taxRate?: number | null;
  inventoryCode?: string | null;
  status?: ProductStatus | null;
  createdDate?: number | string | null;
  lastModifiedDate?: number | string | null;
  creatorUserId?: number | null;
}

export type ProductsResponse = ProductResponse[];

// Domain modeli (frontend içerisinde kullanılacak)
export interface Product {
  productId: number;
  categoryId: number;
  name: string;
  categoryName: string;
  taxRate: number;
  inventoryCode: string;
  status: ProductStatus;
  createdDate: number;
  lastModifiedDate: number;
  creatorUserId: number | null;
}

// Frontend formları için tipler - sadece categoryId ve name gerekli
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
  status?: ProductStatus;
}

// UI'da gösterim için adapter - stock/price default 0 olacak
export interface ProductDisplayItem {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  taxRate: number;
  inventoryCode: string;
  status: ProductStatus;
  stock: number;
  price: number;
  createdDate: string;
  lastModifiedDate: string;
  isActive: boolean;
}

const parseEpoch = (value: number | string | null | undefined): number => {
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

const sanitizeString = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  return fallback;
};

const ensureNumber = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

// Backend DTO -> Domain modeli
export const adaptProductResponse = (product: ProductResponse): Product => ({
  productId: product.productId,
  categoryId: product.categoryId,
  name: sanitizeString(product.name, ""),
  categoryName: sanitizeString(product.categoryName, ""),
  taxRate: ensureNumber(product.taxRate, 0),
  inventoryCode: sanitizeString(product.inventoryCode, ""),
  status: product.status ?? "ACTIVE",
  createdDate: parseEpoch(product.createdDate),
  lastModifiedDate: parseEpoch(product.lastModifiedDate),
  creatorUserId:
    typeof product.creatorUserId === "number" && Number.isFinite(product.creatorUserId)
      ? product.creatorUserId
      : null,
});

export const adaptProductsResponse = (products: ProductResponse[]): Product[] =>
  products.map(adaptProductResponse);

const toIsoString = (value: number): string => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }
  return "";
};

// Domain modeli -> UI gösterimi
export const adaptProductForUI = (product: Product): ProductDisplayItem => ({
  id: product.productId.toString(),
  name: product.name,
  categoryId: product.categoryId.toString(),
  categoryName: product.categoryName,
  taxRate: product.taxRate,
  inventoryCode: product.inventoryCode,
  status: product.status,
  stock: 0,
  price: 0,
  createdDate: toIsoString(product.createdDate),
  lastModifiedDate: toIsoString(product.lastModifiedDate),
  isActive: product.status === "ACTIVE",
});

// UI'dan backend'e gönderim için adapter - sadece categoryId ve name
export type ProductCreateRequest = ProductFormData;
export const adaptProduct = (formData: ProductFormData): ProductCreateRequest => ({
  categoryId: Number(formData.categoryId),
  name: formData.name.trim(),
});

export type ProductUpdateRequest = ProductUpdateData;
export const adaptProductUpdate = (updateData: ProductUpdateData): ProductUpdateRequest => ({
  productId: Number(updateData.productId),
  categoryId: Number(updateData.categoryId),
  name: updateData.name.trim(),
});
