// src/services/api.ts - Sadece minimal güncelleme
const API_BASE_URL = "http://localhost:8080";

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

      // Response'u JSON olarak parse et
      const data = await response.json();

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
    return this.request<any>("/category/save", {
      method: "POST",
      body: JSON.stringify(category),
    });
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

  // Product endpoints (Swagger'dan sonra güncellenecek)
  async getProducts(): Promise<any[]> {
    return this.request<any[]>("/product/search");
  }

  async getProductDetail(id: string): Promise<any> {
    return this.request<any>(`/product/detail/${id}`);
  }

  async saveProduct(product: any): Promise<any> {
    return this.request<any>("/product/save", {
      method: "POST",
      body: JSON.stringify(product),
    });
  }

  async updateProduct(product: any): Promise<any> {
    return this.request<any>("/product/update", {
      method: "PUT",
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    return this.request<void>(`/product/delete/${id}`, {
      method: "DELETE",
    });
  }
}

// Singleton instance
export const apiService = new ApiService(API_BASE_URL);

export default apiService;
