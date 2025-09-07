// src/hooks/useSales.tsx
import { useState, useCallback } from "react";
import apiService from "@/src/services/api";
import {
  SalesProduct,
  SalesRequest,
  SalesResponse,
  SalesDisplayItem,
  SalesSummary,
  adaptSalesProductsForUI,
  adaptSalesResponseForUI,
  calculateSalesSummary,
} from "@/src/types/sales";
import { useToast } from "../useToast";

export interface UseSalesReturn {
  // State
  products: SalesProduct[];
  isLoadingProducts: boolean;
  isCalculating: boolean;
  isConfirming: boolean;
  error: string | null;
  lastCalculation: SalesResponse | null;
  lastConfirmation: SalesResponse | null;

  // Actions
  loadProducts: () => Promise<void>;
  calculateSales: (
    brokerId: number,
    createInvoice: boolean
  ) => Promise<SalesResponse | null>;
  confirmSales: (
    brokerId: number,
    createInvoice: boolean
  ) => Promise<SalesResponse | null>;
  clearLastResults: () => void;

  // Helpers
  getProductById: (productId: number) => SalesProduct | undefined;
  isProductAvailable: (productId: number) => boolean;
  getProductPrice: (productId: number) => number;
}

export const useSales = (): UseSalesReturn => {
  const [products, setProducts] = useState<SalesProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCalculation, setLastCalculation] = useState<SalesResponse | null>(
    null
  );
  const [lastConfirmation, setLastConfirmation] =
    useState<SalesResponse | null>(null);
  const { showToast } = useToast();

  // Load sales products
  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setError(null);

    try {
      console.log("💰 Loading sales products...");
      const salesProducts = await apiService.getSalesProducts();
      setProducts(salesProducts);
      console.log("✅ Sales products loaded:", salesProducts.length);
    } catch (err: any) {
      const errorMessage = err.message || "Ürünler yüklenirken hata oluştu";
      setError(errorMessage);
      console.error("❌ Sales products load error:", err);
      showToast(errorMessage, "error");
    } finally {
      setIsLoadingProducts(false);
    }
  }, [showToast]);

  // Calculate sales
  const calculateSales = useCallback(
    async (
      brokerId: number,
      createInvoice: boolean = false
    ): Promise<SalesResponse | null> => {
      if (!brokerId) {
        showToast("Broker ID gerekli", "error");
        return null;
      }

      const request: SalesRequest = { brokerId, createInvoice };
      setIsCalculating(true);
      setError(null);

      try {
        console.log("🧮 Calculating sales:", request);
        const result = await apiService.calculateSales(request);
        setLastCalculation(result);

        const summary = calculateSalesSummary(result.salesItems);
        console.log("✅ Sales calculation completed:", {
          salesId: result.salesId,
          totalItems: summary.totalItems,
          grandTotal: summary.grandTotal,
        });

        showToast(
          `Hesaplama tamamlandı. Toplam: ₺${result.totalPriceWithTax.toFixed(
            2
          )}`,
          "success"
        );

        return result;
      } catch (err: any) {
        const errorMessage = err.message || "Satış hesaplanırken hata oluştu";
        setError(errorMessage);
        console.error("❌ Sales calculation error:", err);
        showToast(errorMessage, "error");
        return null;
      } finally {
        setIsCalculating(false);
      }
    },
    [showToast]
  );

  // Confirm sales
  const confirmSales = useCallback(
    async (
      brokerId: number,
      createInvoice: boolean = true
    ): Promise<SalesResponse | null> => {
      if (!brokerId) {
        showToast("Broker ID gerekli", "error");
        return null;
      }

      const request: SalesRequest = { brokerId, createInvoice };
      setIsConfirming(true);
      setError(null);

      try {
        console.log("✅ Confirming sales:", request);
        const result = await apiService.confirmSales(request);
        setLastConfirmation(result);

        const summary = calculateSalesSummary(result.salesItems);
        console.log("✅ Sales confirmation completed:", {
          salesId: result.salesId,
          documentNumber: result.documentNumber,
          totalItems: summary.totalItems,
          grandTotal: summary.grandTotal,
        });

        const successMessage = createInvoice
          ? `Satış onaylandı! Fatura No: ${result.documentNumber}`
          : "Satış onaylandı!";

        showToast(successMessage, "success");

        return result;
      } catch (err: any) {
        const errorMessage = err.message || "Satış onaylanırken hata oluştu";
        setError(errorMessage);
        console.error("❌ Sales confirmation error:", err);
        showToast(errorMessage, "error");
        return null;
      } finally {
        setIsConfirming(false);
      }
    },
    [showToast]
  );

  // Clear last results
  const clearLastResults = useCallback(() => {
    setLastCalculation(null);
    setLastConfirmation(null);
    setError(null);
    console.log("💰 Sales results cleared");
  }, []);

  // Helper functions
  const getProductById = useCallback(
    (productId: number): SalesProduct | undefined => {
      return products.find((product) => product.productId === productId);
    },
    [products]
  );

  const isProductAvailable = useCallback(
    (productId: number): boolean => {
      const product = getProductById(productId);
      return product ? product.productCount > 0 : false;
    },
    [getProductById]
  );

  const getProductPrice = useCallback(
    (productId: number): number => {
      const product = getProductById(productId);
      return product ? product.price : 0;
    },
    [getProductById]
  );

  return {
    // State
    products,
    isLoadingProducts,
    isCalculating,
    isConfirming,
    error,
    lastCalculation,
    lastConfirmation,

    // Actions
    loadProducts,
    calculateSales,
    confirmSales,
    clearLastResults,

    // Helpers
    getProductById,
    isProductAvailable,
    getProductPrice,
  };
};

// Additional helper hook for sales operations in components
export const useSalesCalculation = (brokerId: number) => {
  const sales = useSales();

  const calculateAndShow = useCallback(
    async (createInvoice: boolean = false) => {
      if (!brokerId) return null;
      return await sales.calculateSales(brokerId, createInvoice);
    },
    [sales, brokerId]
  );

  const confirmAndShow = useCallback(
    async (createInvoice: boolean = true) => {
      if (!brokerId) return null;
      return await sales.confirmSales(brokerId, createInvoice);
    },
    [sales, brokerId]
  );

  return {
    ...sales,
    calculateAndShow,
    confirmAndShow,
  };
};
