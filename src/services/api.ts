// src/services/api.ts
import type { LoginRequest, LoginResponse, LogoutResponse, ApiError } from "@/src/types/apiTypes";
import logger from "@/src/utils/logger";
import { forceLogoutAndRedirect } from "./authBridge";
import Constants from "expo-constants";
// Prefer env/configured base URL with a safe fallback
const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ||
  ((Constants.expoConfig?.extra as any)?.apiUrl as string | undefined) ||
  "https://stockify-gcsq.onrender.com";
// Default network timeout for mobile networks (ms) - configurable via env/app.json
const DEFAULT_TIMEOUT_MS = (() => {
  const envValue = process.env.EXPO_PUBLIC_API_TIMEOUT_MS;
  if (envValue && !Number.isNaN(Number(envValue))) return Number(envValue);
  const extra = (Constants.expoConfig?.extra as any) || {};
  const confValue = extra.apiTimeoutMs;
  if (confValue && !Number.isNaN(Number(confValue))) return Number(confValue);
  return 15000;
})();

class ApiService {
  private baseURL: string;
  private token: string | null = null;
  // Prevent recursive logout loops on 401 handling
  private forcingLogout = false;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Token'ı set etmek için
  setToken(token: string) {
    this.token = token;
  }

  // Token'ı temizlemek için
  clearToken() {
    this.token = null;
  }

