// src/types/sales.ts
// SalesController: /sales/products, /sales/calculate, /sales/confirm, /sales/cancel

/** GET /sales/products */
export interface SalesProduct {
  productId: number;
  productName: string;
  productCount: number; // stok
  price: number; // birim fiyat
  taxRate: number; // %
}
export type SalesProductsResponse = SalesProduct[];

/** UI-friendly ürün tipi */
export interface SalesProductDisplayItem {
  id: number;
  name: string;
  stock: number;
  unitPrice: number;
  taxRate: number;
}
export const adaptSalesProductForUI = (p: SalesProduct): SalesProductDisplayItem => ({
  id: p.productId,
  name: p.productName,
  stock: p.productCount,
  unitPrice: p.price,
  taxRate: p.taxRate,
});
export const adaptSalesProductsForUI = (list: SalesProduct[]): SalesProductDisplayItem[] =>
  list.map(adaptSalesProductForUI);

// ---------- Request DTOs ----------
export interface SalesCalculateRequest {
  brokerId: number;
  createInvoice: boolean;
}
export interface SalesConfirmRequest {
  brokerId: number;
  createInvoice: boolean;
}
export interface SalesCancelRequest {
  brokerId: number;
  createInvoice: boolean;
}

// ---------- Response DTOs ----------
export interface SalesItem {
  salesId?: number; // confirm'de olabilir
  productId: number;
  productName: string;
  productCount: number;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
  taxPrice: number; // ✅ kalem KDV tutarı (backend: taxPrice)
  totalPriceWithTax: number;
}
export interface SalesSummary {
  documentNumber?: string; // confirm
  salesItems: SalesItem[];
  subtotalPrice: number;
  discountPrice: number;
  discountRate: number;
  totalPrice: number; // iskontodan sonraki ara toplam (KDV hariç)
  totalTaxPrice: number; // ✅ toplam KDV (backend: totalTaxPrice)
  totalPriceWithTax: number; // KDV dahil genel toplam
  downloadUrl?: string; // confirm
  invoiceDownloadUrl?: string; // confirm + fatura PDF
}

export type SalesCalculateResponse = SalesSummary;
export type SalesConfirmResponse = SalesSummary;

export interface SalesCancelResponse {
  success: boolean;
  message: string;
}
