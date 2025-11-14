import { request } from "../base";
import logger from "@/src/utils/logger";
import type {
  ProductCreateRequest,
  ProductPageResponse,
  ProductResponse,
  ProductSort,
  ProductUpdateRequest,
} from "@/src/types/product";

export const getProducts = async (params?: {
  productText?: string;
  status?: "ACTIVE" | "PASSIVE";
}): Promise<ProductResponse[]> => {
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

    const result = await request<ProductResponse[]>(url, {
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
};

export const getProductsPaginated = async (params?: {
  productText?: string;
  status?: "ACTIVE" | "PASSIVE";
  page?: number;
  size?: number;
}): Promise<ProductPageResponse> => {
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

    const result = await request<ProductResponse[] | ProductPageResponse>(url, {
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
};

export const getProductDetail = async (id: string | number): Promise<ProductResponse> => {
  try {
    logger.debug("🛍️ API: Fetching product detail for ID:", id);

    const result = await request<ProductResponse>(`/product/detail/${id}`, {
      method: "GET",
    });

    logger.debug("✅ API: Product detail fetched:", result ? Object.keys(result) : "null");

    return result;
  } catch (error) {
    logger.error("🛍️ API: Product detail fetch error:", error);
    throw error;
  }
};

export const saveProduct = async (product: ProductCreateRequest): Promise<ProductResponse> => {
  try {
    logger.debug("🛍️ API: Saving product:", product);

    const result = await request<ProductResponse>("/product/save", {
      method: "POST",
      body: JSON.stringify(product),
    });

    logger.debug("✅ API: Product saved:", result ? Object.keys(result) : "null");

    return result;
  } catch (error) {
    logger.error("🛍️ API: Product save error:", error);
    throw error;
  }
};

export const updateProduct = async (product: ProductUpdateRequest): Promise<ProductResponse> => {
  try {
    logger.debug("🛍️ API: Updating product:", product);

    const result = await request<ProductResponse>("/product/update", {
      method: "PUT",
      body: JSON.stringify(product),
    });

    logger.debug("✅ API: Product updated:", result ? Object.keys(result) : "null");

    return result;
  } catch (error) {
    logger.error("🛍️ API: Product update error:", error);
    throw error;
  }
};

export const deleteProduct = async (id: string | number): Promise<unknown> => {
  try {
    logger.debug("🛍️ API: Deleting product ID:", id);

    const result = await request<unknown>(`/product/delete/${id}`, {
      method: "DELETE",
    });

    logger.debug("✅ API: Product deleted:", result);
    return result;
  } catch (error) {
    logger.error("🛍️ API: Product delete error:", error);
    throw error;
  }
};
