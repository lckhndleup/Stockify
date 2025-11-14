import { request } from "../base";
import logger from "@/src/utils/logger";

export const getTodayBrokerVisits = async (): Promise<any[]> => {
  try {
    logger.debug("📅 API: Fetching today's broker visits...");

    const result = await request<any[]>("/broker/today", {
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
};

export const updateBrokerVisit = async (visitData: {
  brokerId: number;
  status: "VISITED" | "NOT_VISITED" | "SKIPPED";
  note?: string;
}): Promise<any> => {
  try {
    logger.debug("📅 API: Updating broker visit:", visitData);

    const result = await request<any>("/broker-visits/update", {
      method: "PUT",
      body: JSON.stringify(visitData),
    });

    logger.debug("✅ API: Broker visit updated");
    return result;
  } catch (error) {
    logger.error("📅 API: Broker visit update error:", error);
    throw error;
  }
};