  // Base fetch wrapper
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Headers'ı Record<string, string> olarak type'la
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Token varsa Authorization header'ı ekle
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
      // Avoid logging token content
      logger.debug("🔑 API Request includes Authorization header");
    }

    logger.debug("🌐 API Request:", {
      method: options.method || "GET",
      url,
      hasToken: !!this.token,
      headers: {
        ...headers,
        Authorization: headers.Authorization ? "[HIDDEN]" : undefined,
      },
    });

    // Setup timeout-aware AbortController; respect any external signal
    const controller = new AbortController();
    const externalSignal = (options as any).signal as AbortSignal | undefined;
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort();
      else externalSignal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    const timeoutMs = (options as any).timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => {
      try {
        controller.abort();
      } catch {}
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        // Remove any custom keys we used
        // @ts-expect-error custom field cleanup
        timeoutMs: undefined,
        headers,
        signal: controller.signal,
      });

      // Debug mode için - production'da kapatılabilir
      const isDebugMode = process.env.NODE_ENV === "development";

      if (isDebugMode) {
        logger.debug("📡 API Response:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: response.url,
        });
      }

      // Response'u text olarak al
      const responseText = await response.text();
      if (isDebugMode) logger.debug("📄 Raw response text:", responseText);

      // Response boşsa ve status başarılıysa success objesi döndür
      if (!responseText && response.ok) {
        logger.debug("✅ Empty successful response, returning success");
        return { success: true, message: "İşlem başarılı" } as T;
      }

      // Response varsa JSON parse et
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        logger.error("❌ JSON Parse Error:", parseError);
        if (isDebugMode) logger.debug("📄 Failed to parse text:", responseText);

        if (response.ok) {
          // Parse edilemedi ama status başarılı - muhtemelen boş response
          return { success: true, message: "İşlem başarılı" } as T;
        } else {
          // Parse edilemedi ve status başarısız
          throw {
            message: "Sunucu yanıtı işlenemedi",
            status: response.status,
          } as ApiError;
        }
      }

      if (isDebugMode) {
        logger.debug("📦 Response data:", data);
      }

      if (!response.ok) {
        const errorInfo = {
          message: data?.message || "Bir hata oluştu",
          status: response.status,
        } as ApiError;

        // Sadece debug mode'da detay göster
        if (isDebugMode) {
          logger.warn("❌ API Error (debug):", errorInfo);
        }

        // Centralize 401 handling: force logout and redirect to login
        // Avoid infinite loops by skipping for /auth/logout and guarding re-entrancy
        if (
          errorInfo.status === 401 &&
          !endpoint.startsWith("/auth/logout") &&
          !this.forcingLogout
        ) {
          try {
            this.forcingLogout = true;
            await forceLogoutAndRedirect();
          } catch (e) {
            logger.error("Failed to force logout after 401:", e);
          } finally {
            this.forcingLogout = false;
          }
        }

        throw errorInfo;
      }

      if (isDebugMode) {
        logger.debug("✅ API Success:", {
          endpoint,
          dataKeys: data ? Object.keys(data) : [],
        });
      }

      return data;
    } catch (error: any) {
      if (error?.name === "AbortError") {
        const timeoutError = {
          message: "İstek zaman aşımına uğradı. Lütfen tekrar deneyin.",
          status: 0,
        } as ApiError;
        logger.warn("⏳ Request timed out:", { url, timeoutMs });
        throw timeoutError;
      }
      // Network hatası veya JSON parse hatası
      if (error instanceof TypeError) {
        const networkError = {
          message: "Bağlantı hatası. Sunucuya ulaşılamıyor.",
          status: 0,
        } as ApiError;

        // Network hatalarını her zaman logla (önemli debug bilgisi)
        logger.error("🌐 Network Error:", networkError);
        throw networkError;
      }

      // Diğer hataları sessizce fırlat
      throw error;
    } finally {
      try {
        clearTimeout(timeoutId);
      } catch {}
    }
  }

  // -------------------- Auth --------------------
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    logger.debug("🔐 API Login called with:", {
      username: credentials.username,
      rememberMe: credentials.rememberMe,
    });

    return this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials), // rememberMe da gönderilecek
    });
  }

  // 👈 YENİ: Logout API method
  async logout(): Promise<LogoutResponse> {
    logger.info("🚪 API Logout called");

    if (!this.token) {
      logger.warn("⚠️ No token available for logout");
      return { success: true, message: "Zaten çıkış yapılmış" };
    }

    return this.request<LogoutResponse>("/auth/logout", {
      method: "DELETE",
      // Authorization header otomatik olarak ekleniyor
    });
  }

  // -------------------- Category --------------------
  async getCategories(): Promise<any[]> {
    return this.request<any[]>("/category/all");
  }

  async saveCategory(category: { name: string; taxRate: number }): Promise<any> {
    logger.debug("🏷️ API: Saving category with data:", category);

    try {
      const result = await this.request<any>("/category/save", {
        method: "POST",
        body: JSON.stringify(category),
      });

      logger.debug("🏷️ API: Category save result:", result);
      logger.debug("🏷️ API: Result type:", typeof result);
      logger.debug("🏷️ API: Result keys:", result ? Object.keys(result) : "null");

      return result;
    } catch (error) {
      logger.error("🏷️ API: Category save error:", error);
      throw error;
    }
  }

  async updateCategory(category: {
    categoryId: number;
    name: string;
    taxRate: number;
  }): Promise<any> {
    return this.request<any>("/category/update", {
      method: "PUT",
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: string | number): Promise<any> {
    try {
      logger.debug("🗑️ API: Deleting category ID:", id);

      const result = await this.request<any>(`/category/delete/${id}`, {
        method: "DELETE",
      });

      logger.debug("✅ API: Category deleted:", result);
      return result;
    } catch (error) {
      logger.error("🗑️ API: Category delete error:", error);
      throw error;
    }
  }

  // -------------------- Product (backend swagger'a göre) --------------------
  async getProducts(params?: {
    productText?: string;
    status?: "ACTIVE" | "PASSIVE";
  }): Promise<any[]> {
    try {
      logger.debug("🛍️ API: Fetching products with params:", params);

      const queryParams = new URLSearchParams();
      if (params?.productText) {
        queryParams.append("productText", params.productText);
      }
      if (params?.status) {
        queryParams.append("status", params.status);
      }

      const queryString = queryParams.toString();
      const url = `/product/all${queryString ? `?${queryString}` : ""}`;

      const result = await this.request<any[]>(url, {
        method: "GET",
      });

      logger.debug(
        "✅ API: Products fetched - Count:",
        Array.isArray(result) ? result.length : "not array",
        "Keys:",
        Array.isArray(result) && result.length > 0 ? Object.keys(result[0]) : "empty",
      );

      return result;
    } catch (error) {
      logger.error("🛍️ API: Product fetch error:", error);
      throw error;
    }
  }

  async getProductDetail(id: string | number): Promise<any> {
    try {
      logger.debug("🛍️ API: Fetching product detail for ID:", id);

      const result = await this.request<any>(`/product/detail/${id}`, {
        method: "GET",
      });

      logger.debug("✅ API: Product detail fetched:", result ? Object.keys(result) : "null");

      return result;
    } catch (error) {
      logger.error("🛍️ API: Product detail fetch error:", error);
      throw error;
    }
  }

  async saveProduct(product: { categoryId: number; name: string }): Promise<any> {
    try {
      logger.debug("🛍️ API: Saving product:", product);

      const result = await this.request<any>("/product/save", {
        method: "POST",
        body: JSON.stringify(product),
      });

      logger.debug("✅ API: Product saved:", result ? Object.keys(result) : "null");

      return result;
    } catch (error) {
      logger.error("🛍️ API: Product save error:", error);
      throw error;
    }
  }

  async updateProduct(product: {
    productId: number;
    categoryId: number;
    name: string;
  }): Promise<any> {
    try {
      logger.debug("🛍️ API: Updating product:", product);

      const result = await this.request<any>("/product/update", {
        method: "PUT",
        body: JSON.stringify(product),
      });

      logger.debug("✅ API: Product updated:", result ? Object.keys(result) : "null");

      return result;
    } catch (error) {
      logger.error("🛍️ API: Product update error:", error);
      throw error;
    }
  }

  async deleteProduct(id: string | number): Promise<any> {
    try {
      logger.debug("🛍️ API: Deleting product ID:", id);

      const result = await this.request<any>(`/product/delete/${id}`, {
        method: "DELETE",
      });

      logger.debug("✅ API: Product deleted:", result);
      return result;
    } catch (error) {
      logger.error("🛍️ API: Product delete error:", error);
      throw error;
    }
  }

  // -------------------- Inventory --------------------
  async getInventoryAll(): Promise<any[]> {
    try {
      logger.debug("📦 API: Fetching all inventory...");

      const result = await this.request<any[]>("/inventory/all", {
        method: "GET",
      });

      logger.debug(
        "✅ API: Inventory fetched - Count:",
        Array.isArray(result) ? result.length : "not array",
      );

      return result;
    } catch (error) {
      logger.error("📦 API: Inventory fetch error:", error);
      throw error;
    }
  }

  async getInventoryDetail(id: string | number): Promise<any> {
    try {
      logger.debug("📦 API: Fetching inventory detail for ID:", id);

      const result = await this.request<any>(`/inventory/detail/${id}`, {
        method: "GET",
      });

      logger.debug("✅ API: Inventory detail fetched:", result);
      return result;
    } catch (error) {
      logger.error("📦 API: Inventory detail fetch error:", error);
      throw error;
    }
  }

  async updateInventory(inventoryData: {
    inventoryId: number;
    price: number;
    productCount: number;
    criticalProductCount: number;
  }): Promise<any> {
    try {
      logger.debug("📦 API: Updating inventory:", inventoryData);

      const result = await this.request<any>("/inventory/update", {
        method: "PUT",
        body: JSON.stringify(inventoryData),
      });

      logger.debug("✅ API: Inventory updated:", result);
      return result;
    } catch (error) {
      logger.error("📦 API: Inventory update error:", error);
      throw error;
    }
  }

  async getInventoryCritical(): Promise<any[]> {
    try {
      logger.debug("📦 API: Fetching critical inventory...");

      const result = await this.request<any[]>("/inventory/critical", {
        method: "GET",
      });

      logger.debug(
        "✅ API: Critical inventory fetched - Count:",
        Array.isArray(result) ? result.length : "not array",
      );

      return result;
    } catch (error) {
      logger.error("📦 API: Critical inventory fetch error:", error);
      throw error;
    }
  }

  async getInventoryOutOf(): Promise<any[]> {
    try {
      logger.debug("📦 API: Fetching out of stock inventory...");

      const result = await this.request<any[]>("/inventory/outOf", {
        method: "GET",
      });

      logger.debug(
        "✅ API: Out of stock inventory fetched - Count:",
        Array.isArray(result) ? result.length : "not array",
      );

      return result;
    } catch (error) {
      logger.error("📦 API: Out of stock inventory fetch error:", error);
      throw error;
    }
  }

  async getInventoryAvailable(): Promise<any[]> {
    try {
      logger.debug("📦 API: Fetching available inventory...");

      const result = await this.request<any[]>("/inventory/available", {
        method: "GET",
      });

      logger.debug(
        "✅ API: Available inventory fetched - Count:",
        Array.isArray(result) ? result.length : "not array",
      );

      return result;
    } catch (error) {
      logger.error("📦 API: Available inventory fetch error:", error);
      throw error;
    }
  }

  // -------------------- Broker --------------------
  // GET /broker/all
  async getBrokers(): Promise<any[]> {
    try {
      logger.debug("🤝 API: Fetching brokers...");

      const result = await this.request<any[]>("/broker/all", {
        method: "GET",
      });

      logger.debug(
        "✅ API: Brokers fetched - Count:",
        Array.isArray(result) ? result.length : "not array",
        "Keys:",
        Array.isArray(result) && result.length > 0 ? Object.keys(result[0]) : "empty",
      );

      return result;
    } catch (error) {
      logger.error("🤝 API: Brokers fetch error:", error);
      throw error;
    }
  }

  // Broker detayı getir - GET /broker/detail/{id}
  async getBrokerDetail(id: string | number): Promise<any> {
    try {
      logger.debug("🤝 API: Fetching broker detail for ID:", id);

      const result = await this.request<any>(`/broker/detail/${id}`, {
        method: "GET",
      });

      logger.debug("✅ API: Broker detail fetched:", result ? Object.keys(result) : "null");

      return result;
    } catch (error) {
      logger.error("🤝 API: Broker detail fetch error:", error);
      throw error;
    }
  }

  // Yeni broker kaydet - POST /broker/save
  async saveBroker(broker: {
    firstName: string;
    lastName: string;
    email: string;
    vkn: string;
    discountRate: number;
  }): Promise<any> {
    try {
      logger.debug("🤝 API: Saving broker:", broker);

      const result = await this.request<any>("/broker/save", {
        method: "POST",
        body: JSON.stringify(broker),
      });

      logger.debug("✅ API: Broker saved:", result ? Object.keys(result) : "null");

      return result;
    } catch (error) {
      logger.error("🤝 API: Broker save error:", error);
      throw error;
    }
  }

  // Broker güncelle - PUT /broker/update
  async updateBroker(broker: {
    brokerId: number;
    firstName: string;
    lastName: string;
    email: string;
    vkn: string;
    discountRate: number;
  }): Promise<any> {
    try {
      logger.debug("🤝 API: Updating broker:", broker);

      const result = await this.request<any>("/broker/update", {
        method: "PUT",
        body: JSON.stringify(broker),
      });

      logger.debug("✅ API: Broker updated:", result ? Object.keys(result) : "null");

      return result;
    } catch (error) {
      logger.error("🤝 API: Broker update error:", error);
      throw error;
    }
  }

  // Broker discount rate güncelle - PUT /broker/update/discount-rate
  async updateBrokerDiscountRate(discountData: {
    brokerId: number;
    discountRate: number;
  }): Promise<any> {
    try {
      logger.debug("🤝 API: Updating broker discount rate:", discountData);

      const result = await this.request<any>("/broker/update/discount-rate", {
        method: "PUT",
        body: JSON.stringify(discountData),
      });

      logger.debug("✅ API: Broker discount rate updated:", result ? Object.keys(result) : "null");

      return result;
    } catch (error) {
      logger.error("🤝 API: Broker discount rate update error:", error);
      throw error;
    }
  }

  // Broker sil - DELETE /broker/delete/{id}
  async deleteBroker(id: string | number): Promise<any> {
    try {
      logger.debug("🤝 API: Deleting broker ID:", id);

      const result = await this.request<any>(`/broker/delete/${id}`, {
        method: "DELETE",
      });

      logger.debug("✅ API: Broker deleted:", result);
      return result;
    } catch (error) {
      logger.error("🤝 API: Broker delete error:", error);
      throw error;
    }
  }

  // -------------------- Payment --------------------
  async savePayment(payment: {
    brokerId: number;
    paymentPrice: number;
    paymentType: "CASH" | "CREDIT_CARD" | "BANK_TRANSFER" | "CHECK";
  }): Promise<any> {
    try {
      logger.debug("💰 API: Saving payment:", payment);

      const result = await this.request<any>("/payment/save", {
        method: "POST",
        body: JSON.stringify(payment),
      });

      logger.debug("✅ API: Payment saved:", result ? Object.keys(result) : "null");

      return result;
    } catch (error) {
      logger.error("💰 API: Payment save error:", error);
      throw error;
    }
  }

  // -------------------- Sales (SalesController) --------------------
  /** GET /sales/products */
  async getSalesProducts(): Promise<any[]> {
    try {
      logger.debug("💰 API: Fetching sales products...");

      const result = await this.request<any[]>("/sales/products", {
        method: "GET",
      });

      logger.debug(
        "✅ API: Sales products fetched - Count:",
        Array.isArray(result) ? result.length : "not array",
        "Keys:",
        Array.isArray(result) && result.length > 0 ? Object.keys(result[0]) : "empty",
      );

      return result;
    } catch (error) {
      logger.error("💰 API: Sales products fetch error:", error);
      throw error;
    }
  }

  /** GET /sales/basket/{brokerId} */
  async getBasket(brokerId: number): Promise<any[]> {
    try {
      logger.debug("🧺 API: Fetching basket for broker:", brokerId);

      const result = await this.request<any[]>(`/sales/basket/${brokerId}`, {
        method: "GET",
      });

      logger.debug(
        "✅ API: Basket fetched - Count:",
        Array.isArray(result) ? result.length : "not array",
      );

      return result;
    } catch (error) {
      logger.error("🧺 API: Basket fetch error:", error);
      throw error;
    }
  }

  /** POST /basket/add  (Swagger: /sales değil, root /basket) */
  async addToBasket(payload: {
    brokerId: number;
    productId: number;
    productCount: number;
  }): Promise<{ success: true; message: string }> {
    try {
      logger.debug("🧺➕ API: Add to basket:", payload);

      const result = await this.request<{ success: true; message: string }>("/basket/add", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      logger.debug("✅ API: Added to basket");
      return result;
    } catch (error) {
      logger.error("🧺➕ API: Add to basket error:", error);
      throw error;
    }
  }

  /** POST /basket/remove */
  async removeFromBasket(payload: {
    brokerId: number;
    productId: number;
  }): Promise<{ success: true; message: string }> {
    try {
      logger.debug("🧺➖ API: Remove from basket:", payload);

      const result = await this.request<{ success: true; message: string }>("/basket/remove", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      logger.debug("✅ API: Removed from basket");
      return result;
    } catch (error) {
      logger.error("🧺➖ API: Remove from basket error:", error);
      throw error;
    }
  }

  /** POST /basket/update */
  async updateBasket(payload: {
    brokerId: number;
    productId: number;
    productCount: number;
  }): Promise<{ success: true; message: string }> {
    try {
      logger.debug("🧺✏️ API: Update basket:", payload);

      const result = await this.request<{ success: true; message: string }>("/basket/update", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      logger.debug("✅ API: Basket updated");
      return result;
    } catch (error) {
      logger.error("🧺✏️ API: Update basket error:", error);
      throw error;
    }
  }

  /** POST /sales/calculate */
  async calculateSale(payload: { brokerId: number; createInvoice: boolean }): Promise<any> {
    try {
      logger.debug("🧮 API: Calculate sale:", payload);

      const result = await this.request<any>("/sales/calculate", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      logger.debug("✅ API: Calculation summary:", result ? Object.keys(result) : "null");

      return result;
    } catch (error) {
      // Boş sepet durumunda 404 + { message: "Basket empty", code: ... } gelebilir
      logger.error("🧮 API: Calculate sale error:", error);
      throw error;
    }
  }

  /** POST /sales/confirm */
  async confirmSale(payload: { brokerId: number; createInvoice: boolean }): Promise<any> {
    try {
      logger.debug("✅ API: Confirm sale:", payload);

      const result = await this.request<any>("/sales/confirm", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      logger.debug("✅ API: Sale confirmed:", result ? result.documentNumber : "no-doc");
      return result;
    } catch (error) {
      logger.error("✅ API: Confirm sale error:", error);
      throw error;
    }
  }

  /** POST /sales/cancel */
  async cancelSale(payload: {
    brokerId: number;
    createInvoice: boolean;
  }): Promise<{ success: true; message: string }> {
    try {
      logger.debug("🛑 API: Cancel sale:", payload);

      const result = await this.request<{ success: true; message: string }>("/sales/cancel", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      logger.debug("✅ API: Sale canceled");
      return result;
    } catch (error) {
      logger.error("🛑 API: Cancel sale error:", error);
      throw error;
    }
  }
}

// Singleton instance
export const apiService = new ApiService(API_BASE_URL);
export default apiService;

// Re-export types for convenience
export type { ApiError } from "@/src/types/apiTypes";
