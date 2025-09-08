// src/types/basket.ts
// Basket uçları: GET /sales/basket/{brokerId}, POST /basket/add, POST /basket/remove

// ---------- Request DTOs ----------
export interface BasketAddRequest {
  brokerId: number;
  productId: number;
  productCount: number;
}
export interface BasketRemoveRequest {
  brokerId: number;
  productId: number;
}

// Basket update
export interface BasketUpdateRequest {
  brokerId: number;
  productId: number;
  productCount: number;
}

// ---------- Response DTOs ----------
export interface BackendBasketItem {
  productId: number;
  productName: string;
  productCount: number;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
  taxPrice: number;
  totalPriceWithTax: number;
}
export type BasketResponse = BackendBasketItem[];

// ---------- UI adapters ----------
export interface BasketItemDisplay {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  subtotal: number;
  tax: number;
  total: number;
}
export const adaptBasketItemForUI = (
  i: BackendBasketItem
): BasketItemDisplay => ({
  id: String(i.productId),
  name: i.productName,
  quantity: i.productCount,
  unitPrice: i.unitPrice,
  taxRate: i.taxRate,
  subtotal: i.totalPrice,
  tax: i.taxPrice,
  total: i.totalPriceWithTax,
});
export const adaptBasketForUI = (
  list: BackendBasketItem[]
): BasketItemDisplay[] => list.map(adaptBasketItemForUI);
