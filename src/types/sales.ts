// src/types/sales.ts

// Product type for sales (from GET /sales/products)
export interface SalesProduct {
  productId: number;
  productName: string;
  productCount: number;
  price: number;
  taxRate: number;
}

// Sales item in the sales response
export interface SalesItem {
  id: number;
  salesId: number;
  productId: number;
  productName: string;
  productCount: number;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
  taxPrice: number;
  totalPriceWithTax: number;
  createdDate: number;
}

// Sales calculation/confirmation request
export interface SalesRequest {
  brokerId: number;
  createInvoice: boolean;
}

// Sales response (from POST /sales/calculate and POST /sales/confirm)
export interface SalesResponse {
  salesId: number;
  documentNumber: string;
  salesItems: SalesItem[];
  subtotalPrice: number;
  discountRate: number;
  discountPrice: number;
  totalPrice: number;
  totalTaxPrice: number;
  totalPriceWithTax: number;
}

// UI için kullanılacak types
export interface SalesFormData {
  createInvoice: boolean;
}

export interface SalesDisplayItem {
  id: string;
  salesId: number;
  documentNumber: string;
  totalAmount: number;
  totalTax: number;
  grandTotal: number;
  itemCount: number;
  createdDate: string;
}

// Sales summary for confirmation page
export interface SalesSummary {
  totalItems: number;
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  documentNumber?: string;
}

// Adapters
export const adaptSalesProductsForUI = (products: SalesProduct[]) => {
  return products.map((product) => ({
    ...product,
    id: product.productId.toString(),
    formattedPrice: `₺${product.price.toFixed(2)}`,
    isInStock: product.productCount > 0,
  }));
};

export const adaptSalesResponseForUI = (
  response: SalesResponse
): SalesDisplayItem => {
  return {
    id: response.salesId.toString(),
    salesId: response.salesId,
    documentNumber: response.documentNumber,
    totalAmount: response.totalPrice,
    totalTax: response.totalTaxPrice,
    grandTotal: response.totalPriceWithTax,
    itemCount: response.salesItems.length,
    createdDate: new Date().toISOString(), // Backend'de tarih yok, current date kullanıyoruz
  };
};

export const calculateSalesSummary = (
  salesItems: SalesItem[]
): SalesSummary => {
  return {
    totalItems: salesItems.reduce((sum, item) => sum + item.productCount, 0),
    subtotal: salesItems.reduce((sum, item) => sum + item.totalPrice, 0),
    tax: salesItems.reduce((sum, item) => sum + item.taxPrice, 0),
    discount: 0, // Backend'de discount hesaplaması var ama item level'da yok
    grandTotal: salesItems.reduce(
      (sum, item) => sum + item.totalPriceWithTax,
      0
    ),
  };
};
