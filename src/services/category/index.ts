import { request } from "../base";
import logger from "@/src/utils/logger";
import type {
  CategoryCreateRequest,
  CategoryResponse,
  CategoryUpdateRequest,
} from "@/src/types/category";

// Category endpoints
enum CategoryEndpoint {
  ALL = "/category/all",
  SAVE = "/category/save",
  UPDATE = "/category/update",
  DELETE = "/category/delete",
}

export const getCategories = async (): Promise<CategoryResponse[]> => {
  try {
    logger.debug("🏷️ API: Fetching categories...");

    const result = await request<CategoryResponse[]>(CategoryEndpoint.ALL, {
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
};

export const saveCategory = async (category: CategoryCreateRequest): Promise<CategoryResponse> => {
  logger.debug("🏷️ API: Saving category with data:", category);

  try {
    const result = await request<CategoryResponse>(CategoryEndpoint.SAVE, {
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
};

export const updateCategory = async (
  category: CategoryUpdateRequest,
): Promise<CategoryResponse> => {
  try {
    logger.debug("🏷️ API: Updating category with data:", category);

    const result = await request<CategoryResponse>(CategoryEndpoint.UPDATE, {
      method: "PUT",
      body: JSON.stringify(category),
    });

    logger.debug("✅ API: Category updated:", result ? Object.keys(result) : "null");

    return result;
  } catch (error) {
    logger.error("🏷️ API: Category update error:", error);
    throw error;
  }
};

export const deleteCategory = async (id: string | number): Promise<unknown> => {
  try {
    logger.debug("🗑️ API: Deleting category ID:", id);

    const result = await request<unknown>(`${CategoryEndpoint.DELETE}/${id}`, {
      method: "DELETE",
    });

    logger.debug("✅ API: Category deleted:", result);
    return result;
  } catch (error) {
    logger.error("🗑️ API: Category delete error:", error);
    throw error;
  }
};
