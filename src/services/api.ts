// src/services/api.ts
import type { ApiError } from "@/src/types/apiTypes";
import type {
  BasketAddRequest,
  BasketMutationResponse,
  BasketRemoveRequest,
  BasketResponse,
  BasketUpdateRequest,
} from "@/src/types/basket";
import type {
  CategoryCreateRequest,
  CategoryResponse,
  CategoryUpdateRequest,
} from "@/src/types/category";
import type {
  ProductCreateRequest,
  ProductPageResponse,
  ProductResponse,
  ProductSort,
  ProductUpdateRequest,
} from "@/src/types/product";
import type {
  InventoryCreateRequest,
  InventoryListResponse,
  InventoryResponse,
  InventoryUpdateRequest,
} from "@/src/types/inventory";
import type {
  SalesCalculateRequest,
  SalesCancelRequest,
  SalesCancelResponse,
  SalesConfirmRequest,
  SalesProductsResponse,
  SalesSummary,
} from "@/src/types/sales";
import type {
  ProfileResponse,
  ProfileUpdateRequest,
  PasswordChangeRequest,
  PasswordChangeResponse,
  AccountDeleteRequest,
  AccountDeleteResponse,
} from "@/src/types/profile";
import logger from "@/src/utils/logger";
import { forceLogoutAndRedirect } from "./authBridge";
import Constants from "expo-constants";
// Prefer env/configured base URL with a safe fallback
const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ||
  ((Constants.expoConfig?.extra as any)?.apiUrl as string | undefined) ||
  "http://50.114.185.206:8080";
