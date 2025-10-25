// Sales ile ilgili UI specific type'ları

// Satış ekranında eklenen ürünler için UI tipi
export interface AddedProduct {
  id: string; // productId
  name: string;
  quantity: number;
  unitPrice: number;
  /** Kart sağ tarafında gösterilecek toplam için KDV dahil tutarı da taşıyalım */
  totalPrice: number; // geriye dönük; yoksa totalPriceWithTax kullanacağız
  taxRate?: number;
  taxPrice?: number;
  totalPriceWithTax?: number;
}

// Satış onay ekranında kullanılan parametre tipi
export type SalesItemParam = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate?: number;
  taxPrice?: number;
  totalPriceWithTax?: number;
};

// Satış sonuç ekranında kullanılan satış kalemi tipi
export type SalesItem = {
  salesId?: number;
  productId: number;
  productName: string;
  productCount: number;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
  taxPrice: number;
  totalPriceWithTax: number;
};

// Satış sonuç ekranında kullanılan özet tipi (resultSales için local)
export type SalesSummaryResult = {
  documentNumber?: string;
  salesItems: SalesItem[];
  subtotalPrice: number;
  discountRate: number;
  discountPrice: number;
  totalPrice: number; // iskonto sonrası ara toplam (KDV hariç)
  totalTaxPrice?: number; // toplam KDV
  totalPriceWithTax: number; // KDV dahil genel toplam
  downloadUrl?: string;
};
