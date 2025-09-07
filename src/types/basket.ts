// src/types/basket.ts

// Basket item from GET /basket/all/{brokerId}
export interface BasketItem {
  id: number;
  brokerId: number;
  productId: number;
  productCount: number;
  tenantId: number;
  createdDate: string; // "2025-09-07T16:24:57.612Z" format
}

// Add to basket request (POST /basket/add)
export interface BasketAddRequest {
  brokerId: number;
  productId: number;
  productCount: number;
}

// Remove from basket request (POST /basket/remove)
export interface BasketRemoveRequest {
  brokerId: number;
  productId: number;
}

// Update basket item request (POST /basket/update)
export interface BasketUpdateRequest {
  brokerId: number;
  productId: number;
  productCount: number;
}

// UI için genişletilmiş basket item (product bilgilerini içeren)
export interface BasketDisplayItem {
  id: string;
  basketId: number;
  brokerId: number;
  productId: number;
  productName: string;
  productPrice: number;
  productCount: number;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
  taxAmount: number;
  totalWithTax: number;
  createdDate: string;
  formattedDate: string;
  canIncrease: boolean;
  canDecrease: boolean;
}

// Basket summary for calculations
export interface BasketSummary {
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  isEmpty: boolean;
}

// Form data for basket operations
export interface BasketFormData {
  productId: number;
  productCount: number;
}

export interface BasketUpdateFormData {
  productCount: number;
}

// Basket state for UI
export interface BasketState {
  items: BasketDisplayItem[];
  summary: BasketSummary;
  isLoading: boolean;
  error: string | null;
}

// Product info for basket (to combine with basket items)
export interface BasketProductInfo {
  productId: number;
  productName: string;
  price: number;
  taxRate: number;
  isAvailable: boolean;
  stockCount: number;
}

// Helper types
export type BasketOperation = "add" | "remove" | "update";

export interface BasketOperationResult {
  success: boolean;
  message: string;
  operation: BasketOperation;
  productId: number;
}

// Adapters
export const adaptBasketItemForUI = (
  basketItem: BasketItem,
  productInfo: BasketProductInfo
): BasketDisplayItem => {
  const unitPrice = productInfo.price;
  const totalPrice = unitPrice * basketItem.productCount;
  const taxAmount = (totalPrice * productInfo.taxRate) / 100;
  const totalWithTax = totalPrice + taxAmount;

  return {
    id: basketItem.id.toString(),
    basketId: basketItem.id,
    brokerId: basketItem.brokerId,
    productId: basketItem.productId,
    productName: productInfo.productName,
    productPrice: productInfo.price,
    productCount: basketItem.productCount,
    unitPrice,
    totalPrice,
    taxRate: productInfo.taxRate,
    taxAmount,
    totalWithTax,
    createdDate: basketItem.createdDate,
    formattedDate: new Date(basketItem.createdDate).toLocaleDateString("tr-TR"),
    canIncrease: basketItem.productCount < productInfo.stockCount,
    canDecrease: basketItem.productCount > 1,
  };
};

export const calculateBasketSummary = (
  items: BasketDisplayItem[]
): BasketSummary => {
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.productCount, 0);
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0);
  const grandTotal = items.reduce((sum, item) => sum + item.totalWithTax, 0);

  return {
    totalItems,
    totalQuantity,
    subtotal,
    totalTax,
    grandTotal,
    isEmpty: totalItems === 0,
  };
};

// Validation helpers
export const validateBasketItem = (item: BasketAddRequest): string | null => {
  if (!item.brokerId || item.brokerId <= 0) {
    return "Broker ID gerekli";
  }
  if (!item.productId || item.productId <= 0) {
    return "Ürün ID gerekli";
  }
  if (!item.productCount || item.productCount <= 0) {
    return "Ürün adedi 0'dan büyük olmalı";
  }
  return null;
};

export const validateBasketUpdate = (
  item: BasketUpdateRequest
): string | null => {
  if (!item.brokerId || item.brokerId <= 0) {
    return "Broker ID gerekli";
  }
  if (!item.productId || item.productId <= 0) {
    return "Ürün ID gerekli";
  }
  if (!item.productCount || item.productCount <= 0) {
    return "Ürün adedi 0'dan büyük olmalı";
  }
  return null;
};
