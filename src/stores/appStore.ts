// src/stores/appStore.ts - Simplified: Hybrid product management removed
import React from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Basic types
export interface Category {
  id: string;
  name: string;
  taxRate: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  stock: number;
  price: number;
  isActive: boolean;
}

export interface Broker {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  discountRate: number;
  isActive: boolean;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: "in" | "out";
  quantity: number;
  reason: string;
  date: string;
}

export interface Transaction {
  id: string;
  brokerId: string;
  brokerName: string;
  type: "sale" | "collection";
  amount: number;
  date: string;
  description: string;
  products?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

// Store interface - SIMPLIFIED: Local product data management removed
interface AppStore {
  // Basic State
  categories: Category[];
  products: Product[]; // Bu deprecated olacak ama geriye uyumluluk için kalsın
  brokers: Broker[];
  stockMovements: StockMovement[];

  // Category Actions
  addCategory: (categoryData: Omit<Category, "id" | "isActive">) => string;
  updateCategory: (
    id: string,
    updates: Partial<Omit<Category, "id">>
  ) => boolean;
  deleteCategory: (id: string) => boolean;
  getActiveCategories: () => Category[];
  getCategoryById: (id: string) => Category | undefined;

  // OLD Product Actions - Backward compatibility için geçici olarak kalsın
  addProduct: (productData: Omit<Product, "id" | "isActive">) => string;
  updateProduct: (id: string, updates: Partial<Omit<Product, "id">>) => boolean;
  deleteProduct: (id: string) => boolean;
  getActiveProducts: () => Product[];
  getProductsByCategoryId: (categoryId: string) => Product[];

  // Broker Actions
  addBroker: (brokerData: Omit<Broker, "id" | "isActive">) => string;
  updateBroker: (id: string, updates: Partial<Omit<Broker, "id">>) => boolean;
  deleteBroker: (id: string) => boolean;
  getActiveBrokers: () => Broker[];
  getBrokerById: (id: string) => Broker | undefined;

  // Transaction Actions
  addTransaction: (transactionData: Omit<Transaction, "id">) => {
    success: boolean;
    error?: string;
  };

  // Collection Actions
  collectFromBroker: (
    brokerId: string,
    amount: number,
    paymentType: string
  ) => { success: boolean; error?: string };

  // Stock Actions
  updateProductStock: (
    productId: string,
    newStock: number,
    reason?: string
  ) => boolean;
  addStockMovement: (movement: Omit<StockMovement, "id">) => void;

  // Helper Functions
  getCriticalProducts: () => Product[]; // 50 veya altı
  getOutOfStockProducts: () => Product[];
  getTotalStockValue: () => number;
  getBrokerTotalDebt: (brokerId: string) => number;

  // Discount Functions
  updateBrokerDiscount: (brokerId: string, discountRate: number) => boolean;
  getBrokerDiscount: (brokerId: string) => number;

  // Global Toast
  globalToast: {
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info";
  };
  showGlobalToast: (
    message: string,
    type?: "success" | "error" | "warning" | "info"
  ) => void;
  hideGlobalToast: () => void;