// Default network timeout for mobile networks (ms) - configurable via env/app.json
const DEFAULT_TIMEOUT_MS = (() => {
  const envValue = process.env.EXPO_PUBLIC_API_TIMEOUT_MS;
  if (envValue && !Number.isNaN(Number(envValue))) return Number(envValue);
  const extra = (Constants.expoConfig?.extra as any) || {};
  const confValue = extra.apiTimeoutMs;
  if (confValue && !Number.isNaN(Number(confValue))) return Number(confValue);
  return 60000; // Increased from 15000 to 60000 for slow server responses
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
          !endpoint.startsWith("/auth/login") &&
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

  // -------------------- Category --------------------
  async getCategories(): Promise<CategoryResponse[]> {
    try {
      logger.debug("🏷️ API: Fetching categories...");

      const result = await this.request<CategoryResponse[]>("/category/all", {
        method: "GET",
      });

      logger.debug(
        "✅ API: Categories fetched - Count:",
        Array.isArray(result) ? result.length : "not array",
        "Keys:",
        Array.isArray(result) && result.length > 0 ? Object.keys(result[0]) : "empty",
      );

      return result;
    } catch (error) {
      logger.error("🏷️ API: Categories fetch error:", error);
      throw error;
    }
  }

  async saveCategory(category: CategoryCreateRequest): Promise<CategoryResponse> {
    logger.debug("🏷️ API: Saving category with data:", category);

    try {
      const result = await this.request<CategoryResponse>("/category/save", {
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

  async updateCategory(category: CategoryUpdateRequest): Promise<CategoryResponse> {
    try {
      logger.debug("🏷️ API: Updating category with data:", category);

      const result = await this.request<CategoryResponse>("/category/update", {
        method: "PUT",
        body: JSON.stringify(category),
      });

      logger.debug("✅ API: Category updated:", result ? Object.keys(result) : "null");

      return result;
    } catch (error) {
      logger.error("🏷️ API: Category update error:", error);
      throw error;
    }
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
  }): Promise<ProductResponse[]> {
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

      const result = await this.request<ProductResponse[]>(url, {
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

  async getProductsPaginated(params?: {
    productText?: string;
    status?: "ACTIVE" | "PASSIVE";
    page?: number;
    size?: number;
  }): Promise<ProductPageResponse> {
    try {
      logger.debug("🛍️ API: Fetching products (paginated) with params:", params);

      const queryParams = new URLSearchParams();
      if (params?.productText) {
        queryParams.append("productText", params.productText);
      }
      if (params?.status) {
        queryParams.append("status", params.status);
      }
      if (typeof params?.page === "number") {
        queryParams.append("page", params.page.toString());
      }
      if (typeof params?.size === "number") {
        queryParams.append("size", params.size.toString());
      }

      const queryString = queryParams.toString();
      const url = `/product/all${queryString ? `?${queryString}` : ""}`;

      const result = await this.request<ProductResponse[] | ProductPageResponse>(url, {
        method: "GET",
      });

      if (Array.isArray(result)) {
        const fallbackSize = params?.size ?? result.length;
        const page = params?.page ?? 0;
        const sortMeta: ProductSort = { empty: true, sorted: false, unsorted: true };

        return {
          content: result,
          totalPages: 1,
          totalElements: result.length,
          size: fallbackSize,
          number: page,
          sort: sortMeta,
          pageable: {
            offset: page * fallbackSize,
            pageNumber: page,
            pageSize: fallbackSize,
            paged: false,
            unpaged: true,
            sort: sortMeta,
          },
          numberOfElements: result.length,
          first: page === 0,
          last: true,
          empty: result.length === 0,
        };
      }

      return result;
    } catch (error) {
      logger.error("🛍️ API: Product paginated fetch error:", error);
      throw error;
    }
  }

  async getProductDetail(id: string | number): Promise<ProductResponse> {
    try {
      logger.debug("🛍️ API: Fetching product detail for ID:", id);

      const result = await this.request<ProductResponse>(`/product/detail/${id}`, {
        method: "GET",
      });

      logger.debug("✅ API: Product detail fetched:", result ? Object.keys(result) : "null");

      return result;
    } catch (error) {
      logger.error("🛍️ API: Product detail fetch error:", error);
      throw error;
    }
  }

  async saveProduct(product: ProductCreateRequest): Promise<ProductResponse> {
    try {
      logger.debug("🛍️ API: Saving product:", product);

      const result = await this.request<ProductResponse>("/product/save", {
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

  async updateProduct(product: ProductUpdateRequest): Promise<ProductResponse> {
    try {
      logger.debug("🛍️ API: Updating product:", product);

      const result = await this.request<ProductResponse>("/product/update", {
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
  async getInventoryAll(): Promise<InventoryListResponse> {
    try {
      logger.debug("📦 API: Fetching all inventory...");

      const result = await this.request<InventoryListResponse>("/inventory/all", {
        method: "GET",
      });

      logger.debug(
        "✅ API: Inventory fetched - Count:",
        Array.isArray(result) ? result.length : "not array",
        "Keys:",
        Array.isArray(result) && result.length > 0 ? Object.keys(result[0]) : "empty",
      );

      return result;
    } catch (error) {
      logger.error("📦 API: Inventory fetch error:", error);
      throw error;
    }
  }

  async getInventoryDetail(id: string | number): Promise<InventoryResponse> {
    try {
      logger.debug("📦 API: Fetching inventory detail for ID:", id);

      const result = await this.request<InventoryResponse>(`/inventory/detail/${id}`, {
        method: "GET",
      });

      logger.debug("✅ API: Inventory detail fetched:", result ? Object.keys(result) : "null");
      return result;
    } catch (error) {
      logger.error("📦 API: Inventory detail fetch error:", error);
      throw error;
    }
  }

  async saveInventory(payload: InventoryCreateRequest): Promise<InventoryResponse> {
    try {
      logger.debug("📦 API: Saving inventory:", payload);

      const result = await this.request<InventoryResponse>("/inventory/save", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      logger.debug("✅ API: Inventory saved:", result ? Object.keys(result) : "null");
      return result;
    } catch (error) {
      logger.error("📦 API: Inventory save error:", error);
      throw error;
    }
  }

  async updateInventory(inventoryData: InventoryUpdateRequest): Promise<InventoryResponse> {
    try {
      logger.debug("📦 API: Updating inventory:", inventoryData);

      const result = await this.request<InventoryResponse>("/inventory/update", {
        method: "PUT",
        body: JSON.stringify(inventoryData),
      });

      logger.debug("✅ API: Inventory updated:", result ? Object.keys(result) : "null");
      return result;
    } catch (error) {
      logger.error("📦 API: Inventory update error:", error);
      throw error;
    }
  }

  async getInventoryCritical(): Promise<InventoryListResponse> {
    try {
      logger.debug("📦 API: Fetching critical inventory...");

      const result = await this.request<InventoryListResponse>("/inventory/critical", {
        method: "GET",
      });

      logger.debug(
        "✅ API: Critical inventory fetched - Count:",
        Array.isArray(result) ? result.length : "not array",
        "Keys:",
        Array.isArray(result) && result.length > 0 ? Object.keys(result[0]) : "empty",
      );

      return result;
    } catch (error) {
      logger.error("📦 API: Critical inventory fetch error:", error);
      throw error;
    }
  }

  async getInventoryOutOf(): Promise<InventoryListResponse> {
    try {
      logger.debug("📦 API: Fetching out of stock inventory...");

      const result = await this.request<InventoryListResponse>("/inventory/outOf", {
        method: "GET",
      });

      logger.debug(
        "✅ API: Out of stock inventory fetched - Count:",
        Array.isArray(result) ? result.length : "not array",
        "Keys:",
        Array.isArray(result) && result.length > 0 ? Object.keys(result[0]) : "empty",
      );

      return result;
    } catch (error) {
      logger.error("📦 API: Out of stock inventory fetch error:", error);
      throw error;
    }
  }

  async getInventoryAvailable(): Promise<InventoryListResponse> {
    try {
      logger.debug("📦 API: Fetching available inventory...");

      const result = await this.request<InventoryListResponse>("/inventory/available", {
        method: "GET",
      });

      logger.debug(
        "✅ API: Available inventory fetched - Count:",
        Array.isArray(result) ? result.length : "not array",
        "Keys:",
        Array.isArray(result) && result.length > 0 ? Object.keys(result[0]) : "empty",
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
    tkn: string;
    discountRate: number;
    targetDayOfWeek: string;
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
    tkn: string;
    discountRate: number;
    targetDayOfWeek: string;
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

  // Broker order güncelle - PUT /broker/update/order
  async updateBrokerOrder(orderData: { brokerId: number; orderNo: number }): Promise<any> {
    try {
      logger.debug("🔢 API: Updating broker order:", orderData);

      const result = await this.request<any>("/broker/update/order", {
        method: "PUT",
        body: JSON.stringify(orderData),
      });

      logger.debug("✅ API: Broker order updated:", result ? Object.keys(result) : "null");

      return result;
    } catch (error) {
      logger.error("🔢 API: Broker order update error:", error);
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
  async getSalesProducts(): Promise<SalesProductsResponse> {
    try {
      logger.debug("💰 API: Fetching sales products...");

      const result = await this.request<SalesProductsResponse>("/sales/products", {
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
  async getBasket(brokerId: number): Promise<BasketResponse> {
    try {
      logger.debug("🧺 API: Fetching basket for broker:", brokerId);

      const result = await this.request<BasketResponse>(`/sales/basket/${brokerId}`, {
        method: "GET",
      });

      logger.debug(
        "✅ API: Basket fetched - Count:",
        Array.isArray(result) ? result.length : "not array",
      );

      return result;
    } catch (error) {
      const status = (error as ApiError | undefined)?.status;
      if (status === 404) {
        logger.debug("🧺 API: Basket empty for broker, returning []");
        return [];
      }
      logger.error("🧺 API: Basket fetch error:", error);
      throw error;
    }
  }

  /** POST /basket/add  (Swagger: /sales değil, root /basket) */
  async addToBasket(payload: BasketAddRequest): Promise<BasketMutationResponse> {
    try {
      logger.debug("🧺➕ API: Add to basket:", payload);

      const result = await this.request<BasketMutationResponse>("/basket/add", {
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
  async removeFromBasket(payload: BasketRemoveRequest): Promise<BasketMutationResponse> {
    try {
      logger.debug("🧺➖ API: Remove from basket:", payload);

      const result = await this.request<BasketMutationResponse>("/basket/remove", {
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
  async updateBasket(payload: BasketUpdateRequest): Promise<BasketMutationResponse> {
    try {
      logger.debug("🧺✏️ API: Update basket:", payload);

      const result = await this.request<BasketMutationResponse>("/basket/update", {
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
  async calculateSale(payload: SalesCalculateRequest): Promise<SalesSummary> {
    try {
      logger.debug("🧮 API: Calculate sale:", payload);

      const result = await this.request<SalesSummary>("/sales/calculate", {
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
  async confirmSale(payload: SalesConfirmRequest): Promise<SalesSummary> {
    try {
      logger.debug("✅ API: Confirm sale:", payload);

      const result = await this.request<SalesSummary>("/sales/confirm", {
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
  async cancelSale(payload: SalesCancelRequest): Promise<SalesCancelResponse> {
    try {
      logger.debug("🛑 API: Cancel sale:", payload);

      const result = await this.request<SalesCancelResponse>("/sales/cancel", {
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

  // -------------------- Document Download (with auth) --------------------
  /** Download document with authentication */
  async downloadDocument(url: string): Promise<Blob> {
    try {
      logger.debug("📄 API: Downloading document from:", url);

      // Token'ı header'a ekle
      const headers: Record<string, string> = {};
      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw {
          message: "Belge indirilemedi",
          status: response.status,
        } as ApiError;
      }

      const blob = await response.blob();
      logger.debug("✅ API: Document downloaded, size:", blob.size);

      return blob;
    } catch (error) {
      logger.error("📄 API: Document download error:", error);
      throw error;
    }
  }

  // -------------------- Profile (ProfileController) --------------------
  /** GET /profile - Get current user profile */
  async getProfile(): Promise<ProfileResponse> {
    try {
      logger.debug("👤 API: Fetching user profile...");

      const result = await this.request<ProfileResponse>("/profile/detail", {
        method: "GET",
      });

      logger.debug("✅ API: Profile fetched:", result ? Object.keys(result) : "null");
      return result;
    } catch (error) {
      logger.error("👤 API: Profile fetch error:", error);
      throw error;
    }
  }

  /** PUT /profile/update - Update user profile */
  async updateProfile(profileData: ProfileUpdateRequest): Promise<ProfileResponse> {
    try {
      logger.debug("👤 API: Updating profile:", profileData);

      const result = await this.request<ProfileResponse>("/profile/update", {
        method: "PUT",
        body: JSON.stringify(profileData),
      });

      logger.debug("✅ API: Profile updated:", result ? Object.keys(result) : "null");
      return result;
    } catch (error) {
      logger.error("👤 API: Profile update error:", error);
      throw error;
    }
  }

  /** PUT /profile/change-password - Change user password */
  async changePassword(passwordData: PasswordChangeRequest): Promise<PasswordChangeResponse> {
    try {
      logger.debug("🔐 API: Changing password...");

      const result = await this.request<PasswordChangeResponse>("/profile/change-password", {
        method: "PUT",
        body: JSON.stringify(passwordData),
      });

      logger.debug("✅ API: Password changed successfully");
      return result;
    } catch (error) {
      logger.error("🔐 API: Password change error:", error);
      throw error;
    }
  }

  /** DELETE /profile/delete - Delete user account */
  async deleteAccount(deleteData: AccountDeleteRequest): Promise<AccountDeleteResponse> {
    try {
      logger.debug("🗑️ API: Deleting account...");

      const result = await this.request<AccountDeleteResponse>("/profile/delete", {
        method: "DELETE",
        body: JSON.stringify(deleteData),
      });

      logger.debug("✅ API: Account deleted successfully");
      return result;
    } catch (error) {
      logger.error("🗑️ API: Account delete error:", error);
      throw error;
    }
  }

  // -------------------- Reports --------------------
  /** GET /report/daily - Get daily report */
  async getDailyReport(params?: {
    brokerId?: number;
    startDate?: number;
    endDate?: number;
  }): Promise<any> {
    try {
      logger.debug("📊 API: Fetching daily report...", params);

      const queryParams = new URLSearchParams();
      if (params?.brokerId) {
        queryParams.append("brokerId", params.brokerId.toString());
      }
      if (params?.startDate) {
        queryParams.append("startDate", params.startDate.toString());
      }
      if (params?.endDate) {
        queryParams.append("endDate", params.endDate.toString());
      }

      const queryString = queryParams.toString();
      const url = `/report/daily${queryString ? `?${queryString}` : ""}`;

      const result = await this.request<any>(url, {
        method: "GET",
      });

      logger.debug("✅ API: Daily report fetched");
      return result;
    } catch (error) {
      logger.error("📊 API: Daily report fetch error:", error);
      throw error;
    }
  }

  // -------------------- Broker Visits --------------------
  /** GET /broker-visits/today - Get today's broker visits */
  async getTodayBrokerVisits(): Promise<any[]> {
    try {
      logger.debug("📅 API: Fetching today's broker visits...");

      const result = await this.request<any[]>("/broker/today", {
        method: "GET",
      });

      logger.debug(
        "✅ API: Today's broker visits fetched - Count:",
        Array.isArray(result) ? result.length : "not array",
      );

      return result;
    } catch (error) {
      logger.error("📅 API: Today's broker visits fetch error:", error);
      throw error;
    }
  }

  /** PUT /broker-visits/update - Update broker visit status */
  async updateBrokerVisit(visitData: {
    brokerId: number;
    status: "VISITED" | "NOT_VISITED" | "SKIPPED";
    note?: string;
  }): Promise<any> {
    try {
      logger.debug("📅 API: Updating broker visit:", visitData);

      const result = await this.request<any>("/broker-visits/update", {
        method: "PUT",
        body: JSON.stringify(visitData),
      });

      logger.debug("✅ API: Broker visit updated");
      return result;
    } catch (error) {
      logger.error("📅 API: Broker visit update error:", error);
      throw error;
    }
  }

  /** POST /profile/upload/profile-image - Upload profile image */
  async uploadProfileImage(imageFile: any): Promise<ProfileResponse> {
    try {
      logger.debug("📸 API: Uploading profile image...");

      const formData = new FormData();

      // React Native FormData format
      formData.append("file", {
        uri: imageFile.uri,
        type: imageFile.type || "image/jpeg",
        name: imageFile.fileName || "profile.jpg",
      } as any);

      const response = await fetch(`${this.baseURL}/profile/upload/profile-image`, {
        method: "POST",
        headers: {
          ...this.getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (!response.ok) {
        throw {
          message: "Profil fotoğrafı yüklenemedi",
          status: response.status,
        } as ApiError;
      }

      const result = await response.json();
      logger.debug("✅ API: Profile image uploaded successfully");
      return result;
    } catch (error) {
      logger.error("📸 API: Profile image upload error:", error);
      throw error;
    }
  }

  /** POST /profile/upload/company-logo - Upload company logo */
  async uploadCompanyLogo(imageFile: any): Promise<ProfileResponse> {
    try {
      logger.debug("🏢 API: Uploading company logo...");

      const formData = new FormData();

      // React Native FormData format
      formData.append("file", {
        uri: imageFile.uri,
        type: imageFile.type || "image/jpeg",
        name: imageFile.fileName || "logo.jpg",
      } as any);

      const response = await fetch(`${this.baseURL}/profile/upload/company-logo`, {
        method: "POST",
        headers: {
          ...this.getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (!response.ok) {
        throw {
          message: "Şirket logosu yüklenemedi",
          status: response.status,
        } as ApiError;
      }

      const result = await response.json();
      logger.debug("✅ API: Company logo uploaded successfully");
      return result;
    } catch (error) {
      logger.error("🏢 API: Company logo upload error:", error);
      throw error;
    }
  }

  // Return headers that include Authorization if token exists
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  /**
   * Download image with auth header
   * Converts document URL to authenticated image URI
   */
  getAuthenticatedImageUri(imageUrl: string | null | undefined): string | null {
    if (!imageUrl) return null;

    // If it's already a full URL, return as is (for backward compatibility)
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    // Convert relative path to full URL
    return `${this.baseURL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  }

  /**
   * Get headers for Image component that needs auth
   * Usage: <Image source={{ uri: url, headers: apiService.getImageHeaders() }} />
   */
  getImageHeaders(): Record<string, string> {
    return this.getAuthHeaders();
  }
}

// Singleton instance
export const apiService = new ApiService(API_BASE_URL);
export default apiService;

// Re-export types for convenience
export type { ApiError } from "@/src/types/apiTypes";
