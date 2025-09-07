// src/hooks/useBasket.tsx
import { useState, useCallback, useEffect } from "react";
import apiService from "@/src/services/api";
import {
  BasketItem,
  BasketAddRequest,
  BasketRemoveRequest,
  BasketUpdateRequest,
  BasketDisplayItem,
  BasketSummary,
  BasketOperationResult,
  adaptBasketItemForUI,
  calculateBasketSummary,
  validateBasketItem,
  validateBasketUpdate,
  BasketProductInfo,
} from "@/src/types/basket";
import { useToast } from "../useToast";

export interface UseBasketReturn {
  // State
  items: BasketDisplayItem[];
  summary: BasketSummary;
  isLoading: boolean;
  error: string | null;

  // Actions
  addToBasket: (productId: number, productCount: number) => Promise<boolean>;
  removeFromBasket: (productId: number) => Promise<boolean>;
  updateBasketItem: (
    productId: number,
    productCount: number
  ) => Promise<boolean>;
  refreshBasket: () => Promise<void>;
  clearBasket: () => void;

  // Helpers
  getItemByProductId: (productId: number) => BasketDisplayItem | undefined;
  isProductInBasket: (productId: number) => boolean;
  getProductQuantity: (productId: number) => number;
}

export const useBasket = (
  brokerId: number,
  productsInfo: BasketProductInfo[] = []
): UseBasketReturn => {
  const [items, setItems] = useState<BasketDisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Basket summary hesapla
  const summary = calculateBasketSummary(items);

  // Helper function to find product info
  const getProductInfo = useCallback(
    (productId: number): BasketProductInfo | undefined => {
      return productsInfo.find((p) => p.productId === productId);
    },
    [productsInfo]
  );

  // Adapt basket items for UI
  const adaptBasketItems = useCallback(
    (basketItems: BasketItem[]): BasketDisplayItem[] => {
      return basketItems.map((basketItem) => {
        const productInfo = getProductInfo(basketItem.productId);
        if (!productInfo) {
          console.warn(
            `Product info not found for productId: ${basketItem.productId}`
          );
          // Fallback product info
          const fallbackInfo: BasketProductInfo = {
            productId: basketItem.productId,
            productName: `Ürün ${basketItem.productId}`,
            price: 0,
            taxRate: 18,
            isAvailable: true,
            stockCount: 999,
          };
          return adaptBasketItemForUI(basketItem, fallbackInfo);
        }
        return adaptBasketItemForUI(basketItem, productInfo);
      });
    },
    [getProductInfo]
  );

  // Fetch basket items
  const refreshBasket = useCallback(async () => {
    if (!brokerId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("🛒 Fetching basket items for broker:", brokerId);
      const basketItems = await apiService.getBasketItems(brokerId);
      const adaptedItems = adaptBasketItems(basketItems);
      setItems(adaptedItems);
      console.log("✅ Basket items loaded:", adaptedItems.length);
    } catch (err: any) {
      const errorMessage = err.message || "Sepet yüklenirken hata oluştu";
      setError(errorMessage);
      console.error("❌ Basket fetch error:", err);
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  }, [brokerId, adaptBasketItems, showToast]);

  // Add item to basket
  const addToBasket = useCallback(
    async (productId: number, productCount: number): Promise<boolean> => {
      const request: BasketAddRequest = { brokerId, productId, productCount };

      // Validate request
      const validationError = validateBasketItem(request);
      if (validationError) {
        showToast(validationError, "error");
        return false;
      }

      // Check product info
      const productInfo = getProductInfo(productId);
      if (!productInfo) {
        showToast("Ürün bilgisi bulunamadı", "error");
        return false;
      }

      if (!productInfo.isAvailable) {
        showToast("Bu ürün mevcut değil", "error");
        return false;
      }

      if (productCount > productInfo.stockCount) {
        showToast(
          `Stokta sadece ${productInfo.stockCount} adet mevcut`,
          "error"
        );
        return false;
      }

      setIsLoading(true);

      try {
        console.log("🛒 Adding to basket:", request);
        const result = await apiService.addToBasket(request);

        if (result.success) {
          await refreshBasket(); // Refresh to get updated data
          showToast(`${productInfo.productName} sepete eklendi`, "success");
          return true;
        } else {
          showToast(result.message || "Sepete eklenirken hata oluştu", "error");
          return false;
        }
      } catch (err: any) {
        const errorMessage = err.message || "Sepete eklenirken hata oluştu";
        console.error("❌ Add to basket error:", err);
        showToast(errorMessage, "error");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [brokerId, getProductInfo, showToast, refreshBasket]
  );

  // Remove item from basket
  const removeFromBasket = useCallback(
    async (productId: number): Promise<boolean> => {
      const request: BasketRemoveRequest = { brokerId, productId };

      if (!brokerId || !productId) {
        showToast("Geçersiz parametreler", "error");
        return false;
      }

      const item = items.find((item) => item.productId === productId);
      if (!item) {
        showToast("Ürün sepette bulunamadı", "error");
        return false;
      }

      setIsLoading(true);

      try {
        console.log("🛒 Removing from basket:", request);
        const result = await apiService.removeFromBasket(request);

        if (result.success) {
          await refreshBasket(); // Refresh to get updated data
          showToast(`${item.productName} sepetten çıkarıldı`, "success");
          return true;
        } else {
          showToast(
            result.message || "Sepetten çıkarılırken hata oluştu",
            "error"
          );
          return false;
        }
      } catch (err: any) {
        const errorMessage = err.message || "Sepetten çıkarılırken hata oluştu";
        console.error("❌ Remove from basket error:", err);
        showToast(errorMessage, "error");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [brokerId, items, showToast, refreshBasket]
  );

  // Update basket item quantity
  const updateBasketItem = useCallback(
    async (productId: number, productCount: number): Promise<boolean> => {
      const request: BasketUpdateRequest = {
        brokerId,
        productId,
        productCount,
      };

      // Validate request
      const validationError = validateBasketUpdate(request);
      if (validationError) {
        showToast(validationError, "error");
        return false;
      }

      // Check product info
      const productInfo = getProductInfo(productId);
      if (!productInfo) {
        showToast("Ürün bilgisi bulunamadı", "error");
        return false;
      }

      if (productCount > productInfo.stockCount) {
        showToast(
          `Stokta sadece ${productInfo.stockCount} adet mevcut`,
          "error"
        );
        return false;
      }

      const item = items.find((item) => item.productId === productId);
      if (!item) {
        showToast("Ürün sepette bulunamadı", "error");
        return false;
      }

      setIsLoading(true);

      try {
        console.log("🛒 Updating basket item:", request);
        const result = await apiService.updateBasket(request);

        if (result.success) {
          await refreshBasket(); // Refresh to get updated data
          showToast(`${item.productName} miktarı güncellendi`, "success");
          return true;
        } else {
          showToast(
            result.message || "Miktar güncellenirken hata oluştu",
            "error"
          );
          return false;
        }
      } catch (err: any) {
        const errorMessage = err.message || "Miktar güncellenirken hata oluştu";
        console.error("❌ Update basket error:", err);
        showToast(errorMessage, "error");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [brokerId, getProductInfo, items, showToast, refreshBasket]
  );

  // Clear local basket state
  const clearBasket = useCallback(() => {
    setItems([]);
    setError(null);
    console.log("🛒 Basket cleared locally");
  }, []);

  // Helper functions
  const getItemByProductId = useCallback(
    (productId: number): BasketDisplayItem | undefined => {
      return items.find((item) => item.productId === productId);
    },
    [items]
  );

  const isProductInBasket = useCallback(
    (productId: number): boolean => {
      return items.some((item) => item.productId === productId);
    },
    [items]
  );

  const getProductQuantity = useCallback(
    (productId: number): number => {
      const item = items.find((item) => item.productId === productId);
      return item ? item.productCount : 0;
    },
    [items]
  );

  // Load basket on component mount and when brokerId changes
  useEffect(() => {
    if (brokerId && productsInfo.length > 0) {
      refreshBasket();
    }
  }, [brokerId, productsInfo.length, refreshBasket]);

  return {
    // State
    items,
    summary,
    isLoading,
    error,

    // Actions
    addToBasket,
    removeFromBasket,
    updateBasketItem,
    refreshBasket,
    clearBasket,

    // Helpers
    getItemByProductId,
    isProductInBasket,
    getProductQuantity,
  };
};
