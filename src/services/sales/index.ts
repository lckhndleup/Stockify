import { request } from "../base";
import logger from "@/src/utils/logger";
import type {
  BasketAddRequest,
  BasketMutationResponse,
  BasketRemoveRequest,
  BasketResponse,
  BasketUpdateRequest,
} from "@/src/types/basket";
import type {
  SalesCalculateRequest,
  SalesCancelRequest,
  SalesCancelResponse,
  SalesConfirmRequest,
  SalesProductsResponse,
  SalesSummary,
} from "@/src/types/sales";
import type { ApiError } from "@/src/types/apiTypes";

export const getSalesProducts = async (): Promise<SalesProductsResponse> => {
  try {
    logger.debug("💰 API: Fetching sales products...");

    const result = await request<SalesProductsResponse>("/sales/products", {
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
};

export const getBasket = async (brokerId: number): Promise<BasketResponse> => {
  try {
    logger.debug("🧺 API: Fetching basket for broker:", brokerId);

    const result = await request<BasketResponse>(`/sales/basket/${brokerId}`, {
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
};

export const addToBasket = async (payload: BasketAddRequest): Promise<BasketMutationResponse> => {
  try {
    logger.debug("🧺➕ API: Add to basket:", payload);

    const result = await request<BasketMutationResponse>("/basket/add", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    logger.debug("✅ API: Added to basket");
    return result;
  } catch (error) {
    logger.error("🧺➕ API: Add to basket error:", error);
    throw error;
  }
};

export const removeFromBasket = async (
  payload: BasketRemoveRequest,
): Promise<BasketMutationResponse> => {
  try {
    logger.debug("🧺➖ API: Remove from basket:", payload);

    const result = await request<BasketMutationResponse>("/basket/remove", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    logger.debug("✅ API: Removed from basket");
    return result;
  } catch (error) {
    logger.error("🧺➖ API: Remove from basket error:", error);
    throw error;
  }
};

export const updateBasket = async (
  payload: BasketUpdateRequest,
): Promise<BasketMutationResponse> => {
  try {
    logger.debug("🧺✏️ API: Update basket:", payload);

    const result = await request<BasketMutationResponse>("/basket/update", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    logger.debug("✅ API: Basket updated");
    return result;
  } catch (error) {
    logger.error("🧺✏️ API: Update basket error:", error);
    throw error;
  }
};

export const calculateSale = async (payload: SalesCalculateRequest): Promise<SalesSummary> => {
  try {
    logger.debug("🧮 API: Calculate sale:", payload);

    const result = await request<SalesSummary>("/sales/calculate", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    logger.debug("✅ API: Calculation summary:", result ? Object.keys(result) : "null");

    return result;
  } catch (error) {
    logger.error("🧮 API: Calculate sale error:", error);
    throw error;
  }
};

export const confirmSale = async (payload: SalesConfirmRequest): Promise<SalesSummary> => {
  try {
    logger.debug("✅ API: Confirm sale:", payload);

    const result = await request<SalesSummary>("/sales/confirm", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    logger.debug("✅ API: Sale confirmed:", result ? result.documentNumber : "no-doc");
    return result;
  } catch (error) {
    logger.error("✅ API: Confirm sale error:", error);
    throw error;
  }
};

export const cancelSale = async (payload: SalesCancelRequest): Promise<SalesCancelResponse> => {
  try {
    logger.debug("🛑 API: Cancel sale:", payload);

    const result = await request<SalesCancelResponse>("/sales/cancel", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    logger.debug("✅ API: Sale canceled");
    return result;
  } catch (error) {
    logger.error("🛑 API: Cancel sale error:", error);
    throw error;
  }
};