  // System Actions
  resetStore: () => void;
}

const CRITICAL_LEVEL = 50; // Kritik seviye 50 adet

const middleware = persist<AppStore>(
  (set, get) => ({
    // Initial State
    categories: [],
    products: [],
    brokers: [],
    stockMovements: [],

    // Global Toast
    globalToast: {
      visible: false,
      message: "",
      type: "info",
    },

    // Category Actions
    addCategory: (categoryData) => {
      const newCategory: Category = {
        id: Date.now().toString(),
        ...categoryData,
        isActive: true,
      };

      set((state) => ({
        categories: [newCategory, ...state.categories],
      }));

      return newCategory.id;
    },

    updateCategory: (id, updates) => {
      set((state) => ({
        categories: state.categories.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      }));
      return true;
    },

    deleteCategory: (id) => {
      // Kategoriye ait ürün var mı kontrol et
      const categoryProducts = get().products.filter(
        (p) => p.categoryId === id && p.isActive
      );

      if (categoryProducts.length > 0) {
        return false; // Kategoriye ait aktif ürün varsa silinmesin
      }

      set((state) => ({
        categories: state.categories.map((c) =>
          c.id === id ? { ...c, isActive: false } : c
        ),
      }));
      return true;
    },

    getActiveCategories: () => {
      return get().categories.filter((c) => c.isActive);
    },

    getCategoryById: (id) => {
      return get().categories.find((c) => c.id === id);
    },

    // OLD Product Actions - Backward compatibility (stock/price default 0)
    addProduct: (productData) => {
      const newProduct: Product = {
        id: Date.now().toString(),
        ...productData,
        stock: productData.stock || 0, // Default 0
        price: productData.price || 0, // Default 0
        isActive: true,
      };

      set((state) => ({
        products: [newProduct, ...state.products],
      }));

      // Stok hareketi ekle (sadece stock > 0 ise)
      if (newProduct.stock > 0) {
        get().addStockMovement({
          productId: newProduct.id,
          productName: newProduct.name,
          type: "in",
          quantity: newProduct.stock,
          reason: "Yeni ürün eklendi",
          date: new Date().toISOString().split("T")[0],
        });
      }

      return newProduct.id;
    },

    updateProduct: (id, updates) => {
      const state = get();
      const product = state.products.find((p) => p.id === id);
      if (!product) return false;

      const oldStock = product.stock;
      const newStock = updates.stock ?? product.stock;

      set((state) => ({
        products: state.products.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      }));

      // Stok değişikliği varsa hareket ekle
      if (newStock !== oldStock && newStock !== undefined) {
        get().addStockMovement({
          productId: id,
          productName: updates.name || product.name,
          type: newStock > oldStock ? "in" : "out",
          quantity: Math.abs(newStock - oldStock),
          reason: "Ürün düzenleme",
          date: new Date().toISOString().split("T")[0],
        });
      }

      return true;
    },

    deleteProduct: (id) => {
      set((state) => ({
        products: state.products.map((p) =>
          p.id === id ? { ...p, isActive: false } : p
        ),
      }));
      return true;
    },

    getActiveProducts: () => {
      return get().products.filter((p) => p.isActive);
    },

    getProductsByCategoryId: (categoryId) => {
      return get().products.filter(
        (p) => p.categoryId === categoryId && p.isActive
      );
    },

    // Broker Actions
    addBroker: (brokerData) => {
      const newBroker: Broker = {
        id: Date.now().toString(),
        ...brokerData,
        isActive: true,
      };

      set((state) => ({
        brokers: [newBroker, ...state.brokers],
      }));

      return newBroker.id;
    },

    updateBroker: (id, updates) => {
      set((state) => ({
        brokers: state.brokers.map((b) =>
          b.id === id ? { ...b, ...updates } : b
        ),
      }));
      return true;
    },

    deleteBroker: (id) => {
      set((state) => ({
        brokers: state.brokers.map((b) =>
          b.id === id ? { ...b, isActive: false } : b
        ),
      }));
      return true;
    },

    getActiveBrokers: () => {
      return get().brokers.filter((b) => b.isActive);
    },

    getBrokerById: (id) => {
      return get().brokers.find((b) => b.id === id);
    },

    // Transaction Actions
    addTransaction: (transactionData) => {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        ...transactionData,
      };

      // Stok kontrolü (satış işlemi için)
      if (transactionData.type === "sale" && transactionData.products) {
        for (const item of transactionData.products) {
          const product = get().products.find((p) => p.id === item.id);
          if (!product || product.stock < item.quantity) {
            return {
              success: false,
              error: `${item.name} için yeterli stok yok!`,
            };
          }
        }

        // Stokları düş
        transactionData.products.forEach((item) => {
          const product = get().products.find((p) => p.id === item.id);
          if (product) {
            get().updateProductStock(
              item.id,
              product.stock - item.quantity,
              `Satış: ${newTransaction.id}`
            );
          }
        });
      }

      // Transaction ekle (şimdilik basit - gerçek projede transactions array'i olacak)
      console.log("Transaction added:", newTransaction);

      return { success: true };
    },

    // Collection Actions
    collectFromBroker: (brokerId, amount, paymentType) => {
      const broker = get().getBrokerById(brokerId);
      if (!broker) {
        return { success: false, error: "Bayi bulunamadı!" };
      }

      // Tahsilat transaction'ı ekle
      const collectionResult = get().addTransaction({
        brokerId,
        brokerName: broker.name,
        type: "collection",
        amount,
        date: new Date().toISOString().split("T")[0],
        description: `Tahsilat - ${paymentType}`,
      });

      return collectionResult;
    },

    // Stock Actions
    updateProductStock: (productId, newStock, reason = "Manuel güncelleme") => {
      const product = get().products.find((p) => p.id === productId);
      if (!product) return false;

      const oldStock = product.stock;

      // Stok güncelle
      set((state) => ({
        products: state.products.map((p) =>
          p.id === productId ? { ...p, stock: newStock } : p
        ),
      }));

      // Stok hareketi ekle
      if (newStock !== oldStock) {
        get().addStockMovement({
          productId,
          productName: product.name,
          type: newStock > oldStock ? "in" : "out",
          quantity: Math.abs(newStock - oldStock),
          reason,
          date: new Date().toISOString().split("T")[0],
        });
      }

      return true;
    },

    addStockMovement: (movement) => {
      const newMovement: StockMovement = {
        id: Date.now().toString(),
        ...movement,
      };

      set((state) => ({
        stockMovements: [newMovement, ...state.stockMovements],
      }));
    },

    // Helper Functions
    getCriticalProducts: () => {
      return get().products.filter(
        (p) => p.isActive && p.stock > 0 && p.stock <= CRITICAL_LEVEL
      );
    },

    getOutOfStockProducts: () => {
      return get().products.filter((p) => p.isActive && p.stock === 0);
    },

    getTotalStockValue: () => {
      return get()
        .getActiveProducts()
        .reduce((total, product) => total + product.stock * product.price, 0);
    },

    getBrokerTotalDebt: (brokerId) => {
      // Şimdilik basit implementasyon
      // Gerçek projede transaction'ları hesaplayacak
      return 0;
    },

    // Discount Functions
    updateBrokerDiscount: (brokerId, discountRate) => {
      return get().updateBroker(brokerId, { discountRate });
    },

    getBrokerDiscount: (brokerId) => {
      const broker = get().getBrokerById(brokerId);
      return broker?.discountRate || 0;
    },

    // Global Toast
    showGlobalToast: (message, type = "info") => {
      set({
        globalToast: {
          visible: true,
          message,
          type,
        },
      });

      // Auto hide after 3 seconds
      setTimeout(() => {
        get().hideGlobalToast();
      }, 3000);
    },

    hideGlobalToast: () => {
      set({
        globalToast: {
          visible: false,
          message: "",
          type: "info",
        },
      });
    },

    // System Actions
    resetStore: () => {
      set({
        categories: [],
        products: [],
        brokers: [],
        stockMovements: [],
        globalToast: {
          visible: false,
          message: "",
          type: "info",
        },
      });
      console.log("🔄 Store completely reset");
    },
  }),
  {
    name: "stock-app-storage",
    storage: createJSONStorage(() => AsyncStorage),
    version: 3, // Version increased for schema change
    migrate: (persistedState: any, version: number) => {
      if (version < 3) {
        // Remove localProductsData if exists
        delete persistedState.localProductsData;
        console.log(
          "🔄 Migrated store to version 3 - removed localProductsData"
        );
      }
      return persistedState;
    },
  }
);

export const useAppStore = create<AppStore>()(middleware);

export default useAppStore;
