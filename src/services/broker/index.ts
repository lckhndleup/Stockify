import { request } from "../base";
import logger from "@/src/utils/logger";

// TODO: Strongly type these with broker types when available

export const getBrokers = async (): Promise<any[]> => {
  try {
    logger.debug("🤝 API: Fetching brokers...");

    const result = await request<any[]>("/broker/all", {
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
};

export const getBrokerDetail = async (id: string | number): Promise<any> => {
  try {
    logger.debug("🤝 API: Fetching broker detail for ID:", id);

    const result = await request<any>(`/broker/detail/${id}`, {
      method: "GET",
    });

    logger.debug("✅ API: Broker detail fetched:", result ? Object.keys(result) : "null");

    return result;
  } catch (error) {
    logger.error("🤝 API: Broker detail fetch error:", error);
    throw error;
  }
};

export const saveBroker = async (broker: {
  firstName: string;
  lastName: string;
  email: string;
  vkn: string;
  tkn: string;
  discountRate: number;
  targetDayOfWeek: string;
}): Promise<any> => {
  try {
    logger.debug("🤝 API: Saving broker:", broker);

    const result = await request<any>("/broker/save", {
      method: "POST",
      body: JSON.stringify(broker),
    });

    logger.debug("✅ API: Broker saved:", result ? Object.keys(result) : "null");

    return result;
  } catch (error) {
    logger.error("🤝 API: Broker save error:", error);
    throw error;
  }
};

export const updateBroker = async (broker: {
  brokerId: number;
  firstName: string;
  lastName: string;
  email: string;
  vkn: string;
  tkn: string;
  discountRate: number;
  targetDayOfWeek: string;
}): Promise<any> => {
  try {
    logger.debug("🤝 API: Updating broker:", broker);

    const result = await request<any>("/broker/update", {
      method: "PUT",
      body: JSON.stringify(broker),
    });

    logger.debug("✅ API: Broker updated:", result ? Object.keys(result) : "null");

    return result;
  } catch (error) {
    logger.error("🤝 API: Broker update error:", error);
    throw error;
  }
};

export const updateBrokerDiscountRate = async (discountData: {
  brokerId: number;
  discountRate: number;
}): Promise<any> => {
  try {
    logger.debug("🤝 API: Updating broker discount rate:", discountData);

    const result = await request<any>("/broker/update/discount-rate", {
      method: "PUT",
      body: JSON.stringify(discountData),
    });

    logger.debug("✅ API: Broker discount rate updated:", result ? Object.keys(result) : "null");

    return result;
  } catch (error) {
    logger.error("🤝 API: Broker discount rate update error:", error);
    throw error;
  }
};

export const deleteBroker = async (id: string | number): Promise<any> => {
  try {
    logger.debug("🤝 API: Deleting broker ID:", id);

    const result = await request<any>(`/broker/delete/${id}`, {
      method: "DELETE",
    });

    logger.debug("✅ API: Broker deleted:", result);
    return result;
  } catch (error) {
    logger.error("🤝 API: Broker delete error:", error);
    throw error;
  }
};

export const updateBrokerOrder = async (orderData: {
  brokerId: number;
  orderNo: number;
}): Promise<any> => {
  try {
    logger.debug("🔢 API: Updating broker order:", orderData);

    const result = await request<any>("/broker/update/order", {
      method: "PUT",
      body: JSON.stringify(orderData),
    });

    logger.debug("✅ API: Broker order updated:", result ? Object.keys(result) : "null");

    return result;
  } catch (error) {
    logger.error("🔢 API: Broker order update error:", error);
    throw error;
  }
};
