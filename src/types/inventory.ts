// src/types/inventory.ts
import type { ProductStatus } from "./product";

export const INVENTORY_STATUS_VALUES = ["AVAILABLE", "OUT_OF_INVENTORY", "CRITICAL"] as const;

export type InventoryStatus = (typeof INVENTORY_STATUS_VALUES)[number];

export interface InventoryProductResponse {
  productId?: number | string | null;
  categoryId?: number | string | null;
  categoryName?: string | null;
  taxRate?: number | string | null;
  inventoryCode?: string | null;
  name?: string | null;
  status?: ProductStatus | null;
  createdDate?: number | string | null;
  lastModifiedDate?: number | string | null;
  creatorUserId?: number | string | null;
}

export interface InventoryResponse {
  inventoryId?: number | string | null;
  product?: InventoryProductResponse | null;
  price?: number | string | null;
  totalPrice?: number | string | null;
  productCount?: number | string | null;
  criticalProductCount?: number | string | null;
  active?: boolean | string | null;
  status?: InventoryStatus | null;
  createdDate?: number | string | null;
  lastModifiedDate?: number | string | null;
}

export type InventoryListResponse = InventoryResponse[];

export interface InventoryProduct {
  productId: number;
  categoryId: number;
  categoryName: string;
  taxRate: number;
  inventoryCode: string;
  name: string;
  status: ProductStatus;
  createdDate: number;
  lastModifiedDate: number;
  creatorUserId: number | null;
}

export interface Inventory {
  inventoryId: number;
  product: InventoryProduct;
  price: number;
  totalPrice: number;
  productCount: number;
  criticalProductCount: number;
  active: boolean;
  status: InventoryStatus;
  createdDate: number;
  lastModifiedDate: number;
}

// Bu alias mevcut kullanımları kırmadan domain tipini paylaşmamızı sağlıyor
export type InventoryItem = Inventory;

export interface InventoryDisplayItem {
  id: string;
  inventoryId: number;
  productId: number;
  productName: string;
  categoryName: string;
  inventoryCode: string;
  price: number;
  totalPrice: number;
  productCount: number;
  criticalProductCount: number;
  status: InventoryStatus;
  createdDate: string;
  lastModifiedDate: string;
  active: boolean;
  productStatus: ProductStatus;
  // Hesaplanan alanlar
  isCritical: boolean;
  isOutOfStock: boolean;
  statusColor: string;
  statusText: string;
}

export interface InventoryCreateRequest {
  productId: number;
  price: number;
  productCount: number;
  criticalProductCount: number;
}

export interface InventoryUpdateRequest {
  inventoryId: number;
  price: number;
  productCount: number;
  criticalProductCount: number;
  active: boolean;
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

const ensureNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const ensureBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
  }

  return fallback;
};

const toIsoString = (epoch: number): string => {
  if (typeof epoch === "number" && Number.isFinite(epoch) && epoch > 0) {
    const date = new Date(epoch);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  return "";
};

const deriveInventoryStatus = (
  status: unknown,
  productCount: number,
  criticalProductCount: number,
): InventoryStatus => {
  if (status === "OUT_OF_INVENTORY" || productCount <= 0) {
    return "OUT_OF_INVENTORY";
  }

  const isCritical =
    productCount > 0 && criticalProductCount > 0 && productCount <= criticalProductCount;
  if (status === "CRITICAL" || isCritical) {
    return "CRITICAL";
  }

  return "AVAILABLE";
};

const isInventory = (item: InventoryResponse | Inventory): item is Inventory => {
  return (
    typeof (item as Inventory).inventoryId === "number" &&
    typeof (item as Inventory).price === "number" &&
    typeof (item as Inventory).active === "boolean"
  );
};

export const adaptInventoryResponse = (item: InventoryResponse): Inventory => {
  const product = item.product ?? {};

  const productId = ensureNumber(product.productId, 0);
  const categoryId = ensureNumber(product.categoryId, 0);
  const price = ensureNumber(item.price, 0);
  const productCount = ensureNumber(item.productCount, 0);
  const criticalProductCount = ensureNumber(item.criticalProductCount, 0);
  const totalPrice = ensureNumber(item.totalPrice, price * productCount);
  const status = deriveInventoryStatus(item.status, productCount, criticalProductCount);

  // Güvenli string normalizasyonu - boş string yerine placeholder
  const productName = sanitizeString(product.name, "İsimsiz Ürün");
  const categoryName = sanitizeString(product.categoryName, "Kategori Yok");
  const inventoryCode = sanitizeString(product.inventoryCode, "");

  return {
    inventoryId: ensureNumber(item.inventoryId, 0),
    product: {
      productId,
      categoryId,
      categoryName,
      taxRate: ensureNumber(product.taxRate, 0),
      inventoryCode,
      name: productName,
      status: (product.status ?? "ACTIVE") as ProductStatus,
      createdDate: parseEpoch(product.createdDate),
      lastModifiedDate: parseEpoch(product.lastModifiedDate),
      creatorUserId: (() => {
        const value = product.creatorUserId;
        if (typeof value === "number" && Number.isFinite(value)) return value;
        if (typeof value === "string") {
          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
      })(),
    },
    price,
    totalPrice,
    productCount,
    criticalProductCount,
    active: ensureBoolean(item.active, status !== "OUT_OF_INVENTORY"),
    status,
    createdDate: parseEpoch(item.createdDate),
    lastModifiedDate: parseEpoch(item.lastModifiedDate),
  };
};

export const adaptInventoriesResponse = (items: InventoryResponse[]): Inventory[] =>
  items.map(adaptInventoryResponse);

const statusLabelMap: Record<InventoryStatus, string> = {
  AVAILABLE: "Normal",
  OUT_OF_INVENTORY: "Tükendi",
  CRITICAL: "Kritik",
};

const statusColorMap: Record<InventoryStatus, string> = {
  AVAILABLE: "bg-green-500",
  OUT_OF_INVENTORY: "bg-red-500",
  CRITICAL: "bg-yellow-500",
};

export const adaptInventoryForUI = (item: InventoryResponse | Inventory): InventoryDisplayItem => {
  const inventory = isInventory(item) ? item : adaptInventoryResponse(item);

  const isOutOfStock = inventory.productCount <= 0;
  const isCritical =
    inventory.productCount > 0 &&
    inventory.criticalProductCount > 0 &&
    inventory.productCount <= inventory.criticalProductCount;

  const status = isOutOfStock ? "OUT_OF_INVENTORY" : isCritical ? "CRITICAL" : inventory.status;

  // Güvenli string normalizasyonu
  const productName = inventory.product?.name || "İsimsiz Ürün";
  const categoryName = inventory.product?.categoryName || "Kategori Yok";
  const inventoryCode = inventory.product?.inventoryCode || "";

  return {
    id: inventory.inventoryId.toString(),
    inventoryId: inventory.inventoryId,
    productId: inventory.product.productId,
    productName,
    categoryName,
    inventoryCode,
    price: inventory.price,
    totalPrice: inventory.totalPrice,
    productCount: inventory.productCount,
    criticalProductCount: inventory.criticalProductCount,
    status,
    createdDate: toIsoString(inventory.createdDate),
    lastModifiedDate: toIsoString(inventory.lastModifiedDate),
    active: inventory.active,
    productStatus: inventory.product.status,
    isCritical,
    isOutOfStock,
    statusColor: statusColorMap[status],
    statusText: statusLabelMap[status],
  };
};

export const adaptInventoryListForUI = (
  items: Array<InventoryResponse | Inventory>,
): InventoryDisplayItem[] => items.map((item) => adaptInventoryForUI(item));
