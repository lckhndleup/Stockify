import { request } from "../base";
import logger from "@/src/utils/logger";

export const getDailyReport = async (params?: {
  brokerId?: number;
  startDate?: number;
  endDate?: number;
}): Promise<any> => {
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

    const result = await request<any>(url, {
      method: "GET",
    });

    logger.debug("✅ API: Daily report fetched");
    return result;
  } catch (error) {
    logger.error("📊 API: Daily report fetch error:", error);
    throw error;
  }
};
