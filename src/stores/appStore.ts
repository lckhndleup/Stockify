import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Veri yapıları
export interface Category {
  id: string;
  name: string;
  taxRate: number; // KDV oranı (0-100 arası)
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string; // category string yerine categoryId
  stock: number; // Adet cinsinden
  price: number; // Adet başına fiyat
  isActive: boolean;
}

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  quantity: number; // Adet cinsinden
  unitPrice: number; // Adet başına fiyat
  totalAmount: number; // İskonto öncesi tutar
  finalAmount: number; // İskonto sonrası tutar
  discountRate: number; // İskonto oranı
  date: string;
}

export interface Broker {
  id: string;
  name: string;
  surname: string;
  transactions: Transaction[];
  hasReceipt: boolean;
  discountRate: number; // İskonto oranı (0-100 arası)
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: "in" | "out"; // giriş veya çıkış
  quantity: number; // Adet cinsinden
  reason: string;
  date: string;
}

interface AppStore {
  // State
  categories: Category[];
  products: Product[];
  brokers: Broker[];
  stockMovements: StockMovement[];

  // Category Actions
  addCategory: (category: Omit<Category, "id" | "isActive">) => string;
  updateCategory: (id: string, category: Partial<Category>) => boolean;
  deleteCategory: (id: string) => boolean;
  getActiveCategories: () => Category[];
  getCategoryById: (id: string) => Category | undefined;

  // Product Actions
  addProduct: (product: Omit<Product, "id" | "isActive">) => string;
  updateProduct: (id: string, product: Partial<Product>) => boolean;
  deleteProduct: (id: string) => boolean;
  getActiveProducts: () => Product[];
  getProductById: (id: string) => Product | undefined;
  getProductsByCategoryId: (categoryId: string) => Product[];

  // Broker Actions
  addBroker: (
    broker: Omit<Broker, "id" | "transactions" | "hasReceipt">
  ) => string;
  updateBroker: (id: string, broker: Partial<Broker>) => boolean;
  deleteBroker: (id: string) => boolean;
  toggleBrokerReceipt: (id: string) => boolean;

  // Transaction Actions
  giveProductToBroker: (
    brokerId: string,
    productId: string,
    quantity: number
  ) => { success: boolean; error?: string };

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
    // Initial State - BOŞ BAŞLANGIC
    categories: [],
    products: [],
    brokers: [],
    stockMovements: [],

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

    // Product Actions
    addProduct: (productData) => {
      const newProduct: Product = {
        id: Date.now().toString(),
        ...productData,
        isActive: true,
      };

      set((state) => ({
        products: [newProduct, ...state.products],
      }));

      // Stok hareketi ekle
      get().addStockMovement({
        productId: newProduct.id,
        productName: newProduct.name,
        type: "in",
        quantity: productData.stock,
        reason: "Yeni ürün eklendi",
        date: new Date().toISOString().split("T")[0],
      });

      return newProduct.id;
    },

