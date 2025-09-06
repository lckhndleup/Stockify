// src/types/salesProduct.ts

// Backend'den gelen sales product verisi (Swagger'a göre)
export interface BackendSalesProduct {
  productId: number;
  productName: string;
  productCount: number;
  price: number;
  taxRate: number;
}

// UI'da kullanılan sales product verisi
export interface SalesProductDisplayItem {
  id: string; // productId'yi string'e çevireceğiz
  name: string; // productName
  stock: number; // productCount
  price: number;
  taxRate: number;
  isAvailable: boolean; // stock > 0
  displayText: string; // "Ürün Adı (Stok: X, ₺Y/adet, KDV: %Z)"
}

// Satış için seçilen ürün
export interface SelectedSalesProduct {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalPrice: number; // quantity * unitPrice
  totalWithTax: number; // totalPrice + (totalPrice * taxRate / 100)
}

// SelectBox için option type
export interface SalesProductOption {
  label: string;
  value: string;
  disabled?: boolean;
}

// API Response type
export type SalesProductsResponse = BackendSalesProduct[];

// Backend'den gelen veriyi UI format'ına çevir
export const adaptSalesProductForUI = (
  product: BackendSalesProduct
): SalesProductDisplayItem => ({
  id: product.productId.toString(),
  name: product.productName,
  stock: product.productCount,
  price: product.price,
  taxRate: product.taxRate,
  isAvailable: product.productCount > 0,
  displayText: `${product.productName} (Stok: ${product.productCount}, ₺${product.price}/adet, KDV: %${product.taxRate})`,
});

// Backend'den gelen veriyi UI format'ına çevir (array)
export const adaptSalesProductsForUI = (
  products: BackendSalesProduct[]
): SalesProductDisplayItem[] => {
  return products.map((product) => adaptSalesProductForUI(product));
};

// SelectBox options'ını oluştur
export const createSalesProductOptions = (
  products: SalesProductDisplayItem[],
  excludeIds: string[] = []
): SalesProductOption[] => {
  return products
    .filter((product) => !excludeIds.includes(product.id))
    .map((product) => ({
      label: product.displayText,
      value: product.id,
      disabled: !product.isAvailable,
    }));
};

// Seçilen ürünü hesapla
export const calculateSelectedProduct = (
  product: SalesProductDisplayItem,
  quantity: number
): SelectedSalesProduct => {
  const totalPrice = quantity * product.price;
  const totalWithTax = totalPrice + (totalPrice * product.taxRate) / 100;

  return {
    id: product.id,
    name: product.name,
    quantity,
    unitPrice: product.price,
    taxRate: product.taxRate,
    totalPrice,
    totalWithTax,
  };
};
