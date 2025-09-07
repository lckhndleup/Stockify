// src/services/api.ts
const API_BASE_URL = "https://stockify-gcsq.onrender.com";

// API Response types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface ApiError {
  message: string;
  status: number;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

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
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Headers'ı Record<string, string> olarak type'la
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Token varsa Authorization header'ı ekle
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
      console.log(
        "🔑 API Request with token:",
        this.token.substring(0, 20) + "..."
      );
    }

    console.log("🌐 API Request:", {
      method: options.method || "GET",
      url,
      hasToken: !!this.token,
      headers: {
        ...headers,
        Authorization: headers.Authorization ? "[HIDDEN]" : undefined,
      },
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Debug mode için - production'da kapatılabilir
      const isDebugMode = process.env.NODE_ENV === "development";

      if (isDebugMode) {
        console.log("📡 API Response:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: response.url,
        });
      }

      // Response'u text olarak al
      const responseText = await response.text();
      console.log("📄 Raw response text:", responseText);

      // Response boşsa ve status başarılıysa success objesi döndür
      if (!responseText && response.ok) {
        console.log("✅ Empty successful response, returning success");
        return { success: true, message: "İşlem başarılı" } as T;
      }

      // Response varsa JSON parse et
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.log("❌ JSON Parse Error:", parseError);
        console.log("📄 Failed to parse text:", responseText);

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
        console.log("📦 Response data:", data);
      }

      if (!response.ok) {
        const errorInfo = {
          message: data.message || "Bir hata oluştu",
          status: response.status,
        } as ApiError;

        // Sadece debug mode'da detay göster
        if (isDebugMode) {
          console.log("❌ API Error (debug):", errorInfo);
        }

        throw errorInfo;
      }

      if (isDebugMode) {
        console.log("✅ API Success:", {
          endpoint,
          dataKeys: Object.keys(data),
        });
      }

      return data;
    } catch (error) {
      // Network hatası veya JSON parse hatası
      if (error instanceof TypeError) {
        const networkError = {
          message: "Bağlantı hatası. Sunucuya ulaşılamıyor.",
          status: 0,
        } as ApiError;

        // Network hatalarını her zaman logla (önemli debug bilgisi)
        console.log("🌐 Network Error:", networkError);
        throw networkError;
      }

      // Diğer hataları sessizce fırlat
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log("🔐 API Login called with:", {
      username: credentials.username,
      passwordLength: credentials.password.length,
    });

    return this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  // Category endpoints
  async getCategories(): Promise<any[]> {
    return this.request<any[]>("/category/all");
  }

  async saveCategory(category: {
    name: string;
    taxRate: number;
  }): Promise<any> {
    console.log("🏷️ API: Saving category with data:", category);

    try {
      const result = await this.request<any>("/category/save", {
        method: "POST",
        body: JSON.stringify(category),
      });

      console.log("🏷️ API: Category save result:", result);
      console.log("🏷️ API: Result type:", typeof result);
      console.log(
        "🏷️ API: Result keys:",
        result ? Object.keys(result) : "null"
      );

      return result;
    } catch (error) {
      console.log("🏷️ API: Category save error:", error);
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
      console.log("🗑️ API: Deleting category ID:", id);

      const result = await this.request<any>(`/category/delete/${id}`, {
        method: "DELETE",
      });

      console.log("✅ API: Category deleted:", result);
      return result;
    } catch (error) {
      console.log("🗑️ API: Category delete error:", error);
      throw error;
    }
  }

  // Product endpoints - Backend swagger'a göre güncellenmiş
  async getProducts(params?: {
    productText?: string;
    status?: "ACTIVE" | "PASSIVE";
  }): Promise<any[]> {
    try {
      console.log("🛍️ API: Fetching products with params:", params);

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

      console.log(
        "✅ API: Products fetched - Count:",
        Array.isArray(result) ? result.length : "not array",
        "Keys:",
        Array.isArray(result) && result.length > 0
          ? Object.keys(result[0])
          : "empty"
      );

      return result;
    } catch (error) {
      console.log("🛍️ API: Product fetch error:", error);
      throw error;
    }
  }

  async getProductDetail(id: string | number): Promise<any> {
    try {
      console.log("🛍️ API: Fetching product detail for ID:", id);

      const result = await this.request<any>(`/product/detail/${id}`, {
        method: "GET",
      });

      console.log(
        "✅ API: Product detail fetched:",
        result ? Object.keys(result) : "null"
      );

      return result;
    } catch (error) {
      console.log("🛍️ API: Product detail fetch error:", error);
      throw error;
    }
  }

  async saveProduct(product: {
    categoryId: number;
    name: string;
  }): Promise<any> {
    try {
      console.log("🛍️ API: Saving product:", product);

      const result = await this.request<any>("/product/save", {
        method: "POST",
        body: JSON.stringify(product),
      });

      console.log(
        "✅ API: Product saved:",
        result ? Object.keys(result) : "null"
      );

      return result;
    } catch (error) {
      console.log("🛍️ API: Product save error:", error);
      throw error;
    }
  }

  async updateProduct(product: {
    productId: number;
    categoryId: number;
    name: string;
  }): Promise<any> {
    try {
      console.log("🛍️ API: Updating product:", product);

      const result = await this.request<any>("/product/update", {
        method: "PUT",
        body: JSON.stringify(product),
      });

      console.log(
        "✅ API: Product updated:",
        result ? Object.keys(result) : "null"
      );

      return result;
    } catch (error) {
      console.log("🛍️ API: Product update error:", error);
      throw error;
    }
  }

  async deleteProduct(id: string | number): Promise<any> {
    try {
      console.log("🛍️ API: Deleting product ID:", id);

      const result = await this.request<any>(`/product/delete/${id}`, {
        method: "DELETE",
      });

      console.log("✅ API: Product deleted:", result);
      return result;
    } catch (error) {
      console.log("🛍️ API: Product delete error:", error);
      throw error;
    }
  }
  // Inventory endpoints
  async getInventoryAll(): Promise<any[]> {
    try {
      console.log("📦 API: Fetching all inventory...");

      const result = await this.request<any[]>("/inventory/all", {
        method: "GET",
      });

      console.log(
        "✅ API: Inventory fetched - Count:",
        Array.isArray(result) ? result.length : "not array"
      );

      return result;
    } catch (error) {
      console.log("📦 API: Inventory fetch error:", error);
      throw error;
    }
  }

  async getInventoryDetail(id: string | number): Promise<any> {
    try {
      console.log("📦 API: Fetching inventory detail for ID:", id);

      const result = await this.request<any>(`/inventory/detail/${id}`, {
        method: "GET",
      });

      console.log("✅ API: Inventory detail fetched:", result);
      return result;
    } catch (error) {
      console.log("📦 API: Inventory detail fetch error:", error);
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
      console.log("📦 API: Updating inventory:", inventoryData);

      const result = await this.request<any>("/inventory/update", {
        method: "PUT",
        body: JSON.stringify(inventoryData),
      });

      console.log("✅ API: Inventory updated:", result);
      return result;
    } catch (error) {
      console.log("📦 API: Inventory update error:", error);
      throw error;
    }
  }

  async getInventoryCritical(): Promise<any[]> {
    try {
      console.log("📦 API: Fetching critical inventory...");

      const result = await this.request<any[]>("/inventory/critical", {
        method: "GET",
      });

      console.log(
        "✅ API: Critical inventory fetched - Count:",
        Array.isArray(result) ? result.length : "not array"
      );

      return result;
    } catch (error) {
      console.log("📦 API: Critical inventory fetch error:", error);
      throw error;
    }
  }

  async getInventoryOutOf(): Promise<any[]> {
    try {
      console.log("📦 API: Fetching out of stock inventory...");

      const result = await this.request<any[]>("/inventory/outOf", {
        method: "GET",
      });

      console.log(
        "✅ API: Out of stock inventory fetched - Count:",
        Array.isArray(result) ? result.length : "not array"
      );

      return result;
    } catch (error) {
      console.log("📦 API: Out of stock inventory fetch error:", error);
      throw error;
    }
  }

  async getInventoryAvailable(): Promise<any[]> {
    try {
      console.log("📦 API: Fetching available inventory...");

      const result = await this.request<any[]>("/inventory/available", {
        method: "GET",
      });

      console.log(
        "✅ API: Available inventory fetched - Count:",
        Array.isArray(result) ? result.length : "not array"
      );

      return result;
    } catch (error) {
      console.log("📦 API: Available inventory fetch error:", error);
      throw error;
    }
  }
  //GET /broker/all
  async getBrokers(): Promise<any[]> {
    try {
      console.log("🤝 API: Fetching brokers...");

      const result = await this.request<any[]>("/broker/all", {
        method: "GET",
      });

      console.log(
        "✅ API: Brokers fetched - Count:",
        Array.isArray(result) ? result.length : "not array",
        "Keys:",
        Array.isArray(result) && result.length > 0
          ? Object.keys(result[0])
          : "empty"
      );

      return result;
    } catch (error) {
      console.log("🤝 API: Brokers fetch error:", error);
      throw error;
    }
  }

  // Broker detayı getir - GET /broker/detail/{id}
  async getBrokerDetail(id: string | number): Promise<any> {
    try {
      console.log("🤝 API: Fetching broker detail for ID:", id);

      const result = await this.request<any>(`/broker/detail/${id}`, {
        method: "GET",
      });

      console.log(
        "✅ API: Broker detail fetched:",
        result ? Object.keys(result) : "null"
      );

      return result;
    } catch (error) {
      console.log("🤝 API: Broker detail fetch error:", error);
      throw error;
    }
  }

  // Yeni broker kaydet - POST /broker/save
  async saveBroker(broker: {
    firstName: string;
    lastName: string;
    discountRate: number;
  }): Promise<any> {
    try {
      console.log("🤝 API: Saving broker:", broker);

      const result = await this.request<any>("/broker/save", {
        method: "POST",
        body: JSON.stringify(broker),
      });

      console.log(
        "✅ API: Broker saved:",
        result ? Object.keys(result) : "null"
      );

      return result;
    } catch (error) {
      console.log("🤝 API: Broker save error:", error);
      throw error;
    }
  }

  // Broker güncelle - PUT /broker/update
  async updateBroker(broker: {
    brokerId: number;
    firstName: string;
    lastName: string;
    discountRate: number;
  }): Promise<any> {
    try {
      console.log("🤝 API: Updating broker:", broker);

      const result = await this.request<any>("/broker/update", {
        method: "PUT",
        body: JSON.stringify(broker),
      });

      console.log(
        "✅ API: Broker updated:",
        result ? Object.keys(result) : "null"
      );

      return result;
    } catch (error) {
      console.log("🤝 API: Broker update error:", error);
      throw error;
    }
  }

  // Broker discount rate güncelle - PUT /broker/update/discount-rate
  async updateBrokerDiscountRate(discountData: {
    brokerId: number;
    discountRate: number;
  }): Promise<any> {
    try {
      console.log("🤝 API: Updating broker discount rate:", discountData);

      const result = await this.request<any>("/broker/update/discount-rate", {
        method: "PUT",
        body: JSON.stringify(discountData),
      });

      console.log(
        "✅ API: Broker discount rate updated:",
        result ? Object.keys(result) : "null"
      );

      return result;
    } catch (error) {
      console.log("🤝 API: Broker discount rate update error:", error);
      throw error;
    }
  }

  // Broker sil - DELETE /broker/delete/{id}
  async deleteBroker(id: string | number): Promise<any> {
    try {
      console.log("🤝 API: Deleting broker ID:", id);

      const result = await this.request<any>(`/broker/delete/${id}`, {
        method: "DELETE",
      });

      console.log("✅ API: Broker deleted:", result);
      return result;
    } catch (error) {
      console.log("🤝 API: Broker delete error:", error);
      throw error;
    }
  }
  // Payment endpoints
  async savePayment(payment: {
    brokerId: number;
    paymentPrice: number;
    paymentType: "CASH" | "CREDIT_CARD" | "BANK_TRANSFER" | "CHECK";
  }): Promise<any> {
    try {
      console.log("💰 API: Saving payment:", payment);

      const result = await this.request<any>("/payment/save", {
        method: "POST",
        body: JSON.stringify(payment),
      });

      console.log(
        "✅ API: Payment saved:",
        result ? Object.keys(result) : "null"
      );

      return result;
    } catch (error) {
      console.log("💰 API: Payment save error:", error);
      throw error;
    }
  }
  // Sales endpoints
  //products
  async getSalesProducts(): Promise<any[]> {
    try {
      console.log("💰 API: Fetching sales products...");

      const result = await this.request<any[]>("/sales/products", {
        method: "GET",
      });

      console.log(
        "✅ API: Sales products fetched - Count:",
        Array.isArray(result) ? result.length : "not array",
        "Keys:",
        Array.isArray(result) && result.length > 0
          ? Object.keys(result[0])
          : "empty"
      );

      return result;
    } catch (error) {
      console.log("💰 API: Sales products fetch error:", error);
      throw error;
    }
  }
}

// Singleton instance
export const apiService = new ApiService(API_BASE_URL);

export default apiService;