    updateProduct: (id, updates) => {
      const state = get();
      const product = state.products.find((p) => p.id === id);
      if (!product) return false;

      const oldStock = product.stock;
      const newStock = updates.stock;

      set((state) => ({
        products: state.products.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      }));

      // Stok değişikliği varsa hareket ekle
      if (newStock !== undefined && newStock !== oldStock) {
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

    getProductById: (id) => {
      return get().products.find((p) => p.id === id);
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
        transactions: [],
        hasReceipt: false,
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
        brokers: state.brokers.filter((b) => b.id !== id),
      }));
      return true;
    },

    toggleBrokerReceipt: (id) => {
      set((state) => ({
        brokers: state.brokers.map((b) =>
          b.id === id ? { ...b, hasReceipt: !b.hasReceipt } : b
        ),
      }));
      return true;
    },

    // Discount Functions
    updateBrokerDiscount: (brokerId: string, discountRate: number) => {
      set((state) => ({
        brokers: state.brokers.map((b) =>
          b.id === brokerId ? { ...b, discountRate } : b
        ),
      }));
      return true;
    },

    getBrokerDiscount: (brokerId: string) => {
      const broker = get().brokers.find((b) => b.id === brokerId);
      return broker?.discountRate || 0;
    },

    // Transaction Actions
    giveProductToBroker: (brokerId, productId, quantity) => {
      const state = get();
      const product = state.products.find((p) => p.id === productId);
      const broker = state.brokers.find((b) => b.id === brokerId);

      if (!product || !broker) {
        return { success: false, error: "Ürün veya aracı bulunamadı." };
      }

      if (!product.isActive) {
        return { success: false, error: "Bu ürün aktif değil." };
      }

      if (product.stock < quantity) {
        return {
          success: false,
          error: `Yetersiz stok! Mevcut stok: ${product.stock} adet, talep edilen: ${quantity} adet.`,
        };
      }

      // İskonto hesaplaması
      const totalAmount = quantity * product.price;
      const discountAmount = (totalAmount * broker.discountRate) / 100;
      const finalAmount = totalAmount - discountAmount;

      // Transaction oluştur - iskonto uygulanmış
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        unitPrice: product.price,
        totalAmount: totalAmount, // İskonto öncesi
        finalAmount: finalAmount, // İskonto sonrası - bu bakiyeye eklenir
        discountRate: broker.discountRate,
        date: new Date().toISOString().split("T")[0],
      };

      // Broker'a transaction ekle
      set((state) => ({
        brokers: state.brokers.map((b) =>
          b.id === brokerId
            ? { ...b, transactions: [...b.transactions, newTransaction] }
            : b
        ),
      }));

      // Stoktan düş
      get().updateProductStock(
        productId,
        product.stock - quantity,
        `${broker.name} ${broker.surname} aracısına verildi`
      );

      return { success: true };
    },

    // Collection Actions
    collectFromBroker: (brokerId, amount, paymentType) => {
      const state = get();
      const broker = state.brokers.find((b) => b.id === brokerId);

      if (!broker) {
        return { success: false, error: "Aracı bulunamadı." };
      }

      if (amount <= 0) {
        return { success: false, error: "Geçersiz tahsilat tutarı." };
      }

      // Yeni bir tahsilat transaction'ı oluştur
      const newTransaction = {
        id: Date.now().toString(),
        productId: "collection", // Özel bir ID kullanıyoruz
        productName: `Tahsilat (${paymentType})`,
        quantity: 1,
        unitPrice: -amount, // Eksi olarak kaydet çünkü bu bir tahsilattır
        totalAmount: -amount,
        finalAmount: -amount,
        discountRate: 0,
        date: new Date().toISOString().split("T")[0],
      };

      // Broker'a transaction ekle
      set((state) => ({
        brokers: state.brokers.map((b) =>
          b.id === brokerId
            ? { ...b, transactions: [...b.transactions, newTransaction] }
            : b
        ),
      }));

      return { success: true };
    },

    // Stock Actions
    updateProductStock: (productId, newStock, reason = "Manuel güncelleme") => {
      const state = get();
      const product = state.products.find((p) => p.id === productId);
      if (!product) return false;

      const oldStock = product.stock;

      set((state) => ({
        products: state.products.map((p) =>
          p.id === productId ? { ...p, stock: newStock } : p
        ),
      }));

      // Stok hareketi ekle
      get().addStockMovement({
        productId: productId,
        productName: product.name,
        type: newStock > oldStock ? "in" : "out",
        quantity: Math.abs(newStock - oldStock),
        reason: reason,
        date: new Date().toISOString().split("T")[0],
      });

      return true;
    },

    addStockMovement: (movement) => {
      set((state) => ({
        stockMovements: [
          { ...movement, id: Date.now().toString() },
          ...state.stockMovements,
        ],
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
        .products.filter((p) => p.isActive)
        .reduce((total, product) => total + product.stock * product.price, 0);
    },

    getBrokerTotalDebt: (brokerId) => {
      const broker = get().brokers.find((b) => b.id === brokerId);
      if (!broker) return 0;

      return broker.transactions.reduce((total, transaction) => {
        // Eğer finalAmount varsa onu kullan, yoksa eski sistem için totalAmount kullan
        const amount =
          transaction.finalAmount !== undefined
            ? transaction.finalAmount
            : transaction.totalAmount;
        return total + amount;
      }, 0);
    },

    // Global Toast State
    globalToast: {
      visible: false,
      message: "",
      type: "info",
    },

    showGlobalToast: (message: string, type = "info") => {
      set({
        globalToast: {
          visible: true,
          message,
          type,
        },
      });
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
    },
  }),
  {
    name: "stockify-app-store",
    storage: createJSONStorage(() => AsyncStorage),
  }
);

export const useAppStore = create<AppStore>()(middleware);
