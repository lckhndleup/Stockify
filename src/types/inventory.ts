// src/types/inventory.ts
export interface InventoryItem {
  inventoryId: number;
  product: {
    productId: number;
    categoryId: number;
    categoryName: string;
    taxRate: number;
    inventoryCode: string;
    name: string;
    status: "ACTIVE" | "PASSIVE";
    createdDate: number;
    lastModifiedDate: number;
  };
  price: number;
  totalPrice: number;
  productCount: number;
  criticalProductCount: number;
  status: "AVAILABLE" | "OUT_OF_STOCK" | "CRITICAL";
  createdDate: number;
  lastModifiedDate: number;
}

// API Request types
export interface InventoryUpdateRequest {
  inventoryId: number;
  price: number;
  productCount: number;
  criticalProductCount: number;
}

// UI Display types
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
  status: "AVAILABLE" | "OUT_OF_STOCK" | "CRITICAL";
  createdDate: string;
  lastModifiedDate: string;
  // Calculated fields
  isCritical: boolean;
  isOutOfStock: boolean;
  statusColor: string;
  statusText: string;
}

// API Responses
export type InventoryListResponse = InventoryItem[];

// Adapters
export const adaptInventoryForUI = (
  item: InventoryItem
): InventoryDisplayItem => {
  const isCritical =
    item.productCount > 0 && item.productCount <= item.criticalProductCount;
  const isOutOfStock = item.productCount === 0;

  let statusColor = "bg-green-500";
  let statusText = "Normal";

  if (isOutOfStock) {
    statusColor = "bg-red-500";
    statusText = "Tükendi";
  } else if (isCritical) {
    statusColor = "bg-yellow-500";
    statusText = "Kritik";
  }

  return {
    id: item.inventoryId.toString(),
    inventoryId: item.inventoryId,
    productId: item.product.productId,
    productName: item.product.name,
    categoryName: item.product.categoryName,
    inventoryCode: item.product.inventoryCode,
    price: item.price,
    totalPrice: item.totalPrice,
    productCount: item.productCount,
    criticalProductCount: item.criticalProductCount,
    status: item.status,
    createdDate: new Date(item.createdDate).toISOString(),
    lastModifiedDate: new Date(item.lastModifiedDate).toISOString(),
    isCritical,
    isOutOfStock,
    statusColor,
    statusText,
  };
};

export const adaptInventoryListForUI = (
  items: InventoryItem[]
): InventoryDisplayItem[] => {
  return items.map(adaptInventoryForUI);
};
