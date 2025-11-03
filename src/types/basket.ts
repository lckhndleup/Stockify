// src/types/basket.ts
// Basket uçları: GET /sales/basket/{brokerId}, POST /basket/{add|remove|update}

// ---------- Request DTO'ları ----------
export interface BasketAddRequest {
  brokerId: number;
  productId: number;
  productCount: number;
}

export interface BasketRemoveRequest {
  brokerId: number;
  productId: number;
}

export interface BasketUpdateRequest {
  brokerId: number;
  productId: number;
  productCount: number;
}

export interface BasketMutationResponse {
  success: boolean;
  message: string;
}

// ---------- Response DTO'ları ----------
export interface BasketItemResponse {
  productId?: number | string | null;
  productName?: string | null;
  productCount?: number | string | null;
  unitPrice?: number | string | null;
  totalPrice?: number | string | null;
  taxRate?: number | string | null;
  taxPrice?: number | string | null;
  totalPriceWithTax?: number | string | null;
}

export type BasketResponse = BasketItemResponse[];

export interface BasketItem {
  productId: number;
  productName: string;
  productCount: number;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
  taxPrice: number;
  totalPriceWithTax: number;
}

// ---------- Yardımcılar ----------
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

const sanitizeString = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  return fallback;
};

const adaptBasketItemResponse = (item: BasketItemResponse): BasketItem => {
  const productId = ensureNumber(item.productId, 0);
  const productCount = ensureNumber(item.productCount, 0);
  const unitPrice = ensureNumber(item.unitPrice, 0);
  const totalPrice = ensureNumber(item.totalPrice, unitPrice * productCount);
  const taxPrice = ensureNumber(item.taxPrice, 0);
  const totalPriceWithTax = ensureNumber(item.totalPriceWithTax, totalPrice + taxPrice);

  return {
    productId,
    productName: sanitizeString(item.productName, ""),
    productCount,
    unitPrice,
    totalPrice,
    taxRate: ensureNumber(item.taxRate, 0),
    taxPrice,
    totalPriceWithTax,
  };
};

const isBasketItem = (item: BasketItem | BasketItemResponse): item is BasketItem => {
  return typeof (item as BasketItem).productId === "number";
};

// ---------- Domain & UI Adapters ----------
export const adaptBasketResponse = (items: BasketResponse): BasketItem[] =>
  items.map((item) => adaptBasketItemResponse(item));

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

export const adaptBasketItemForUI = (item: BasketItem | BasketItemResponse): BasketItemDisplay => {
  const normalized = isBasketItem(item) ? item : adaptBasketItemResponse(item);

  return {
    id: String(normalized.productId),
    name: normalized.productName,
    quantity: normalized.productCount,
    unitPrice: normalized.unitPrice,
    taxRate: normalized.taxRate,
    subtotal: normalized.totalPrice,
    tax: normalized.taxPrice,
    total: normalized.totalPriceWithTax,
  };
};

export const adaptBasketForUI = (
  list: Array<BasketItem | BasketItemResponse>,
): BasketItemDisplay[] => list.map((item) => adaptBasketItemForUI(item));

export const adaptBasketResponseForUI = (items: BasketResponse): BasketItemDisplay[] =>
  adaptBasketForUI(items);
