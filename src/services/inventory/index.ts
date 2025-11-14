import { request } from "../base";
import logger from "@/src/utils/logger";
import type {
  InventoryCreateRequest,
  InventoryListResponse,
  InventoryResponse,
  InventoryUpdateRequest,
} from "@/src/types/inventory";

export const getInventoryAll = async (): Promise<InventoryListResponse> => {
  try {
    logger.debug("📦 API: Fetching all inventory...");

    const result = await request<InventoryListResponse>("/inventory/all", {
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
};

export const getInventoryDetail = async (id: string | number): Promise<InventoryResponse> => {
  try {
    logger.debug("📦 API: Fetching inventory detail for ID:", id);

    const result = await request<InventoryResponse>(`/inventory/detail/${id}`, {
      method: "GET",
    });

    logger.debug("✅ API: Inventory detail fetched:", result ? Object.keys(result) : "null");
    return result;
  } catch (error) {
    logger.error("📦 API: Inventory detail fetch error:", error);
    throw error;
  }
};

export const saveInventory = async (
  payload: InventoryCreateRequest,
): Promise<InventoryResponse> => {
  try {
    logger.debug("📦 API: Saving inventory:", payload);

    const result = await request<InventoryResponse>("/inventory/save", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    logger.debug("✅ API: Inventory saved:", result ? Object.keys(result) : "null");
    return result;
  } catch (error) {
    logger.error("📦 API: Inventory save error:", error);
    throw error;
  }
};

export const updateInventory = async (
  inventoryData: InventoryUpdateRequest,
): Promise<InventoryResponse> => {
  try {
    logger.debug("📦 API: Updating inventory:", inventoryData);

    const result = await request<InventoryResponse>("/inventory/update", {
      method: "PUT",
      body: JSON.stringify(inventoryData),
    });

    logger.debug("✅ API: Inventory updated:", result ? Object.keys(result) : "null");
    return result;
  } catch (error) {
    logger.error("📦 API: Inventory update error:", error);
    throw error;
  }
};

export const getInventoryCritical = async (): Promise<InventoryListResponse> => {
  try {
    logger.debug("📦 API: Fetching critical inventory...");

    const result = await request<InventoryListResponse>("/inventory/critical", {
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
};

export const getInventoryOutOf = async (): Promise<InventoryListResponse> => {
  try {
    logger.debug("📦 API: Fetching out of stock inventory...");

    const result = await request<InventoryListResponse>("/inventory/outOf", {
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
};

export const getInventoryAvailable = async (): Promise<InventoryListResponse> => {
  try {
    logger.debug("📦 API: Fetching available inventory...");

    const result = await request<InventoryListResponse>("/inventory/available", {
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
};
